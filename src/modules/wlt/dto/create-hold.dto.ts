import { IsUUID, IsInt, Min, IsOptional, IsString, MaxLength, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateHoldDto {
  @ApiProperty({ description: 'Account ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  account_id!: string;

  @ApiProperty({ description: 'Hold amount (in smallest currency unit)', example: 5000 })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiProperty({ description: 'Currency code (ISO 4217)', required: false, default: 'YER' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({ description: 'External reference (order/booking/ride ID)', example: 'order_123' })
  @IsString()
  @MaxLength(255)
  external_ref!: string;

  @ApiProperty({ description: 'Service reference (DSH/ARB/AMN)', example: 'DSH' })
  @IsString()
  @MaxLength(64)
  service_ref!: string;

  @ApiProperty({ description: 'Release rules', required: false })
  @IsOptional()
  @IsObject()
  release_rules?: {
    release_days?: number;
    no_show_split?: number;
  };

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
