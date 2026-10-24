import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { EventBooking, EventCategory, WellnessEvent } from '../models/domain.models';
import { ApiService } from './api.service';

export interface NearbyEventsQuery {
  lat: number;
  lng: number;
  radius?: number;
  category?: EventCategory;
}

export interface CreateEventPayload {
  title: string;
  description: string | null;
  category: EventCategory;
  latitude: number;
  longitude: number;
  address: string;
  date: string;
  capacity: number;
  isFree: boolean;
  price: string | null;
  organizerName?: string;
}

const CUSTOM_EVENTS_STORAGE_KEY = 'wl_custom_events';
const BOOKINGS_STORAGE_KEY = 'wl_event_bookings';

const FALLBACK_EVENTS: WellnessEvent[] = [
  {
    id: 'evt-caddebostan-yoga',
    title: 'Gün Doğumu Sahil Vinyasa Yoga',
    description:
      'Çimlerin üzerinde, deniz sesi eşliğinde tüm seviyelere uygun 45 dakikalık nefes ve akış seansı. Matınızı getirmeniz yeterli.',
    category: 'YOGA',
    latitude: 40.9632,
    longitude: 29.0635,
    address: 'Caddebostan Sahili, Kadıköy / İstanbul',
    date: new Date(Date.now() + 18 * 3_600_000).toISOString(),
    capacity: 25,
    isFree: true,
    price: null,
    organizerId: 'Kadıköy Yoga Kolektifi',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-macka-pilates',
    title: 'Maçka Parkı Mat Pilates & Postür Atölyesi',
    description:
      'Fizyoterapist eşliğinde omurga sağlığı, pelvik stabilizasyon ve derin core güçlendirme çalışması.',
    category: 'PILATES',
    latitude: 41.0445,
    longitude: 28.9945,
    address: 'Maçka Demokrasi Parkı, Şişli / İstanbul',
    date: new Date(Date.now() + 28 * 3_600_000).toISOString(),
    capacity: 20,
    isFree: false,
    price: '350',
    organizerId: 'Nişantaşı Core Studio',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-bebek-run',
    title: 'Boğaz Hattı 5K Mindful Koşu Kulübü',
    description:
      'Sohbet temposunda sahil koşusu ve ardından Bebek Parkında rehberli soğuma esnemeleri.',
    category: 'RUNNING',
    latitude: 41.0771,
    longitude: 29.0436,
    address: 'Bebek Parkı Buluşma Noktası, Beşiktaş / İstanbul',
    date: new Date(Date.now() + 42 * 3_600_000).toISOString(),
    capacity: 35,
    isFree: true,
    price: null,
    organizerId: 'Boğaz Run Crew',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-moda-sailing',
    title: 'Gün Batımı Yelken & Deniz Üstü Meditasyon',
    description:
      'Moda koyunda rüzgarla buluşma, temel yelken pratiği ve teknede gün batımı nefes farkındalığı.',
    category: 'SAILING',
    latitude: 40.9796,
    longitude: 29.0255,
    address: 'Moda Deniz Kulübü İskelesi, Kadıköy / İstanbul',
    date: new Date(Date.now() + 68 * 3_600_000).toISOString(),
    capacity: 10,
    isFree: false,
    price: '750',
    organizerId: 'Moda Yelken Akademisi',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-belgrad-hiking',
    title: 'Belgrad Ormanı Sabah Farkındalık Yürüyüşü (Shinrin-Yoku)',
    description:
      'Orman banyosu tekniğiyle duyusal farkındalık yürüyüşü ve bitki çayı molası.',
    category: 'HIKING',
    latitude: 41.1842,
    longitude: 28.9894,
    address: 'Neşet Suyu Parkuru Girişi, Sarıyer / İstanbul',
    date: new Date(Date.now() + 90 * 3_600_000).toISOString(),
    capacity: 18,
    isFree: true,
    price: null,
    organizerId: 'Kuzey Orman Wellness',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'evt-cihangir-meditation',
    title: 'Ses Çanakları (Sound Bath) & Derin Gevşeme',
    description:
      'Tibet ses çanakları ve gong frekanslarıyla sinir sistemini yatıştıran akşam seansı.',
    category: 'MEDITATION',
    latitude: 41.0318,
    longitude: 28.9836,
    address: 'Cihangir Nefes Stüdyosu, Beyoğlu / İstanbul',
    date: new Date(Date.now() + 52 * 3_600_000).toISOString(),
    capacity: 15,
    isFree: false,
    price: '450',
    organizerId: 'Cihangir Nefes Stüdyosu',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Yakındaki wellness etkinliklerini (PostGIS `/events/nearby`), yeni kulüp/stüdyo
 * etkinliği oluşturmayı ve rezervasyon + QR kod üretimini yöneten servis.
 */
@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly api = inject(ApiService);

  private readonly customEventsSignal = signal<WellnessEvent[]>(this.readCustomEvents());
  private readonly apiEventsSignal = signal<WellnessEvent[]>(FALLBACK_EVENTS);
  private readonly bookingsSignal = signal<EventBooking[]>(this.readBookings());
  private readonly activeCategorySignal = signal<EventCategory | undefined>(undefined);

  readonly bookings = this.bookingsSignal.asReadonly();
  readonly organizerEvents = this.customEventsSignal.asReadonly();

  /** Seçili kategori filtresine göre birleştirilmiş etkinlik listesi */
  readonly events = computed<WellnessEvent[]>(() => {
    const merged = [...this.customEventsSignal(), ...this.apiEventsSignal()];
    const cat = this.activeCategorySignal();
    return cat ? merged.filter((e) => e.category === cat) : merged;
  });

  getUpcomingEvents(): Observable<WellnessEvent[]> {
    this.activeCategorySignal.set(undefined);
    return this.api.get<WellnessEvent[]>('/events').pipe(
      catchError(() => of(FALLBACK_EVENTS)),
      tap((list) => this.apiEventsSignal.set(list.length ? list : FALLBACK_EVENTS)),
    );
  }

  getNearbyEvents(query: NearbyEventsQuery): Observable<WellnessEvent[]> {
    this.activeCategorySignal.set(query.category);
    const params: Record<string, string | number | boolean> = {
      lat: query.lat,
      lng: query.lng,
      ...(query.radius ? { radius: query.radius } : {}),
      ...(query.category ? { category: query.category } : {}),
    };

    return this.api.get<WellnessEvent[]>('/events/nearby', params).pipe(
      catchError(() => of(FALLBACK_EVENTS)),
      tap((list) => this.apiEventsSignal.set(list.length ? list : FALLBACK_EVENTS)),
    );
  }

  /** İşletme veya spor kulübü panelinden yeni etkinlik oluşturur. */
  createEvent(payload: CreateEventPayload): Observable<WellnessEvent> {
    const newEvent: WellnessEvent = {
      id: `evt-${Date.now().toString(36)}`,
      title: payload.title,
      description: payload.description,
      category: payload.category,
      latitude: Number(payload.latitude.toFixed(5)),
      longitude: Number(payload.longitude.toFixed(5)),
      address: payload.address,
      date: payload.date,
      capacity: payload.capacity,
      isFree: payload.isFree,
      price: payload.isFree ? null : payload.price,
      organizerId: payload.organizerName?.trim() || 'LunaWell Partner Stüdyo',
      createdAt: new Date().toISOString(),
    };

    return this.api.post<WellnessEvent>('/events', newEvent).pipe(
      catchError(() => of(newEvent)),
      tap((created) => {
        const updated = [created, ...this.customEventsSignal()];
        this.customEventsSignal.set(updated);
        this.writeCustomEvents(updated);
      }),
    );
  }

  removeOrganizerEvent(eventId: string): void {
    const updated = this.customEventsSignal().filter((e) => e.id !== eventId);
    this.customEventsSignal.set(updated);
    this.writeCustomEvents(updated);
  }

  bookEvent(eventId: string): Observable<EventBooking> {
    const existing = this.bookingsSignal().find(
      (b) => b.eventId === eventId && b.rsvpStatus === 'CONFIRMED',
    );
    if (existing) {
      return of(existing);
    }

    const fallbackBooking: EventBooking = {
      id: `bk-${Date.now().toString(36)}`,
      userId: 'demo-user-01',
      eventId,
      rsvpStatus: 'CONFIRMED',
      qrCode: `LW-${eventId.slice(-6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };

    return this.api.post<EventBooking>('/bookings', { eventId }).pipe(
      catchError(() => of(fallbackBooking)),
      tap((booking) => {
        const next = [booking, ...this.bookingsSignal()];
        this.bookingsSignal.set(next);
        this.writeBookings(next);
      }),
    );
  }

  getBookingForEvent(eventId: string): EventBooking | undefined {
    return this.bookingsSignal().find(
      (b) => b.eventId === eventId && b.rsvpStatus === 'CONFIRMED',
    );
  }

  private readCustomEvents(): WellnessEvent[] {
    try {
      const raw = localStorage.getItem(CUSTOM_EVENTS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WellnessEvent[]) : [];
    } catch {
      return [];
    }
  }

  private writeCustomEvents(events: WellnessEvent[]): void {
    try {
      localStorage.setItem(CUSTOM_EVENTS_STORAGE_KEY, JSON.stringify(events));
    } catch {
      // ignore
    }
  }

  private readBookings(): EventBooking[] {
    try {
      const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as EventBooking[]) : [];
    } catch {
      return [];
    }
  }

  private writeBookings(bookings: EventBooking[]): void {
    try {
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(bookings));
    } catch {
      // ignore
    }
  }
}
