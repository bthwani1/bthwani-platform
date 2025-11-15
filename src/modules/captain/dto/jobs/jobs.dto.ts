import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum JobServiceType {
  DSH = 'DSH',
  AMN = 'AMN',
  ALL = 'ALL',
}

export class ListOffersQueryDto {
  @ApiProperty({
    description: 'Service filter',
    enum: JobServiceType,
    required: false,
    default: JobServiceType.ALL,
  })
  @IsOptional()
  @IsEnum(JobServiceType)
  service?: JobServiceType;

  @ApiProperty({
    description: 'Cursor for pagination',
    required: false,
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({
    description: 'Limit per page',
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class UpdateJobStatusDto {
  @ApiProperty({
    description: 'Job status',
    example: 'arrived_store',
  })
  @IsString()
  status!: string;
}

export class NegotiateFareDto {
  @ApiProperty({
    description: 'Negotiated fare percentage (80-120%)',
    minimum: 80,
    maximum: 120,
    example: 110,
  })
  @IsNumber()
  @Min(80)
  @Max(120)
  percentage!: number;
}

