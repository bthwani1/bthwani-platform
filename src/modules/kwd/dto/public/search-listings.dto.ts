import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  IsNumber,
  IsArray,
  Min,
  Max,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CursorPaginationDto } from '../common/pagination.dto';

/**
 * Search listings query DTO
 */
export class SearchListingsDto extends CursorPaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  keyword?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @ArrayMaxSize(10)
  @Type(() => String)
  skills?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  experience_years_min?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  experience_years_max?: number;

  @IsOptional()
  @IsEnum(['individual', 'company'])
  entity_type?: 'individual' | 'company';

  @IsOptional()
  @IsEnum(['published', 'closed'])
  status?: 'published' | 'closed';

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  @Type(() => Number)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  @Type(() => Number)
  lon?: number;
}
