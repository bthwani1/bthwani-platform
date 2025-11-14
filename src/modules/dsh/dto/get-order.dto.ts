import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetOrderDto {
  @ApiProperty({ description: 'Order identifier' })
  @IsString()
  order_id!: string;
}
