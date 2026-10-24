import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CyclePhase, SessionCategory } from '../../../../core/models/domain.models';
import { ProfileService } from '../../../../core/services/profile.service';
import { SessionService, WellnessSessionDetail } from '../../../../core/services/session.service';

@Component({
  selector: 'app-session-list',
  standalone: true,
  template: `
    <div class="space-y-6">
      <!-- Üst Başlık & Döngü Fazı Özeti -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-xs font-medium tracking-wide text-sage-700 uppercase">
            Modül 5 · Mindful Hareket & Nefes Stüdyosu
          </p>
          <h1 class="text-2xl font-bold text-ink-900">Seanslar & Meditasyon Oynatıcı</h1>
          <p class="text-xs text-ink-500">
            {{ profileService.cycleSnapshot().phaseLabel }} için önerilen sesli meditasyon, nefes
            koçu ve egzersiz akışları
          </p>
        </div>

        <div class="flex items-center gap-2 rounded-2xl border border-sage-200 bg-sage-50 px-3.5 py-2 text-xs font-semibold text-sage-800">
          <span>✨ Tamamlanan Seans:</span>
          <strong class="text-sm">{{ sessionService.completedCount() }}</strong>
        </div>
      </div>

      <!-- Aktif Seans & Canlı Nefes/Meditasyon Oynatıcısı -->
      @if (activeSession(); as current) {
        <section
          class="relative overflow-hidden rounded-3xl border border-lavender-200 bg-gradient-to-br from-lavender-50 via-cream-50 to-sage-50 p-6 shadow-soft"
        >
          <div class="grid items-center gap-6 lg:grid-cols-[auto_1fr]">
            <!-- Animasyonlu Nefes & Ses Frekansı Halkası -->
            <div class="mx-auto flex flex-col items-center">
              <div class="relative flex h-48 w-48 items-center justify-center">
                <!-- Dış Genişleyen Nefes Halkası -->
                <div
                  class="absolute inset-3 rounded-full bg-lavender-200/50 transition-transform duration-1000"
                  [class.scale-110]="isPlaying() && breathStage() === 'Nefes Al'"
                  [class.scale-105]="isPlaying() && breathStage() === 'Tut'"
                  [class.scale-90]="isPlaying() && breathStage() === 'Yavaşça Ver'"
                ></div>

                <!-- SVG Zamanlayıcı Halkası -->
                <svg class="relative h-44 w-44 -rotate-90" viewBox="0 0 160 160">
                  <circle
                    cx="80"
                    cy="80"
                    r="66"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="10"
                    class="text-white/80"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="66"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="10"
                    stroke-linecap="round"
                    [attr.stroke-dasharray]="circumference"
                    [attr.stroke-dashoffset]="timerDashoffset()"
                    class="text-lavender-600 transition-all duration-500"
                  />
                </svg>

                <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span class="rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold text-lavender-700">
                    {{ isPlaying() ? breathStage() : 'Hazır' }}
                  </span>
                  <span class="mt-1 font-mono text-2xl font-extrabold text-ink-900">
                    {{ formattedTime() }}
                  </span>
                  <span class="text-[11px] text-ink-500">
                    {{ current.ambientHz }} Hz Ambient
                  </span>
                </div>
              </div>

              <!-- Oynatıcı Kontrolleri -->
              <div class="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  (click)="togglePlay()"
                  class="rounded-2xl bg-sage-600 px-5 py-2.5 text-xs font-semibold text-white shadow-soft transition hover:bg-sage-700"
                >
                  {{ isPlaying() ? '⏸ Duraklat' : '▶ Seansı Başlat' }}
                </button>
                <button
                  type="button"
                  (click)="toggleAmbientSound()"
                  class="rounded-2xl border border-lavender-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-lavender-700 transition hover:bg-lavender-50"
                >
                  {{ ambientSoundActive() ? '🔊 ' + current.ambientHz + ' Hz Açık' : '🔈 Ambient Ses' }}
                </button>
                <button
                  type="button"
                  (click)="completeCurrentSession()"
                  class="rounded-2xl border border-sage-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-sage-800 hover:bg-sage-50"
                >
                  ✓ Tamamla
                </button>
              </div>
            </div>

            <!-- Sağ: Seans Detayları, Nefes Ritmi & Bölümler -->
            <div class="space-y-4">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-800">
                  {{ categoryLabel(current.category) }}
                </span>
                <span class="rounded-full bg-lavender-100 px-3 py-1 text-xs font-semibold text-lavender-700">
                  {{ current.mediaType === 'VIDEO' ? '🎬 Rehberli Video' : '🎧 Sesli Meditasyon' }} ·
                  {{ current.durationMinutes }} dk
                </span>
                @if (current.recommendedPhase) {
                  <span class="rounded-full bg-cream-200 px-3 py-1 text-xs font-medium text-ink-700">
                    Önerilen Faz: {{ phaseLabel(current.recommendedPhase) }}
                  </span>
                }
              </div>

              <div>
                <h2 class="text-xl font-bold text-ink-900">{{ current.title }}</h2>
                <p class="mt-0.5 text-xs font-medium text-sage-700">{{ current.instructor }}</p>
                <p class="mt-1.5 text-xs leading-relaxed text-ink-700">{{ current.subtitle }}</p>
              </div>

              <div class="rounded-2xl border border-white/80 bg-white/80 p-3.5">
                <p class="text-xs font-bold text-lavender-700">
                  🌬️ Nefes Ritmi: {{ current.breathingPattern.label }}
                </p>
                <ul class="mt-2.5 space-y-1.5 text-xs text-ink-700">
                  @for (step of current.steps; track step) {
                    <li class="flex items-center gap-2">
                      <span class="h-1.5 w-1.5 rounded-full bg-sage-500"></span>
                      <span>{{ step }}</span>
                    </li>
                  }
                </ul>
              </div>
            </div>
          </div>
        </section>
      }

      <!-- Kategori Filtreleri -->
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          (click)="selectedCategory.set(undefined)"
          class="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition"
          [class.border-sage-600]="selectedCategory() === undefined"
          [class.bg-sage-600]="selectedCategory() === undefined"
          [class.text-white]="selectedCategory() === undefined"
          [class.border-cream-300]="selectedCategory() !== undefined"
          [class.bg-cream-50]="selectedCategory() !== undefined"
        >
          Tüm Seanslar
        </button>
        @for (cat of categories; track cat.value) {
          <button
            type="button"
            (click)="selectedCategory.set(cat.value)"
            class="rounded-full border px-3.5 py-1.5 text-xs font-semibold transition"
            [class.border-sage-600]="selectedCategory() === cat.value"
            [class.bg-sage-600]="selectedCategory() === cat.value"
            [class.text-white]="selectedCategory() === cat.value"
            [class.border-cream-300]="selectedCategory() !== cat.value"
            [class.bg-cream-50]="selectedCategory() !== cat.value"
          >
            {{ cat.label }}
          </button>
        }
      </div>

      <!-- Seans Kütüphanesi Kartları -->
      <div class="grid gap-4 md:grid-cols-2">
        @for (session of filteredSessions(); track session.id) {
          <article
            class="wl-card flex flex-col justify-between transition"
            [class.ring-2]="activeSession()?.id === session.id"
            [class.ring-sage-500]="activeSession()?.id === session.id"
          >
            <div>
              <div class="flex items-center justify-between gap-2">
                <span class="rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-800">
                  {{ categoryLabel(session.category) }}
                </span>
                <div class="flex items-center gap-1.5">
                  @if (sessionService.isCompleted(session.id)) {
                    <span class="rounded-full bg-sage-600 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      ✓ Tamamlandı
                    </span>
                  }
                  <span class="text-xs font-bold text-ink-500">{{ session.durationMinutes }} dk</span>
                </div>
              </div>

              <h3 class="mt-3 text-base font-bold text-ink-900">{{ session.title }}</h3>
              <p class="mt-0.5 text-[11px] font-medium text-lavender-700">{{ session.instructor }}</p>
              <p class="mt-1.5 text-xs leading-relaxed text-ink-700">{{ session.subtitle }}</p>
            </div>

            <div class="mt-4 flex items-center justify-between border-t border-cream-200 pt-3">
              <span class="text-[11px] text-ink-500">
                {{ session.recommendedPhase ? phaseLabel(session.recommendedPhase) + ' Uyumlu' : 'Tüm Fazlar' }}
              </span>
              <button
                type="button"
                (click)="selectSession(session)"
                class="rounded-xl bg-sage-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-sage-600"
              >
                {{ activeSession()?.id === session.id ? 'Oynatıcıda Açık' : 'Oynatıcıda Başlat' }}
              </button>
            </div>
          </article>
        }
      </div>
    </div>
  `,
})
export class SessionListPage implements OnInit, OnDestroy {
  protected readonly sessionService = inject(SessionService);
  protected readonly profileService = inject(ProfileService);

