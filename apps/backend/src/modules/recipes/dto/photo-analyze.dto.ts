import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class PhotoAnalyzeDto {
  @IsOptional()
  @IsString()
  imageBase64?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  mealHint?: string;

  @IsOptional()
  @IsIn(['SMALL', 'MEDIUM', 'LARGE'])
  portionSize?: 'SMALL' | 'MEDIUM' | 'LARGE';
}
