import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CloseRequestDto {
  @ApiProperty({ description: '6-digit close code', pattern: '^[0-9]{6}$' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{6}$/, { message: 'Close code must be exactly 6 digits' })
  close_code!: string;

  @ApiProperty({ description: 'Recipient name', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  recipient_name!: string;
}
