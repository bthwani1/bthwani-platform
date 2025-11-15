import { IsString, Length, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitPodCodeDto {
  @ApiProperty({
    description: '6-digit delivery code',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  code!: string;
}

export class SubmitPodPhotoDto {
  @ApiProperty({
    description: 'Base64 encoded photo (with masking applied)',
    example: 'data:image/jpeg;base64,...',
  })
  @IsString()
  photo!: string;

  @ApiProperty({
    description: 'Optional notes',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

