import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../entities/booking.entity';

export class UpdateBookingStatusDto {
  @ApiProperty({ description: 'New booking status', enum: BookingStatus })
  @IsEnum(BookingStatus)
  status!: BookingStatus;

  @ApiProperty({ description: 'Notes or reason for status change', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
