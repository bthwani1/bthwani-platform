import { IsOptional, IsEnum, IsInt, Min, Max, IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AbuseReportStatus, AbuseReportType } from '../../entities/abuse-report.entity';

export class ListAbuseReportsDto {
  @ApiProperty({ enum: AbuseReportStatus, required: false })
  @IsEnum(AbuseReportStatus)
  @IsOptional()
  status?: AbuseReportStatus;

  @ApiProperty({ enum: AbuseReportType, required: false })
  @IsEnum(AbuseReportType)
  @IsOptional()
  report_type?: AbuseReportType;

  @ApiProperty({ description: 'Filter by listing ID', required: false })
  @IsUUID()
  @IsOptional()
  listing_id?: string;

  @ApiProperty({ description: 'Cursor for pagination', required: false })
  @IsString()
  @IsOptional()
  cursor?: string;

  @ApiProperty({ description: 'Number of items per page', minimum: 1, maximum: 100, default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}
