import { IsEnum, IsString, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../../entities/booking.entity';
import { MoneyValueDto } from '../common/money-value.dto';

export enum ResolutionType {
  FULL_REFUND = 'full_refund',
  PARTIAL_REFUND = 'partial_refund',
  RELEASE_TO_PARTNER = 'release_to_partner',
  PARTIAL_RELEASE = 'partial_release',
}

export class ApplyResolutionDto {
  @ApiProperty({ description: 'Booking ID' })
  @IsString()
  @IsNotEmpty()
  booking_id!: string;

  @ApiProperty({ description: 'Resolution type', enum: ResolutionType })
  @IsEnum(ResolutionType)
  resolution_type!: ResolutionType;

  @ApiProperty({
    description: 'Refund amount (for partial refund)',
    type: MoneyValueDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyValueDto)
  refund_amount?: MoneyValueDto;

  @ApiProperty({
    description: 'Release amount (for partial release)',
    type: MoneyValueDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyValueDto)
  release_amount?: MoneyValueDto;

  @ApiProperty({ description: 'New booking status', enum: BookingStatus, required: false })
  @IsOptional()
  @IsEnum(BookingStatus)
  new_status?: BookingStatus;

  @ApiProperty({ description: 'Resolution reason/notes' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
