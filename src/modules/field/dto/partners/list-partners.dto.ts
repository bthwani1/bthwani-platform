import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum PartnerStatus {
  LEAD = 'lead',
  UNDER_REVIEW = 'under_review',
  READY = 'ready',
  REJECTED = 'rejected',
}

export class ListPartnersDto {
  @ApiPropertyOptional({
    description: 'Cursor for pagination',
    example: 'eyJwYXJ0bmVyX2lkIjoiMTIzIn0=',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter by partner status',
    enum: PartnerStatus,
  })
  @IsOptional()
  @IsEnum(PartnerStatus)
  status?: PartnerStatus;

  @ApiPropertyOptional({
    description: 'Search by name or ID',
    example: 'متجر',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

