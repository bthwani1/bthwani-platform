import {
  IsBoolean,
  IsOptional,
  IsEnum,
  IsString,
  MaxLength,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BloodType, RhFactor } from '../entities/esf-request.entity';

class LocationDto {
  lat!: number;
  lon!: number;
}

export class UpdateAvailabilityDto {
  @IsBoolean()
  @IsOptional()
  is_available?: boolean;

  @IsEnum(BloodType)
  @IsOptional()
  abo_type?: BloodType;

  @IsEnum(RhFactor)
  @IsOptional()
  rh_factor?: RhFactor;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  district?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}
