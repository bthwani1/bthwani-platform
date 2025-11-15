import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsUUID,
  ValidateNested,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum EscrowChannel {
  WALLET = 'wallet',
  CARD = 'card',
  BANK = 'bank',
}

export class EscrowMetadataDto {
  @ApiProperty({ description: 'KNZ listing ID' })
  @IsUUID()
  knz_listing_id!: string;

  @ApiProperty({ description: 'Fulfilment mode', enum: ['pickup', 'delivery_through_dls'] })
  @IsString()
  fulfilment_mode!: string;
}

export class CreateEscrowHoldDto {
  @ApiProperty({ description: 'Order ID' })
  @IsUUID()
  order_id!: string;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  user_id!: string;

  @ApiProperty({ description: 'Amount in YER (minor units)' })
  @IsInt()
  @Min(1)
  amount_yer!: number;

  @ApiProperty({ description: 'Currency', default: 'YER' })
  @IsString()
  currency: string = 'YER';

  @ApiProperty({ enum: EscrowChannel })
  @IsEnum(EscrowChannel)
  channel!: EscrowChannel;

  @ApiProperty({ type: EscrowMetadataDto })
  @ValidateNested()
  @Type(() => EscrowMetadataDto)
  metadata!: EscrowMetadataDto;
}
