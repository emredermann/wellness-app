import { Module } from '@nestjs/common';
import { CycleModule } from '../cycle/cycle.module.js';
import { EventsModule } from '../events/events.module.js';
import { TodayDashboardController } from './dashboard.controller.js';
import { TodayDashboardService } from './dashboard.service.js';

@Module({
  imports: [CycleModule, EventsModule],
  controllers: [TodayDashboardController],
  providers: [TodayDashboardService],
  exports: [TodayDashboardService],
})
export class TodayDashboardModule {}
