import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { EventBooking, EventCategory, WellnessEvent } from '../../../../core/models/domain.models';
import { EventService } from '../../../../core/services/event.service';
import {
  WellnessIconComponent,
  WellnessIconName,
} from '../../../../shared/components/icon/wellness-icon.component';

@Component({
  selector: 'app-event-detail-modal',
  standalone: true,
  imports: [DatePipe, WellnessIconComponent],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/45 p-0 backdrop-blur-xs sm:items-center sm:p-4"
      (click)="closed.emit()"
    >
      <div
        class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-cream-200 bg-cream-50 p-6 shadow-2xl sm:rounded-3xl"
        (click)="$event.stopPropagation()"
      >
        <!-- Üst Başlık ve Kapatma -->
        <div class="flex items-start justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-800">
              <app-icon [name]="categoryIcon(event().category)" sizeClass="h-3.5 w-3.5" />
              <span>{{ categoryLabel(event().category) }}</span>
            </span>
            <span
              class="rounded-full px-3 py-1 text-xs font-bold"
              [class.bg-lavender-100]="event().isFree"
              [class.text-lavender-700]="event().isFree"
              [class.bg-cream-200]="!event().isFree"
              [class.text-ink-900]="!event().isFree"
            >
              {{ event().isFree ? 'Ücretsiz Etkinlik' : event().price + ' ₺' }}
            </span>
          </div>

          <button
            type="button"
            (click)="closed.emit()"
            aria-label="Kapat"
            class="flex h-8 w-8 items-center justify-center rounded-full border border-cream-300 bg-white text-ink-500 hover:text-ink-900"
          >
            <app-icon name="close" sizeClass="h-4 w-4" />
          </button>
        </div>

        <h2 class="mt-3 text-2xl text-ink-900">{{ event().title }}</h2>
        <p class="mt-1.5 text-xs leading-relaxed text-ink-700">
          {{ event().description || 'Tüm seviyelere uygun açık hava / stüdyo wellness buluşması.' }}
        </p>

        <!-- Bilgi Kartları -->
        <div class="mt-4 grid grid-cols-2 gap-2.5 text-xs">
          <div class="rounded-2xl border border-cream-200 bg-white p-3">
            <span class="inline-flex items-center gap-1 text-[11px] text-ink-400">
              <app-icon name="calendar" sizeClass="h-3.5 w-3.5 text-sage-600" />
              <span>Tarih & Saat</span>
            </span>
            <strong class="mt-1 block text-ink-900">
              {{ event().date | date: 'dd MMM yyyy · HH:mm' }}
            </strong>
          </div>
          <div class="rounded-2xl border border-cream-200 bg-white p-3">
            <span class="inline-flex items-center gap-1 text-[11px] text-ink-400">
              <app-icon name="users" sizeClass="h-3.5 w-3.5 text-lavender-600" />
              <span>Kontenjan</span>
            </span>
            <strong class="mt-1 block text-ink-900">{{ event().capacity }} Kişilik</strong>
          </div>
          <div class="col-span-2 rounded-2xl border border-cream-200 bg-white p-3">
            <span class="inline-flex items-center gap-1 text-[11px] text-ink-400">
              <app-icon name="map-pin" sizeClass="h-3.5 w-3.5 text-sage-600" />
              <span>Buluşma Noktası & Organizatör</span>
            </span>
            <strong class="mt-1 block text-ink-900">{{ event().address }}</strong>
            <span class="mt-0.5 block text-[11px] text-sage-700">
              Düzenleyen: {{ event().organizerId }} ({{ event().latitude }}, {{ event().longitude }})
            </span>
          </div>
        </div>

        <!-- Rezervasyon Tamamlandıysa Katılım QR Kodu Bileşeni -->
        @if (activeBooking(); as booking) {
          <div
            class="mt-5 rounded-3xl border border-sage-300 bg-gradient-to-br from-sage-50 via-white to-lavender-50 p-5 text-center"
          >
            <span class="inline-flex items-center gap-1.5 rounded-full bg-sage-600 px-3 py-1 text-[11px] font-semibold text-white">
              <app-icon name="check" sizeClass="h-3.5 w-3.5" />
              <span>Rezervasyonun Onaylandı</span>
            </span>
            <p class="mt-2 text-xs text-ink-700">
              Etkinlik girişinde eğitmene aşağıdaki katılım QR kodunu okutabilirsin.
            </p>

            <div class="mx-auto my-4 inline-flex flex-col items-center rounded-2xl border border-cream-300 bg-white p-4 shadow-soft">
              <svg
                class="h-36 w-36 text-ink-900"
                viewBox="0 0 21 21"
                shape-rendering="crispEdges"
                aria-label="Katılım QR Kodu"
              >
                <path
                  fill="currentColor"
                  d="M0 0h7v7H0zM1 1v5h5V1zM2 2h3v3H2zM14 0h7v7h-7zM15 1v5h5V1zM16 2h3v3h-3zM0 14h7v7H0zM1 15v5h5v-5zM2 16h3v3H2z"
                />
                @for (cell of qrCells(); track cell.key) {
                  <rect [attr.x]="cell.x" [attr.y]="cell.y" width="1" height="1" fill="currentColor" />
                }
              </svg>
              <span class="mt-2 font-mono text-xs font-bold tracking-wider text-sage-800">
                {{ booking.qrCode }}
              </span>
            </div>

            <p class="text-[11px] text-ink-400">
              Kayıt Zamanı: {{ booking.createdAt | date: 'dd.MM.yyyy HH:mm' }}
            </p>
          </div>
        } @else {
          <div class="mt-6">
            <button
              type="button"
              (click)="confirmReservation()"
              [disabled]="submitting()"
              class="wl-btn-primary"
            >
              <app-icon name="qr" sizeClass="h-4 w-4" />
              @if (submitting()) {
                <span>Rezervasyon oluşturuluyor...</span>
              } @else {
                <span>
                  {{ event().isFree ? 'Ücretsiz Katıl / Rezervasyon Yap' : 'Rezervasyon Yap (' + event().price + ' ₺)' }}
                </span>
              }
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class EventDetailModalComponent {
  private readonly eventService = inject(EventService);

  readonly event = input.required<WellnessEvent>();
  readonly closed = output<void>();
  readonly booked = output<EventBooking>();

  protected readonly submitting = signal(false);
  private readonly manualBooking = signal<EventBooking | null>(null);

  protected readonly activeBooking = computed<EventBooking | undefined>(() => {
    return this.manualBooking() ?? this.eventService.getBookingForEvent(this.event().id);
  });

  protected readonly qrCells = computed(() => {
    const code = this.activeBooking()?.qrCode ?? 'LUNAWL';
    const cells: { x: number; y: number; key: string }[] = [];
    let seed = 0;
    for (let i = 0; i < code.length; i++) {
      seed = (seed * 31 + code.charCodeAt(i)) >>> 0;
    }

    for (let y = 0; y < 21; y++) {
      for (let x = 0; x < 21; x++) {
        const inTopLeft = x < 8 && y < 8;
        const inTopRight = x >= 13 && y < 8;
        const inBottomLeft = x < 8 && y >= 13;
        if (inTopLeft || inTopRight || inBottomLeft) continue;

        seed = (seed * 1664525 + 1013904223) >>> 0;
        if ((seed & 3) === 0 || (x + y + code.charCodeAt((x + y) % code.length)) % 3 === 0) {
          cells.push({ x, y, key: `${x}-${y}` });
        }
      }
    }
    return cells;
  });

  protected confirmReservation(): void {
    this.submitting.set(true);
    this.eventService.bookEvent(this.event().id).subscribe((res) => {
      this.submitting.set(false);
      this.manualBooking.set(res);
      this.booked.emit(res);
    });
  }

  protected categoryIcon(cat: EventCategory): WellnessIconName {
    const map: Record<EventCategory, WellnessIconName> = {
      YOGA: 'yoga',
      PILATES: 'pilates',
      RUNNING: 'running',
      SAILING: 'sailing',
      HIKING: 'hiking',
      MEDITATION: 'meditation',
      CYCLING: 'cycling',
      SWIMMING: 'swimming',
      DANCE: 'dance',
      FITNESS: 'fitness',
      OTHER: 'sparkle',
    };
    return map[cat] ?? 'lotus';
  }

  protected categoryLabel(cat: EventCategory): string {
    const map: Record<EventCategory, string> = {
      YOGA: 'Yoga',
      PILATES: 'Pilates',
      RUNNING: 'Koşu',
      SAILING: 'Yelken',
      HIKING: 'Doğa Yürüyüşü',
      MEDITATION: 'Meditasyon',
      CYCLING: 'Bisiklet',
      SWIMMING: 'Yüzme',
      DANCE: 'Dans',
      FITNESS: 'Fitness',
      OTHER: 'Diğer',
    };
    return map[cat] ?? cat;
  }
}
