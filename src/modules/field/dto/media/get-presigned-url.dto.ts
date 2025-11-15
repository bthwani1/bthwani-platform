import {
  IsString,
  IsNotEmpty,
  IsEnum,
  Matches,
  IsOptional,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FileType {
  PHOTO = 'photo',
  DOCUMENT = 'document',
  SIGNATURE = 'signature',
}

export class GetPresignedUrlDto {
  @ApiProperty({
    description: 'Partner ID',
    example: 'partner_123456789',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^partner_[a-zA-Z0-9_-]+$/, {
    message: 'Partner ID must match pattern: partner_*',
  })
  partner_id: string;

  @ApiProperty({
    description: 'File type',
    enum: FileType,
  })
  @IsEnum(FileType)
  file_type: FileType;

  @ApiProperty({
    description: 'File name',
    example: 'store_exterior.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  file_name: string;

  @ApiProperty({
    description: 'Content type (MIME)',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  content_type: string;
}

