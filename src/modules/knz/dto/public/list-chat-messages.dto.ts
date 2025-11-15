import { IsOptional, IsInt, Min, Max, IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ListChatMessagesDto {
  @ApiProperty({ description: 'Listing ID' })
  @IsUUID()
  listing_id!: string;

  @ApiProperty({ description: 'Number of items per page', minimum: 1, maximum: 100, default: 50 })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiProperty({ description: 'Cursor for pagination', required: false })
  @IsString()
  @IsOptional()
  cursor?: string;
}
