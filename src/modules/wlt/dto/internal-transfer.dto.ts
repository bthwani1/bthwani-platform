import { IsUUID, IsInt, Min, IsOptional, IsString, MaxLength, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InternalTransferDto {
  @ApiProperty({
    description: 'Source account ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  from_account_id!: string;

  @ApiProperty({
    description: 'Target account ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  to_account_id!: string;

  @ApiProperty({ description: 'Transfer amount (in smallest currency unit)', example: 10000 })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiProperty({ description: 'Currency code (ISO 4217)', required: false, default: 'YER' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({ description: 'Service reference', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  service_ref?: string;

  @ApiProperty({ description: 'Transaction description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
