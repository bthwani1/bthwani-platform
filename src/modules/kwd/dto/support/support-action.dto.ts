import {
  IsUUID,
  IsEnum,
  IsString,
  IsInt,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

/**
 * Support action request DTO
 */
export class SupportActionDto {
  @IsUUID()
  listing_id!: string;

  @IsEnum(['hide', 'soft_delete', 'warn', 'temp_block'])
  action!: 'hide' | 'soft_delete' | 'warn' | 'temp_block';

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  duration_days?: number;
}
