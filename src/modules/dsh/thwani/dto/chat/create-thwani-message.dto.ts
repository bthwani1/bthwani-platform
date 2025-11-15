import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateThwaniMessageDto {
  @ApiProperty({ description: 'Message body', maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body!: string;

  @ApiProperty({ description: 'Urgent flag', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_urgent?: boolean = false;
}

