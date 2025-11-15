import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsString,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SndConfigScope } from '../../entities/snd-config.entity';

export class UpdateConfigDto {
  @ApiProperty({ description: 'Configuration scope', enum: SndConfigScope })
  @IsEnum(SndConfigScope)
  @IsNotEmpty()
  scope!: SndConfigScope;

  @ApiProperty({ description: 'Scope value (region, etc.)', required: false })
  @IsOptional()
  @IsString()
  scope_value?: string;

  @ApiProperty({ description: 'Category ID', required: false })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiProperty({ description: 'Configuration key' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ description: 'Configuration value' })
  @IsObject()
  @IsNotEmpty()
  value!: Record<string, unknown>;

  @ApiProperty({ description: 'Description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Is active', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}
