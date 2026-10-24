import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser, type JwtUserPayload } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UpdateProfileDto } from '../profile/dto/update-profile.dto.js';
import { UsersService } from './users.service.js';

@Controller(['v1/users', 'users'])
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtUserPayload) {
    return this.service.findById(user.sub);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: JwtUserPayload, @Body() dto: UpdateProfileDto) {
    return this.service.updateMe(user.sub, dto);
  }

  @Get('me/data-export')
  exportData(@CurrentUser() user: JwtUserPayload) {
    return this.service.exportKvkkData(user.sub);
  }

  @Delete('me')
  deleteMe(@CurrentUser() user: JwtUserPayload) {
    return this.service.deleteAccount(user.sub);
  }
}
