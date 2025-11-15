import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetCategoryDto {
  @ApiProperty({ description: 'Category ID' })
  @IsUUID()
  category_id!: string;
}
