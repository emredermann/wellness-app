import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { EventCategory, RsvpStatus } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { EventsService } from './events.service.js';

describe('EventsService (PostGIS Map & QR Booking)', () => {
  let service: EventsService;
  let mockPrisma: {
    $queryRaw: ReturnType<typeof vi.fn>;
    event: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
    eventBooking: {
      findUnique: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: vi.fn(),
      event: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      eventBooking: {
        findUnique: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
      },
    };
    service = new EventsService(mockPrisma as unknown as PrismaService);
  });

  describe('findForMap (GET /api/v1/events/map)', () => {
    it('yakındaki etkinlikleri GeoJSON FeatureCollection ve koordinat dizisi olarak dönmelidir', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        {
          id: 'evt-1',
          title: 'Maçka Parkı Sabah Yogası',
          description: 'Açık hava Vinyasa akışı',
          category: EventCategory.YOGA,
          latitude: 41.045,
          longitude: 28.994,
          address: 'Maçka Demokrasi Parkı, Şişli',
          date: new Date('2026-10-26T08:00:00Z'),
          capacity: 25,
          isFree: true,
          price: null,
          distanceMeters: 1250,
        },
      ]);

      const result = await service.findForMap({
        latitude: 41.04,
        longitude: 28.99,
        radiusKm: 5,
      });

      expect(result.type).toBe('FeatureCollection');
      expect(result.totalCount).toBe(1);
      expect(result.features[0].geometry.type).toBe('Point');
      expect(result.features[0].geometry.coordinates).toEqual([28.994, 41.045]);
      expect(result.features[0].properties.distanceKm).toBe(1.25);
      expect(result.coordinates[0].coordinates).toEqual([28.994, 41.045]);
    });
  });

  describe('bookEvent (POST /api/v1/events/:id/book)', () => {
    const eventId = '11111111-1111-4111-8111-111111111111';
    const userId = '22222222-2222-4222-8222-222222222222';

    it('rezervasyon oluşturmalı ve benzersiz bir QR doğrulama kodu üretmelidir', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: eventId,
        title: 'Caddebostan Sahil Koşusu',
        capacity: 30,
      });
      mockPrisma.eventBooking.findUnique.mockResolvedValue(null);
      mockPrisma.eventBooking.count.mockResolvedValue(12);
      mockPrisma.eventBooking.create.mockImplementation(
        async ({ data }: { data: { userId: string; eventId: string; rsvpStatus: RsvpStatus; qrCode: string } }) => ({
          id: 'booking-uuid-1',
          ...data,
          createdAt: new Date('2026-10-24T19:00:00Z'),
        }),
      );

      const booking = await service.bookEvent(eventId, userId);

      expect(booking.rsvpStatus).toBe(RsvpStatus.CONFIRMED);
      expect(booking.qrCode).toMatch(/^WLN-EVT-111111-2222-[0-9A-F]{8}$/);
      expect(booking.qrVerificationPayload.eventTitle).toBe('Caddebostan Sahil Koşusu');
    });

    it('kontenjan doluysa BadRequestException fırlatmalıdır', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: eventId,
        title: 'Butik Pilates',
        capacity: 5,
      });
      mockPrisma.eventBooking.findUnique.mockResolvedValue(null);
      mockPrisma.eventBooking.count.mockResolvedValue(5);

      await expect(service.bookEvent(eventId, userId)).rejects.toThrow(BadRequestException);
    });

    it('kullanıcı zaten kayıtlıysa ConflictException fırlatmalıdır', async () => {
      mockPrisma.event.findUnique.mockResolvedValue({
        id: eventId,
        title: 'Butik Pilates',
        capacity: 15,
      });
      mockPrisma.eventBooking.findUnique.mockResolvedValue({
        id: 'existing-booking',
        rsvpStatus: RsvpStatus.CONFIRMED,
      });

      await expect(service.bookEvent(eventId, userId)).rejects.toThrow(ConflictException);
    });

    it('etkinlik yoksa NotFoundException fırlatmalıdır', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null);

      await expect(service.bookEvent(eventId, userId)).rejects.toThrow(NotFoundException);
    });
  });
});
