import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { CyclePhase, SessionCategory } from '../../generated/prisma/enums.js';
import { SessionsService } from './sessions.service.js';

@Controller(['v1/sessions', 'sessions'])
export class SessionsController {
  constructor(private readonly service: SessionsService) {}

  @Get()
  findAll(
    @Query('category') category?: SessionCategory,
    @Query('recommendedPhase') recommendedPhase?: CyclePhase,
    @Query('maxDurationMinutes') maxDurationMinutes?: number,
  ) {
    return this.service.findAll({ category, recommendedPhase, maxDurationMinutes });
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }
}
