import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, of, tap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { CyclePhase, DietType, EventCategory, Gender, User } from '../models/domain.models';
import { ApiService } from './api.service';

export interface CycleSnapshot {
  phase: CyclePhase;
  phaseLabel: string;
  energyTitle: string;
  energySubtitle: string;
  dayOfCycle: number;
  cycleLength: number;
  progressPercent: number;
  daysUntilNextPeriod: number;
  nextPeriodDate: string;
  ovulationWindow: [number, number];
  recommendedCategories: EventCategory[];
  recommendedWorkoutTitle: string;
  recommendedWorkoutDuration: number;
  recommendedWorkoutNote: string;
}

export interface ProfilePreferencesPayload {
  name?: string;
  gender?: Gender | null;
  dietType?: DietType;
  bmi?: number | null;
  cycleStartDate?: string | null;
  cycleLength?: number | null;
  isCycleTrackingActive?: boolean;
  favoriteSportCategories?: EventCategory[];
  hideCalories?: boolean;
}

const PREFS_KEY = 'wl_profile_preferences';

interface LocalPrefs {
  favoriteSportCategories: EventCategory[];
  hideCalories: boolean;
}

const DEFAULT_USER: User = {
  id: 'demo-user-01',
  email: 'selin@wellness.app',
  name: 'Selin Kaya',
  gender: 'FEMALE',
  dietType: 'VEGETARIAN',
  bmi: 21.4,
  cycleStartDate: new Date(Date.now() - 8 * 86_400_000).toISOString().slice(0, 10),
  cycleLength: 28,
  isCycleTrackingActive: true,
  kvkkConsent: true,
};

