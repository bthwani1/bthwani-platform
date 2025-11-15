import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  Length,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitSiteSurveyDto {
  @ApiProperty({
    description: 'Verified address',
    example: 'شارع الزبيري، صنعاء',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 500)
  verified_address: string;

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

  @ApiPropertyOptional({
    description: 'Geo accuracy in meters',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy_meters?: number;

  @ApiPropertyOptional({
    description: 'Facility basics (size, capacity, etc.)',
    example: 'Large store, 200 sqm, good parking',
  })
  @IsOptional()
  @IsString()
  facility_basics?: string;

  @ApiPropertyOptional({
    description: 'Array of photo media IDs',
    example: ['media_123', 'media_456'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photo_media_ids?: string[];

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Store is ready for operations',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

