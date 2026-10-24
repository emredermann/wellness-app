import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { EventCategory, WellnessEvent } from '../../../../core/models/domain.models';
import { EventService } from '../../../../core/services/event.service';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-medium tracking-wide text-sage-700 uppercase">PostGIS Yakınlık Keşfi</p>
          <h1 class="text-2xl font-bold text-ink-900">Yakındaki Wellness Etkinlikleri</h1>
        </div>

        <div class="flex flex-wrap gap-1.5">
          <button
            type="button"
            (click)="filterByCategory(undefined)"
            class="rounded-full px-3 py-1.5 text-xs font-semibold transition"
            [class.bg-sage-500]="selectedCategory() === undefined"
            [class.text-white]="selectedCategory() === undefined"
            [class.bg-cream-50]="selectedCategory() !== undefined"
          >
            Tümü
          </button>
          @for (cat of categories; track cat.value) {
            <button
              type="button"
              (click)="filterByCategory(cat.value)"
              class="rounded-full px-3 py-1.5 text-xs font-semibold transition"
              [class.bg-sage-500]="selectedCategory() === cat.value"
              [class.text-white]="selectedCategory() === cat.value"
              [class.bg-cream-50]="selectedCategory() !== cat.value"
            >
              {{ cat.label }}
            </button>
          }
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        @for (ev of eventService.events(); track ev.id) {
          <article class="wl-card flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <span class="rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-800">
                  {{ ev.category }}
                </span>
                <span class="text-xs font-bold text-lavender-700">
                  {{ ev.isFree ? 'Ücretsiz' : ev.price + ' ₺' }}
                </span>
              </div>
              <h2 class="mt-3 text-base font-bold text-ink-900">{{ ev.title }}</h2>
              <p class="mt-1 text-xs leading-relaxed text-ink-700">{{ ev.description }}</p>
              <p class="mt-3 text-xs text-ink-500">📍 {{ ev.address }}</p>
              <p class="mt-1 text-xs text-ink-500">🗓️ {{ ev.date | date: 'dd MMM yyyy, HH:mm' }}</p>
            </div>

            <div class="mt-4 flex items-center justify-between border-t border-cream-200 pt-3">
              <span class="text-xs text-ink-500">Kapasite: {{ ev.capacity }} kişi</span>
              <button
                type="button"
                (click)="book(ev)"
                class="rounded-xl bg-sage-500 px-4 py-2 text-xs font-semibold text-white hover:bg-sage-600"
              >
                {{ bookedId() === ev.id ? 'Katılım Onaylandı ✓' : 'Katıl (RSVP)' }}
              </button>
            </div>
          </article>
        }
      </div>
    </div>
  `,
})
export class EventListPage implements OnInit {
  protected readonly eventService = inject(EventService);
  protected readonly selectedCategory = signal<EventCategory | undefined>(undefined);
  protected readonly bookedId = signal<string | null>(null);

  protected readonly categories: { value: EventCategory; label: string }[] = [
    { value: 'YOGA', label: 'Yoga' },
    { value: 'PILATES', label: 'Pilates' },
    { value: 'RUNNING', label: 'Koşu' },
    { value: 'SAILING', label: 'Yelken' },
  ];

  ngOnInit(): void {
    this.eventService.getNearbyEvents({ lat: 40.99, lng: 29.02, radius: 15_000 }).subscribe();
  }

  protected filterByCategory(category?: EventCategory): void {
    this.selectedCategory.set(category);
    this.eventService
      .getNearbyEvents({ lat: 40.99, lng: 29.02, radius: 15_000, category })
      .subscribe();
  }

  protected book(ev: WellnessEvent): void {
    this.eventService.bookEvent(ev.id).subscribe(() => this.bookedId.set(ev.id));
  }
}
