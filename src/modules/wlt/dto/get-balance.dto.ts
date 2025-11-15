import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetBalanceDto {
  @ApiProperty({ description: 'Account ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  account_id!: string;
}
