import {
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEnum,
  IsObject,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class MoneyValueDto {
  @ApiProperty({ description: 'Amount in minor units (e.g. fils)' })
  @IsString()
  amount!: string;

  @ApiProperty({ description: 'ISO-4217 currency code (YER by default)', default: 'YER' })
  @IsString()
  @IsOptional()
  currency?: string;
}

export class GeoPointDto {
  @ApiProperty({ minimum: -90, maximum: 90 })
  lat!: number;

  @ApiProperty({ minimum: -180, maximum: 180 })
  lon!: number;
}

export class AddressDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  street?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  building?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => GeoPointDto)
  @IsOptional()
  location?: GeoPointDto;
}

export class OrderItemRequestDto {
  @ApiProperty({ description: 'Stock keeping unit / catalog identifier' })
  @IsString()
  sku!: string;

  @ApiProperty({ description: 'Display name presented to the customer' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ minimum: 1 })
  quantity!: number;

  @ApiProperty()
  @ValidateNested()
  @Type(() => MoneyValueDto)
  @IsOptional()
  unit_price?: MoneyValueDto;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  addons?: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemRequestDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemRequestDto)
  items!: OrderItemRequestDto[];

  @ApiProperty()
  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  delivery_address?: AddressDto;

  @ApiProperty()
  @IsString()
  @IsOptional()
  slot_id?: string;

  @ApiProperty({ enum: ['wallet', 'cash', 'card'] })
  @IsEnum(['wallet', 'cash', 'card'])
  @IsOptional()
  payment_method?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Primary catalog category used for automatic discounts/coupons',
    required: false,
  })
  @IsString()
  @IsOptional()
  primary_category?: string;

  @ApiProperty({
    description: 'Active subscription plan identifier (e.g., sub_user_pro_monthly)',
    required: false,
  })
  @IsString()
  @IsOptional()
  subscription_plan_id?: string;

  @ApiProperty({
    description: 'Coupon or promo code applied at checkout',
    required: false,
  })
  @IsString()
  @IsOptional()
  coupon_code?: string;

  @ApiProperty({
    description: 'Rewards points requested for redemption',
    required: false,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  redeem_points?: number;

  @ApiProperty({
    enum: ['new', 'existing', 'subscriber'],
    required: false,
    description: 'User classification for eligibility checks',
  })
  @IsEnum(['new', 'existing', 'subscriber'])
  @IsOptional()
  user_type?: 'new' | 'existing' | 'subscriber';
}
