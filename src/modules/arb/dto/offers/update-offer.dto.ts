import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MoneyValueDto } from '../common/money-value.dto';
import { OfferStatus, DepositPolicy } from '../../entities/offer.entity';
import { SlotDto } from './create-offer.dto';

export class UpdateOfferDto {
  @ApiProperty({ description: 'Title in Arabic', required: false })
  @IsOptional()
  @IsString()
  title_ar?: string;

  @ApiProperty({ description: 'Title in English', required: false })
  @IsOptional()
  @IsString()
  title_en?: string;

  @ApiProperty({ description: 'Description in Arabic', required: false })
  @IsOptional()
  @IsString()
  description_ar?: string;

  @ApiProperty({ description: 'Description in English', required: false })
  @IsOptional()
  @IsString()
  description_en?: string;

  @ApiProperty({ description: 'Image URLs', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Price', type: MoneyValueDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyValueDto)
  price?: MoneyValueDto;

  @ApiProperty({ description: 'Deposit amount', type: MoneyValueDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyValueDto)
  deposit_amount?: MoneyValueDto;

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

  @ApiProperty({ description: 'Deposit policy', enum: DepositPolicy, required: false })
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

  @ApiProperty({ description: 'Status', enum: OfferStatus, required: false })
  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;
}
