import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen flex-col justify-center bg-gradient-to-br from-lavender-50 via-cream-100 to-sage-50 px-4 py-10">
      <div class="mx-auto w-full max-w-md">
        <!-- Başlık -->
        <div class="mb-7 text-center">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-lavender-100 px-3.5 py-1 text-xs font-semibold text-lavender-700">
            Bütüncül Wellness Yolculuğu
          </span>
          <h1 class="mt-3 text-2xl font-bold tracking-tight text-ink-900">Yeni Hesap Oluştur</h1>
          <p class="mt-1 text-sm text-ink-500">
            Döngüne, enerjine ve beslenme tercihine göre kişiselleştirilmiş deneyim.
          </p>
        </div>

        <div class="wl-card">
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4" novalidate>
            <div>
              <label for="name" class="wl-label">Ad Soyad</label>
              <input
                id="name"
                type="text"
                formControlName="name"
                autocomplete="name"
                placeholder="Selin Kaya"
                class="wl-input"
                [class.wl-input-error]="isFieldInvalid('name')"
              />
              @if (isFieldInvalid('name')) {
                <p class="wl-error">Lütfen adınızı ve soyadınızı girin (en az 2 karakter).</p>
              }
            </div>

            <div>
              <label for="reg-email" class="wl-label">E-posta Adresi</label>
              <input
                id="reg-email"
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="ornek@wellness.app"
                class="wl-input"
                [class.wl-input-error]="isFieldInvalid('email')"
              />
              @if (isFieldInvalid('email')) {
                <p class="wl-error">Geçerli bir e-posta adresi girin.</p>
              }
            </div>

            <div>
              <label for="reg-password" class="wl-label">Şifre</label>
              <input
                id="reg-password"
                type="password"
                formControlName="password"
                autocomplete="new-password"
                placeholder="En az 6 karakter"
                class="wl-input"
                [class.wl-input-error]="isFieldInvalid('password')"
              />
              @if (isFieldInvalid('password')) {
                <p class="wl-error">Şifre en az 6 karakter olmalıdır.</p>
              }
            </div>

            <!-- KVKK Aydınlatma & Açık Rıza Onay Kutusu -->
            <div class="rounded-2xl border border-lavender-200 bg-lavender-50/70 p-4">
              <label class="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  formControlName="kvkkConsent"
                  class="mt-1 h-4 w-4 rounded border-lavender-300 text-sage-600 focus:ring-sage-300"
                />
                <span class="text-xs leading-relaxed text-ink-700">
                  <strong class="font-semibold text-ink-900">6698 sayılı KVKK Aydınlatma Metni</strong>'ni okudum.
                  Sağlık, döngü takvimi ve beslenme tercihlerime ilişkin özel nitelikli kişisel verilerimin
                  kişiselleştirilmiş öneriler sunulması amacıyla işlenmesine
                  <button
                    type="button"
                    (click)="showKvkkModal.set(true)"
                    class="font-semibold text-lavender-700 underline underline-offset-2"
                  >
                    açık rıza veriyorum
                  </button>.
                </span>
              </label>
              @if (isFieldInvalid('kvkkConsent')) {
                <p class="wl-error mt-2">
                  Kaydı tamamlamak için KVKK açık rıza onay kutusunu işaretlemeniz zorunludur.
                </p>
              }
            </div>

            <button type="submit" [disabled]="loading()" class="wl-btn-primary">
              @if (loading()) {
                <span>Hesabın oluşturuluyor...</span>
              } @else {
                <span>KVKK Onayı ile Kayıt Ol</span>
              }
            </button>
          </form>

          <div class="mt-6 border-t border-cream-200 pt-5 text-center text-sm text-ink-500">
            Zaten üye misin?
            <a routerLink="/login" class="wl-link ml-1">Giriş Yap</a>
          </div>
        </div>
      </div>

      <!-- KVKK Aydınlatma Metni Önizleme Modalı -->
      @if (showKvkkModal()) {
        <div
          class="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-xs"
          (click)="showKvkkModal.set(false)"
        >
          <div
            class="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-cream-50 p-6 shadow-xl"
            (click)="$event.stopPropagation()"
          >
            <h2 class="text-lg font-bold text-ink-900">KVKK Aydınlatma ve Açık Rıza Metni</h2>
            <p class="mt-3 text-xs leading-relaxed text-ink-700">
              6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca; ad-soyad, e-posta,
              menstrüel döngü başlangıç tarihi, döngü süresi ve beslenme tipi verileriniz yalnızca
              size özel egzersiz, tarif ve yakındaki etkinlik önerileri oluşturmak amacıyla uçtan uca
              güvenli biçimde işlenir.
            </p>
            <ul class="mt-3 list-disc space-y-1.5 pl-5 text-xs text-ink-700">
              <li>Verileriniz üçüncü taraf reklam ağlarıyla <strong>asla paylaşılmaz</strong>.</li>
              <li>Profil &gt; KVKK Veri Yönetimi sekmesinden tüm verilerinizi JSON olarak indirebilirsiniz.</li>
              <li>Dilediğiniz anda "Hesabımı Sil" adımıyla unutulma hakkınızı kullanabilirsiniz.</li>
            </ul>
            <div class="mt-5 flex justify-end gap-2">
              <button
                type="button"
                (click)="acceptKvkkFromModal()"
                class="rounded-xl bg-sage-500 px-4 py-2 text-xs font-semibold text-white hover:bg-sage-600"
              >
                Okudum ve Onaylıyorum
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly showKvkkModal = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    kvkkConsent: [false, [Validators.requiredTrue]],
  });

  protected isFieldInvalid(field: 'name' | 'email' | 'password' | 'kvkkConsent'): boolean {
    const ctrl = this.form.controls[field];
    return ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  protected acceptKvkkFromModal(): void {
    this.form.controls.kvkkConsent.setValue(true);
    this.showKvkkModal.set(false);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const payload = this.form.getRawValue();
    this.auth.register(payload, true).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/app/today']);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
