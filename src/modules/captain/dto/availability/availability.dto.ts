import { IsBoolean, IsOptional, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ServiceType {
  DSH = 'DSH',
  AMN = 'AMN',
}

export class UpdateAvailabilityDto {
  @ApiProperty({
    description: 'Online/Offline status',
    example: true,
  })
  @IsBoolean()
  online!: boolean;

  @ApiProperty({
    description: 'Active services',
    example: ['DSH', 'AMN'],
    enum: ServiceType,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ServiceType, { each: true })
  activeServices?: ServiceType[];
}

