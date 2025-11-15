import {
  IsString,
  IsOptional,
  IsDecimal,
  IsArray,
  ValidateNested,
  MaxLength,
  IsObject,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FeeProfileStatus } from '../../entities/fee-profile.entity';
import { FeeOverrideDto } from './create-fee-profile.dto';

export class UpdateFeeProfileDto {
  @ApiProperty({ description: 'Fee profile name', required: false, maxLength: 255 })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Fee profile description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Default fee percentage (e.g., 5.50 for 5.5%)', required: false })
  @IsDecimal({ decimal_digits: '0,2' })
  @IsOptional()
  fee_percentage?: string;

  @ApiProperty({ type: [FeeOverrideDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeOverrideDto)
  @IsOptional()
  fee_overrides?: FeeOverrideDto[];

  @ApiProperty({ enum: FeeProfileStatus, required: false })
  @IsEnum(FeeProfileStatus)
  @IsOptional()
  status?: FeeProfileStatus;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
