import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetListingDto {
  @ApiProperty({ description: 'Listing ID' })
  @IsUUID()
  listing_id!: string;
}
