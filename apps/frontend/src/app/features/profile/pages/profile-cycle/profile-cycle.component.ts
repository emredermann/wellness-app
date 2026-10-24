import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DietType, EventCategory } from '../../../../core/models/domain.models';
import { ProfileService } from '../../../../core/services/profile.service';

type ProfileTab = 'cycle' | 'preferences' | 'kvkk';

interface CalendarDayCell {
  iso: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isCycleStart: boolean;
  isPeriodWindow: boolean;
  isOvulationWindow: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-profile-cycle',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Başlık & Sekme Geçişleri -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs font-medium tracking-wide text-lavender-700 uppercase">
            Kişisel Alan & Döngü Yönetimi
          </p>
          <h1 class="text-2xl font-bold text-ink-900">{{ profileService.profile().name }}</h1>
          <p class="text-xs text-ink-500">{{ profileService.profile().email }}</p>
        </div>

        <div class="inline-flex rounded-2xl border border-cream-300 bg-cream-50 p-1">
          <button
            type="button"
            (click)="activeTab.set('cycle')"
            class="rounded-xl px-3.5 py-2 text-xs font-semibold transition"
            [class.bg-sage-500]="activeTab() === 'cycle'"
            [class.text-white]="activeTab() === 'cycle'"
            [class.text-ink-700]="activeTab() !== 'cycle'"
          >
            Döngü Takvimi
          </button>
          <button
            type="button"
            (click)="activeTab.set('preferences')"
            class="rounded-xl px-3.5 py-2 text-xs font-semibold transition"
            [class.bg-sage-500]="activeTab() === 'preferences'"
            [class.text-white]="activeTab() === 'preferences'"
            [class.text-ink-700]="activeTab() !== 'preferences'"
          >
            Diyet & Spor Tercihi
          </button>
          <button
            type="button"
            (click)="activeTab.set('kvkk')"
            class="rounded-xl px-3.5 py-2 text-xs font-semibold transition"
            [class.bg-sage-500]="activeTab() === 'kvkk'"
            [class.text-white]="activeTab() === 'kvkk'"
            [class.text-ink-700]="activeTab() !== 'kvkk'"
          >
            KVKK Veri Yönetimi
          </button>
        </div>
      </div>

      @if (toastMessage()) {
        <div class="rounded-2xl border border-sage-300 bg-sage-50 px-4 py-3 text-xs font-semibold text-sage-800">
          ✓ {{ toastMessage() }}
        </div>
      }

