import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsLatitude, IsLongitude, IsOptional, Max, Min } from 'class-validator';
import { EventCategory } from '../../../generated/prisma/enums.js';

export class NearbyEventsQueryDto {
  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  @Type(() => Number)
  @IsLongitude()
  lng!: number;

  /** Arama yarıçapı (metre) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(100_000)
  radius = 5_000;

  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;
}