  protected readonly selectedCategory = signal<SessionCategory | undefined>(undefined);
  protected readonly activeSession = signal<WellnessSessionDetail | null>(null);
  protected readonly isPlaying = signal(false);
  protected readonly elapsedSeconds = signal(0);
  protected readonly ambientSoundActive = signal(false);

  protected readonly circumference = 2 * Math.PI * 66;

  private intervalId?: ReturnType<typeof setInterval>;
  private audioCtx?: AudioContext;
  private oscillator?: OscillatorNode;

  protected readonly categories: { value: SessionCategory; label: string }[] = [
    { value: 'YOGA', label: '🧘‍♀️ Yoga' },
    { value: 'PILATES', label: '🤸‍♀️ Pilates' },
    { value: 'BREATHING', label: '🌬️ Nefes Koçu' },
    { value: 'MEDITATION', label: '🕯️ Meditasyon' },
    { value: 'WORKOUT', label: '💪 Kardiyo & Güç' },
    { value: 'SLEEP', label: '🌙 Uyku & Yoga Nidra' },
  ];

  protected readonly filteredSessions = computed(() => {
    const cat = this.selectedCategory();
    const all = this.sessionService.sessions();
    return cat ? all.filter((s) => s.category === cat) : all;
  });

  protected readonly totalSeconds = computed(() => {
    const cur = this.activeSession();
    return (cur?.durationMinutes ?? 15) * 60;
  });