      <!-- SEKME 1: DÖNGÜ TAKVİMİ BİLEŞENİ -->
      @if (activeTab() === 'cycle') {
        <div class="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <!-- Etkileşimli Aylık Takvim -->
          <section class="wl-card space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-base font-bold text-ink-900">Döngü Başlangıç Takvimi</h2>
                <p class="text-xs text-ink-500">
                  Son regl başlangıç gününe dokunarak döngü fazlarını anında güncelle
                </p>
              </div>
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  (click)="shiftMonth(-1)"
                  class="rounded-xl border border-cream-300 bg-white px-2.5 py-1 text-xs font-bold text-ink-700 hover:border-sage-300"
                >
                  ‹
                </button>
                <span class="min-w-28 text-center text-xs font-semibold text-ink-900">
                  {{ currentMonthLabel() }}
                </span>
                <button
                  type="button"
                  (click)="shiftMonth(1)"
                  class="rounded-xl border border-cream-300 bg-white px-2.5 py-1 text-xs font-bold text-ink-700 hover:border-sage-300"
                >
                  ›
                </button>
              </div>
            </div>

            <!-- Haftanın Günleri -->
            <div class="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-ink-400">
              @for (dayName of weekDays; track dayName) {
                <span class="py-1">{{ dayName }}</span>
              }
            </div>

            <!-- Gün Hücreleri -->
            <div class="grid grid-cols-7 gap-1.5">
              @for (cell of calendarDays(); track cell.iso) {
                <button
                  type="button"
                  (click)="selectCycleStartDate(cell.iso)"
                  class="relative flex h-11 flex-col items-center justify-center rounded-xl border text-xs transition"
                  [class.opacity-35]="!cell.inCurrentMonth"
                  [class.border-sage-600]="cell.isCycleStart"
                  [class.bg-sage-500]="cell.isCycleStart"
                  [class.text-white]="cell.isCycleStart"
                  [class.font-bold]="cell.isCycleStart || cell.isToday"
                  [class.border-rose-200]="!cell.isCycleStart && cell.isPeriodWindow"
                  [class.bg-rose-50]="!cell.isCycleStart && cell.isPeriodWindow"
                  [class.text-rose-800]="!cell.isCycleStart && cell.isPeriodWindow"
                  [class.border-lavender-300]="!cell.isCycleStart && !cell.isPeriodWindow && cell.isOvulationWindow"
                  [class.bg-lavender-50]="!cell.isCycleStart && !cell.isPeriodWindow && cell.isOvulationWindow"
                  [class.text-lavender-700]="!cell.isCycleStart && !cell.isPeriodWindow && cell.isOvulationWindow"
                  [class.border-cream-200]="!cell.isCycleStart && !cell.isPeriodWindow && !cell.isOvulationWindow"
                  [class.bg-white]="!cell.isCycleStart && !cell.isPeriodWindow && !cell.isOvulationWindow"
                >
                  <span>{{ cell.dayNumber }}</span>
                  @if (cell.isToday && !cell.isCycleStart) {
                    <span class="h-1 w-1 rounded-full bg-sage-600"></span>
                  }
                </button>
              }
            </div>

            <!-- Renk Açıklamaları -->
            <div class="flex flex-wrap items-center gap-4 border-t border-cream-200 pt-3 text-[11px] text-ink-500">
              <span class="inline-flex items-center gap-1.5">
                <span class="h-3 w-3 rounded bg-sage-500"></span> Başlangıç Günü
              </span>
              <span class="inline-flex items-center gap-1.5">
                <span class="h-3 w-3 rounded border border-rose-200 bg-rose-50"></span> Menstrüel Günler (1-5)
              </span>
              <span class="inline-flex items-center gap-1.5">
                <span class="h-3 w-3 rounded border border-lavender-300 bg-lavender-50"></span> Tahmini Ovulasyon Penceresi
              </span>
            </div>
          </section>

          <!-- Döngü Parametreleri Formu -->
          <section class="wl-card space-y-4">
            <h2 class="text-base font-bold text-ink-900">Döngü Ayarları</h2>

            <form [formGroup]="cycleForm" (ngSubmit)="saveCycleSettings()" class="space-y-4">
              <div>
                <label for="cycleStartDate" class="wl-label">Son Döngü Başlangıç Tarihi</label>
                <input
                  id="cycleStartDate"
                  type="date"
                  formControlName="cycleStartDate"
                  class="wl-input"
                />
              </div>

              <div>
                <label for="cycleLength" class="wl-label">
                  Ortalama Döngü Süresi: <strong>{{ cycleForm.controls.cycleLength.value }} gün</strong>
                </label>
                <input
                  id="cycleLength"
                  type="range"
                  min="21"
                  max="40"
                  formControlName="cycleLength"
                  class="w-full accent-sage-600"
                />
                <div class="flex justify-between text-[11px] text-ink-400">
                  <span>21 gün</span>
                  <span>28 gün (Standart)</span>
                  <span>40 gün</span>
                </div>
              </div>

              <label class="flex cursor-pointer items-center justify-between rounded-2xl border border-cream-200 bg-white px-4 py-3">
                <div>
                  <span class="block text-xs font-semibold text-ink-900">Döngü Bazlı Öneriler Aktif</span>
                  <span class="block text-[11px] text-ink-500">
                    Antrenman ve tarif önerilerini döngü fazıma göre uyarla
                  </span>
                </div>
                <input
                  type="checkbox"
                  formControlName="isCycleTrackingActive"
                  class="h-4 w-4 rounded border-cream-400 text-sage-600 focus:ring-sage-300"
                />
              </label>

              <div class="rounded-2xl bg-lavender-50 p-4 text-xs text-ink-700">
                <p class="font-semibold text-lavender-700">
                  Mevcut Durum: {{ profileService.cycleSnapshot().phaseLabel }} ({{ profileService.cycleSnapshot().dayOfCycle }}. Gün)
                </p>
                <p class="mt-1">
                  Tahmini sonraki döngü başlangıcı:
                  <strong>{{ profileService.cycleSnapshot().nextPeriodDate }}</strong>
                </p>
              </div>

              <button type="submit" class="wl-btn-primary">
                Döngü Bilgilerini Kaydet
              </button>
            </form>
          </section>
        </div>
      }

