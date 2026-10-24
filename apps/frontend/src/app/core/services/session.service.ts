import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { CyclePhase, SessionCategory, WellnessSession } from '../models/domain.models';
import { ApiService } from './api.service';

export interface WellnessSessionDetail extends WellnessSession {
  instructor: string;
  subtitle: string;
  ambientHz: number;
  breathingPattern: {
    inhaleSec: number;
    holdSec: number;
    exhaleSec: number;
    label: string;
  };
  steps: string[];
}

const COMPLETED_SESSIONS_KEY = 'wl_completed_sessions';

const FALLBACK_SESSIONS: WellnessSessionDetail[] = [
  {
    id: 'ses-yin-yoga-01',
    title: 'Restoratif Yin Yoga & Pelvik Rahatlama',
    subtitle: 'Menstrüel fazda kramp ve bel gerginliğini azaltan nazik yer serisi.',
    instructor: 'Ece Duru · Yoga Alliance E-RYT 500',
    durationMinutes: 20,
    mediaType: 'VIDEO',
    mediaUrl: 'https://wellness.local/media/yin-yoga.mp4',
    category: 'YOGA',
    recommendedPhase: 'MENSTRUAL',
    ambientHz: 432,
    breathingPattern: {
      inhaleSec: 4,
      holdSec: 2,
      exhaleSec: 6,
      label: '4-2-6 Uzatılmış Nefes Veriş (Parasempatik Aktivasyon)',
    },
    steps: [
      '00:00 – Kelebek Pozu (Baddha Konasana) ve karın nefesi farkındalığı',
      '05:00 – Destekli Çocuk Pozu (Balasana) ile alt sırt gevşemesi',
      '12:00 – Sırtüstü Burgu (Supta Matsyendrasana) ile omurga dekompresyonu',
      '17:00 – Savasana ve 432 Hz ses çanağı eşliğinde derin dinlenme',
    ],
  },
  {
    id: 'ses-pilates-core-02',
    title: 'Sabah Akışı: Dinamik Mat Pilates & Core Stabilizasyon',
    subtitle: 'Foliküler fazda yükselen enerjiyi omurga hizası ve derin karın kaslarına yönlendirir.',
    instructor: 'Zeynep Aksoy · Klinik Pilates Uzmanı',
    durationMinutes: 30,
    mediaType: 'VIDEO',
    mediaUrl: 'https://wellness.local/media/dynamic-pilates.mp4',
    category: 'PILATES',
    recommendedPhase: 'FOLLICULAR',
    ambientHz: 528,
    breathingPattern: {
      inhaleSec: 4,
      holdSec: 0,
      exhaleSec: 4,
      label: '4-0-4 Lateral Göğüs Kafesi Pilates Nefesi',
    },
    steps: [
      '00:00 – Diyafram & kaburga nefesi aktivasyonu, pelvik tilt ısınması',
      '06:00 – The Hundred & Single Leg Stretch akışı',
      '15:00 – Side Kick serisi ve kalça stabilizasyonu',
      '24:00 – Spine Stretch Forward & kedi-deve esnemesi ile kapanış',
    ],
  },
  {
    id: 'ses-breath-box-03',
    title: 'Vagus Siniri Uyarımı: 4-7-8 Sakinleştirici Nefes & Meditasyon',
    subtitle: 'Luteal fazdaki zihinsel yoğunluğu ve kortizol seviyesini dakikalar içinde dengeler.',
    instructor: 'Mert Yalçın · Mindfulness & Nefes Koçu',
    durationMinutes: 15,
    mediaType: 'AUDIO',
    mediaUrl: 'https://wellness.local/media/vagus-breathing.mp3',
    category: 'BREATHING',
    recommendedPhase: 'LUTEAL',
    ambientHz: 396,
    breathingPattern: {
      inhaleSec: 4,
      holdSec: 7,
      exhaleSec: 8,
      label: '4 sn Al · 7 sn Tut · 8 sn Yavaşça Ver',
    },
    steps: [
      '00:00 – Omuzları ve çene kaslarını serbest bırakma taraması',
      '03:00 – 4-7-8 ritmik nefes döngüsü (8 tam tur)',
      '10:00 – Kalp merkezi odaklanması ve şefkat meditasyonu',
    ],
  },
  {
    id: 'ses-hiit-sculpt-04',
    title: 'Zirve Enerji: Fonksiyonel Kardiyo & Beden Heykeltıraşı',
    subtitle: 'Ovulasyon fazındaki maksimum dayanıklılığı değerlendiren yüksek enerjili antrenman.',
    instructor: 'Derin Korkmaz · Fonksiyonel Antrenör',
    durationMinutes: 35,
    mediaType: 'VIDEO',
    mediaUrl: 'https://wellness.local/media/ovulatory-sculpt.mp4',
    category: 'WORKOUT',
    recommendedPhase: 'OVULATORY',
    ambientHz: 528,
    breathingPattern: {
      inhaleSec: 3,
      holdSec: 1,
      exhaleSec: 3,
      label: '3-1-3 Ritmik Tempo Nefesi',
    },
    steps: [
      '00:00 – Dinamik eklem mobilitesi ve nabız yükseltici ısınma',
      '08:00 – Squat-to-Press, Lunge Pulse ve Plank Walkout istasyonları',
      '25:00 – Glute Bridge & Core Finisher',
      '30:00 – Derin psoas ve hamstring soğuma esnemeleri',
    ],
  },
  {
    id: 'ses-sleep-nidra-05',
    title: 'Yoga Nidra & Beden Taraması ile Derin Uyku Hazırlığı',
    subtitle: 'Gece uykusuna geçişi kolaylaştıran delta dalgası destekli sesli rehberlik.',
    instructor: 'Ece Duru · Yoga Alliance E-RYT 500',
    durationMinutes: 25,
    mediaType: 'AUDIO',
    mediaUrl: 'https://wellness.local/media/yoga-nidra.mp3',
    category: 'SLEEP',
    recommendedPhase: 'LUTEAL',
    ambientHz: 285,
    breathingPattern: {
      inhaleSec: 4,
      holdSec: 4,
      exhaleSec: 6,
      label: '4-4-6 Gece Sakinleşme Nefesi',
    },
    steps: [
      '00:00 – Sankalpa (niyet) belirleme ve yatak içinde rahat yerleşim',
      '05:00 – Sağdan sola 61 noktalı sistematik beden taraması',
      '18:00 – Ağırlaşma ve derin uykuya teslimiyet',
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly api = inject(ApiService);

  private readonly sessionsSignal = signal<WellnessSessionDetail[]>(FALLBACK_SESSIONS);
  private readonly completedIdsSignal = signal<string[]>(this.readCompletedIds());

  readonly sessions = this.sessionsSignal.asReadonly();
  readonly completedIds = this.completedIdsSignal.asReadonly();
  readonly completedCount = computed(() => this.completedIdsSignal().length);

  loadSessions(filter?: {
    category?: SessionCategory;
    recommendedPhase?: CyclePhase;
  }): Observable<WellnessSessionDetail[]> {
    const params: Record<string, string | number | boolean> = {
      ...(filter?.category ? { category: filter.category } : {}),
      ...(filter?.recommendedPhase ? { recommendedPhase: filter.recommendedPhase } : {}),
    };

    return this.api.get<WellnessSession[]>('/sessions', params).pipe(
      catchError(() => of(FALLBACK_SESSIONS)),
      map((items) => {
        if (!items.length) return FALLBACK_SESSIONS;
        return items.map((item, idx) => {
          const fallback = FALLBACK_SESSIONS[idx % FALLBACK_SESSIONS.length];
          return {
            ...fallback,
            ...item,
          } satisfies WellnessSessionDetail;
        });
      }),
      map((items) => {
        return items.filter((s) => {
          if (filter?.category && s.category !== filter.category) return false;
          if (filter?.recommendedPhase && s.recommendedPhase !== filter.recommendedPhase)
            return false;
          return true;
        });
      }),
      tap((items) => {
        if (!filter?.category && !filter?.recommendedPhase) {
          this.sessionsSignal.set(items);
        }
      }),
    );
  }

  markSessionCompleted(sessionId: string): void {
    const current = this.completedIdsSignal();
    if (!current.includes(sessionId)) {
      const updated = [sessionId, ...current];
      this.completedIdsSignal.set(updated);
      try {
        localStorage.setItem(COMPLETED_SESSIONS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  }

  isCompleted(sessionId: string): boolean {
    return this.completedIdsSignal().includes(sessionId);
  }

  private readCompletedIds(): string[] {
    try {
      const raw = localStorage.getItem(COMPLETED_SESSIONS_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }
}
