import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetTaskDto {
  @ApiProperty({
    description: 'Task ID',
    example: 'task_123456789',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^task_[a-zA-Z0-9_-]+$/, {
    message: 'Task ID must match pattern: task_*',
  })
  task_id: string;
}

