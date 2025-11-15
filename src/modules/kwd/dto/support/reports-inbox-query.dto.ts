import { IsOptional, IsString, IsEnum, MaxLength } from 'class-validator';
import { CursorPaginationDto } from '../common/pagination.dto';

/**
 * Support reports inbox query DTO
 */
export class ReportsInboxQueryDto extends CursorPaginationDto {
  @IsOptional()
  @IsEnum(['fraud', 'spam', 'offensive', 'misleading', 'duplicate', 'other'])
  reason?: 'fraud' | 'spam' | 'offensive' | 'misleading' | 'duplicate' | 'other';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsEnum(['pending', 'under_review', 'resolved', 'dismissed'])
  status?: 'pending' | 'under_review' | 'resolved' | 'dismissed';
}
