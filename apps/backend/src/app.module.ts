import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { BookingsModule } from './modules/bookings/bookings.module.js';
import { RecipesModule } from './modules/recipes/recipes.module.js';
import { SessionsModule } from './modules/sessions/sessions.module.js';
import { CycleModule } from './modules/cycle/cycle.module.js';
import { ProfileModule } from './modules/profile/profile.module.js';
import { TodayDashboardModule } from './modules/dashboard/dashboard.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProfileModule,
    CycleModule,
    EventsModule,
    BookingsModule,
    RecipesModule,
    SessionsModule,
    TodayDashboardModule,
  ],
})
export class AppModule {}
