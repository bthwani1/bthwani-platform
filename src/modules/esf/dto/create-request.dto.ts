import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  ValidateNested,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BloodType, RhFactor } from '../entities/esf-request.entity';

class LocationDto {
  @IsNotEmpty()
  lat!: number;

  @IsNotEmpty()
  lon!: number;
}

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  patient_name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  hospital_name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  city!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  district?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  hospital_address?: string;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsEnum(BloodType)
  abo_type!: BloodType;

  @IsEnum(RhFactor)
  rh_factor!: RhFactor;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
