import { IsEnum, IsOptional, IsObject, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AmendmentType } from '../../entities/booking-amendment.entity';
import { MoneyValueDto } from '../common/money-value.dto';

export class PriceChangeDto {
  @ApiProperty({ description: 'New price', type: MoneyValueDto })
  @ValidateNested()
  @Type(() => MoneyValueDto)
  new_amount!: MoneyValueDto;

  @ApiProperty({ description: 'Reason for price change', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ScheduleChangeDto {
  @ApiProperty({ description: 'New slot' })
  @IsObject()
  new_slot!: {
    id: string;
    start_time: string;
    end_time: string;
    date: string;
  };

  @ApiProperty({ description: 'Reason for schedule change', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateAmendmentDto {
  @ApiProperty({ description: 'Amendment type', enum: AmendmentType })
  @IsEnum(AmendmentType)
  type!: AmendmentType;

  @ApiProperty({ description: 'Price change details', type: PriceChangeDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => PriceChangeDto)
  price_change?: PriceChangeDto;

  @ApiProperty({ description: 'Schedule change details', type: ScheduleChangeDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => ScheduleChangeDto)
  schedule_change?: ScheduleChangeDto;

  @ApiProperty({ description: 'Notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
