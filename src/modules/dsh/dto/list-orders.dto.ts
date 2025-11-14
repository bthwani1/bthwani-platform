import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ListOrdersDto {
  @ApiProperty({ required: false, description: 'Cursor for pagination' })
  @IsString()
  @IsOptional()
  cursor?: string;

  @ApiProperty({ required: false, minimum: 1, maximum: 200, default: 20 })
  @IsInt()
  @Min(1)
  @Max(200)
  @Type(() => Number)
  @IsOptional()
  limit?: number;
}
