import {
  IsEnum,
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  MinLength,
  MaxLength,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocationDto } from '../common/location.dto';
import { AttachmentDto } from '../common/attachment.dto';

/**
 * Update listing request DTO
 */
export class UpdateListingDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  skills?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  experience_years?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  @ArrayMaxSize(5)
  attachments?: AttachmentDto[];

  @IsOptional()
  @IsEnum(['published', 'closed'])
  status?: 'published' | 'closed';
}
