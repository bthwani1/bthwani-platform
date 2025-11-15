import { IsOptional, IsEnum, IsInt, Min, Max, IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { KnzOrderStatus } from '../../entities/knz-order.entity';

export class ListOrdersDto {
  @ApiProperty({ enum: KnzOrderStatus, required: false })
  @IsEnum(KnzOrderStatus)
  @IsOptional()
  status?: KnzOrderStatus;

  @ApiProperty({ description: 'Filter by buyer ID', required: false })
  @IsUUID()
  @IsOptional()
  buyer_id?: string;

  @ApiProperty({ description: 'Filter by seller ID', required: false })
  @IsUUID()
  @IsOptional()
  seller_id?: string;

  @ApiProperty({ description: 'Filter by listing ID', required: false })
  @IsUUID()
  @IsOptional()
  listing_id?: string;

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
