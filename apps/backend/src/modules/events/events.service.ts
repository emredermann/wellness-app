import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client.js';
import { EventCategory, RsvpStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MapEventsQueryDto } from './dto/map-events.query.dto.js';
import { NearbyEventsQueryDto } from './dto/nearby-events.query.dto.js';

export interface NearbyEventRow {
  id: string;
  title: string;
  description?: string | null;
  category: EventCategory;
  latitude: number;
  longitude: number;
  address: string;
  date: Date;
  capacity?: number;
  isFree?: boolean;
  price?: number | string | null;
  distanceMeters: number;
}

export interface GeoJsonPointFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    /** GeoJSON standardı: [longitude, latitude] */
    coordinates: [number, number];
  };
  properties: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    address: string;
    date: Date;
    capacity: number | null;
    isFree: boolean;
    price: number | null;
    distanceMeters: number;
    distanceKm: number;
  };
}

export interface EventMapResponse {
  type: 'FeatureCollection';
  center: {
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  totalCount: number;
  features: GeoJsonPointFeature[];
  coordinates: Array<{
    id: string;
    title: string;
    category: string;
    latitude: number;
    longitude: number;
    /** [longitude, latitude] */
    coordinates: [number, number];
    address: string;
    date: Date;
    distanceMeters: number;
    distanceKm: number;
  }>;
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  findUpcoming() {
    return this.prisma.event.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      take: 50,
    });
  }

  /** PostGIS ST_DWithin + GIST index ile yarıçap içindeki yaklaşan etkinlikler. */
  findNearby({ lat, lng, radius, category }: NearbyEventsQueryDto) {
    const point = Prisma.sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`;
    const categoryFilter = category
      ? Prisma.sql`AND e.category = ${category}::"EventCategory"`
      : Prisma.empty;

    return this.prisma.$queryRaw<NearbyEventRow[]>`
      SELECT e.id, e.title, e.description, e.category, e.latitude, e.longitude, e.address, e.date,
             e.capacity, e.is_free AS "isFree", e.price,
             ST_Distance(e.location, ${point}) AS "distanceMeters"
      FROM events e
      WHERE e.date >= NOW()
        AND ST_DWithin(e.location, ${point}, ${radius})
        ${categoryFilter}
      ORDER BY "distanceMeters" ASC
      LIMIT 50`;
  }

  /**
   * GET /api/v1/events/map
   * Kullanıcının latitude, longitude ve yarıçap (radiusKm) parametrelerine göre
   * yakındaki etkinlikleri hem GeoJSON FeatureCollection hem de koordinat dizisi olarak döner.
   */
  async findForMap(query: MapEventsQueryDto): Promise<EventMapResponse> {
    const latitude = query.latitude ?? query.lat;
    const longitude = query.longitude ?? query.lng;

    if (latitude === undefined || longitude === undefined) {
      throw new BadRequestException('Harita sorgusu için latitude ve longitude zorunludur.');
    }

    const radiusKm = query.radiusKm ?? 10;
    const radiusMeters = Math.round(radiusKm * 1000);

    const rows = await this.findNearby({
      lat: latitude,
      lng: longitude,
      radius: radiusMeters,
      category: query.category,
    });

    const features: GeoJsonPointFeature[] = rows.map((row) => {
      const distanceMeters = Math.round(Number(row.distanceMeters));
      const distanceKm = Number((distanceMeters / 1000).toFixed(2));
      return {
        type: 'Feature',
        id: row.id,
        geometry: {
          type: 'Point',
          coordinates: [Number(row.longitude), Number(row.latitude)],
        },
        properties: {
          id: row.id,
          title: row.title,
          description: row.description ?? null,
          category: String(row.category),
          address: row.address,
          date: row.date,
          capacity: row.capacity ?? null,
          isFree: row.isFree ?? true,
          price: row.price !== null && row.price !== undefined ? Number(row.price) : null,
          distanceMeters,
          distanceKm,
        },
      };
    });

    const coordinates = rows.map((row) => {
      const distanceMeters = Math.round(Number(row.distanceMeters));
      const distanceKm = Number((distanceMeters / 1000).toFixed(2));
      return {
        id: row.id,
        title: row.title,
        category: String(row.category),
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        coordinates: [Number(row.longitude), Number(row.latitude)] as [number, number],
        address: row.address,
        date: row.date,
        distanceMeters,
        distanceKm,
      };
    });

    return {
      type: 'FeatureCollection',
      center: {
        latitude,
        longitude,
        radiusKm,
      },
      totalCount: features.length,
      features,
      coordinates,
    };
  }

  /**
   * POST /api/v1/events/:id/book
   * Etkinlik rezervasyonu yapar ve benzersiz bir QR doğrulama kodu üretir.
   */
  async bookEvent(eventId: string, userId?: string) {
    if (!userId) {
      throw new BadRequestException(
        'Rezervasyon için kullanıcı kimliği (userId veya Bearer token) gereklidir.',
      );
    }

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Etkinlik bulunamadı.');
    }

    const existingBooking = await this.prisma.eventBooking.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existingBooking && existingBooking.rsvpStatus === RsvpStatus.CONFIRMED) {
      throw new ConflictException('Bu etkinliğe zaten aktif bir rezervasyonunuz bulunuyor.');
    }

    const confirmedCount = await this.prisma.eventBooking.count({
      where: {
        eventId,
        rsvpStatus: RsvpStatus.CONFIRMED,
      },
    });

    if (confirmedCount >= event.capacity) {
      throw new BadRequestException('Etkinlik kontenjanı dolmuştur.');
    }

    const qrCode = this.generateQrVerificationCode(eventId, userId);

    const booking = await this.prisma.eventBooking.create({
      data: {
        userId,
        eventId,
        rsvpStatus: RsvpStatus.CONFIRMED,
        qrCode,
      },
    });

    return {
      bookingId: booking.id,
      eventId: booking.eventId,
      userId: booking.userId,
      rsvpStatus: booking.rsvpStatus,
      qrCode: booking.qrCode,
      qrVerificationPayload: {
        code: booking.qrCode,
        eventId: event.id,
        eventTitle: event.title,
        userId,
        issuedAt: booking.createdAt.toISOString(),
      },
      createdAt: booking.createdAt,
    };
  }

  generateQrVerificationCode(eventId: string, userId: string): string {
    const eventPrefix = eventId.replace(/-/g, '').slice(0, 6).toUpperCase();
    const userPrefix = userId.replace(/-/g, '').slice(0, 4).toUpperCase();
    const randomToken = randomBytes(4).toString('hex').toUpperCase();
    return `WLN-EVT-${eventPrefix}-${userPrefix}-${randomToken}`;
  }
}
