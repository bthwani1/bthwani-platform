import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsObject,
  ValidateNested,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LocationDto {
  @ApiProperty({ description: 'Latitude' })
  @IsNotEmpty()
  lat!: number;

  @ApiProperty({ description: 'Longitude' })
  @IsNotEmpty()
  lon!: number;
}

export class CreateThwaniRequestDto {
  @ApiProperty({ description: 'Category ID', required: false })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiProperty({ description: 'Request title', maxLength: 500 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  title!: string;

  @ApiProperty({ description: 'Request description' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Image URLs', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({ description: 'Location coordinates', required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @ApiProperty({ description: 'Address', required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiProperty({ description: 'Region', required: false, maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  region?: string;
}

