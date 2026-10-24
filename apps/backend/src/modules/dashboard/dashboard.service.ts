import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CyclePhase,
  DietType,
  MediaType,
  SessionCategory,
} from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CycleService } from '../cycle/cycle.service.js';
import { EventsService } from '../events/events.service.js';
import { TodayDashboardQueryDto } from './dto/today-dashboard.query.dto.js';

export interface FallbackExercise {
  id: string;
  title: string;
  durationMinutes: number;
  mediaType: MediaType;
  mediaUrl: string;
  category: SessionCategory;
  recommendedPhase: CyclePhase;
}

export interface FallbackMeal {
  id: string;
  title: string;
  description: string;
  dietType: DietType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  turkishCuisine: boolean;
  cyclePhaseSupport: CyclePhase[];
}

const FALLBACK_SHORT_EXERCISES: Record<CyclePhase, FallbackExercise> = {
  [CyclePhase.MENSTRUAL]: {
    id: 'default-session-menstrual',
    title: 'Pelvik Rahatlama & Derin Diyafram Nefesi',
    durationMinutes: 12,
    mediaType: MediaType.VIDEO,
    mediaUrl: 'https://cdn.wellness.local/sessions/menstrual-yin-12m.mp4',
    category: SessionCategory.YOGA,
    recommendedPhase: CyclePhase.MENSTRUAL,
  },
  [CyclePhase.FOLLICULAR]: {
    id: 'default-session-follicular',
    title: 'Sabah Enerji Akışı & Mobilite Serisi',
    durationMinutes: 15,
    mediaType: MediaType.VIDEO,
    mediaUrl: 'https://cdn.wellness.local/sessions/follicular-flow-15m.mp4',
    category: SessionCategory.PILATES,
    recommendedPhase: CyclePhase.FOLLICULAR,
  },
  [CyclePhase.OVULATORY]: {
    id: 'default-session-ovulatory',
    title: 'Dinamik Core Pilates & Kardiyo Ritmi',
    durationMinutes: 20,
    mediaType: MediaType.VIDEO,
    mediaUrl: 'https://cdn.wellness.local/sessions/ovulatory-core-20m.mp4',
    category: SessionCategory.WORKOUT,
    recommendedPhase: CyclePhase.OVULATORY,
  },
  [CyclePhase.LUTEAL]: {
    id: 'default-session-luteal',
    title: 'Sinir Sistemi Sakinleştirici Akşam Esnemesi',
    durationMinutes: 15,
    mediaType: MediaType.AUDIO,
    mediaUrl: 'https://cdn.wellness.local/sessions/luteal-stretch-15m.mp3',
    category: SessionCategory.STRETCHING,
    recommendedPhase: CyclePhase.LUTEAL,
  },
};

const FALLBACK_PHASE_MEALS: Record<CyclePhase, FallbackMeal> = {
  [CyclePhase.MENSTRUAL]: {
    id: 'default-recipe-menstrual',
    title: 'Zerdeçallı Kırmızı Mercimek Çorbası & Ispanak Sote',
    description: 'Demir ve magnezyum açısından zengin, ısıtıcı geleneksel Türk mutfağı öğünü.',
    dietType: DietType.VEGAN,
    calories: 380,
    protein: 18,
    carbs: 48,
    fat: 11,
    turkishCuisine: true,
    cyclePhaseSupport: [CyclePhase.MENSTRUAL],
  },
  [CyclePhase.FOLLICULAR]: {
    id: 'default-recipe-follicular',
    title: 'Zeytinyağlı Enginar Kalbi & Dereotlu Kinoa Kasesi',
    description: 'Prebiyotik lifler ve taze yeşilliklerle Foliküler faz canlılığını destekler.',
    dietType: DietType.VEGAN,
    calories: 410,
    protein: 14,
    carbs: 46,
    fat: 16,
    turkishCuisine: true,
    cyclePhaseSupport: [CyclePhase.FOLLICULAR],
  },
  [CyclePhase.OVULATORY]: {
    id: 'default-recipe-ovulatory',
    title: 'Nar Ekşili Semizotu & Nohutlu Akdeniz Salatası',
    description: 'Yüksek antioksidan ve bitkisel protein içeren ferahlatıcı öğün.',
    dietType: DietType.VEGAN,
    calories: 430,
    protein: 16,
    carbs: 44,
    fat: 18,
    turkishCuisine: true,
    cyclePhaseSupport: [CyclePhase.OVULATORY],
  },
  [CyclePhase.LUTEAL]: {
    id: 'default-recipe-luteal',
    title: 'Fırınlanmış Tatlı Patates, Humus & Cevizli Karabuğday Tabağı',
    description: 'Kan şekerini dengeleyen kompleks karbonhidrat ve B6 vitamini kaynağı.',
    dietType: DietType.VEGAN,
    calories: 460,
    protein: 15,
    carbs: 54,
    fat: 19,
    turkishCuisine: true,
    cyclePhaseSupport: [CyclePhase.LUTEAL],
  },
};

