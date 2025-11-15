import { IsString, IsNotEmpty, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'Offer ID' })
  @IsString()
  @IsNotEmpty()
  offer_id!: string;

  @ApiProperty({ description: 'Selected slot', required: false })
  @IsOptional()
  @IsObject()
  slot?: {
    id: string;
    start_time: string;
    end_time: string;
    date: string;
  };

  @ApiProperty({ description: 'Customer notes', required: false })
  @IsOptional()
  @IsString()
  customer_notes?: string;
}
