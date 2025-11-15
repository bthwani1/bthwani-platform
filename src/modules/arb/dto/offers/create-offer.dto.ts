import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEnum,
  IsObject,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MoneyValueDto } from '../common/money-value.dto';
import { OfferStatus, DepositPolicy } from '../../entities/offer.entity';

export class SlotDto {
  @ApiProperty({ description: 'Slot ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Start time (ISO 8601)', example: '09:00' })
  @IsString()
  start_time!: string;

  @ApiProperty({ description: 'End time (ISO 8601)', example: '10:00' })
  @IsString()
  end_time!: string;

  @ApiProperty({ description: 'Date (ISO 8601)', example: '2025-12-01' })
  @IsString()
  date!: string;

  @ApiProperty({ description: 'Is slot available' })
  @IsBoolean()
  available!: boolean;
}

export class CreateOfferDto {
  @ApiProperty({ description: 'Title in Arabic' })
  @IsString()
  @IsNotEmpty()
  title_ar!: string;

  @ApiProperty({ description: 'Title in English' })
  @IsString()
  @IsNotEmpty()
  title_en!: string;

  @ApiProperty({ description: 'Description in Arabic', required: false })
  @IsOptional()
  @IsString()
  description_ar?: string;

  @ApiProperty({ description: 'Description in English', required: false })
  @IsOptional()
  @IsString()
  description_en?: string;

  @ApiProperty({ description: 'Image URLs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  images!: string[];

  @ApiProperty({ description: 'Price', type: MoneyValueDto })
  @ValidateNested()
  @Type(() => MoneyValueDto)
  price!: MoneyValueDto;

  @ApiProperty({ description: 'Deposit amount', type: MoneyValueDto })
  @ValidateNested()
  @Type(() => MoneyValueDto)
  deposit_amount!: MoneyValueDto;

  @ApiProperty({ description: 'Category ID', required: false })
  @IsOptional()
  @IsString()
  category_id?: string;

  @ApiProperty({ description: 'Subcategory ID', required: false })
  @IsOptional()
  @IsString()
  subcategory_id?: string;

  @ApiProperty({ description: 'Region code', required: false })
  @IsOptional()
  @IsString()
  region_code?: string;

  @ApiProperty({ description: 'Location', required: false })
  @IsOptional()
  @IsObject()
  location?: {
    city?: string;
    district?: string;
    coordinates?: { lat: number; lon: number };
  };

  @ApiProperty({
    description: 'Deposit policy',
    enum: DepositPolicy,
    default: DepositPolicy.FULL_REFUND,
  })
  @IsOptional()
  @IsEnum(DepositPolicy)
  deposit_policy?: DepositPolicy;

  @ApiProperty({ description: 'Release days', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  release_days?: number;

  @ApiProperty({ description: 'Available slots', type: [SlotDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlotDto)
  slots?: SlotDto[];

  @ApiProperty({ description: 'Calendar configuration', required: false })
  @IsOptional()
  @IsObject()
  calendar_config?: {
    timezone?: string;
    working_hours?: Record<string, { start: string; end: string }>;
    blocked_dates?: string[];
  };

  @ApiProperty({ description: 'Status', enum: OfferStatus, default: OfferStatus.DRAFT })
  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;
}
