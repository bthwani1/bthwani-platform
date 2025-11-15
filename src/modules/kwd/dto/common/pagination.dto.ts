import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Cursor pagination query DTO
 */
export class CursorPaginationDto {
  @IsOptional()
  @IsString()
  @Type(() => String)
  cursor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;
}

/**
 * Cursor pagination response DTO
 */
export class CursorPaginationResponseDto {
  next_cursor?: string | null;
  prev_cursor?: string | null;
  has_next!: boolean;
  has_prev!: boolean;
}
