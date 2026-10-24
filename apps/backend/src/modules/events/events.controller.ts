import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, type JwtUserPayload } from '../auth/decorators/current-user.decorator.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { BookEventDto } from './dto/book-event.dto.js';
import { MapEventsQueryDto } from './dto/map-events.query.dto.js';
import { NearbyEventsQueryDto } from './dto/nearby-events.query.dto.js';
import { EventsService } from './events.service.js';

@Controller(['v1/events', 'events'])
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  findUpcoming() {
    return this.events.findUpcoming();
  }

  @Get('nearby')
  findNearby(@Query() query: NearbyEventsQueryDto) {
    return this.events.findNearby(query);
  }

  @Get('map')
  findForMap(@Query() query: MapEventsQueryDto) {
    return this.events.findForMap(query);
  }

  @Post(':id/book')
  @UseGuards(OptionalJwtAuthGuard)
  bookEvent(
    @Param('id', ParseUUIDPipe) eventId: string,
    @Body() dto: BookEventDto,
    @CurrentUser() user?: JwtUserPayload,
  ) {
    return this.events.bookEvent(eventId, dto.userId ?? user?.sub);
  }
}
