import { Module } from '@nestjs/common';
import { CycleController } from './cycle.controller.js';
import { CycleService } from './cycle.service.js';

@Module({
  controllers: [CycleController],
  providers: [CycleService],
  exports: [CycleService],
})
export class CycleModule {}
