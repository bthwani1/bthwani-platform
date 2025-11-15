import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HomeFeedDto {
  @ApiProperty({ description: 'City code', required: false })
  @IsString()
  @IsOptional()
  city_code?: string;

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
