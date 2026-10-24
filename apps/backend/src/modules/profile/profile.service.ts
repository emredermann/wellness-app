import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CycleService } from '../cycle/cycle.service.js';
import { calculateBmiValue } from '../cycle/utils/cycle-calculator.util.js';
import { CurrentPhaseQueryDto } from './dto/current-phase-query.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cycleService: CycleService,
  ) {}

  async getCurrentPhase(query: CurrentPhaseQueryDto, authenticatedUserId?: string) {
    const targetUserId = query.userId ?? authenticatedUserId;
    const referenceDate = query.referenceDate ? new Date(query.referenceDate) : new Date();

    if (targetUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: targetUserId },
      });

      if (!user) {
        throw new NotFoundException('Kullanıcı profili bulunamadı.');
      }

      const summary = this.cycleService.buildProfilePhaseSummary({
        gender: query.gender ?? user.gender,
        isCycleTrackingActive:
          query.isCycleTrackingActive ?? user.isCycleTrackingActive,
        cycleStartDate: query.cycleStartDate ?? user.cycleStartDate,
        cycleLength: query.cycleLength ?? user.cycleLength,
        bmi:
          query.bmi ??
          (user.bmi !== null && user.bmi !== undefined ? Number(user.bmi) : null),
        weightKg: query.weightKg,
        heightCm: query.heightCm,
        referenceDate,
      });

      return {
        userId: user.id,
        dietType: user.dietType,
        ...summary,
      };
    }

    const summary = this.cycleService.buildProfilePhaseSummary({
      gender: query.gender,
      isCycleTrackingActive: query.isCycleTrackingActive,
      cycleStartDate: query.cycleStartDate,
      cycleLength: query.cycleLength,
      bmi: query.bmi,
      weightKg: query.weightKg,
      heightCm: query.heightCm,
      referenceDate,
    });

    return {
      userId: null,
      dietType: null,
      ...summary,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      throw new NotFoundException('Kullanıcı profili bulunamadı.');
    }

    const resolvedBmi =
      dto.bmi ??
      (dto.weightKg && dto.heightCm
        ? calculateBmiValue(dto.weightKg, dto.heightCm)
        : undefined);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        ...(dto.dietType !== undefined ? { dietType: dto.dietType } : {}),
        ...(resolvedBmi !== undefined ? { bmi: resolvedBmi } : {}),
        ...(dto.cycleStartDate !== undefined
          ? { cycleStartDate: new Date(dto.cycleStartDate) }
          : {}),
        ...(dto.cycleLength !== undefined ? { cycleLength: dto.cycleLength } : {}),
        ...(dto.isCycleTrackingActive !== undefined
          ? { isCycleTrackingActive: dto.isCycleTrackingActive }
          : {}),
      },
    });

    return this.getCurrentPhase({ userId: updated.id });
  }
}
