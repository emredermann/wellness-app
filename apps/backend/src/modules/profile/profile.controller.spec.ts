import { NotFoundException } from '@nestjs/common';
import { CyclePhase, DietType, Gender } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CycleService } from '../cycle/cycle.service.js';
import { ProfileController } from './profile.controller.js';
import { ProfileService } from './profile.service.js';

describe('ProfileController & ProfileService (GET /api/v1/profile/current-phase)', () => {
  let controller: ProfileController;
  let profileService: ProfileService;
  let mockPrisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };
    const cycleService = new CycleService();
    profileService = new ProfileService(mockPrisma as unknown as PrismaService, cycleService);
    controller = new ProfileController(profileService);
  });

  it('kayıtlı kadın kullanıcı için mevcut fazı, VKİ durumunu ve öneri etiketlerini dönmelidir', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'aaaa1111-bbbb-4ccc-8ddd-eeeeffff0001',
      gender: Gender.FEMALE,
      dietType: DietType.VEGETARIAN,
      bmi: 21.5,
      cycleStartDate: new Date('2026-10-12T00:00:00Z'),
      cycleLength: 28,
      isCycleTrackingActive: true,
    });

    const result = await controller.getCurrentPhase({
      userId: 'aaaa1111-bbbb-4ccc-8ddd-eeeeffff0001',
      referenceDate: '2026-10-25T00:00:00Z', // 14. gün -> Yumurtlama (OVULATORY)
    });

    expect(result.userId).toBe('aaaa1111-bbbb-4ccc-8ddd-eeeeffff0001');
    expect(result.currentPhase).toBe(CyclePhase.OVULATORY);
    expect(result.phaseNameTr).toBe('Yumurtlama');
    expect(result.bmiStatus.category).toBe('NORMAL');
    expect(result.recommendations.movementTags).toContain('Dinamik Pilates');
    expect(result.recommendations.nutritionTags).toContain('Antioksidan Meyveler');
  });

  it('bulunamayan userId için NotFoundException fırlatmalıdır', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      controller.getCurrentPhase({
        userId: 'aaaa1111-bbbb-4ccc-8ddd-eeeeffff9999',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
