import {
  IsString,
  IsOptional,
  IsEnum,
  IsDecimal,
  IsArray,
  ValidateNested,
  MaxLength,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FeeProfileScope } from '../../entities/fee-profile.entity';

export class FeeOverrideDto {
  @ApiProperty({ description: 'Condition for override' })
  @IsObject()
  condition!: Record<string, unknown>;

  @ApiProperty({ description: 'Fee percentage (e.g., 5.50 for 5.5%)' })
  @IsDecimal({ decimal_digits: '0,2' })
  fee_percentage!: string;

  @ApiProperty({ description: 'Effective from date', required: false })
  @IsOptional()
  effective_from?: Date;

  @ApiProperty({ description: 'Effective until date', required: false })
  @IsOptional()
  effective_until?: Date;
}

export class CreateFeeProfileDto {
  @ApiProperty({ description: 'Unique fee profile code', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Fee profile name', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'Fee profile description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: FeeProfileScope })
  @IsEnum(FeeProfileScope)
  scope!: FeeProfileScope;

  @ApiProperty({ description: 'Region code (required if scope is region)', required: false })
  @IsString()
  @IsOptional()
  region_code?: string;

  @ApiProperty({ description: 'Category ID (required if scope is category)', required: false })
  @IsString()
  @IsOptional()
  category_id?: string;

  @ApiProperty({
    description: 'Subcategory ID (required if scope is subcategory)',
    required: false,
  })
  @IsString()
  @IsOptional()
  subcategory_id?: string;

  @ApiProperty({ description: 'Default fee percentage (e.g., 5.50 for 5.5%)' })
  @IsDecimal({ decimal_digits: '0,2' })
  fee_percentage!: string;

  @ApiProperty({ type: [FeeOverrideDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeeOverrideDto)
  @IsOptional()
  fee_overrides?: FeeOverrideDto[];

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
