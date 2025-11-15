import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { EsfRequestStatus } from '../entities/esf-request.entity';

export class ListRequestsDto {
  @IsString()
  @IsOptional()
  cursor?: string;

  @IsInt()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 20;

  @IsEnum(EsfRequestStatus)
  @IsOptional()
  status?: EsfRequestStatus;
}
