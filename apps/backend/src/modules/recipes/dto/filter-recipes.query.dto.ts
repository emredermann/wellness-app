import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { CyclePhase, DietType } from '../../../generated/prisma/enums.js';

export class FilterRecipesQueryDto {
  @IsOptional()
  @IsEnum(DietType)
  dietType?: DietType;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  turkishCuisine?: boolean;

  @IsOptional()
  @IsEnum(CyclePhase)
  phase?: CyclePhase;

  @IsOptional()
  @IsEnum(CyclePhase)
  cyclePhase?: CyclePhase;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(50)
  @Max(3000)
  maxCalories?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
