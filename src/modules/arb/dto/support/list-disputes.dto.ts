import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CursorPaginationDto } from '../common/pagination.dto';
import { BookingStatus } from '../../entities/booking.entity';

export class ListDisputesDto extends CursorPaginationDto {
  @ApiProperty({ description: 'Booking status filter', enum: BookingStatus, required: false })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
