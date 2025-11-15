import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EsfRequestStatus } from '../../entities/esf-request.entity';
import { BloodType, RhFactor } from '../../entities/esf-request.entity';

export class AdminSearchRequestsDto {
  @IsString()
  @IsOptional()
  cursor?: string;

  @IsInt()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsString()
  @IsOptional()
  city?: string;

  @IsEnum(EsfRequestStatus)
  @IsOptional()
  status?: EsfRequestStatus;

  @IsEnum(BloodType)
  @IsOptional()
  abo_type?: BloodType;

  @IsEnum(RhFactor)
  @IsOptional()
  rh_factor?: RhFactor;

  @IsDateString()
  @IsOptional()
  from?: string;

  @IsDateString()
  @IsOptional()
  to?: string;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  sla_breach?: boolean;
}
