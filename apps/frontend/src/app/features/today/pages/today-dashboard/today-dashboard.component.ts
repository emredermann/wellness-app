import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CyclePhase, EventCategory, WellnessEvent } from '../../../../core/models/domain.models';
import { EventService } from '../../../../core/services/event.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { RecipeService } from '../../../../core/services/recipe.service';
import {
  WellnessIconComponent,
  WellnessIconName,
} from '../../../../shared/components/icon/wellness-icon.component';

interface SymptomLogOption {
  id: string;
  label: string;
  icon: WellnessIconName;
}

@Component({
  selector: 'app-today-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, WellnessIconComponent],
  template: `
    <div class="space-y-6">
      <!-- Üst Editorial Karşılama & Sezgisel Beslenme (Kalori Gizleme) Toggle -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-sage-700 uppercase">
            <app-icon name="sparkle" sizeClass="h-3.5 w-3.5" />
            <span>Biyolojik Ritim & Günlük Rehber</span>
          </p>
          <h1 class="mt-1 text-3xl text-ink-900">
            Merhaba, {{ profileService.profile().name.split(' ')[0] }}
          </h1>
        </div>

        <!-- Kalori Gösterimini Gizleme / Açma (Mindful Beslenme Toggle) -->
        <button
          type="button"
          (click)="profileService.toggleCaloriesVisibility()"
          [attr.aria-pressed]="!profileService.hideCalories()"
          class="inline-flex items-center gap-2.5 rounded-full border border-cream-300 bg-cream-50 px-4 py-2 text-xs font-semibold text-ink-700 shadow-2xs transition hover:border-sage-400"
        >
          <span
            class="inline-block h-2.5 w-2.5 rounded-full transition"
            [class.bg-sage-600]="!profileService.hideCalories()"
            [class.bg-lavender-500]="profileService.hideCalories()"
          ></span>
          <span>
            {{ profileService.hideCalories() ? 'Sezgisel Mod (Kaloriler Gizli)' : 'Kalorileri Göster' }}
          </span>
        </button>
      </div>

      <!-- 1) Faz-Adaptif Döngü / Enerji Halkası Widget (Wild AI & Flo İlhamlı) -->
      <section
        class="relative overflow-hidden rounded-3xl border p-6 shadow-soft transition-colors"
        [class.border-terracotta-200]="cycle().phase === 'MENSTRUAL'"
        [class.bg-gradient-to-br]="true"
        [class.from-terracotta-50]="cycle().phase === 'MENSTRUAL'"
        [class.via-cream-50]="true"
        [class.to-lavender-50]="cycle().phase === 'MENSTRUAL' || cycle().phase === 'LUTEAL'"
        [class.border-sage-200]="cycle().phase === 'FOLLICULAR'"
        [class.from-sage-50]="cycle().phase === 'FOLLICULAR'"
        [class.to-cream-100]="cycle().phase === 'FOLLICULAR'"
        [class.border-amber-200]="cycle().phase === 'OVULATORY'"
        [class.from-amber-50]="cycle().phase === 'OVULATORY'"
        [class.to-sage-50]="cycle().phase === 'OVULATORY'"
        [class.border-lavender-200]="cycle().phase === 'LUTEAL'"
        [class.from-lavender-50]="cycle().phase === 'LUTEAL'"
      >
        <div class="grid items-center gap-6 md:grid-cols-[auto_1fr]">
          <!-- SVG Döngü Halkası + Ay Fazı İkonu -->
          <div class="relative mx-auto flex h-48 w-48 items-center justify-center">
            <svg class="h-48 w-48 -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="66"
                fill="none"
                stroke="currentColor"
                stroke-width="11"
                class="text-white/85"
              />
              <circle
                cx="80"
                cy="80"
                r="66"
                fill="none"
                stroke="currentColor"
                stroke-width="11"
                stroke-linecap="round"
                [attr.stroke-dasharray]="circumference"
                [attr.stroke-dashoffset]="strokeDashoffset()"
                class="transition-all duration-700"
                [class.text-terracotta-500]="cycle().phase === 'MENSTRUAL'"
                [class.text-sage-600]="cycle().phase === 'FOLLICULAR'"
                [class.text-amber-500]="cycle().phase === 'OVULATORY'"
                [class.text-lavender-600]="cycle().phase === 'LUTEAL'"
              />
            </svg>

            <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span
                class="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold shadow-2xs"
                [class.text-terracotta-700]="cycle().phase === 'MENSTRUAL'"
                [class.text-sage-800]="cycle().phase === 'FOLLICULAR'"
                [class.text-amber-700]="cycle().phase === 'OVULATORY'"
                [class.text-lavender-700]="cycle().phase === 'LUTEAL'"
              >
                <app-icon [name]="phaseIcon(cycle().phase)" sizeClass="h-3.5 w-3.5" />
                <span>{{ cycle().phaseLabel }}</span>
              </span>
              <span class="font-editorial mt-1.5 text-4xl text-ink-900">
                {{ cycle().dayOfCycle }}. Gün
              </span>
              <span class="text-xs font-medium text-ink-500">
                {{ cycle().cycleLength }} günlük döngü
              </span>
            </div>
          </div>

          <!-- Faz & Enerji Detayları -->
          <div class="space-y-3.5">
            <div class="flex flex-wrap items-center gap-2">
              <span class="wl-glass-pill text-ink-900">
                <app-icon name="flame" sizeClass="h-3.5 w-3.5 text-sage-700" />
                <span>{{ cycle().energyTitle }}</span>
              </span>
              <span class="wl-glass-pill text-ink-700">
                <app-icon name="calendar" sizeClass="h-3.5 w-3.5 text-lavender-600" />
                <span>Yeni döngüye {{ cycle().daysUntilNextPeriod }} gün</span>
              </span>
            </div>

            <h2 class="text-2xl text-ink-900">
              {{ cycle().energyTitle }}
            </h2>
            <p class="text-sm leading-relaxed text-ink-700">
              {{ cycle().energySubtitle }}
            </p>

            <!-- 4 Fazlı Organik Zaman Çizelgesi (Ay Fazı Sembolleriyle) -->
            <div class="grid grid-cols-2 gap-2 pt-1 sm:grid-cols-4">
              @for (p of phases; track p.key) {
                <div
                  class="flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left text-xs transition"
                  [class.border-sage-500]="cycle().phase === p.key"
                  [class.bg-white]="cycle().phase === p.key"
                  [class.shadow-2xs]="cycle().phase === p.key"
                  [class.border-white/60]="cycle().phase !== p.key"
                  [class.bg-white/55]="cycle().phase !== p.key"
                >
                  <span
                    class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    [class.bg-terracotta-100]="p.key === 'MENSTRUAL'"
                    [class.text-terracotta-700]="p.key === 'MENSTRUAL'"
                    [class.bg-sage-100]="p.key === 'FOLLICULAR'"
                    [class.text-sage-800]="p.key === 'FOLLICULAR'"
                    [class.bg-amber-100]="p.key === 'OVULATORY'"
                    [class.text-amber-700]="p.key === 'OVULATORY'"
                    [class.bg-lavender-100]="p.key === 'LUTEAL'"
                    [class.text-lavender-700]="p.key === 'LUTEAL'"
                  >
                    <app-icon [name]="p.icon" sizeClass="h-4 w-4" />
                  </span>
                  <div>
                    <span class="block text-[10px] font-medium text-ink-400">{{ p.days }}</span>
                    <span class="font-bold text-ink-900">{{ p.label }}</span>
                  </div>
                </div>
              }
            </div>

            <!-- Clue & Flo Tarzı Hızlı Günlük His / Semptom Check-in -->
            <div class="flex flex-wrap items-center gap-2 border-t border-ink-900/10 pt-3">
              <span class="text-xs font-semibold text-ink-700">Bugün nasıl hissediyorsun?</span>
              @for (sym of symptomOptions; track sym.id) {
                <button
                  type="button"
                  (click)="toggleSymptom(sym.id)"
                  class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition"
                  [class.border-sage-600]="isSymptomSelected(sym.id)"
                  [class.bg-sage-600]="isSymptomSelected(sym.id)"
                  [class.text-white]="isSymptomSelected(sym.id)"
                  [class.border-white/80]="!isSymptomSelected(sym.id)"
                  [class.bg-white/80]="!isSymptomSelected(sym.id)"
                  [class.text-ink-700]="!isSymptomSelected(sym.id)"
                >
                  <app-icon [name]="sym.icon" sizeClass="h-3.5 w-3.5" />
                  <span>{{ sym.label }}</span>
                </button>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- 2) "Bugün Sana Ne İyi Gelir?" Kartı (Günün Egzersizi + Günün Tarifi) -->
      <section class="wl-card space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 class="text-2xl text-ink-900">Bugün Sana Ne İyi Gelir?</h2>
            <p class="text-xs text-ink-500">
              {{ cycle().phaseLabel }} ritmine ve {{ dietLabel() }} tercihine göre kürasyon
            </p>
          </div>
          <span class="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3.5 py-1 text-xs font-semibold text-sage-800">
            <app-icon name="lotus" sizeClass="h-3.5 w-3.5" />
            <span>Cycle-Synced Kürasyon</span>
          </span>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <!-- Günün Egzersizi (Alo Moves Tarzı Kart) -->
          <article
            class="flex flex-col justify-between rounded-3xl border border-sage-200/90 bg-gradient-to-br from-sage-50/90 via-white to-cream-50 p-5"
          >
            <div>
              <div class="flex items-center justify-between">
                <span class="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-800">
                  <app-icon name="yoga" sizeClass="h-3.5 w-3.5" />
                  <span>Günün Hareketi</span>
                </span>
                <span class="inline-flex items-center gap-1 text-xs font-semibold text-ink-500">
                  <app-icon name="clock" sizeClass="h-3.5 w-3.5" />
                  <span>{{ cycle().recommendedWorkoutDuration }} dk</span>
                </span>
              </div>

              <h3 class="mt-3.5 text-lg font-bold text-ink-900">
                {{ cycle().recommendedWorkoutTitle }}
              </h3>
              <p class="mt-1 text-xs leading-relaxed text-ink-700">
                {{ cycle().recommendedWorkoutNote }}
              </p>

              <div class="mt-3.5 flex flex-wrap gap-1.5">
                @for (cat of cycle().recommendedCategories; track cat) {
                  <span class="inline-flex items-center gap-1 rounded-xl bg-sage-100/80 px-2.5 py-1 text-[11px] font-semibold text-sage-800">
                    <app-icon [name]="categoryIcon(cat)" sizeClass="h-3 w-3" />
                    <span>{{ categoryLabel(cat) }}</span>
                  </span>
                }
              </div>
            </div>

            <div class="mt-5 flex items-center justify-between border-t border-sage-200/60 pt-3.5">
              <span class="inline-flex items-center gap-1.5 text-xs text-ink-500">
                <app-icon name="breath" sizeClass="h-3.5 w-3.5 text-sage-600" />
                <span>432 Hz Ses & Nefes Rehberli</span>
              </span>
              <a
                routerLink="/app/sessions"
                class="inline-flex items-center gap-1.5 rounded-xl bg-sage-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sage-700"
              >
                <span>Seansı Başlat</span>
                <app-icon name="arrow-right" sizeClass="h-3.5 w-3.5" />
              </a>
            </div>
          </article>

          <!-- Günün Tarifi -->
          @if (todayRecipe(); as recipe) {
            <article
              class="flex flex-col justify-between rounded-3xl border border-lavender-200/90 bg-gradient-to-br from-lavender-50/80 via-white to-cream-50 p-5"
            >
              <div>
                <div class="flex items-center justify-between">
                  <span class="inline-flex items-center gap-1.5 rounded-full bg-lavender-100 px-3 py-1 text-xs font-semibold text-lavender-700">
                    <app-icon name="bowl" sizeClass="h-3.5 w-3.5" />
                    <span>Günün Şifalı Tabağı</span>
                  </span>

                  @if (!profileService.hideCalories()) {
                    <span class="rounded-full bg-lavender-100 px-2.5 py-0.5 text-xs font-bold text-lavender-700">
                      {{ recipe.calories }} kcal
                    </span>
                  } @else {
                    <span class="inline-flex items-center gap-1 rounded-full bg-cream-200 px-2.5 py-0.5 text-[11px] font-semibold text-ink-700">
                      <app-icon name="leaf" sizeClass="h-3 w-3 text-sage-700" />
                      <span>Hormon Dostu Öğün</span>
                    </span>
                  }
                </div>

                <h3 class="mt-3.5 text-lg font-bold text-ink-900">
                  {{ recipe.title }}
                </h3>
                <p class="mt-1 text-xs leading-relaxed text-ink-700">
                  {{ recipe.description }}
                </p>

                <!-- Makro / İçerik Etiketleri -->
                <div class="mt-3.5 flex flex-wrap gap-2 text-[11px]">
                  @if (!profileService.hideCalories()) {
                    <span class="rounded-xl border border-cream-200 bg-white px-2.5 py-1 font-medium text-ink-700">
                      Protein: <strong>{{ recipe.protein }}g</strong>
                    </span>
                    <span class="rounded-xl border border-cream-200 bg-white px-2.5 py-1 font-medium text-ink-700">
                      Karb: <strong>{{ recipe.carbs }}g</strong>
                    </span>
                    <span class="rounded-xl border border-cream-200 bg-white px-2.5 py-1 font-medium text-ink-700">
                      Yağ: <strong>{{ recipe.fat }}g</strong>
                    </span>
                  } @else {
                    @for (ing of recipe.ingredients.slice(0, 3); track ing.name) {
                      <span class="rounded-xl border border-cream-200 bg-white px-2.5 py-1 font-medium text-ink-700">
                        {{ ing.name }}
                      </span>
                    }
                  }
                </div>
              </div>

              <div class="mt-5 flex items-center justify-between border-t border-lavender-200/60 pt-3.5">
                <span class="inline-flex items-center gap-1.5 text-xs text-ink-500">
                  <app-icon name="sprout" sizeClass="h-3.5 w-3.5 text-lavender-600" />
                  <span>{{ recipe.turkishCuisine ? 'Anadolu Mutfağı' : 'Akdeniz Wellness' }}</span>
                </span>
                <a
                  routerLink="/app/recipes"
                  class="inline-flex items-center gap-1.5 rounded-xl bg-lavender-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-lavender-700"
                >
                  <span>Tarife Git</span>
                  <app-icon name="arrow-right" sizeClass="h-3.5 w-3.5" />
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
            <h2 class="text-2xl text-ink-900">Yakınındaki Topluluk Etkinliği</h2>
            <p class="text-xs text-ink-500">
              PostGIS konum sorgusuyla çevrendeki açık hava ve stüdyo buluşmaları
            </p>
          </div>
          <a routerLink="/app/map" class="wl-link inline-flex items-center gap-1 text-xs">
            <span>Tümünü Haritada Gör</span>
            <app-icon name="arrow-right" sizeClass="h-3.5 w-3.5" />
          </a>
        </div>

        @if (featuredEvent(); as ev) {
          <div class="grid gap-4 md:grid-cols-[1.15fr_1fr]">
            <!-- Stilize Mini Harita Önizlemesi -->
            <div
              class="relative min-h-48 overflow-hidden rounded-3xl border border-sage-200 bg-gradient-to-tr from-sage-100 via-cream-100 to-lavender-100 p-4"
            >
              <svg
                class="pointer-events-none absolute inset-0 h-full w-full opacity-55"
                viewBox="0 0 400 200"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 140 Q 120 90, 220 130 T 400 95"
                  fill="none"
                  stroke="#76a68b"
                  stroke-width="14"
                  stroke-linecap="round"
                />
                <path
                  d="M40 0 Q 110 100, 190 200"
                  fill="none"
                  stroke="#fdfbf8"
                  stroke-width="6"
                />
                <path
                  d="M260 0 Q 240 110, 310 200"
                  fill="none"
                  stroke="#fdfbf8"
                  stroke-width="5"
                />
                <circle cx="210" cy="105" r="38" fill="#55896d" fill-opacity="0.16" />
              </svg>

              <div class="relative z-10 flex h-full flex-col justify-between">
                <div class="flex items-center justify-between gap-2">
                  <span class="inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold text-sage-800 shadow-2xs">
                    <app-icon name="map-pin" sizeClass="h-3.5 w-3.5 text-sage-600" />
                    <span>{{ ev.address }}</span>
                  </span>
                  <span class="rounded-full bg-sage-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    1.4 km
                  </span>
                </div>

                <div class="my-auto flex items-center justify-center">
                  <div class="flex items-center gap-2.5 rounded-2xl bg-white/95 px-4 py-2.5 shadow-soft">
                    <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-sage-600 text-white">
                      <app-icon [name]="categoryIcon(ev.category)" sizeClass="h-4 w-4" />
                    </span>
                    <div class="text-left">
                      <p class="text-xs font-bold text-ink-900">{{ ev.title }}</p>
                      <p class="text-[10px] text-ink-500">
                        {{ ev.organizerId }} · {{ ev.latitude }}, {{ ev.longitude }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="flex items-center justify-between text-[11px] text-ink-700">
                  <span class="rounded-lg bg-white/85 px-2.5 py-0.5 font-medium">
                    PostGIS Canlı Yakınlık
                  </span>
                  <span class="inline-flex items-center gap-1 font-semibold text-sage-800">
                    <app-icon name="users" sizeClass="h-3.5 w-3.5" />
                    <span>{{ ev.capacity }} kişilik kontenjan</span>
                  </span>
                </div>
              </div>
            </div>

            <!-- Etkinlik Detay & Hızlı Katılım (RSVP) -->
            <div class="flex flex-col justify-between rounded-3xl border border-cream-200 bg-white/85 p-5">
              <div>
                <div class="flex items-center justify-between gap-2">
                  <span class="inline-flex items-center gap-1.5 rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-800">
                    <app-icon [name]="categoryIcon(ev.category)" sizeClass="h-3.5 w-3.5" />
                    <span>{{ categoryLabel(ev.category) }}</span>
                  </span>
                  <span class="text-xs font-bold text-lavender-700">
                    {{ ev.isFree ? 'Ücretsiz Topluluk Etkinliği' : ev.price + ' ₺' }}
                  </span>
                </div>

                <h3 class="mt-3 text-base font-bold text-ink-900">{{ ev.title }}</h3>
                <p class="mt-1 text-xs leading-relaxed text-ink-700">{{ ev.description }}</p>

                <div class="mt-3 space-y-1.5 text-xs text-ink-500">
                  <p class="inline-flex items-center gap-1.5">
                    <app-icon name="calendar" sizeClass="h-3.5 w-3.5 text-sage-600" />
                    <span>{{ ev.date | date: 'dd MMM yyyy, HH:mm' }}</span>
                  </p>
                  <p class="flex items-center gap-1.5">
                    <app-icon name="map-pin" sizeClass="h-3.5 w-3.5 text-lavender-600" />
                    <span>{{ ev.address }}</span>
                  </p>
                </div>
              </div>

              <div class="mt-4 flex items-center gap-2 pt-3">
                <button
                  type="button"
                  (click)="reserveQuickly(ev)"
                  class="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-sage-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-sage-700"
                >
                  <app-icon name="qr" sizeClass="h-3.5 w-3.5" />
                  <span>{{ bookedQrCode() ? 'Katılım Onaylandı (QR Hazır)' : 'Hızlı Katıl (RSVP)' }}</span>
                </button>
                <a
                  routerLink="/app/map"
                  class="inline-flex items-center gap-1 rounded-xl border border-cream-300 bg-cream-50 px-3.5 py-2.5 text-xs font-semibold text-ink-700 hover:border-sage-400"
                >
                  <app-icon name="compass" sizeClass="h-3.5 w-3.5" />
                  <span>Harita</span>
                </a>
              </div>

              @if (bookedQrCode(); as qr) {
                <p class="mt-2.5 flex items-center justify-between rounded-xl bg-sage-50 px-3 py-2 text-[11px] font-medium text-sage-800">
                  <span>Giriş QR Kodun:</span>
                  <strong class="font-mono">{{ qr }}</strong>
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

  protected readonly bookedQrCode = signal<string | null>(null);
  protected readonly loggedSymptoms = signal<string[]>(['calm', 'hydrated']);

  protected readonly phases: {
    key: CyclePhase;
    label: string;
    days: string;
    icon: WellnessIconName;
  }[] = [
    { key: 'MENSTRUAL', label: 'Menstrüel', days: 'Gün 1-5', icon: 'moon-new' },
    { key: 'FOLLICULAR', label: 'Foliküler', days: 'Gün 6-12', icon: 'moon-waxing' },
    { key: 'OVULATORY', label: 'Ovulasyon', days: 'Gün 13-15', icon: 'moon-full' },
    { key: 'LUTEAL', label: 'Luteal', days: 'Gün 16-28', icon: 'moon-waning' },
  ];

  protected readonly symptomOptions: SymptomLogOption[] = [
    { id: 'calm', label: 'Dengeli & Sakin', icon: 'lotus' },
    { id: 'energetic', label: 'Yüksek Enerji', icon: 'flame' },
    { id: 'hydrated', label: 'Bol Su İçtim', icon: 'droplet' },
    { id: 'sleepy', label: 'Dinlenme İhtiyacı', icon: 'sleep' },
  ];

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
        return 'Dengeli Beslenme';
    }
  });

  ngOnInit(): void {
    this.eventService.getUpcomingEvents().subscribe();
    this.recipeService.getRecipes().subscribe();
  }

  protected phaseIcon(phase: CyclePhase): WellnessIconName {
    switch (phase) {
      case 'MENSTRUAL':
        return 'moon-new';
      case 'FOLLICULAR':
        return 'moon-waxing';
      case 'OVULATORY':
        return 'moon-full';
      case 'LUTEAL':
        return 'moon-waning';
    }
  }

  protected categoryIcon(category: EventCategory): WellnessIconName {
    const icons: Record<EventCategory, WellnessIconName> = {
      YOGA: 'yoga',
      PILATES: 'pilates',
      RUNNING: 'running',
      SAILING: 'sailing',
      CYCLING: 'cycling',
      HIKING: 'hiking',
      SWIMMING: 'swimming',
      MEDITATION: 'meditation',
      DANCE: 'dance',
      FITNESS: 'fitness',
      OTHER: 'sparkle',
    };
    return icons[category] ?? 'lotus';
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

  protected isSymptomSelected(id: string): boolean {
    return this.loggedSymptoms().includes(id);
  }

  protected toggleSymptom(id: string): void {
    const cur = this.loggedSymptoms();
    this.loggedSymptoms.set(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }

  protected reserveQuickly(ev: WellnessEvent): void {
    this.eventService.bookEvent(ev.id).subscribe((booking) => {
      this.bookedQrCode.set(booking.qrCode);
    });
  }
}
