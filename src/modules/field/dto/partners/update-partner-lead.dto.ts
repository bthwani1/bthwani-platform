import { IsOptional, IsString, Length, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PartnerContactDto } from './create-partner-lead.dto';

export class UpdatePartnerLeadDto {
  @ApiPropertyOptional({
    description: 'Trade name (display name)',
    example: 'متجر الأمل',
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  trade_name?: string;

  @ApiPropertyOptional({
    description: 'Business category',
    example: 'retail',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Full address',
    example: 'شارع الزبيري، صنعاء',
  })
  @IsOptional()
  @IsString()
  @Length(10, 500)
  address?: string;

  @ApiPropertyOptional({
    description: 'Primary contacts',
    type: [PartnerContactDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartnerContactDto)
  contacts?: PartnerContactDto[];

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Large store with good location',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

