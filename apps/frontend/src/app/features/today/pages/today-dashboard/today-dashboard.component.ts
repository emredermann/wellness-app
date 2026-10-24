import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventCategory, WellnessEvent } from '../../../../core/models/domain.models';
import { EventService } from '../../../../core/services/event.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { RecipeService } from '../../../../core/services/recipe.service';

@Component({
  selector: 'app-today-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="space-y-6">
      <!-- Üst Karşılama & Kalori Görünürlüğü Toggle -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-medium tracking-wide text-sage-700 uppercase">Bugünün Özeti</p>
          <h1 class="text-2xl font-bold text-ink-900">
            Merhaba, {{ profileService.profile().name.split(' ')[0] }}
          </h1>
        </div>

        <!-- Kalori Gösterimini Gizleme / Açma (Mindful Beslenme Toggle) -->
        <button
          type="button"
          (click)="profileService.toggleCaloriesVisibility()"
          [attr.aria-pressed]="!profileService.hideCalories()"
          class="inline-flex items-center gap-2.5 rounded-full border border-cream-300 bg-cream-50 px-3.5 py-2 text-xs font-medium text-ink-700 shadow-2xs transition hover:border-lavender-300"
        >
          <span
            class="inline-block h-2.5 w-2.5 rounded-full transition"
            [class.bg-sage-500]="!profileService.hideCalories()"
            [class.bg-ink-400]="profileService.hideCalories()"
          ></span>
          <span>{{ profileService.hideCalories() ? 'Kaloriler Gizli (Sezgisel Mod)' : 'Kalorileri Göster' }}</span>
        </button>
      </div>

      <!-- 1) Mevcut Döngü / Enerji Fazı Görsel Halka & Kart Widget -->
      <section
        class="relative overflow-hidden rounded-3xl border border-sage-200/80 bg-gradient-to-br from-sage-50 via-cream-50 to-lavender-50 p-6 shadow-soft"
      >
        <div class="grid items-center gap-6 md:grid-cols-[auto_1fr]">
          <!-- SVG Döngü Halkası -->
          <div class="relative mx-auto flex h-44 w-44 items-center justify-center">
            <svg class="h-44 w-44 -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="66"
                fill="none"
                stroke="currentColor"
                stroke-width="12"
                class="text-cream-200"
              />
              <circle
                cx="80"
                cy="80"
                r="66"
                fill="none"
                stroke="currentColor"
                stroke-width="12"
                stroke-linecap="round"
                [attr.stroke-dasharray]="circumference"
                [attr.stroke-dashoffset]="strokeDashoffset()"
                class="text-sage-500 transition-all duration-700"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span class="rounded-full bg-lavender-100 px-2.5 py-0.5 text-[11px] font-semibold text-lavender-700">
                {{ cycle().phaseLabel }}
              </span>
              <span class="mt-1 text-3xl font-extrabold text-ink-900">
                {{ cycle().dayOfCycle }}. Gün
              </span>
              <span class="text-xs text-ink-500">{{ cycle().cycleLength }} günlük döngü</span>
            </div>
          </div>

          <!-- Faz & Enerji Detayları -->
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-800">
                Enerji Odağı: {{ cycle().energyTitle }}
              </span>
              <span class="rounded-full bg-cream-200 px-3 py-1 text-xs font-medium text-ink-700">
                Yeni döngüye {{ cycle().daysUntilNextPeriod }} gün
              </span>
            </div>

            <h2 class="text-xl font-bold text-ink-900">
              {{ cycle().energyTitle }}
            </h2>
            <p class="text-sm leading-relaxed text-ink-700">
              {{ cycle().energySubtitle }}
            </p>

            <!-- 4 Fazlı Mini İlerleme Çubuğu -->
            <div class="grid grid-cols-4 gap-2 pt-2">
              @for (p of phases; track p.key) {
                <div
                  class="rounded-xl border px-2.5 py-2 text-center text-xs transition"
                  [class.border-sage-400]="cycle().phase === p.key"
                  [class.bg-sage-100]="cycle().phase === p.key"
                  [class.font-semibold]="cycle().phase === p.key"
                  [class.border-cream-200]="cycle().phase !== p.key"
                  [class.bg-cream-50]="cycle().phase !== p.key"
                >
                  <span class="block text-[11px] text-ink-500">{{ p.days }}</span>
                  <span class="text-ink-900">{{ p.label }}</span>
                </div>
              }
            </div>

            <div class="pt-1">
              <a routerLink="/app/profile" class="text-xs font-semibold text-lavender-700 hover:underline">
                Döngü takvimini ve semptom tercihlerini güncelle →
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- 2) "Bugün Sana Ne İyi Gelir?" Kartı (Günün Egzersizi + Günün Tarifi) -->
      <section class="wl-card space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-ink-900">Bugün Sana Ne İyi Gelir?</h2>
            <p class="text-xs text-ink-500">
              {{ cycle().phaseLabel }} ve {{ dietLabel() }} tercihine göre seçildi
            </p>
          </div>
          <span class="rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-700">
            Kişisel Öneri
          </span>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <!-- Günün Egzersizi -->
          <article
            class="flex flex-col justify-between rounded-2xl border border-sage-200 bg-sage-50/70 p-5"
          >
            <div>
              <div class="flex items-center justify-between">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-sage-700">
                  🧘‍♀️ Günün Egzersizi
                </span>
                <span class="text-xs font-semibold text-ink-500">
                  {{ cycle().recommendedWorkoutDuration }} dk
                </span>
              </div>

              <h3 class="mt-3 text-base font-bold text-ink-900">
                {{ cycle().recommendedWorkoutTitle }}
              </h3>
              <p class="mt-1 text-xs leading-relaxed text-ink-700">
                {{ cycle().recommendedWorkoutNote }}
              </p>

              <div class="mt-3 flex flex-wrap gap-1.5">
                @for (cat of cycle().recommendedCategories; track cat) {
                  <span class="rounded-lg bg-sage-100 px-2.5 py-0.5 text-[11px] font-medium text-sage-800">
                    #{{ categoryLabel(cat) }}
                  </span>
                }
              </div>
            </div>

            <div class="mt-5 flex items-center justify-between border-t border-sage-200/70 pt-3">
              <span class="text-xs text-ink-500">Rehberli ses & video akışı</span>
              <a
                routerLink="/app/sessions"
                class="rounded-xl bg-sage-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-sage-700"
              >
                Seansı Başlat →
              </a>
            </div>
          </article>

          <!-- Günün Tarifi -->
          @if (todayRecipe(); as recipe) {
            <article
              class="flex flex-col justify-between rounded-2xl border border-lavender-200 bg-lavender-50/60 p-5"
            >
              <div>
                <div class="flex items-center justify-between">
                  <span class="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-lavender-700">
                    🥗 Günün Tarifi
                  </span>

                  @if (!profileService.hideCalories()) {
                    <span class="rounded-full bg-lavender-100 px-2.5 py-0.5 text-xs font-bold text-lavender-700">
                      {{ recipe.calories }} kcal
                    </span>
                  } @else {
                    <span class="rounded-full bg-cream-200 px-2.5 py-0.5 text-[11px] font-medium text-ink-500">
                      Dengeli Öğün
                    </span>
                  }
                </div>

                <h3 class="mt-3 text-base font-bold text-ink-900">
                  {{ recipe.title }}
                </h3>
                <p class="mt-1 text-xs leading-relaxed text-ink-700">
                  {{ recipe.description }}
                </p>

                <!-- Makro / İçerik Etiketleri -->
                <div class="mt-3 flex flex-wrap gap-2 text-[11px]">
                  @if (!profileService.hideCalories()) {
                    <span class="rounded-lg bg-white px-2.5 py-1 font-medium text-ink-700">
                      Protein: <strong>{{ recipe.protein }}g</strong>
                    </span>
                    <span class="rounded-lg bg-white px-2.5 py-1 font-medium text-ink-700">
                      Karb: <strong>{{ recipe.carbs }}g</strong>
                    </span>
                    <span class="rounded-lg bg-white px-2.5 py-1 font-medium text-ink-700">
                      Yağ: <strong>{{ recipe.fat }}g</strong>
                    </span>
                  } @else {
                    @for (ing of recipe.ingredients.slice(0, 3); track ing.name) {
                      <span class="rounded-lg bg-white px-2.5 py-1 font-medium text-ink-700">
                        {{ ing.name }}
                      </span>
                    }
                  }
                </div>
              </div>

              <div class="mt-5 flex items-center justify-between border-t border-lavender-200/70 pt-3">
                <span class="text-xs text-ink-500">
                  {{ recipe.turkishCuisine ? 'Anadolu Mutfağı' : 'Akdeniz Wellness' }}
                </span>
                <a
                  routerLink="/app/recipes"
                  class="rounded-xl bg-lavender-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-lavender-700"
                >
                  Tarife Git →
                </a>
              </div>
            </article>
          }
        </div>
      </section>

      <!-- 3) "Yakınındaki Etkinlik" Mini Harita / Kart Önizlemesi -->
      <section class="wl-card space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-lg font-bold text-ink-900">Yakınındaki Etkinlik</h2>
            <p class="text-xs text-ink-500">
              Konumuna 5 km yarıçapındaki açık hava ve stüdyo buluşmaları
            </p>
          </div>
          <a routerLink="/app/map" class="wl-link text-xs">Tümünü Haritada Gör →</a>
        </div>

        @if (featuredEvent(); as ev) {
          <div class="grid gap-4 md:grid-cols-[1.15fr_1fr]">
            <!-- Stilize Mini Harita Önizlemesi (SVG + Konum Pinleri) -->
            <div
              class="relative min-h-48 overflow-hidden rounded-2xl border border-sage-200 bg-gradient-to-tr from-sage-100 via-cream-100 to-lavender-100 p-4"
            >
              <!-- Harita Grid & Yol Çizgileri -->
              <svg
                class="pointer-events-none absolute inset-0 h-full w-full opacity-55"
                viewBox="0 0 400 200"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 140 Q 120 90, 220 130 T 400 95"
                  fill="none"
                  stroke="#7fb18f"
                  stroke-width="14"
                  stroke-linecap="round"
                />
                <path
                  d="M40 0 Q 110 100, 190 200"
                  fill="none"
                  stroke="#fffdf8"
                  stroke-width="6"
                />
                <path
                  d="M260 0 Q 240 110, 310 200"
                  fill="none"
                  stroke="#fffdf8"
                  stroke-width="5"
                />
                <circle cx="210" cy="105" r="38" fill="#5f9773" fill-opacity="0.14" />
              </svg>

              <!-- Aktif Etkinlik Pin -->
              <div class="relative z-10 flex h-full flex-col justify-between">
                <div class="flex items-center justify-between">
                  <span class="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-sage-800 shadow-2xs">
                    📍 {{ ev.address }}
                  </span>
                  <span class="rounded-full bg-sage-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    1.4 km
                  </span>
                </div>

                <div class="my-auto flex items-center justify-center">
                  <div class="flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2 shadow-soft">
                    <span class="flex h-7 w-7 items-center justify-center rounded-xl bg-sage-500 text-xs font-bold text-white">
                      ★
                    </span>
                    <div class="text-left">
                      <p class="text-xs font-bold text-ink-900">{{ ev.title }}</p>
                      <p class="text-[10px] text-ink-500">
                        Koordinat: {{ ev.latitude }}, {{ ev.longitude }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between text-[11px] text-ink-700">
                  <span class="rounded-lg bg-white/80 px-2 py-0.5">
                    PostGIS Canlı Yakınlık Sorgusu
                  </span>
                  <span class="font-semibold text-sage-800">
                    Kontenjan: {{ ev.capacity }} kişi
                  </span>
                </div>
              </div>
            </div>

            <!-- Etkinlik Detay & Hızlı Katılım (RSVP) -->
            <div class="flex flex-col justify-between rounded-2xl border border-cream-200 bg-white/80 p-5">
              <div>
                <div class="flex items-center justify-between gap-2">
                  <span class="rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-800">
                    {{ categoryLabel(ev.category) }}
                  </span>
                  <span class="text-xs font-semibold text-lavender-700">
                    {{ ev.isFree ? 'Ücretsiz Topluluk Etkinliği' : ev.price + ' ₺' }}
                  </span>
                </div>

                <h3 class="mt-3 text-base font-bold text-ink-900">{{ ev.title }}</h3>
                <p class="mt-1 text-xs leading-relaxed text-ink-700">{{ ev.description }}</p>

                <div class="mt-3 space-y-1 text-xs text-ink-500">
                  <p>🗓️ {{ ev.date | date: 'dd MMM yyyy, HH:mm' }}</p>
                  <p>📌 {{ ev.address }}</p>
                </div>
              </div>

              <div class="mt-4 flex items-center gap-2 pt-3">
                <button
                  type="button"
                  (click)="reserveQuickly(ev)"
                  class="flex-1 rounded-xl bg-sage-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-sage-600"
                >
                  {{ bookedQrCode() ? 'Katılım Onaylandı (QR Hazır)' : 'Hızlı Katıl (RSVP)' }}
                </button>
                <a
                  routerLink="/app/map"
                  class="rounded-xl border border-cream-300 bg-cream-50 px-3.5 py-2.5 text-xs font-semibold text-ink-700 hover:border-sage-300"
                >
                  Harita
                </a>
              </div>

              @if (bookedQrCode(); as qr) {
                <p class="mt-2 rounded-xl bg-sage-50 px-3 py-1.5 text-[11px] font-medium text-sage-800">
                  Giriş QR Kodun: <strong class="font-mono">{{ qr }}</strong>
                </p>
              }
            </div>
          </div>
        }
      </section>
    </div>
  `,
})
export class TodayDashboardComponent implements OnInit {
  protected readonly profileService = inject(ProfileService);
  private readonly eventService = inject(EventService);
  private readonly recipeService = inject(RecipeService);

  protected readonly cycle = this.profileService.cycleSnapshot;
  protected readonly circumference = 2 * Math.PI * 66;

  protected readonly strokeDashoffset = computed(() => {
    const pct = this.cycle().progressPercent;
    return this.circumference * (1 - pct / 100);
  });

  protected readonly workoutStarted = signal(false);
  protected readonly bookedQrCode = signal<string | null>(null);

  protected readonly phases = [
    { key: 'MENSTRUAL', label: 'Menstrüel', days: 'Gün 1-5' },
    { key: 'FOLLICULAR', label: 'Foliküler', days: 'Gün 6-12' },
    { key: 'OVULATORY', label: 'Ovulasyon', days: 'Gün 13-15' },
    { key: 'LUTEAL', label: 'Luteal', days: 'Gün 16-28' },
  ] as const;

  protected readonly todayRecipe = computed(() =>
    this.recipeService.getRecommendedForToday(
      this.cycle().phase,
      this.profileService.profile().dietType,
    ),
  );

  protected readonly featuredEvent = computed<WellnessEvent | undefined>(() => {
    const events = this.eventService.events();
    const recCategories = this.cycle().recommendedCategories;
    return events.find((e) => recCategories.includes(e.category)) ?? events[0];
  });

  protected readonly dietLabel = computed(() => {
    switch (this.profileService.profile().dietType) {
      case 'VEGAN':
        return 'Vegan';
      case 'VEGETARIAN':
        return 'Vejetaryen';
      case 'PESCATARIAN':
        return 'Pesketaryen';
      default:
        return 'Normal Beslenme';
    }
  });

  ngOnInit(): void {
    this.eventService.getUpcomingEvents().subscribe();
    this.recipeService.getRecipes().subscribe();
  }

  protected categoryLabel(category: EventCategory): string {
    const labels: Record<EventCategory, string> = {
      YOGA: 'Yoga',
      PILATES: 'Pilates',
      RUNNING: 'Koşu',
      SAILING: 'Yelken',
      CYCLING: 'Bisiklet',
      HIKING: 'Doğa Yürüyüşü',
      SWIMMING: 'Yüzme',
      MEDITATION: 'Meditasyon',
      DANCE: 'Dans',
      FITNESS: 'Fitness',
      OTHER: 'Diğer',
    };
    return labels[category] ?? category;
  }

  protected reserveQuickly(ev: WellnessEvent): void {
    this.eventService.bookEvent(ev.id).subscribe((booking) => {
      this.bookedQrCode.set(booking.qrCode);
    });
  }
}
