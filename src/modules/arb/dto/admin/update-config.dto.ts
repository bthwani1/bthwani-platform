import {
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsString,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ConfigScope } from '../../entities/arb-config.entity';
import { MoneyValueDto } from '../common/money-value.dto';

export class UpdateConfigDto {
  @ApiProperty({ description: 'Config scope', enum: ConfigScope })
  @IsEnum(ConfigScope)
  scope!: ConfigScope;

  @ApiProperty({ description: 'Scope value (e.g., region code, category ID)', required: false })
  @IsOptional()
  @IsString()
  scope_value?: string;

  @ApiProperty({ description: 'Release days', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  release_days?: number;

  @ApiProperty({ description: 'No-show keep percentage (0-100)', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  no_show_keep_pct?: number;

  @ApiProperty({ description: 'No-show cap amount', type: MoneyValueDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyValueDto)
  no_show_cap?: MoneyValueDto;

  @ApiProperty({ description: 'Is active', required: false })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
