import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { EventCategory, WellnessEvent } from '../../../../core/models/domain.models';
import { EventService } from '../../../../core/services/event.service';
import { EventDetailModalComponent } from '../../components/event-detail-modal/event-detail-modal.component';

interface CategoryFilterOption {
  value?: EventCategory;
  label: string;
  emoji: string;
}

@Component({
  selector: 'app-event-map',
  standalone: true,
  imports: [DatePipe, RouterLink, EventDetailModalComponent],
  template: `
    <div class="relative flex h-[calc(100vh-9.5rem)] min-h-[540px] w-full flex-col overflow-hidden rounded-3xl border border-cream-300 bg-cream-50 shadow-soft">
      <!-- Üst Yüzen Filtre Barı & İşletme Paneli Geçişi -->
      <div class="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-2.5 p-3 sm:p-4">
        <div class="pointer-events-auto flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cream-200/90 bg-cream-50/95 px-3.5 py-2.5 shadow-soft backdrop-blur-md">
          <div>
            <span class="text-[11px] font-semibold tracking-wide text-sage-700 uppercase">
              Modül 4 · Yerel Etkinlik Haritası
            </span>
            <h1 class="text-sm font-bold text-ink-900 sm:text-base">
              Açık Hava & Stüdyo Buluşmaları ({{ eventService.events().length }} Pin)
            </h1>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="locateUser()"
              class="rounded-xl border border-sage-300 bg-white px-3 py-1.5 text-xs font-semibold text-sage-800 transition hover:bg-sage-50"
            >
              📍 Konumuma Git
            </button>
            <a
              routerLink="/app/map/organizer"
              class="rounded-xl bg-lavender-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-lavender-700"
            >
              + Kulüp / Etkinlik Ekle
            </a>
          </div>
        </div>

        <!-- Spor Branşlarına Göre Filtreleme Butonları -->
        <div class="pointer-events-auto flex items-center gap-1.5 overflow-x-auto pb-1">
          @for (item of categoryFilters; track item.label) {
            <button
              type="button"
              (click)="selectCategory(item.value)"
              class="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition"
              [class.border-sage-600]="selectedCategory() === item.value"
              [class.bg-sage-600]="selectedCategory() === item.value"
              [class.text-white]="selectedCategory() === item.value"
              [class.border-cream-300]="selectedCategory() !== item.value"
              [class.bg-cream-50/95]="selectedCategory() !== item.value"
              [class.text-ink-700]="selectedCategory() !== item.value"
            >
              <span>{{ item.emoji }}</span>
              <span>{{ item.label }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Tam Ekran Leaflet Harita Konteyneri -->
      <div #mapContainer class="z-10 h-full w-full flex-1"></div>

      <!-- Pin Tıklandığında Alt Tarafta Açılan (Bottom Sheet) Etkinlik Detay Kartı -->
      @if (selectedEvent(); as ev) {
        <section
          aria-label="Seçili Etkinlik Özeti"
          class="z-20 border-t border-cream-300 bg-cream-50/98 p-4 shadow-nav backdrop-blur-md transition-all sm:p-5"
        >
          <div class="mx-auto max-w-3xl">
            <div class="mb-2 flex items-center justify-between">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-sage-100 px-2.5 py-0.5 text-xs font-semibold text-sage-800">
                  {{ categoryLabel(ev.category) }}
                </span>
                <span
                  class="rounded-full px-2.5 py-0.5 text-xs font-bold"
                  [class.bg-lavender-100]="ev.isFree"
                  [class.text-lavender-700]="ev.isFree"
                  [class.bg-cream-200]="!ev.isFree"
                  [class.text-ink-900]="!ev.isFree"
                >
                  {{ ev.isFree ? 'Ücretsiz' : ev.price + ' ₺' }}
                </span>
                @if (eventService.getBookingForEvent(ev.id); as booking) {
                  <span class="rounded-full bg-sage-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    ✓ Kayıtlısın ({{ booking.qrCode }})
                  </span>
                }
              </div>

              <button
                type="button"
                (click)="selectedEvent.set(null)"
                class="rounded-lg px-2 py-1 text-xs font-medium text-ink-400 hover:text-ink-900"
              >
                Kapat ✕
              </button>
            </div>

            <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 class="text-base font-bold text-ink-900 sm:text-lg">{{ ev.title }}</h2>
                <p class="mt-0.5 line-clamp-2 text-xs text-ink-700">{{ ev.description }}</p>
                <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-500">
                  <span>🗓️ {{ ev.date | date: 'dd MMM yyyy · HH:mm' }}</span>
                  <span>👥 Kontenjan: {{ ev.capacity }} kişi</span>
                  <span>📍 {{ ev.address }}</span>
                </div>
              </div>

              <div class="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  (click)="openBookingModal(ev)"
                  class="rounded-2xl bg-sage-600 px-4 py-2.5 text-xs font-semibold text-white shadow-soft transition hover:bg-sage-700"
                >
                  {{
                    eventService.getBookingForEvent(ev.id)
                      ? 'QR Biletini Gör'
                      : 'Katıl / Rezervasyon Yap'
                  }}
                </button>
              </div>
            </div>
          </div>
        </section>
      }

      <!-- Katılım & QR Kod Modalı -->
      @if (modalEvent(); as mEvent) {
        <app-event-detail-modal
          [event]="mEvent"
          (closed)="modalEvent.set(null)"
        />
      }
    </div>
  `,
})
export class EventMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true })
  private readonly mapContainer!: ElementRef<HTMLDivElement>;

  protected readonly eventService = inject(EventService);

  protected readonly selectedCategory = signal<EventCategory | undefined>(undefined);
  protected readonly selectedEvent = signal<WellnessEvent | null>(null);
  protected readonly modalEvent = signal<WellnessEvent | null>(null);

  private map?: L.Map;
  private markerLayer?: L.LayerGroup;

  protected readonly categoryFilters: CategoryFilterOption[] = [
    { value: undefined, label: 'Tümü', emoji: '🌿' },
    { value: 'RUNNING', label: 'Koşu', emoji: '🏃‍♀️' },
    { value: 'YOGA', label: 'Yoga', emoji: '🧘‍♀️' },
    { value: 'PILATES', label: 'Pilates', emoji: '🤸‍♀️' },
    { value: 'SAILING', label: 'Yelken', emoji: '⛵' },
    { value: 'HIKING', label: 'Doğa Yürüyüşü', emoji: '🥾' },
    { value: 'MEDITATION', label: 'Meditasyon', emoji: '🕯️' },
  ];

  constructor() {
    effect(() => {
      const list = this.eventService.events();
      this.renderMarkers(list);
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.eventService.getNearbyEvents({ lat: 41.015, lng: 29.02, radius: 25_000 }).subscribe();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  protected selectCategory(category?: EventCategory): void {
    this.selectedCategory.set(category);
    this.eventService
      .getNearbyEvents({ lat: 41.015, lng: 29.02, radius: 25_000, category })
      .subscribe((list) => {
        if (this.selectedEvent() && category && this.selectedEvent()!.category !== category) {
          this.selectedEvent.set(list[0] ?? null);
        }
      });
  }

  protected locateUser(): void {
    if (!this.map) return;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          this.map?.flyTo([latitude, longitude], 13, { duration: 1.1 });
          this.eventService
            .getNearbyEvents({
              lat: latitude,
              lng: longitude,
              radius: 25_000,
              category: this.selectedCategory(),
            })
            .subscribe();
        },
        () => {
          this.map?.flyTo([41.0082, 29.018], 12, { duration: 0.8 });
        },
      );
    }
  }

  protected openBookingModal(ev: WellnessEvent): void {
    this.modalEvent.set(ev);
  }

  protected categoryLabel(cat: EventCategory): string {
    const found = this.categoryFilters.find((c) => c.value === cat);
    return found ? `${found.emoji} ${found.label}` : cat;
  }

  private initMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [41.015, 29.025],
      zoom: 12,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(this.map);

    this.markerLayer = L.layerGroup().addTo(this.map);
    this.renderMarkers(this.eventService.events());

    setTimeout(() => this.map?.invalidateSize(), 150);
  }

  private renderMarkers(events: WellnessEvent[]): void {
    if (!this.map || !this.markerLayer) return;
    this.markerLayer.clearLayers();

    for (const ev of events) {
      const emoji = this.categoryEmoji(ev.category);
      const isBooked = Boolean(this.eventService.getBookingForEvent(ev.id));

      const icon = L.divIcon({
        className: 'wl-leaflet-pin',
        html: `
          <div style="
            display:flex;align-items:center;gap:6px;
            padding:6px 10px;border-radius:9999px;
            background:${isBooked ? '#7a5cb1' : '#4a7a5c'};
            color:#ffffff;font-weight:700;font-size:12px;
            box-shadow:0 8px 20px -6px rgba(42,65,52,0.45);
            border:2px solid #fffdf8;white-space:nowrap;
          ">
            <span>${emoji}</span>
            <span>${ev.isFree ? 'Ücretsiz' : ev.price + '₺'}</span>
          </div>
        `,
        iconSize: [92, 34],
        iconAnchor: [46, 17],
      });

      const marker = L.marker([ev.latitude, ev.longitude], { icon });
      marker.on('click', () => {
        this.selectedEvent.set(ev);
        this.map?.panTo([ev.latitude, ev.longitude], { animate: true });
      });
      marker.addTo(this.markerLayer);
    }

    if (!this.selectedEvent() && events.length > 0) {
      this.selectedEvent.set(events[0]);
    }
  }

  private categoryEmoji(cat: EventCategory): string {
    return this.categoryFilters.find((c) => c.value === cat)?.emoji ?? '🌿';
  }
}
