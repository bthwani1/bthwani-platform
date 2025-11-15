import { IsString, IsPhoneNumber, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'Phone number',
    example: '+967712345678',
  })
  @IsString()
  @IsPhoneNumber('YE')
  phone!: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number',
    example: '+967712345678',
  })
  @IsString()
  @IsPhoneNumber('YE')
  phone!: string;

  @ApiProperty({
    description: 'OTP code (6 digits)',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  code!: string;
}

