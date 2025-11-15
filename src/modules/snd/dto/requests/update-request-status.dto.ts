import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SndRequestStatus } from '../../entities/request.entity';

export class UpdateRequestStatusDto {
  @ApiProperty({ description: 'New status', enum: SndRequestStatus })
  @IsEnum(SndRequestStatus)
  @IsNotEmpty()
  status!: SndRequestStatus;

  @ApiProperty({ description: 'Reason for status change', required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
