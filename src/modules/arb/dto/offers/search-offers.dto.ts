import { IsOptional, IsString, IsUUID, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CursorPaginationDto } from '../common/pagination.dto';
import { OfferStatus } from '../../entities/offer.entity';

export class SearchOffersDto extends CursorPaginationDto {
  @ApiProperty({ description: 'Search query', required: false })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({ description: 'Category ID', required: false })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiProperty({ description: 'Subcategory ID', required: false })
  @IsOptional()
  @IsUUID()
  subcategory_id?: string;

  @ApiProperty({ description: 'Region code', required: false })
  @IsOptional()
  @IsString()
  region_code?: string;

  @ApiProperty({ description: 'Offer status', enum: OfferStatus, required: false })
  @IsOptional()
  @IsEnum(OfferStatus)
  status?: OfferStatus;
}
