import { IsString, IsNotEmpty, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Phone number or agent ID',
    example: '+967712345678',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 20)
  identifier: string;
}

