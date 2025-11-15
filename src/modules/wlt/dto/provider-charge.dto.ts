import { IsUUID, IsInt, Min, IsOptional, IsString, MaxLength, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProviderChargeDto {
  @ApiProperty({ description: 'Account ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  account_id!: string;

  @ApiProperty({ description: 'Charge amount (in smallest currency unit)', example: 15000 })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiProperty({ description: 'Currency code (ISO 4217)', required: false, default: 'YER' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({ description: 'Provider-specific payload', required: false })
  @IsOptional()
  @IsObject()
  provider_payload?: Record<string, unknown>;

  @ApiProperty({ description: 'Service reference', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  service_ref?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
