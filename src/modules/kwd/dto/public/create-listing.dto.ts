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
 * Create listing request DTO
 */
export class CreateListingDto {
  @IsEnum(['individual', 'company'])
  entity_type!: 'individual' | 'company';

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description!: string;

  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  skills!: string[];

  @IsInt()
  @Min(0)
  @Max(50)
  experience_years!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  @ArrayMaxSize(5)
  attachments?: AttachmentDto[];
}
