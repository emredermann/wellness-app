import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ProfileService } from '../../core/services/profile.service';

interface BottomNavItem {
  path: string;
  label: string;
  icon: 'today' | 'map' | 'sessions' | 'recipes' | 'profile';
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex min-h-screen flex-col bg-cream-100 text-ink-700">
      <!-- Üst Sakin Başlık Çubuğu -->
      <header class="sticky top-0 z-30 border-b border-cream-200/80 bg-cream-50/90 backdrop-blur-md">
        <div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5">
          <a routerLink="/app/today" class="flex items-center gap-2.5">
            <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-100 text-sage-700">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3c2.5 3.5 4 7 4 10a4 4 0 11-8 0c0-3 1.5-6.5 4-10z" />
              </svg>
            </span>
            <div>
              <span class="block text-base font-bold tracking-tight text-ink-900">LunaWell</span>
              <span class="block text-[11px] text-ink-400">Bütüncül Yaşam & Döngü Rehberi</span>
            </div>
          </a>

          <div class="flex items-center gap-3">
            <span class="hidden rounded-full bg-lavender-100 px-3 py-1 text-xs font-medium text-lavender-700 sm:inline-flex">
              {{ profile.cycleSnapshot().phaseLabel }} · Gün {{ profile.cycleSnapshot().dayOfCycle }}
            </span>

            @if (auth.currentUser(); as user) {
              <a
                routerLink="/app/profile"
                class="flex items-center gap-2 rounded-full border border-cream-300 bg-cream-50 px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-sage-300"
              >
                <span class="flex h-6 w-6 items-center justify-center rounded-full bg-sage-200 text-[11px] font-bold text-sage-800">
                  {{ user.name.charAt(0).toUpperCase() }}
                </span>
                <span class="hidden sm:inline">{{ user.name }}</span>
              </a>
            }

            <button
              type="button"
              (click)="auth.logout()"
              title="Çıkış Yap"
              class="rounded-xl border border-cream-300 px-2.5 py-1.5 text-xs font-medium text-ink-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
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

      <!-- Alt Navigasyon Çubuğu (Bugün, Harita, Seanslar, Tarifler, Profil) -->
      <nav
        aria-label="Ana Navigasyon"
        class="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-cream-50/95 shadow-nav backdrop-blur-md"
      >
        <div class="mx-auto grid max-w-xl grid-cols-5 px-2 py-1.5">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="text-sage-700 bg-sage-50/90 font-semibold"
              class="group flex flex-col items-center justify-center gap-1 rounded-2xl py-2 text-xs text-ink-500 transition hover:text-sage-600"
            >
              @switch (item.icon) {
                @case ('today') {
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                    <circle cx="12" cy="12" r="4" />
                    <path stroke-linecap="round" d="M12 3v2m0 14v2M3 12h2m14 0h2m-2.9-6.1-1.4 1.4M7.3 16.7l-1.4 1.4m0-12.2 1.4 1.4m9.4 9.4 1.4 1.4" />
                  </svg>
                }
                @case ('map') {
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z" />
                    <circle cx="12" cy="11" r="2.3" />
                  </svg>
                }
                @case ('sessions') {
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                    <circle cx="12" cy="12" r="9" />
                    <polygon points="10,8.5 16,12 10,15.5" fill="currentColor" stroke="none" />
                  </svg>
                }
                @case ('recipes') {
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 11h16a7 7 0 0 1-14 0H4zm3 7h10M9 4c0 1.5 1.5 2 1.5 3.5M14 4c0 1.5 1.5 2 1.5 3.5" />
                  </svg>
                }
                @case ('profile') {
                  <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9">
                    <circle cx="12" cy="8" r="3.5" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 20a7 7 0 0 1 14 0" />
                  </svg>
                }
              }
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
    { path: '/app/today', label: 'Bugün', icon: 'today' },
    { path: '/app/map', label: 'Harita', icon: 'map' },
    { path: '/app/sessions', label: 'Seanslar', icon: 'sessions' },
    { path: '/app/recipes', label: 'Tarifler', icon: 'recipes' },
    { path: '/app/profile', label: 'Profil', icon: 'profile' },
  ];
}
