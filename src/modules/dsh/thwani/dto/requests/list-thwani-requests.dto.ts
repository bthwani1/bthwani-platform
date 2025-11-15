import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CursorPaginationDto } from '../common/pagination.dto';
import { ThwaniRequestStatus } from '../../entities/thwani-request.entity';

export class ListThwaniRequestsDto extends CursorPaginationDto {
  @ApiProperty({ description: 'Request status', enum: ThwaniRequestStatus, required: false })
  @IsOptional()
  @IsEnum(ThwaniRequestStatus)
  status?: ThwaniRequestStatus;
}

