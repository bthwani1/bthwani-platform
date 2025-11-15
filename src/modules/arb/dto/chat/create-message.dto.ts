import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateChatMessageDto {
  @ApiProperty({ description: 'Message body' })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiProperty({ description: 'Is urgent message', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_urgent?: boolean;
}
