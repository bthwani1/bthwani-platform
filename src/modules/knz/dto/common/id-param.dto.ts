import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IdParamDto {
  @ApiProperty({ description: 'Entity ID' })
  @IsUUID()
  id!: string;
}
