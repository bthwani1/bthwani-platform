import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DocumentType {
  LICENSE = 'license',
  ID = 'id',
  TAX = 'tax',
  COMMERCIAL_REGISTRY = 'commercial_registry',
  OTHER = 'other',
}

export class DocumentUploadDto {
  @ApiProperty({
    description: 'Document type',
    enum: DocumentType,
  })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiProperty({
    description: 'Media ID of uploaded document',
    example: 'media_123456',
  })
  @IsString()
  @IsNotEmpty()
  media_id: string;

  @ApiPropertyOptional({
    description: 'Document number/identifier',
    example: '12345/2024',
  })
  @IsOptional()
  @IsString()
  document_number?: string;

  @ApiPropertyOptional({
    description: 'Expiry date (ISO 8601)',
    example: '2025-12-31',
  })
  @IsOptional()
  @IsString()
  expiry_date?: string;
}

export class SubmitKycDocsDto {
  @ApiProperty({
    description: 'Array of uploaded documents',
    type: [DocumentUploadDto],
  })
  @IsArray()
  documents: DocumentUploadDto[];

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'All required documents uploaded',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

