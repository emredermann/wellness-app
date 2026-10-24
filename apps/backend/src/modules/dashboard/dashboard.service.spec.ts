import {
  CyclePhase,
  DietType,
  EventCategory,
  Gender,
  MediaType,
  SessionCategory,
} from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CycleService } from '../cycle/cycle.service.js';
import { EventsService } from '../events/events.service.js';
import { TodayDashboardService } from './dashboard.service.js';

describe('TodayDashboardService (GET /api/v1/dashboard/today Single Card Payload)', () => {
  let dashboardService: TodayDashboardService;
  let mockPrisma: {
    user: { findUnique: ReturnType<typeof vi.fn> };
    session: { findFirst: ReturnType<typeof vi.fn> };
    recipe: { findFirst: ReturnType<typeof vi.fn> };
    event: { findFirst: ReturnType<typeof vi.fn> };
  };
  let mockEventsService: {
    findNearby: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockPrisma = {
      user: { findUnique: vi.fn() },
      session: { findFirst: vi.fn() },
      recipe: { findFirst: vi.fn() },
      event: { findFirst: vi.fn() },
    };
    mockEventsService = {
      findNearby: vi.fn(),
    };

    dashboardService = new TodayDashboardService(
      mockPrisma as unknown as PrismaService,
      new CycleService(),
      mockEventsService as unknown as EventsService,
    );
  });

  it('kullanıcı id ve konuma göre egzersiz, faz öğünü ve yakındaki etkinliği tek kartta birleştirmelidir', async () => {
    const userId = '33333333-3333-4333-8333-333333333333';

    mockPrisma.user.findUnique.mockResolvedValue({
      id: userId,
      name: 'Zeynep Kaya',
      gender: Gender.FEMALE,
      dietType: DietType.VEGAN,
      bmi: 21.2,
      cycleStartDate: new Date(), // Bugün 1. gün -> MENSTRUAL
      cycleLength: 28,
      isCycleTrackingActive: true,
    });

    mockPrisma.session.findFirst.mockResolvedValue({
      id: 'sess-1',
      title: '10 Dakika Pelvik Nefes & Yin Yoga',
      durationMinutes: 10,
      mediaType: MediaType.VIDEO,
      mediaUrl: 'https://cdn.wellness.local/yin.mp4',
      category: SessionCategory.YOGA,
      recommendedPhase: CyclePhase.MENSTRUAL,
    });

    mockPrisma.recipe.findFirst.mockResolvedValue({
      id: 'rcp-1',
      title: 'Kırmızı Mercimek & Ispanak Kasesi',
      dietType: DietType.VEGAN,
      calories: 360,
      turkishCuisine: true,
      cyclePhaseSupport: [CyclePhase.MENSTRUAL],
    });

    mockEventsService.findNearby.mockResolvedValue([
      {
        id: 'evt-nearby-1',
        title: 'Moda Sahili Gün Batımı Meditasyonu',
        category: EventCategory.MEDITATION,
        latitude: 40.979,
        longitude: 29.025,
        address: 'Moda Çay Bahçesi Yanı, Kadıköy',
        date: new Date('2026-10-25T16:30:00Z'),
        distanceMeters: 850,
      },
    ]);

    const payload = await dashboardService.getTodayCard({
      userId,
      latitude: 40.98,
      longitude: 29.02,
      radiusKm: 10,
    });

    expect(payload.cardType).toBe('SINGLE_CARD_PAYLOAD');
    expect(payload.user.id).toBe(userId);
    expect(payload.phaseSummary.currentPhase).toBe(CyclePhase.MENSTRUAL);
    expect(payload.recommendedExercise.title).toBe('10 Dakika Pelvik Nefes & Yin Yoga');
    expect(payload.recommendedMeal.title).toBe('Kırmızı Mercimek & Ispanak Kasesi');
    expect(payload.nearbyActiveEvent?.title).toBe('Moda Sahili Gün Batımı Meditasyonu');
  });
});
