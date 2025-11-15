import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength } from 'class-validator';

export enum SupportActionType {
  WARN = 'warn',
  MUTE = 'mute',
  TEMP_BAN = 'temp_ban',
  MARK_ABUSE = 'mark_abuse',
  CLOSE_REQUEST = 'close_request',
  ESCALATE = 'escalate',
}

export class ApplyActionDto {
  @IsEnum(SupportActionType)
  action_type!: SupportActionType;

  @IsString()
  @IsNotEmpty()
  entity_type!: string;

  @IsString()
  @IsNotEmpty()
  entity_id!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
