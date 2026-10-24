import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { calculateBmiValue } from '../cycle/utils/cycle-calculator.util.js';
import { UpdateProfileDto } from '../profile/dto/update-profile.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }
    return this.sanitizeUser(user);
  }

  async updateMe(id: string, dto: UpdateProfileDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const resolvedBmi =
      dto.bmi ??
      (dto.weightKg && dto.heightCm
        ? calculateBmiValue(dto.weightKg, dto.heightCm)
        : undefined);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
        ...(dto.dietType !== undefined ? { dietType: dto.dietType } : {}),
        ...(resolvedBmi !== undefined ? { bmi: resolvedBmi } : {}),
        ...(dto.cycleStartDate !== undefined
          ? { cycleStartDate: dto.cycleStartDate ? new Date(dto.cycleStartDate) : null }
          : {}),
        ...(dto.cycleLength !== undefined ? { cycleLength: dto.cycleLength } : {}),
        ...(dto.isCycleTrackingActive !== undefined
          ? { isCycleTrackingActive: dto.isCycleTrackingActive }
          : {}),
      },
    });

    return this.sanitizeUser(updated);
  }

  async exportKvkkData(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            event: true,
          },
        },
        organizedEvents: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    return {
      exportedAt: new Date().toISOString(),
      kvkkLawReference: '6698 Sayılı Kişisel Verilerin Korunması Kanunu - Madde 11',
      user: this.sanitizeUser(user),
      bookings: user.bookings,
      organizedEvents: user.organizedEvents,
    };
  }

  async deleteAccount(id: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    await this.prisma.user.delete({ where: { id } });
    return {
      deleted: true,
      deletedAt: new Date().toISOString(),
    };
  }

  private sanitizeUser(user: {
    id: string;
    email: string;
    name: string;
    gender: string | null;
    dietType: string;
    bmi: unknown;
    cycleStartDate: Date | null;
    cycleLength: number | null;
    isCycleTrackingActive: boolean;
    kvkkConsent: boolean;
    kvkkConsentAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      gender: user.gender,
      dietType: user.dietType,
      bmi: user.bmi !== null && user.bmi !== undefined ? Number(user.bmi) : null,
      cycleStartDate: user.cycleStartDate
        ? user.cycleStartDate.toISOString().slice(0, 10)
        : null,
      cycleLength: user.cycleLength,
      isCycleTrackingActive: user.isCycleTrackingActive,
      kvkkConsent: user.kvkkConsent,
      kvkkConsentAt: user.kvkkConsentAt,
      createdAt: user.createdAt,
    };
  }
}
