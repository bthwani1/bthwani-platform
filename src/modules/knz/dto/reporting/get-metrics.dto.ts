import { IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetMetricsDto {
  @ApiProperty({ description: 'Start date for metrics (ISO 8601)', required: false })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiProperty({ description: 'End date for metrics (ISO 8601)', required: false })
  @IsDateString()
  @IsOptional()
  end_date?: string;
}
