import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DietType, Gender } from '../../../generated/prisma/enums.js';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEnum(DietType)
  dietType?: DietType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(10)
  @Max(70)
  bmi?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(25)
  @Max(300)
  weightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(100)
  @Max(250)
  heightCm?: number;

  @IsOptional()
  @IsDateString()
  cycleStartDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(21)
  @Max(45)
  cycleLength?: number;

  @IsOptional()
  @IsBoolean()
  isCycleTrackingActive?: boolean;
}
