import { IsOptional, IsEnum, IsInt, Min, Max, IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ListingStatus } from '../../entities/listing.entity';

export class ListListingsDto {
  @ApiProperty({ enum: ListingStatus, required: false })
  @IsEnum(ListingStatus)
  @IsOptional()
  status?: ListingStatus;

  @ApiProperty({ description: 'Filter by seller ID', required: false })
  @IsUUID()
  @IsOptional()
  seller_id?: string;

  @ApiProperty({ description: 'Filter by category ID', required: false })
  @IsUUID()
  @IsOptional()
  category_id?: string;

  @ApiProperty({ description: 'Cursor for pagination', required: false })
  @IsString()
  @IsOptional()
  cursor?: string;

  @ApiProperty({ description: 'Number of items per page', minimum: 1, maximum: 100, default: 20 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;
}
