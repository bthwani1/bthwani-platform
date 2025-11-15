import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartVisitDto {
  @ApiPropertyOptional({
    description: 'Latitude of visit location',
    example: 15.3694,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude of visit location',
    example: 44.1910,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'Optional notes at visit start',
    example: 'Arrived at partner location',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

