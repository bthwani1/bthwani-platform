import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MoneyValueDto {
  @ApiProperty({ description: 'Amount in minor units (e.g. fils)', example: '50000' })
  @IsString()
  amount!: string;

  @ApiProperty({
    description: 'ISO-4217 currency code (YER by default)',
    default: 'YER',
    example: 'YER',
  })
  @IsString()
  @IsOptional()
  currency?: string;
}
