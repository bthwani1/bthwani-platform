import { IsOptional, IsString, IsEnum, MaxLength } from 'class-validator';
import { CursorPaginationDto } from '../common/pagination.dto';

/**
 * Admin listings query DTO
 */
export class AdminListingsQueryDto extends CursorPaginationDto {
  @IsOptional()
  @IsEnum(['pending_review', 'published', 'rejected', 'closed', 'hidden'])
  status?: 'pending_review' | 'published' | 'rejected' | 'closed' | 'hidden';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}
