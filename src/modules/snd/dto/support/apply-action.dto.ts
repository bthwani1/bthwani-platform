import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum SndSupportAction {
  DISCOUNT = 'discount',
  CANCEL = 'cancel',
  REROUTE = 'reroute',
  MANUAL_CLOSE = 'manual_close',
  ESCALATE = 'escalate',
}

export class ApplySupportActionDto {
  @ApiProperty({ description: 'Request ID' })
  @IsUUID()
  @IsNotEmpty()
  request_id!: string;

  @ApiProperty({ description: 'Action to apply', enum: SndSupportAction })
  @IsEnum(SndSupportAction)
  @IsNotEmpty()
  action!: SndSupportAction;

  @ApiProperty({ description: 'Reason for action', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;

  @ApiProperty({ description: 'Discount amount in YER (for discount action)', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  discount_amount_yer?: number;

  @ApiProperty({ description: 'New captain/provider ID (for reroute action)', required: false })
  @IsOptional()
  @IsString()
  new_assigned_id?: string;

  @ApiProperty({ description: 'Close code (for manual close)', required: false })
  @IsOptional()
  @IsString()
  close_code?: string;

  @ApiProperty({ description: 'Recipient name (for manual close)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  recipient_name?: string;
}
