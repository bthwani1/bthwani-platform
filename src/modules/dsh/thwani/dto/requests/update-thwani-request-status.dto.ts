import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ThwaniRequestStatus } from '../../entities/thwani-request.entity';

export class UpdateThwaniRequestStatusDto {
  @ApiProperty({ description: 'Request status', enum: ThwaniRequestStatus })
  @IsEnum(ThwaniRequestStatus)
  status!: ThwaniRequestStatus;

  @ApiProperty({ description: 'Reason for status change', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Final price in YER', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  price_final_yer?: number;
}

