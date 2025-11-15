import { IsString, IsEnum, IsObject, IsUUID, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum EscrowForfeitReason {
  NO_SHOW = 'no_show',
  CANCELLATION_AFTER_WINDOW = 'cancellation_after_window',
  POLICY_VIOLATION = 'policy_violation',
}

export class EscrowForfeitMetadataDto {
  @ApiProperty({ description: 'KNZ order ID' })
  @IsUUID()
  knz_order_id!: string;
}

export class ForfeitEscrowDto {
  @ApiProperty({ description: 'Escrow ID' })
  @IsUUID()
  escrow_id!: string;

  @ApiProperty({ description: 'Forfeit percentage (0-100)', minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  forfeit_pct!: number;

  @ApiProperty({ description: 'Cap amount in YER', minimum: 0 })
  @IsInt()
  @Min(0)
  cap_yer!: number;

  @ApiProperty({ enum: EscrowForfeitReason })
  @IsEnum(EscrowForfeitReason)
  reason_code!: EscrowForfeitReason;

  @ApiProperty({ type: EscrowForfeitMetadataDto })
  @IsObject()
  metadata!: EscrowForfeitMetadataDto;
}
