import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ProfileService } from '../../core/services/profile.service';
import {
  WellnessIconComponent,
  WellnessIconName,
} from '../../shared/components/icon/wellness-icon.component';

interface BottomNavItem {
  path: string;
  label: string;
  icon: WellnessIconName;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, WellnessIconComponent],
  template: `
    <div class="flex min-h-screen flex-col bg-cream-100 text-ink-700">
      <!-- Üst Editorial Başlık Çubuğu -->
      <header class="sticky top-0 z-30 border-b border-cream-200/80 bg-cream-50/88 backdrop-blur-lg">
        <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5">
          <a routerLink="/app/today" class="group flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-100 via-cream-100 to-lavender-100 text-sage-700 shadow-2xs transition group-hover:scale-105"
            >
              <app-icon name="lotus" sizeClass="h-5 w-5" />
            </span>
            <div>
              <span class="font-editorial block text-lg leading-none text-ink-900">LunaWell</span>
              <span class="mt-0.5 block text-[11px] font-medium text-ink-400">
                Cycle-Syncing & Holistic Studio
              </span>
            </div>
          </a>

          <div class="flex items-center gap-2.5">
            <!-- Faz-Adaptif Dinamik Rozet -->
            <span
              class="hidden items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold sm:inline-flex"
              [class.border-terracotta-200]="profile.cycleSnapshot().phase === 'MENSTRUAL'"
              [class.bg-terracotta-50]="profile.cycleSnapshot().phase === 'MENSTRUAL'"
              [class.text-terracotta-700]="profile.cycleSnapshot().phase === 'MENSTRUAL'"
              [class.border-sage-200]="profile.cycleSnapshot().phase === 'FOLLICULAR'"
              [class.bg-sage-50]="profile.cycleSnapshot().phase === 'FOLLICULAR'"
              [class.text-sage-800]="profile.cycleSnapshot().phase === 'FOLLICULAR'"
              [class.border-amber-200]="profile.cycleSnapshot().phase === 'OVULATORY'"
              [class.bg-amber-50]="profile.cycleSnapshot().phase === 'OVULATORY'"
              [class.text-amber-700]="profile.cycleSnapshot().phase === 'OVULATORY'"
              [class.border-lavender-200]="profile.cycleSnapshot().phase === 'LUTEAL'"
              [class.bg-lavender-50]="profile.cycleSnapshot().phase === 'LUTEAL'"
              [class.text-lavender-700]="profile.cycleSnapshot().phase === 'LUTEAL'"
            >
              <app-icon [name]="phaseMoonIcon()" sizeClass="h-3.5 w-3.5" />
              <span>
                {{ profile.cycleSnapshot().phaseLabel }} · {{ profile.cycleSnapshot().dayOfCycle }}. Gün
              </span>
            </span>

            @if (auth.currentUser(); as user) {
              <a
                routerLink="/app/profile"
                class="flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-sage-400"
              >
                <span
                  class="flex h-6 w-6 items-center justify-center rounded-full bg-sage-600 text-[11px] font-bold text-white"
                >
                  {{ user.name.charAt(0).toUpperCase() }}
                </span>
                <span class="hidden sm:inline">{{ user.name }}</span>
              </a>
            }

            <button
              type="button"
              (click)="auth.logout()"
              title="Çıkış Yap"
              class="rounded-xl border border-cream-300 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-ink-500 transition hover:border-terracotta-200 hover:bg-terracotta-50 hover:text-terracotta-700"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <!-- Ana İçerik Alanı -->
      <main class="mx-auto w-full max-w-4xl flex-1 px-4 pt-6 pb-28">
        <router-outlet />
      </main>

      <!-- Alt Navigasyon Çubuğu (Flo / Clue / Alo Moves tarzı minimal organik ikonlar) -->
      <nav
        aria-label="Ana Navigasyon"
        class="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200/90 bg-cream-50/92 shadow-nav backdrop-blur-xl"
      >
        <div class="mx-auto grid max-w-xl grid-cols-5 px-2 py-1.5">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="text-sage-700 bg-sage-100/75 font-semibold"
              class="group flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-[11px] text-ink-500 transition hover:text-sage-700"
            >
              <app-icon
                [name]="item.icon"
                sizeClass="h-5 w-5 transition-transform group-hover:scale-110"
              />
              <span>{{ item.label }}</span>
            </a>
          }
        </div>
      </nav>
    </div>
  `,
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly profile = inject(ProfileService);

  protected readonly navItems: BottomNavItem[] = [
    { path: '/app/today', label: 'Bugün', icon: 'sun' },
    { path: '/app/map', label: 'Harita', icon: 'compass' },
    { path: '/app/sessions', label: 'Seanslar', icon: 'lotus' },
    { path: '/app/recipes', label: 'Tarifler', icon: 'bowl' },
    { path: '/app/profile', label: 'Profil', icon: 'user' },
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
