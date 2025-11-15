import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitConsentDto {
  @ApiProperty({
    description: 'Consent given',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  consent_given: boolean;

  @ApiPropertyOptional({
    description: 'E-signature media ID (if enabled)',
    example: 'media_123456',
  })
  @IsOptional()
  @IsString()
  signature_media_id?: string;

  @ApiPropertyOptional({
    description: 'Consent version/terms ID',
    example: 'terms_v2.1',
  })
  @IsOptional()
  @IsString()
  terms_version?: string;
}

