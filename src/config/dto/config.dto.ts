import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export class CreateConfigDto {
  @ApiProperty({ description: 'Configuration key', example: 'JWT_ISSUER' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({
    description: 'Configuration value (string, number, boolean, or JSON object)',
    example: 'https://api.bthwani.com',
  })
  @IsNotEmpty()
  value!: string | number | boolean | object;

  @ApiPropertyOptional({ description: 'Configuration description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this is sensitive data (will be masked in logs)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isSensitive?: boolean;

  @ApiPropertyOptional({ description: 'User ID who updated this configuration' })
  @IsString()
  @IsOptional()
  updatedBy?: string;
}

export class UpdateConfigDto {
  @ApiProperty({
    description: 'Configuration value (string, number, boolean, or JSON object)',
    example: 'https://api.bthwani.com',
  })
  @IsNotEmpty()
  value!: string | number | boolean | object;

  @ApiPropertyOptional({ description: 'Configuration description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this is sensitive data (will be masked in logs)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isSensitive?: boolean;

  @ApiPropertyOptional({ description: 'User ID who updated this configuration' })
  @IsString()
  @IsOptional()
  updatedBy?: string;
}

