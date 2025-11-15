import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReadinessCheckItemDto {
  @ApiProperty({
    description: 'Check item identifier',
    example: 'operating_hours',
  })
  @IsString()
  @IsNotEmpty()
  item_id: string;

  @ApiProperty({
    description: 'Check passed',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  passed: boolean;

  @ApiPropertyOptional({
    description: 'Notes for this check',
    example: 'Operating hours confirmed: 8 AM - 10 PM',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class SubmitReadinessDto {
  @ApiProperty({
    description: 'Array of readiness check items',
    type: [ReadinessCheckItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReadinessCheckItemDto)
  checks: ReadinessCheckItemDto[];

  @ApiProperty({
    description: 'Overall readiness status',
    example: 'ready',
  })
  @IsString()
  @IsNotEmpty()
  status: 'ready' | 'needs_followup';

  @ApiPropertyOptional({
    description: 'Follow-up task description (if needed)',
    example: 'Need to install signage',
  })
  @IsOptional()
  @IsString()
  followup_notes?: string;
}

