import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';

/**
 * Admin decision request DTO
 */
export class AdminDecisionDto {
  @IsEnum(['approve', 'reject'])
  decision!: 'approve' | 'reject';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
