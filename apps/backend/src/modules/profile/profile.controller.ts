import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, type JwtUserPayload } from '../auth/decorators/current-user.decorator.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentPhaseQueryDto } from './dto/current-phase-query.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ProfileService } from './profile.service.js';

@Controller(['v1/profile', 'profile'])
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * GET /api/v1/profile/current-phase
   * Mevcut döngü fazını (veya Enerji Ritim Modunu), VKİ durumunu ve
   * faza uygun rahatlatıcı hareket/beslenme öneri etiketlerini döner.
   */
  @Get('current-phase')
  @UseGuards(OptionalJwtAuthGuard)
  getCurrentPhase(
    @Query() query: CurrentPhaseQueryDto,
    @CurrentUser() user?: JwtUserPayload,
  ) {
    return this.profileService.getCurrentPhase(query, user?.sub);
  }

  @Patch(':userId')
  updateProfile(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(userId, dto);
  }
}
