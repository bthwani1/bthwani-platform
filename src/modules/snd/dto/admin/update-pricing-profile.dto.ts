import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SndPricingScope } from '../../entities/pricing-profile.entity';

export class UpdatePricingProfileDto {
  @ApiProperty({ description: 'Pricing scope', enum: SndPricingScope })
  @IsEnum(SndPricingScope)
  @IsNotEmpty()
  scope!: SndPricingScope;

  @ApiProperty({ description: 'Scope value (region, etc.)', required: false })
  @IsOptional()
  @IsString()
  scope_value?: string;

  @ApiProperty({ description: 'Category ID', required: false })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiProperty({ description: 'Minimum price in YER (minor units)' })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  min_price_yer!: number;

  @ApiProperty({ description: 'Maximum price in YER (minor units)' })
  @IsInt()
  @Min(0)
  @IsNotEmpty()
  max_price_yer!: number;

  @ApiProperty({ description: 'Requires review', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  requires_review?: boolean = false;

  @ApiProperty({ description: 'Is active', required: false, default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}
