import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const [{ postgis }] = await this.prisma.$queryRaw<{ postgis: string }[]>`SELECT postgis_version() AS postgis`;
    return { status: 'ok', db: 'up', postgis, timestamp: new Date().toISOString() };
  }
}
