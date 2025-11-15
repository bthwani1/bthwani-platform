import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  MaxLength,
  IsObject,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryStatus } from '../../entities/category.entity';

export class UpdateCategoryDto {
  @ApiProperty({ description: 'Category name in Arabic', required: false, maxLength: 255 })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name_ar?: string;

  @ApiProperty({ description: 'Category name in English', required: false, maxLength: 255 })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name_en?: string;

  @ApiProperty({ description: 'Category description in Arabic', required: false })
  @IsString()
  @IsOptional()
  description_ar?: string;

  @ApiProperty({ description: 'Category description in English', required: false })
  @IsString()
  @IsOptional()
  description_en?: string;

  @ApiProperty({ description: 'Parent category ID', required: false })
  @IsString()
  @IsOptional()
  parent_id?: string;

  @ApiProperty({ description: 'Sort order', minimum: 0, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  sort_order?: number;

  @ApiProperty({ enum: CategoryStatus, required: false })
  @IsEnum(CategoryStatus)
  @IsOptional()
  status?: CategoryStatus;

  @ApiProperty({ description: 'Whether category is sensitive', required: false })
  @IsBoolean()
  @IsOptional()
  is_sensitive?: boolean;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
