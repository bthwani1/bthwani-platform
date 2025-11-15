import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum EarningsPeriod {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export enum EarningsService {
  DSH = 'DSH',
  AMN = 'AMN',
  ALL = 'ALL',
}

export class GetEarningsQueryDto {
  @ApiProperty({
    description: 'Time period',
    enum: EarningsPeriod,
    required: false,
    default: EarningsPeriod.WEEK,
  })
  @IsOptional()
  @IsEnum(EarningsPeriod)
  period?: EarningsPeriod;

  @ApiProperty({
    description: 'Service filter',
    enum: EarningsService,
    required: false,
    default: EarningsService.ALL,
  })
  @IsOptional()
  @IsEnum(EarningsService)
  service?: EarningsService;
}

export enum PayoutChannel {
  BANK = 'bank',
  CASH_OFFICE = 'cash_office',
}

export class CreatePayoutRequestDto {
  @ApiProperty({
    description: 'Payout amount in YER',
    minimum: 1000,
    example: 50000,
  })
  @IsNumber()
  @Min(1000)
  amount!: number;

  @ApiProperty({
    description: 'Payout channel',
    enum: PayoutChannel,
  })
  @IsEnum(PayoutChannel)
  channel!: PayoutChannel;
}

