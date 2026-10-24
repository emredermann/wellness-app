import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import {
  WellnessIconComponent,
  WellnessIconName,
} from '../../shared/components/icon/wellness-icon.component';

interface NavItem {
  path: string;
  label: string;
  subtitle: string;
  icon: WellnessIconName;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, WellnessIconComponent],
  template: `
    <div class="flex min-h-dvh flex-col bg-cream-100 text-ink-700 lg:flex-row">
      <!-- =========================================================================
           MASAÜSTÜ (PC) SOL SABİT SIDEBAR NAVİGASYON (lg: 1024px ve üzeri)
           ========================================================================= -->
      <aside
        aria-label="Masaüstü Ana Menü"
        class="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-72 lg:shrink-0 lg:flex-col lg:justify-between lg:border-r lg:border-cream-200/90 lg:bg-cream-50/95 lg:p-6"
      >
        <div class="space-y-7">
          <!-- Marka Logosu -->
          <a routerLink="/app/today" class="group flex items-center gap-3.5 px-1">
            <span
              class="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-600 to-lavender-600 text-white shadow-soft transition group-hover:scale-105"
            >
              <app-icon name="lotus" sizeClass="h-6 w-6" />
            </span>
            <div>
              <span class="font-editorial block text-2xl leading-none text-ink-900">LunaWell</span>
              <span class="mt-1 block text-[11px] font-medium text-ink-400">
                Cycle-Syncing & Holistic Studio
              </span>
            </div>
          </a>

          <!-- Aktif Döngü Fazı Özet Kartı (Sidebar İçinde) -->
          <a
            routerLink="/app/profile"
            class="block rounded-2xl border p-3.5 transition hover:shadow-2xs"
            [class.border-terracotta-200]="profile.cycleSnapshot().phase === 'MENSTRUAL'"
            [class.bg-terracotta-50/80]="profile.cycleSnapshot().phase === 'MENSTRUAL'"
            [class.border-sage-200]="profile.cycleSnapshot().phase === 'FOLLICULAR'"
            [class.bg-sage-50/80]="profile.cycleSnapshot().phase === 'FOLLICULAR'"
            [class.border-amber-200]="profile.cycleSnapshot().phase === 'OVULATORY'"
            [class.bg-amber-50/80]="profile.cycleSnapshot().phase === 'OVULATORY'"
            [class.border-lavender-200]="profile.cycleSnapshot().phase === 'LUTEAL'"
            [class.bg-lavender-50/80]="profile.cycleSnapshot().phase === 'LUTEAL'"
          >
            <div class="flex items-center justify-between">
              <span class="inline-flex items-center gap-1.5 text-xs font-bold text-ink-900">
                <app-icon [name]="phaseMoonIcon()" sizeClass="h-4 w-4 text-sage-700" />
                <span>{{ profile.cycleSnapshot().phaseLabel }}</span>
              </span>
              <span class="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-ink-900">
                {{ profile.cycleSnapshot().dayOfCycle }}. Gün
              </span>
            </div>
            <p class="mt-1.5 text-[11px] text-ink-500">
              {{ profile.cycleSnapshot().energyTitle }} · Yeni döngüye
              {{ profile.cycleSnapshot().daysUntilNextPeriod }} gün
            </p>
          </a>

          <!-- Masaüstü Menü Linkleri -->
          <nav class="space-y-1.5">
            @for (item of navItems; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-sage-600 text-white shadow-soft"
                #rla="routerLinkActive"
                class="group flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition"
                [class.text-ink-700]="!rla.isActive"
                [class.hover:bg-sage-50]="!rla.isActive"
              >
                <app-icon
                  [name]="item.icon"
                  sizeClass="h-5 w-5 shrink-0 transition-transform group-hover:scale-110"
                />
                <div class="min-w-0 flex-1">
                  <span class="block leading-tight">{{ item.label }}</span>
                  <span
                    class="block truncate text-[11px] font-normal"
                    [class.text-sage-100]="rla.isActive"
                    [class.text-ink-400]="!rla.isActive"
                  >
                    {{ item.subtitle }}
                  </span>
                </div>
              </a>
            }
          </nav>
        </div>

        <!-- Kullanıcı & Çıkış Bölümü -->
        <div class="space-y-3 border-t border-cream-200 pt-4">
          @if (auth.currentUser(); as user) {
            <div class="flex items-center justify-between gap-2">
              <a routerLink="/app/profile" class="flex min-w-0 items-center gap-2.5">
                <span
                  class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage-600 text-xs font-bold text-white"
                >
                  {{ user.name.charAt(0).toUpperCase() }}
                </span>
                <div class="min-w-0">
                  <p class="truncate text-xs font-bold text-ink-900">{{ user.name }}</p>
                  <p class="truncate text-[11px] text-ink-400">{{ user.email }}</p>
                </div>
              </a>

              <button
                type="button"
                (click)="auth.logout()"
                title="Çıkış Yap"
                class="shrink-0 rounded-xl border border-cream-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-500 transition hover:border-terracotta-200 hover:bg-terracotta-50 hover:text-terracotta-700"
              >
                Çıkış
              </button>
            </div>
          }
        </div>
      </aside>

      <!-- =========================================================================
           SAĞ / MERKEZ İÇERİK ALANI + MOBİL/TABLET ÜST HEADER VE ALT BAR
           ========================================================================= -->
      <div class="flex min-w-0 flex-1 flex-col">
        <!-- Mobil & Tablet Üst Başlık Çubuğu (lg altında görünür) -->
        <header
          class="sticky top-0 z-30 border-b border-cream-200/80 bg-cream-50/90 backdrop-blur-lg lg:hidden"
        >
          <div class="mx-auto flex max-w-4xl items-center justify-between gap-2 px-3.5 py-2.5 sm:px-5 sm:py-3">
            <a routerLink="/app/today" class="flex items-center gap-2.5">
              <span
                class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sage-600 to-lavender-600 text-white shadow-2xs"
              >
                <app-icon name="lotus" sizeClass="h-5 w-5" />
              </span>
              <div>
                <span class="font-editorial block text-lg leading-none text-ink-900">LunaWell</span>
                <span class="block text-[10px] font-medium text-ink-400">
                  {{ profile.cycleSnapshot().phaseLabel }} · {{ profile.cycleSnapshot().dayOfCycle }}. Gün
                </span>
              </div>
            </a>

            <div class="flex items-center gap-2">
              @if (auth.currentUser(); as user) {
                <a
                  routerLink="/app/profile"
                  class="flex items-center gap-1.5 rounded-full border border-cream-300 bg-cream-50 px-2.5 py-1 text-xs font-semibold text-ink-700"
                >
                  <span
                    class="flex h-6 w-6 items-center justify-center rounded-full bg-sage-600 text-[11px] font-bold text-white"
                  >
                    {{ user.name.charAt(0).toUpperCase() }}
                  </span>
                  <span class="hidden sm:inline">{{ user.name.split(' ')[0] }}</span>
                </a>
              }

              <button
                type="button"
                (click)="auth.logout()"
                class="rounded-xl border border-cream-300 bg-white/90 px-2.5 py-1.5 text-xs font-medium text-ink-500 active:bg-terracotta-50"
              >
                Çıkış
              </button>
            </div>
          </div>
        </header>

        <!-- Sayfa İçeriği (Mobilde alt bar için pb-24, PC'de geniş container ve pb-10) -->
        <main class="mx-auto w-full max-w-6xl flex-1 px-3.5 pt-4 pb-24 sm:px-6 sm:pt-6 lg:px-8 lg:py-8">
          <router-outlet />
        </main>

        <!-- Mobil & Tablet Alt Navigasyon Çubuğu (lg altında sabit, iOS safe-area uyumlu) -->
        <nav
          aria-label="Mobil Alt Menü"
          class="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-cream-200/90 bg-cream-50/95 shadow-nav backdrop-blur-xl lg:hidden"
        >
          <div class="mx-auto grid max-w-xl grid-cols-5 px-1.5 pt-1.5">
            @for (item of navItems; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="text-sage-700 bg-sage-100/80 font-bold"
                class="group flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-medium text-ink-500 transition active:scale-95"
              >
                <app-icon [name]="item.icon" sizeClass="h-5 w-5" />
                <span class="truncate">{{ item.label }}</span>
              </a>
            }
          </div>
        </nav>
      </div>
    </div>
  `,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly profile = inject(ProfileService);

  protected readonly navItems: NavItem[] = [
    { path: '/app/today', label: 'Bugün', subtitle: 'Döngü & Günlük Özet', icon: 'sun' },
    { path: '/app/map', label: 'Harita', subtitle: 'Yakındaki Etkinlikler', icon: 'compass' },
    { path: '/app/sessions', label: 'Seanslar', subtitle: 'Nefes & Meditasyon', icon: 'lotus' },
    { path: '/app/recipes', label: 'Tarifler', subtitle: 'Beslenme & Liste', icon: 'bowl' },
    { path: '/app/profile', label: 'Profil', subtitle: 'Takvim & KVKK', icon: 'user' },
  ];

  protected phaseMoonIcon(): WellnessIconName {
    switch (this.profile.cycleSnapshot().phase) {
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
}
