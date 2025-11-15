import { IsNumber, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Ranking weights DTO
 */
export class RankingWeightsDto {
  @IsNumber()
  @Min(0)
  @Max(1)
  sponsored!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  freshness!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  proximity!: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  text_score!: number;
}

/**
 * Update ranking config request DTO
 */
export class UpdateRankingConfigDto {
  @ValidateNested()
  @Type(() => RankingWeightsDto)
  weights!: RankingWeightsDto;
}
