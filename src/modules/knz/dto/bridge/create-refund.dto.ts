import { IsString, IsEnum, IsObject, IsUUID, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum RefundReason {
  ORDER_CANCELLED = 'order_cancelled',
  DISPUTE_RESOLVED = 'dispute_resolved',
  PRODUCT_DEFECTIVE = 'product_defective',
  WRONG_ITEM = 'wrong_item',
  OTHER = 'other',
}

export class RefundMetadataDto {
  @ApiProperty({ description: 'Escrow ID', required: false })
  @IsUUID()
  @IsObject()
  escrow_id?: string;
}

export class CreateRefundDto {
  @ApiProperty({ description: 'Order ID' })
  @IsUUID()
  order_id!: string;

  @ApiProperty({ description: 'User ID' })
  @IsString()
  user_id!: string;

  @ApiProperty({ description: 'Amount in YER (minor units)', minimum: 1 })
  @IsInt()
  @Min(1)
  amount_yer!: number;

  @ApiProperty({ enum: RefundReason })
  @IsEnum(RefundReason)
  reason_code!: RefundReason;

  @ApiProperty({ type: RefundMetadataDto, required: false })
  @IsObject()
  @IsObject()
  metadata?: RefundMetadataDto;
}
