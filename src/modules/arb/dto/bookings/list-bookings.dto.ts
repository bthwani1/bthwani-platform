import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CursorPaginationDto } from '../common/pagination.dto';
import { BookingStatus } from '../../entities/booking.entity';

export class ListBookingsDto extends CursorPaginationDto {
  @ApiProperty({ description: 'Booking status', enum: BookingStatus, required: false })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
