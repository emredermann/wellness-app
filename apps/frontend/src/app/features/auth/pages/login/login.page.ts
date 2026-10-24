import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { WellnessIconComponent } from '../../../../shared/components/icon/wellness-icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, WellnessIconComponent],
  template: `
    <div class="flex min-h-screen flex-col justify-center bg-gradient-to-br from-sage-50 via-cream-100 to-lavender-50 px-4 py-10">
      <div class="mx-auto w-full max-w-md">
        <!-- Marka Başlığı -->
        <div class="mb-8 text-center">
          <div class="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 shadow-soft">
            <app-icon name="lotus" sizeClass="h-7 w-7" />
          </div>
          <span class="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold tracking-wider text-sage-700 uppercase">
            LunaWell Holistic Studio
          </span>
          <h1 class="mt-2.5 text-3xl text-ink-900">Tekrar Hoş Geldin</h1>
          <p class="mt-1.5 text-sm text-ink-500">
            Bedeninin biyolojik ritmine uyum sağlamak için hesabına giriş yap.
          </p>
        </div>

        <!-- Form Kartı -->
        <div class="wl-card">
          @if (errorMessage()) {
            <div class="mb-5 rounded-2xl border border-terracotta-200 bg-terracotta-50 px-4 py-3 text-sm text-terracotta-700">
              {{ errorMessage() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-5" novalidate>
            <div>
              <label for="email" class="wl-label">E-posta Adresi</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="ornek@wellness.app"
                class="wl-input"
                [class.wl-input-error]="isFieldInvalid('email')"
              />
              @if (isFieldInvalid('email')) {
                <p class="wl-error">Lütfen geçerli bir e-posta adresi girin.</p>
              }
            </div>

            <div>
              <label for="password" class="wl-label">Şifre</label>
              <div class="relative">
                <input
                  id="password"
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  autocomplete="current-password"
                  placeholder="••••••••"
                  class="wl-input pr-14"
                  [class.wl-input-error]="isFieldInvalid('password')"
                />
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute inset-y-0 right-3.5 flex items-center text-xs font-semibold text-ink-500 hover:text-ink-900"
                >
                  {{ showPassword() ? 'Gizle' : 'Göster' }}
                </button>
              </div>
              @if (isFieldInvalid('password')) {
                <p class="wl-error">Şifre en az 6 karakter olmalıdır.</p>
              }
            </div>

            <div class="flex items-center justify-between text-xs">
              <label class="inline-flex cursor-pointer items-center gap-2 font-medium text-ink-700">
                <input
                  type="checkbox"
                  formControlName="rememberMe"
                  class="h-4 w-4 rounded border-cream-400 text-sage-600 focus:ring-sage-300"
                />
                <span>Beni hatırla</span>
              </label>
              <span class="inline-flex items-center gap-1 text-ink-400">
                <app-icon name="shield-check" sizeClass="h-3.5 w-3.5 text-sage-600" />
                <span>JWT korumalı oturum</span>
              </span>
            </div>

            <button type="submit" [disabled]="loading()" class="wl-btn-primary">
              @if (loading()) {
                <span>Giriş yapılıyor...</span>
              } @else {
                <span>Giriş Yap</span>
                <app-icon name="arrow-right" sizeClass="h-4 w-4" />
              }
            </button>
          </form>

          <div class="mt-6 border-t border-cream-200 pt-5 text-center text-xs text-ink-500">
            Henüz hesabın yok mu?
            <a routerLink="/register" class="wl-link ml-1">KVKK onayıyla ücretsiz kayıt ol</a>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly showPassword = signal(false);
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    email: ['selin@wellness.app', [Validators.required, Validators.email]],
    password: ['wellness123', [Validators.required, Validators.minLength(6)]],
    rememberMe: [true],
  });

  protected isFieldInvalid(field: 'email' | 'password'): boolean {
    const ctrl = this.form.controls[field];
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password, rememberMe } = this.form.getRawValue();
    this.auth.login({ email, password }, rememberMe).subscribe({
      next: () => {
        this.loading.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/app/today';
        void this.router.navigateByUrl(returnUrl);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
      },
    });
  }
}