  protected readonly timerDashoffset = computed(() => {
    const progress = Math.min(1, this.elapsedSeconds() / this.totalSeconds());
    return this.circumference * (1 - progress);
  });

  protected readonly formattedTime = computed(() => {
    const remaining = Math.max(0, this.totalSeconds() - this.elapsedSeconds());
    const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
    const secs = String(remaining % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  });

  protected readonly breathStage = computed<'Nefes Al' | 'Tut' | 'Yavaşça Ver'>(() => {
    const cur = this.activeSession();
    if (!cur) return 'Nefes Al';
    const { inhaleSec, holdSec, exhaleSec } = cur.breathingPattern;
    const cycleTotal = Math.max(1, inhaleSec + holdSec + exhaleSec);
    const secInCycle = this.elapsedSeconds() % cycleTotal;
    if (secInCycle < inhaleSec) return 'Nefes Al';
    if (secInCycle < inhaleSec + holdSec) return 'Tut';
    return 'Yavaşça Ver';
  });

  ngOnInit(): void {
    this.sessionService.loadSessions().subscribe((list) => {
      const currentPhase = this.profileService.cycleSnapshot().phase;
      const match = list.find((s) => s.recommendedPhase === currentPhase) ?? list[0] ?? null;
      this.activeSession.set(match);
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.stopAmbientSound();
  }

  protected selectSession(session: WellnessSessionDetail): void {
    this.stopTimer();
    this.elapsedSeconds.set(0);
    this.activeSession.set(session);
    this.startTimer();
    if (this.ambientSoundActive()) {
      this.startAmbientSound(session.ambientHz);
    }
  }

  protected togglePlay(): void {
    if (this.isPlaying()) {
      this.stopTimer();
    } else {
      this.startTimer();
    }
  }

  protected completeCurrentSession(): void {
    const current = this.activeSession();
    if (!current) return;
    this.stopTimer();
    this.sessionService.markSessionCompleted(current.id);
  }

  protected toggleAmbientSound(): void {
    if (this.ambientSoundActive()) {
      this.stopAmbientSound();
    } else {
      const hz = this.activeSession()?.ambientHz ?? 432;
      this.startAmbientSound(hz);
    }
  }

  protected categoryLabel(cat: SessionCategory): string {
    return this.categories.find((c) => c.value === cat)?.label ?? cat;
  }

  protected phaseLabel(phase: CyclePhase): string {
    const map: Record<CyclePhase, string> = {
      MENSTRUAL: 'Menstrüel Faz',
      FOLLICULAR: 'Foliküler Faz',
      OVULATORY: 'Ovulasyon Fazı',
      LUTEAL: 'Luteal Faz',
    };
    return map[phase];
  }

  private startTimer(): void {
    this.isPlaying.set(true);
    this.intervalId = setInterval(() => {
      this.elapsedSeconds.update((v) => {
        if (v + 1 >= this.totalSeconds()) {
          this.completeCurrentSession();
          return 0;
        }
        return v + 1;
      });
    }, 1000);
  }

  private stopTimer(): void {
    this.isPlaying.set(false);
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  /** Web Audio API ile sakinleştirici düşük volümlü 432/528 Hz ambient ton üretir */
  private startAmbientSound(frequencyHz: number): void {
    try {
      this.stopAmbientSound();
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequencyHz / 2, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      this.audioCtx = ctx;
      this.oscillator = osc;
      this.ambientSoundActive.set(true);
    } catch {
      this.ambientSoundActive.set(false);
    }
  }

  private stopAmbientSound(): void {
    try {
      this.oscillator?.stop();
      void this.audioCtx?.close();
    } catch {
      // ignore
    }
    this.oscillator = undefined;
    this.audioCtx = undefined;
    this.ambientSoundActive.set(false);
  }
}
