import { IsOptional, IsUUID, IsEnum, IsString, IsDateString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EntryCategory } from '../entities/journal-entry.entity';

export class ListTransactionsDto {
  @ApiProperty({ description: 'Account ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  account_id!: string;

  @ApiProperty({ description: 'Cursor for pagination', required: false })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({ description: 'Limit per page', required: false, default: 50 })
  @IsOptional()
  limit?: number;

  @ApiProperty({ description: 'Transaction category filter', enum: EntryCategory, required: false })
  @IsOptional()
  @IsEnum(EntryCategory)
  category?: EntryCategory;

  @ApiProperty({ description: 'Service reference filter', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  service_ref?: string;

  @ApiProperty({ description: 'Date from filter (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiProperty({ description: 'Date to filter (ISO 8601)', required: false })
  @IsOptional()
  @IsDateString()
  date_to?: string;
}
