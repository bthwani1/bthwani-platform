import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CursorPaginationDto {
  @ApiProperty({ description: 'Cursor for pagination', required: false })
  @IsOptional()
  @IsString()
  @Type(() => String)
  cursor?: string;

  @ApiProperty({ description: 'Number of items per page', minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

export class CursorPaginationResponseDto {
  @ApiProperty({ description: 'Next cursor for pagination', required: false })
  next_cursor?: string | null;

  @ApiProperty({ description: 'Previous cursor for pagination', required: false })
  prev_cursor?: string | null;
}