@Injectable()
export class TodayDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cycleService: CycleService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * GET /api/v1/dashboard/today
   * Kullanıcı id'sine göre tek bir yanıtta (Single Card Payload):
   * a) Günün önerilen kısa egzersizi,
   * b) Günün döngü fazına uygun öğün önerisi,
   * c) Yakındaki ilk aktif topluluk etkinliğini birleştirir.
   */
  async getTodayCard(query: TodayDashboardQueryDto, authenticatedUserId?: string) {
    const userId = query.userId ?? authenticatedUserId;
    if (!userId) {
      throw new BadRequestException(
        'Bugün kartı için userId parametresi veya oturum anahtarı (Bearer token) gereklidir.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const phaseSummary = this.cycleService.buildProfilePhaseSummary({
      gender: user.gender,
      isCycleTrackingActive: user.isCycleTrackingActive,
      cycleStartDate: user.cycleStartDate,
      cycleLength: user.cycleLength,
      bmi: user.bmi !== null && user.bmi !== undefined ? Number(user.bmi) : null,
    });

    const effectivePhase = phaseSummary.effectiveCyclePhase;
    const latitude = query.latitude ?? query.lat;
    const longitude = query.longitude ?? query.lng;

    const [recommendedExercise, recommendedMeal, nearbyActiveEvent] = await Promise.all([
      this.findRecommendedShortExercise(effectivePhase),
      this.findRecommendedMealForPhase(effectivePhase, user.dietType),
      this.findFirstActiveNearbyEvent(latitude, longitude, query.radiusKm ?? 15),
    ]);

    return {
      cardType: 'SINGLE_CARD_PAYLOAD' as const,
      generatedAt: new Date().toISOString(),
      user: {
        id: user.id,
        name: user.name,
        dietType: user.dietType,
      },
      phaseSummary,
      recommendedExercise,
      recommendedMeal,
      nearbyActiveEvent,
    };
  }

  private async findRecommendedShortExercise(phase: CyclePhase) {
    const phaseMatchedShortSession = await this.prisma.session.findFirst({
      where: {
        recommendedPhase: phase,
        durationMinutes: { lte: 30 },
      },
      orderBy: { durationMinutes: 'asc' },
    });

    if (phaseMatchedShortSession) {
      return phaseMatchedShortSession;
    }

    const anyShortSession = await this.prisma.session.findFirst({
      orderBy: { durationMinutes: 'asc' },
    });

    return anyShortSession ?? FALLBACK_SHORT_EXERCISES[phase];
  }

  private async findRecommendedMealForPhase(phase: CyclePhase, dietType: DietType) {
    const exactMatch = await this.prisma.recipe.findFirst({
      where: {
        dietType,
        cyclePhaseSupport: { has: phase },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (exactMatch) {
      return exactMatch;
    }

    const phaseOnlyMatch = await this.prisma.recipe.findFirst({
      where: {
        cyclePhaseSupport: { has: phase },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (phaseOnlyMatch) {
      return phaseOnlyMatch;
    }

    return FALLBACK_PHASE_MEALS[phase];
  }

  private async findFirstActiveNearbyEvent(
    latitude?: number,
    longitude?: number,
    radiusKm = 15,
  ) {
    if (latitude !== undefined && longitude !== undefined) {
      const nearbyRows = await this.eventsService.findNearby({
        lat: latitude,
        lng: longitude,
        radius: Math.round(radiusKm * 1000),
      });

      if (nearbyRows.length > 0) {
        const first = nearbyRows[0];
        return {
          ...first,
          distanceMeters: Math.round(Number(first.distanceMeters)),
          distanceKm: Number((Number(first.distanceMeters) / 1000).toFixed(2)),
        };
      }
    }

    const nextUpcoming = await this.prisma.event.findFirst({
      where: {
        date: { gte: new Date() },
      },
      orderBy: { date: 'asc' },
    });

    return nextUpcoming;
  }
}
