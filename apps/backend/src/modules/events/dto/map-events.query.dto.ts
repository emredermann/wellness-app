import { Type } from 'class-transformer';
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { EventCategory } from '../../../generated/prisma/enums.js';

export class MapEventsQueryDto {
  @ValidateIf((o: MapEventsQueryDto) => o.lat === undefined)
  @Type(() => Number)
  @IsLatitude({ message: 'Geçerli bir latitude değeri giriniz (-90 ile 90 arası).' })
  latitude?: number;

  @ValidateIf((o: MapEventsQueryDto) => o.lng === undefined)
  @Type(() => Number)
  @IsLongitude({ message: 'Geçerli bir longitude değeri giriniz (-180 ile 180 arası).' })
  longitude?: number;

  @ValidateIf((o: MapEventsQueryDto) => o.latitude === undefined)
  @Type(() => Number)
  @IsLatitude()
  lat?: number;

  @ValidateIf((o: MapEventsQueryDto) => o.longitude === undefined)
  @Type(() => Number)
  @IsLongitude()
  lng?: number;

  /** Arama yarıçapı (kilometre), varsayılan: 10 km */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(500)
  radiusKm = 10;

  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory;
}
