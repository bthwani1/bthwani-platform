import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from './list-tasks.dto';

export class UpdateTaskStatusDto {
  @ApiProperty({
    description: 'New task status',
    enum: TaskStatus,
  })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiPropertyOptional({
    description: 'Optional notes about the status change',
    example: 'Completed site survey, waiting for KYC docs',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

