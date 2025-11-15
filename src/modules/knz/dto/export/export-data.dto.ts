import { IsEnum, IsOptional, IsString, IsDateString, IsArray, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  JSON = 'json',
}

export enum ExportEntityType {
  LISTINGS = 'listings',
  ORDERS = 'orders',
  ABUSE_REPORTS = 'abuse_reports',
  METRICS = 'metrics',
}

export class ExportDataDto {
  @ApiProperty({ enum: ExportEntityType })
  @IsEnum(ExportEntityType)
  entity_type!: ExportEntityType;

  @ApiProperty({ enum: ExportFormat, default: ExportFormat.CSV })
  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat;

  @ApiProperty({ description: 'Start date filter (ISO 8601)', required: false })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiProperty({ description: 'End date filter (ISO 8601)', required: false })
  @IsDateString()
  @IsOptional()
  end_date?: string;

  @ApiProperty({ description: 'Additional filters', required: false })
  @IsObject()
  @IsOptional()
  filters?: Record<string, unknown>;

  @ApiProperty({ description: 'Fields to include in export', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fields?: string[];

  @ApiProperty({ description: 'Whether to mask sensitive data (enforced for PII)', default: true })
  @IsOptional()
  mask_sensitive?: boolean;
}
