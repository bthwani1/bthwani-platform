import { IsString, IsOptional, IsBoolean, IsInt, Min, MaxLength, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Unique category code', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Category name in Arabic', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name_ar!: string;

  @ApiProperty({ description: 'Category name in English', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name_en!: string;

  @ApiProperty({ description: 'Category description in Arabic', required: false })
  @IsString()
  @IsOptional()
  description_ar?: string;

  @ApiProperty({ description: 'Category description in English', required: false })
  @IsString()
  @IsOptional()
  description_en?: string;

  @ApiProperty({ description: 'Parent category ID (for subcategories)', required: false })
  @IsString()
  @IsOptional()
  parent_id?: string;

  @ApiProperty({ description: 'Sort order', minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sort_order?: number;

  @ApiProperty({
    description: 'Whether category is sensitive (requires special handling)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  is_sensitive?: boolean;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
