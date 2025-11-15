import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number or agent ID',
    example: '+967712345678',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 20)
  identifier: string;

  @ApiProperty({
    description: 'OTP code received via SMS',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 8)
  @Matches(/^\d+$/, { message: 'OTP must contain only digits' })
  otp: string;
}