      <!-- SEKME 2: DİYET TİPİ VE SPOR STİLİ TERCİHİ FORMU -->
      @if (activeTab() === 'preferences') {
        <section class="wl-card space-y-6">
          <div>
            <h2 class="text-base font-bold text-ink-900">Beslenme & Spor Stili Tercihleri</h2>
            <p class="text-xs text-ink-500">
              "Bugün" ekranındaki tarifler ve yakın etkinlik önerileri bu seçimlere göre filtrelenir.
            </p>
          </div>

          <!-- Diyet Tipi Seçimi (Vegan, Vejetaryen, Pesketaryen, Normal) -->
          <div class="space-y-2.5">
            <span class="wl-label">Diyet Tipi</span>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              @for (diet of dietOptions; track diet.value) {
                <button
                  type="button"
                  (click)="selectedDiet.set(diet.value)"
                  class="flex flex-col items-start rounded-2xl border p-4 text-left transition"
                  [class.border-sage-500]="selectedDiet() === diet.value"
                  [class.bg-sage-50]="selectedDiet() === diet.value"
                  [class.border-cream-300]="selectedDiet() !== diet.value"
                  [class.bg-white]="selectedDiet() !== diet.value"
                >
                  <span class="text-lg">{{ diet.emoji }}</span>
                  <span class="mt-1.5 text-sm font-bold text-ink-900">{{ diet.label }}</span>
                  <span class="mt-0.5 text-[11px] text-ink-500">{{ diet.description }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Spor Stili Tercihi (Çoklu Seçim) -->
          <div class="space-y-2.5">
            <span class="wl-label">Favori Spor & Hareket Stillerin</span>
            <div class="flex flex-wrap gap-2.5">
              @for (sport of sportOptions; track sport.value) {
                <button
                  type="button"
                  (click)="toggleSport(sport.value)"
                  class="inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold transition"
                  [class.border-lavender-500]="isSportSelected(sport.value)"
                  [class.bg-lavender-100]="isSportSelected(sport.value)"
                  [class.text-lavender-700]="isSportSelected(sport.value)"
                  [class.border-cream-300]="!isSportSelected(sport.value)"
                  [class.bg-white]="!isSportSelected(sport.value)"
                  [class.text-ink-700]="!isSportSelected(sport.value)"
                >
                  <span>{{ sport.emoji }}</span>
                  <span>{{ sport.label }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Kalori Görünürlüğü Tercihi -->
          <div class="flex items-center justify-between rounded-2xl border border-cream-200 bg-white p-4">
            <div>
              <p class="text-sm font-semibold text-ink-900">Sezgisel Beslenme Modu (Kalorileri Gizle)</p>
              <p class="text-xs text-ink-500">
                Tarif kartlarında kalori ve gramaj yerine içerik çeşitliliğini öne çıkarır.
              </p>
            </div>
            <button
              type="button"
              (click)="profileService.toggleCaloriesVisibility()"
              class="rounded-xl px-4 py-2 text-xs font-semibold transition"
              [class.bg-sage-500]="profileService.hideCalories()"
              [class.text-white]="profileService.hideCalories()"
              [class.bg-cream-200]="!profileService.hideCalories()"
              [class.text-ink-700]="!profileService.hideCalories()"
            >
              {{ profileService.hideCalories() ? 'Açık' : 'Kapalı' }}
            </button>
          </div>

          <div class="flex justify-end">
            <button
              type="button"
              (click)="saveDietAndSportPreferences()"
              class="wl-btn-primary sm:w-auto"
            >
              Tercihleri Güncelle
            </button>
          </div>
        </section>
      }

      <!-- SEKME 3: KVKK VERİ YÖNETİMİ (VERİLERİMİ İNDİR / HESABIMI SİL) -->
      @if (activeTab() === 'kvkk') {
        <section class="wl-card space-y-6">
          <div>
            <span class="rounded-full bg-lavender-100 px-3 py-1 text-xs font-semibold text-lavender-700">
              6698 Sayılı KVKK Kapsamında Hakların
            </span>
            <h2 class="mt-2 text-lg font-bold text-ink-900">Kişisel Veri Yönetimi ve Şeffaflık</h2>
            <p class="mt-1 text-xs leading-relaxed text-ink-500">
              Sağlık ve döngü verilerin yalnızca senin kontrolündedir. İstediğin zaman tüm veri
              kopyanı indirebilir veya hesabını kalıcı olarak silebilirsin.
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <!-- Verilerimi İndir -->
            <div class="flex flex-col justify-between rounded-2xl border border-sage-200 bg-sage-50/60 p-5">
              <div>
                <h3 class="text-sm font-bold text-ink-900">📥 Verilerimi İndir (JSON Taşınabilirlik)</h3>
                <p class="mt-1.5 text-xs leading-relaxed text-ink-700">
                  Profil bilgilerin, döngü başlangıç tarihin, beslenme ve spor tercihlerinle birlikte
                  KVKK onay kaydını makinece okunabilir <code>.json</code> formatında cihazına indirir.
                </p>
              </div>
              <button
                type="button"
                (click)="downloadKvkkData()"
                class="mt-5 inline-flex items-center justify-center rounded-xl bg-sage-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-sage-700"
              >
                Verilerimi İndir (.json)
              </button>
            </div>

            <!-- Hesabımı Sil -->
            <div class="flex flex-col justify-between rounded-2xl border border-rose-200 bg-rose-50/60 p-5">
              <div>
                <h3 class="text-sm font-bold text-rose-900">🗑️ Hesabımı ve Verilerimi Kalıcı Sil</h3>
                <p class="mt-1.5 text-xs leading-relaxed text-rose-800">
                  KVKK Madde 7 (Unutulma Hakkı) kapsamında profilin, döngü geçmişin ve etkinlik
                  biletlerin geri döndürülemez biçimde silinir ve oturumun kapatılır.
                </p>
              </div>

              @if (!confirmDelete()) {
                <button
                  type="button"
                  (click)="confirmDelete.set(true)"
                  class="mt-5 inline-flex items-center justify-center rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  Hesabımı Sil
                </button>
              } @else {
                <div class="mt-4 space-y-2 rounded-xl bg-white p-3">
                  <p class="text-[11px] font-semibold text-rose-800">
                    Bu işlem geri alınamaz. Onaylıyor musunuz?
                  </p>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      (click)="executeAccountDeletion()"
                      class="flex-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                      Evet, Kalıcı Olarak Sil
                    </button>
                    <button
                      type="button"
                      (click)="confirmDelete.set(false)"
                      class="rounded-lg border border-cream-300 px-3 py-1.5 text-xs font-medium text-ink-700"
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </section>
      }
    </div>
  `,
})
export class ProfileCycleComponent {
  protected readonly profileService = inject(ProfileService);
  private readonly fb = inject(FormBuilder);

  protected readonly activeTab = signal<ProfileTab>('cycle');
  protected readonly toastMessage = signal<string | null>(null);
  protected readonly confirmDelete = signal(false);

  protected readonly viewMonth = signal<Date>(new Date());

  protected readonly weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  protected readonly cycleForm = this.fb.nonNullable.group({
    cycleStartDate: [
      this.profileService.profile().cycleStartDate ?? new Date().toISOString().slice(0, 10),
      [Validators.required],
    ],
    cycleLength: [this.profileService.profile().cycleLength ?? 28, [Validators.min(21), Validators.max(40)]],
    isCycleTrackingActive: [this.profileService.profile().isCycleTrackingActive],
  });

  protected readonly selectedDiet = signal<DietType>(this.profileService.profile().dietType);
  protected readonly selectedSports = signal<EventCategory[]>([
    ...this.profileService.favoriteSports(),
  ]);

  protected readonly dietOptions: {
    value: DietType;
    label: string;
    emoji: string;
    description: string;
  }[] = [
    {
      value: 'VEGAN',
      label: 'Vegan',
      emoji: '🌱',
      description: 'Tamamen bitkisel, antioksidan ve lif odaklı tarifler.',
    },
    {
      value: 'VEGETARIAN',
      label: 'Vejetaryen',
      emoji: '🥗',
      description: 'Sebze, bakliyat, yumurta ve fermente süt ürünleri.',
    },
    {
      value: 'PESCATARIAN',
      label: 'Pesketaryen',
      emoji: '🐟',
      description: 'Bitkisel ağırlıklı + Omega-3 zengini deniz ürünleri.',
    },
    {
      value: 'REGULAR',
      label: 'Normal',
      emoji: '🍲',
      description: 'Kısıtlama olmadan mevsimsel ve dengeli Anadolu/Akdeniz mutfağı.',
    },
  ];

  protected readonly sportOptions: { value: EventCategory; label: string; emoji: string }[] = [
    { value: 'YOGA', label: 'Yoga', emoji: '🧘‍♀️' },
    { value: 'PILATES', label: 'Pilates', emoji: '🤸‍♀️' },
    { value: 'RUNNING', label: 'Koşu', emoji: '🏃‍♀️' },
    { value: 'MEDITATION', label: 'Meditasyon & Nefes', emoji: '🕯️' },
    { value: 'SAILING', label: 'Yelken', emoji: '⛵' },
    { value: 'CYCLING', label: 'Bisiklet', emoji: '🚴‍♀️' },
    { value: 'HIKING', label: 'Doğa Yürüyüşü', emoji: '🥾' },
    { value: 'SWIMMING', label: 'Yüzme', emoji: '🏊‍♀️' },
    { value: 'DANCE', label: 'Dans', emoji: '💃' },
  ];

  protected readonly currentMonthLabel = computed(() =>
    this.viewMonth().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
  );

  protected readonly calendarDays = computed<CalendarDayCell[]>(() => {
    const ref = this.viewMonth();
    const year = ref.getFullYear();
    const month = ref.getMonth();

    const firstOfMonth = new Date(year, month, 1);
    const startOffset = (firstOfMonth.getDay() + 6) % 7; // Pazartesi = 0
    const gridStart = new Date(year, month, 1 - startOffset);

    const startIso =
      this.cycleForm.controls.cycleStartDate.value ||
      this.profileService.profile().cycleStartDate ||
      new Date().toISOString().slice(0, 10);
    const startDate = new Date(startIso + 'T00:00:00');
    const cycleLen = Number(this.cycleForm.controls.cycleLength.value) || 28;
    const ovDay = Math.max(10, cycleLen - 14);
    const todayIso = new Date().toISOString().slice(0, 10);

    const cells: CalendarDayCell[] = [];
    for (let i = 0; i < 35; i++) {
      const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      const iso = this.toIsoDate(d);
      const diff = Math.floor((d.getTime() - startDate.getTime()) / 86_400_000);
      const modDay = ((diff % cycleLen) + cycleLen) % cycleLen; // 0-indexed

      cells.push({
        iso,
        dayNumber: d.getDate(),
        inCurrentMonth: d.getMonth() === month,
        isCycleStart: iso === startIso,
        isPeriodWindow: diff >= 0 && modDay >= 0 && modDay < 5,
        isOvulationWindow: diff >= 0 && modDay >= ovDay - 2 && modDay <= ovDay,
        isToday: iso === todayIso,
      });
    }
    return cells;
  });

  protected shiftMonth(delta: number): void {
    const cur = this.viewMonth();
    this.viewMonth.set(new Date(cur.getFullYear(), cur.getMonth() + delta, 1));
  }

  protected selectCycleStartDate(iso: string): void {
    this.cycleForm.controls.cycleStartDate.setValue(iso);
    this.saveCycleSettings();
  }

  protected saveCycleSettings(): void {
    const raw = this.cycleForm.getRawValue();
    this.profileService
      .updateProfile({
        cycleStartDate: raw.cycleStartDate,
        cycleLength: Number(raw.cycleLength),
        isCycleTrackingActive: raw.isCycleTrackingActive,
      })
      .subscribe(() => this.showToast('Döngü takvimin güncellendi.'));
  }

  protected isSportSelected(cat: EventCategory): boolean {
    return this.selectedSports().includes(cat);
  }

  protected toggleSport(cat: EventCategory): void {
    const current = this.selectedSports();
    if (current.includes(cat)) {
      this.selectedSports.set(current.filter((item) => item !== cat));
    } else {
      this.selectedSports.set([...current, cat]);
    }
  }

  protected saveDietAndSportPreferences(): void {
    this.profileService
      .updateProfile({
        dietType: this.selectedDiet(),
        favoriteSportCategories: this.selectedSports(),
      })
      .subscribe(() => this.showToast('Beslenme ve spor stili tercihlerin kaydedildi.'));
  }

  protected downloadKvkkData(): void {
    this.profileService.exportKvkkData().subscribe((data) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `lunawell-kvkk-verilerim-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      this.showToast('KVKK veri paketin (.json) indirildi.');
    });
  }

  protected executeAccountDeletion(): void {
    this.profileService.deleteAccount().subscribe();
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3500);
  }

  private toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
