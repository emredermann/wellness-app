import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, type JwtUserPayload } from '../auth/decorators/current-user.decorator.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { TodayDashboardService } from './dashboard.service.js';
import { TodayDashboardQueryDto } from './dto/today-dashboard.query.dto.js';

@Controller(['v1/dashboard', 'dashboard'])
export class TodayDashboardController {
  constructor(private readonly dashboardService: TodayDashboardService) {}

  @Get('today')
  @UseGuards(OptionalJwtAuthGuard)
  getToday(
    @Query() query: TodayDashboardQueryDto,
    @CurrentUser() user?: JwtUserPayload,
  ) {
    return this.dashboardService.getTodayCard(query, user?.sub);
  }
}
