import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  Matches,
  Length,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PartnerContactDto {
  @ApiProperty({
    description: 'Contact name',
    example: 'Ahmed Ali',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    description: 'Contact phone number',
    example: '+967712345678',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+967\d{9}$/, {
    message: 'Phone must be Yemeni format: +967XXXXXXXXX',
  })
  phone: string;

  @ApiPropertyOptional({
    description: 'Contact email',
    example: 'ahmed@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Contact role',
    example: 'Manager',
  })
  @IsOptional()
  @IsString()
  role?: string;
}

export class CreatePartnerLeadDto {
  @ApiProperty({
    description: 'Legal business name',
    example: 'شركة التجارة العامة المحدودة',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  legal_name: string;

  @ApiProperty({
    description: 'Trade name (display name)',
    example: 'متجر الأمل',
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  trade_name: string;

  @ApiProperty({
    description: 'Business category',
    example: 'retail',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Full address',
    example: 'شارع الزبيري، صنعاء',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  address: string;

  @ApiProperty({
    description: 'Latitude',
    example: 15.3694,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude',
    example: 44.1910,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Primary contacts',
    type: [PartnerContactDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartnerContactDto)
  contacts: PartnerContactDto[];

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Large store with good location',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