/**
 * Kullanıcı profili, döngü takibi (Cycle) hesaplamaları, diyet/spor tercihleri
 * ve KVKK veri yönetimi işlemlerini yöneten servis.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private readonly profileSignal = signal<User>(this.auth.currentUser() ?? DEFAULT_USER);
  private readonly prefsSignal = signal<LocalPrefs>(this.readLocalPrefs());

  readonly profile = this.profileSignal.asReadonly();
  readonly favoriteSports = computed(() => this.prefsSignal().favoriteSportCategories);
  readonly hideCalories = computed(() => this.prefsSignal().hideCalories);

  /** Mevcut döngü gününü, fazını ve enerji tavsiyelerini reaktif olarak hesaplar. */
  readonly cycleSnapshot = computed<CycleSnapshot>(() => {
    const user = this.profileSignal();
    const length = Math.min(40, Math.max(21, user.cycleLength ?? 28));
    const startStr = user.cycleStartDate ?? new Date(Date.now() - 8 * 86_400_000).toISOString().slice(0, 10);
    const startDate = new Date(startStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / 86_400_000));
    const dayOfCycle = (diffDays % length) + 1;
    const daysUntilNextPeriod = length - dayOfCycle + 1;

    const nextDate = new Date(today.getTime() + (daysUntilNextPeriod - 1) * 86_400_000);
    const nextPeriodDate = nextDate.toISOString().slice(0, 10);

    const ovulationDay = Math.max(10, length - 14);
    const ovulationWindow: [number, number] = [ovulationDay - 1, ovulationDay + 1];

    const phase = this.resolvePhase(dayOfCycle, ovulationWindow);
    const meta = this.getPhaseMeta(phase);

    return {
      phase,
      dayOfCycle,
      cycleLength: length,
      progressPercent: Math.round((dayOfCycle / length) * 100),
      daysUntilNextPeriod,
      nextPeriodDate,
      ovulationWindow,
      ...meta,
    };
  });

  loadProfile(): Observable<User> {
    return this.api.get<User>('/users/me').pipe(
      catchError(() => of(this.auth.currentUser() ?? this.profileSignal())),
      tap((user) => {
        this.profileSignal.set(user);
        this.auth.updateCurrentUser(user);
      }),
    );
  }

  updateProfile(patch: ProfilePreferencesPayload): Observable<User> {
    if (patch.favoriteSportCategories !== undefined || patch.hideCalories !== undefined) {
      const nextPrefs: LocalPrefs = {
        favoriteSportCategories: patch.favoriteSportCategories ?? this.prefsSignal().favoriteSportCategories,
        hideCalories: patch.hideCalories ?? this.prefsSignal().hideCalories,
      };
      this.prefsSignal.set(nextPrefs);
      this.writeLocalPrefs(nextPrefs);
    }

    const updated: User = {
      ...this.profileSignal(),
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.gender !== undefined ? { gender: patch.gender } : {}),
      ...(patch.dietType !== undefined ? { dietType: patch.dietType } : {}),
      ...(patch.bmi !== undefined ? { bmi: patch.bmi } : {}),
      ...(patch.cycleStartDate !== undefined ? { cycleStartDate: patch.cycleStartDate } : {}),
      ...(patch.cycleLength !== undefined ? { cycleLength: patch.cycleLength } : {}),
      ...(patch.isCycleTrackingActive !== undefined
        ? { isCycleTrackingActive: patch.isCycleTrackingActive }
        : {}),
    };

    return this.api.patch<User>('/users/me', updated).pipe(
      catchError(() => of(updated)),
      tap((user) => {
        this.profileSignal.set(user);
        this.auth.updateCurrentUser(user);
      }),
    );
  }

  toggleCaloriesVisibility(hide?: boolean): void {
    const next = hide ?? !this.prefsSignal().hideCalories;
    const updated: LocalPrefs = { ...this.prefsSignal(), hideCalories: next };
    this.prefsSignal.set(updated);
    this.writeLocalPrefs(updated);
  }

  /** KVKK Madde 11 kapsamında kullanıcının tüm kişisel verilerini JSON paketi olarak dışa aktarır. */
  exportKvkkData(): Observable<{ exportedAt: string; user: User; preferences: LocalPrefs }> {
    const payload = {
      exportedAt: new Date().toISOString(),
      user: this.profileSignal(),
      preferences: this.prefsSignal(),
    };
    return this.api.get<typeof payload>('/users/me/data-export').pipe(catchError(() => of(payload)));
  }

  /** KVKK unutulma hakkı kapsamında hesabı ve bağlı verileri kalıcı olarak siler. */
  deleteAccount(): Observable<{ deleted: boolean }> {
    return this.api.delete<{ deleted: boolean }>('/users/me').pipe(
      catchError(() => of({ deleted: true })),
      tap(() => {
        try {
          localStorage.removeItem(PREFS_KEY);
        } catch {
          // ignore
        }
        this.auth.logout(true);
      }),
    );
  }

  private resolvePhase(day: number, [ovStart, ovEnd]: [number, number]): CyclePhase {
    if (day <= 5) return 'MENSTRUAL';
    if (day < ovStart) return 'FOLLICULAR';
    if (day <= ovEnd) return 'OVULATORY';
    return 'LUTEAL';
  }

  private getPhaseMeta(
    phase: CyclePhase,
  ): Omit<
    CycleSnapshot,
    | 'phase'
    | 'dayOfCycle'
    | 'cycleLength'
    | 'progressPercent'
    | 'daysUntilNextPeriod'
    | 'nextPeriodDate'
    | 'ovulationWindow'
  > {
    switch (phase) {
      case 'MENSTRUAL':
        return {
          phaseLabel: 'Menstrüel Faz',
          energyTitle: 'Dinlenme & Yenilenme',
          energySubtitle: 'Bedenin nazik hareketlere, sıcak bitki çaylarına ve derin nefeslere ihtiyaç duyuyor.',
          recommendedCategories: ['MEDITATION', 'YOGA'],
          recommendedWorkoutTitle: 'Restoratif Yin Yoga & Derin Nefes',
          recommendedWorkoutDuration: 20,
          recommendedWorkoutNote: 'Düşük tempo · Pelvik bölgeyi rahatlatan esneme akışı',
        };
      case 'FOLLICULAR':
        return {
          phaseLabel: 'Foliküler Faz',
          energyTitle: 'Yükselen Enerji & Yaratıcılık',
          energySubtitle: 'Östrojen yükselirken yeni bir egzersiz denemek ve açık havaya çıkmak için harika bir gün.',
          recommendedCategories: ['PILATES', 'RUNNING', 'HIKING', 'DANCE'],
          recommendedWorkoutTitle: 'Sabah Akışı: Dinamik Mat Pilates & Core',
          recommendedWorkoutDuration: 30,
          recommendedWorkoutNote: 'Orta tempo · Kas tonusunu ve duruşu destekleyen seri',
        };
      case 'OVULATORY':
        return {
          phaseLabel: 'Ovulasyon Fazı',
          energyTitle: 'Zirve Enerji & Sosyallik',
          energySubtitle: 'Dayanıklılığın en yüksek seviyede! Grup etkinlikleri ve tempolu antrenmanlar sana çok iyi gelecek.',
          recommendedCategories: ['RUNNING', 'CYCLING', 'SAILING', 'FITNESS'],
          recommendedWorkoutTitle: 'Sahil Koşusu & Fonksiyonel Kardiyo',
          recommendedWorkoutDuration: 40,
          recommendedWorkoutNote: 'Yüksek enerji · Toplulukla açık hava antrenmanı',
        };
      case 'LUTEAL':
        return {
          phaseLabel: 'Luteal Faz',
          energyTitle: 'Dengeleme & Topraklanma',
          energySubtitle: 'Temponu yavaşça düşür; güç odaklı sakin pilates ve magnezyum zengini öğünlerle dengede kal.',
          recommendedCategories: ['PILATES', 'YOGA', 'SWIMMING', 'MEDITATION'],
          recommendedWorkoutTitle: 'Mindful Slow-Flow Yoga & Mobilite',
          recommendedWorkoutDuration: 25,
          recommendedWorkoutNote: 'Sakin tempo · Sinir sistemini yatıştıran akış',
        };
    }
  }

  private readLocalPrefs(): LocalPrefs {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        return JSON.parse(raw) as LocalPrefs;
      }
    } catch {
      // ignore
    }
    return {
      favoriteSportCategories: ['YOGA', 'PILATES', 'RUNNING'],
      hideCalories: false,
    };
  }

  private writeLocalPrefs(prefs: LocalPrefs): void {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }
}
