import { IsObject, IsUUID, ValidateNested, IsOptional, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ShippingAddressDto } from '../public/create-order.dto';

export class DispatchDlsDto {
  @ApiProperty({ description: 'KNZ order ID' })
  @IsUUID()
  knz_order_id!: string;

  @ApiProperty({ type: ShippingAddressDto, required: false })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  @IsOptional()
  shipping_address?: ShippingAddressDto;

  @ApiProperty({ description: 'Delivery notes', maxLength: 500, required: false })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  delivery_notes?: string;
}
