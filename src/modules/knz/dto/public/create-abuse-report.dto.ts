import { IsEnum, IsString, IsUUID, MaxLength, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AbuseReportType } from '../../entities/abuse-report.entity';

export class CreateAbuseReportDto {
  @ApiProperty({ description: 'Listing ID' })
  @IsUUID()
  listing_id!: string;

  @ApiProperty({ enum: AbuseReportType })
  @IsEnum(AbuseReportType)
  report_type!: AbuseReportType;

  @ApiProperty({ description: 'Report description' })
  @IsString()
  @MaxLength(1000)
  description!: string;

  @ApiProperty({ description: 'Evidence (image URLs)', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  evidence?: string[];
}
