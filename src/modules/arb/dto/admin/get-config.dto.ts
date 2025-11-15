import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ConfigScope } from '../../entities/arb-config.entity';

export class GetConfigDto {
  @ApiProperty({ description: 'Config scope', enum: ConfigScope, required: false })
  @IsOptional()
  @IsEnum(ConfigScope)
  scope?: ConfigScope;

  @ApiProperty({ description: 'Scope value (e.g., region code, category ID)', required: false })
  @IsOptional()
  scope_value?: string;
}
