import { Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsDateString,
  IsEmail,
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

export class RegisterDto {
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz.' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır.' })
  @MaxLength(72, { message: 'Şifre en fazla 72 karakter olabilir.' })
  password!: string;

  @IsString()
  @MinLength(2, { message: 'İsim en az 2 karakter olmalıdır.' })
  @MaxLength(120)
  name!: string;

  /**
   * KVKK Açık Rıza Onay Kutusu (Zorunlu: true olmalıdır)
   */
  @IsBoolean({ message: 'KVKK açık rıza alanı boolean olmalıdır.' })
  @Equals(true, { message: 'Kayıt olabilmek için KVKK açık rıza metnini onaylamanız zorunludur.' })
  kvkkConsent!: boolean;

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
