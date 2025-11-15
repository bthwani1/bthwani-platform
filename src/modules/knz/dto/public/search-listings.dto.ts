import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsArray,
  IsNumber,
  Min as MinVal,
  Max as MaxVal,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SearchListingsDto {
  @ApiProperty({ description: 'Search query', required: false })
  @IsString()
  @IsOptional()
  q?: string;

  @ApiProperty({ description: 'Category ID', required: false })
  @IsUUID()
  @IsOptional()
  category_id?: string;

  @ApiProperty({ description: 'City code', required: false })
  @IsString()
  @IsOptional()
  city_code?: string;

  @ApiProperty({ description: 'Minimum price (YER)', required: false })
  @IsNumber()
  @MinVal(0)
  @IsOptional()
  min_price?: number;

  @ApiProperty({ description: 'Maximum price (YER)', required: false })
  @IsNumber()
  @MinVal(0)
  @IsOptional()
  max_price?: number;

  @ApiProperty({
    description: 'Sort order',
    enum: ['relevance', 'price_asc', 'price_desc', 'newest', 'oldest'],
    required: false,
  })
  @IsEnum(['relevance', 'price_asc', 'price_desc', 'newest', 'oldest'])
  @IsOptional()
  sort?: string;

  @ApiProperty({ description: 'Number of items per page', minimum: 1, maximum: 50, default: 20 })
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number;

  @ApiProperty({ description: 'Cursor for pagination', required: false })
  @IsString()
  @IsOptional()
  cursor?: string;
}
