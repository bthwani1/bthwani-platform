import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CursorPaginationDto } from '../common/pagination.dto';
import { SndRequestStatus, SndRequestType } from '../../entities/request.entity';

export class ListRequestsDto extends CursorPaginationDto {
  @ApiProperty({ description: 'Request status', enum: SndRequestStatus, required: false })
  @IsOptional()
  @IsEnum(SndRequestStatus)
  status?: SndRequestStatus;

  @ApiProperty({ description: 'Request type', enum: SndRequestType, required: false })
  @IsOptional()
  @IsEnum(SndRequestType)
  type?: SndRequestType;
}
