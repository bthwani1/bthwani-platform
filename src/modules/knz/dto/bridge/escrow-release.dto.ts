import { IsString, IsEnum, IsOptional, IsObject, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum EscrowReleaseReason {
  ORDER_COMPLETED = 'order_completed',
  ORDER_DELIVERED = 'order_delivered',
  DISPUTE_RESOLVED = 'dispute_resolved',
}

export class EscrowReleaseMetadataDto {
  @ApiProperty({ description: 'KNZ order ID' })
  @IsUUID()
  knz_order_id!: string;
}

export class ReleaseEscrowDto {
  @ApiProperty({ description: 'Escrow ID' })
  @IsUUID()
  escrow_id!: string;

  @ApiProperty({ enum: EscrowReleaseReason })
  @IsEnum(EscrowReleaseReason)
  reason_code!: EscrowReleaseReason;

  @ApiProperty({ type: EscrowReleaseMetadataDto })
  @IsObject()
  metadata!: EscrowReleaseMetadataDto;
}
