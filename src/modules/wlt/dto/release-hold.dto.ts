import { IsOptional, IsUUID, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReleaseHoldDto {
  @ApiProperty({
    description: 'Release to balance (default: true)',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  release_to_balance?: boolean;

  @ApiProperty({ description: 'Target account ID (if not releasing to balance)', required: false })
  @IsOptional()
  @IsUUID()
  target_account_id?: string;

  @ApiProperty({ description: 'Release amount (default: full hold amount)', required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;
}
