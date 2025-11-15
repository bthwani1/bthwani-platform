import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsUUID,
  IsObject,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum FulfilmentMode {
  PICKUP = 'pickup',
  DELIVERY_THROUGH_DLS = 'delivery_through_dls',
}

export class ShippingAddressDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  building?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  location?: { lat: number; lon: number };
}

export class CreateKnzOrderDto {
  @ApiProperty({ description: 'Listing ID' })
  @IsUUID()
  listing_id!: string;

  @ApiProperty({ description: 'Quantity', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ enum: FulfilmentMode, default: FulfilmentMode.PICKUP })
  @IsEnum(FulfilmentMode)
  @IsOptional()
  fulfilment_mode?: FulfilmentMode;

  @ApiProperty({ type: ShippingAddressDto, required: false })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @IsOptional()
  shipping_address?: ShippingAddressDto;

  @ApiProperty({ description: 'Order notes', maxLength: 500, required: false })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;
}
