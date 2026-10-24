import { Injectable, NotFoundException } from '@nestjs/common';
import { CyclePhase, SessionCategory } from '../../generated/prisma/enums.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface FilterSessionsQuery {
  category?: SessionCategory;
  recommendedPhase?: CyclePhase;
  maxDurationMinutes?: number;
}

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: FilterSessionsQuery = {}) {
    const where: Prisma.SessionWhereInput = {};
    if (query.category) {
      where.category = query.category;
    }
    if (query.recommendedPhase) {
      where.recommendedPhase = query.recommendedPhase;
    }
    if (query.maxDurationMinutes !== undefined) {
      where.durationMinutes = { lte: Number(query.maxDurationMinutes) };
    }

    return this.prisma.session.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findById(id: string) {
    const session = await this.prisma.session.findUnique({ where: { id } });
    if (!session) {
      throw new NotFoundException('Seans bulunamadı.');
    }
    return session;
  }
}
