import { IsOptional, IsEnum, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryStatus } from '../../entities/category.entity';

export class ListCategoriesDto {
  @ApiProperty({ enum: CategoryStatus, required: false })
  @IsEnum(CategoryStatus)
  @IsOptional()
  status?: CategoryStatus;

  @ApiProperty({ description: 'Filter by parent ID (null for root categories)', required: false })
  @IsOptional()
  parent_id?: string | null;

  @ApiProperty({ description: 'Filter by sensitive flag', required: false })
  @IsBoolean()
  @IsOptional()
  is_sensitive?: boolean;

  @ApiProperty({ description: 'Number of items per page', minimum: 1, maximum: 100, default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiProperty({ description: 'Offset for pagination', minimum: 0, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number;
}
