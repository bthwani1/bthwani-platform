import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Geo coordinates DTO
 */
export class GeoCoordinatesDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lon!: number;
}

/**
 * Location DTO
 * Used for job location (region, city, optional geo)
 */
export class LocationDto {
  @IsString()
  @MaxLength(100)
  region!: string;

  @IsString()
  @MaxLength(100)
  city!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoCoordinatesDto)
  geo?: GeoCoordinatesDto;
}
