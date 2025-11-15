import { IsString, IsEnum, IsOptional, MaxLength, IsUrl } from 'class-validator';

/**
 * Attachment DTO
 */
export class AttachmentDto {
  @IsUrl()
  @MaxLength(2000)
  url!: string;

  @IsEnum(['image', 'document'])
  type!: 'image' | 'document';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  filename?: string;
}
