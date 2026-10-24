import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { CurrentUser, type JwtUserPayload } from '../auth/decorators/current-user.decorator.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { BookingsService } from './bookings.service.js';

export class CreateBookingDto {
  @IsString()
  eventId!: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

@Controller(['v1/bookings', 'bookings'])
@UseGuards(OptionalJwtAuthGuard)
export class BookingsController {
  constructor(private readonly service: BookingsService) {}

  @Get()
  findMine(@CurrentUser() user?: JwtUserPayload) {
    return this.service.findAllForUser(user?.sub);
  }

  @Post()
  create(@Body() dto: CreateBookingDto, @CurrentUser() user?: JwtUserPayload) {
    return this.service.createBooking(dto.eventId, dto.userId ?? user?.sub);
  }

  @Delete(':id')
  cancel(
    @Param('id', ParseUUIDPipe) bookingId: string,
    @CurrentUser() user?: JwtUserPayload,
  ) {
    return this.service.cancelBooking(bookingId, user?.sub);
  }
}
