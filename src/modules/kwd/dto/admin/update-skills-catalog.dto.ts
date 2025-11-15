import {
  IsArray,
  IsEnum,
  IsString,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Skill DTO for catalog operations
 */
export class SkillDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MaxLength(100)
  name!: string;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  synonyms!: string[];
}

/**
 * Catalog operation DTO
 */
export class CatalogOperationDto {
  @IsEnum(['add', 'update', 'remove'])
  op!: 'add' | 'update' | 'remove';

  @ValidateNested()
  @Type(() => SkillDto)
  skill!: SkillDto;
}

/**
 * Update skills catalog request DTO
 */
export class UpdateSkillsCatalogDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogOperationDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  operations!: CatalogOperationDto[];
}
