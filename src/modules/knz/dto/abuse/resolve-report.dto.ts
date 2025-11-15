import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ResolutionAction {
  DISMISS = 'dismiss',
  RESOLVE = 'resolve',
  ESCALATE = 'escalate',
}

export class ResolveReportDto {
  @ApiProperty({ enum: ResolutionAction })
  @IsEnum(ResolutionAction)
  action!: ResolutionAction;

  @ApiProperty({ description: 'Review notes', required: false })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  review_notes?: string;
}
