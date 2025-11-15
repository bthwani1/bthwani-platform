import { IsEnum, IsString, IsOptional, IsObject, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ModerationAction {
  WARN = 'warn',
  HIDE = 'hide',
  SOFT_BLOCK = 'soft_block',
  HARD_BLOCK = 'hard_block',
  ESCALATE = 'escalate',
}

export class ModerateListingDto {
  @ApiProperty({ enum: ModerationAction })
  @IsEnum(ModerationAction)
  action!: ModerationAction;

  @ApiProperty({ description: 'Reason for moderation action' })
  @IsString()
  @MaxLength(500)
  reason!: string;

  @ApiProperty({ description: 'Effective until date (for temporary actions)', required: false })
  @IsString()
  @IsOptional()
  effective_until?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
