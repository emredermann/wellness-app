import { Controller, Get, Query } from '@nestjs/common';
import { CycleService } from './cycle.service.js';
import { CurrentPhaseQueryDto } from '../profile/dto/current-phase-query.dto.js';

@Controller(['v1/cycle', 'cycle'])
export class CycleController {
  constructor(private readonly cycleService: CycleService) {}

  @Get('calculate')
  calculate(@Query() query: CurrentPhaseQueryDto) {
    return this.cycleService.buildProfilePhaseSummary({
      gender: query.gender,
      isCycleTrackingActive: query.isCycleTrackingActive,
      cycleStartDate: query.cycleStartDate,
      cycleLength: query.cycleLength,
      bmi: query.bmi,
      weightKg: query.weightKg,
      heightCm: query.heightCm,
      referenceDate: query.referenceDate ? new Date(query.referenceDate) : undefined,
    });
  }
}
