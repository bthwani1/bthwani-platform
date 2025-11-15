import { IsEnum, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

/**
 * Report listing request DTO
 */
export class ReportListingDto {
  @IsEnum(['fraud', 'spam', 'offensive', 'misleading', 'duplicate', 'other'])
  reason!: 'fraud' | 'spam' | 'offensive' | 'misleading' | 'duplicate' | 'other';

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description?: string;
}
