import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * Ranking weights value object
 */
export interface RankingWeights {
  sponsored: number;
  freshness: number;
  proximity: number;
  text_score: number;
}

/**
 * KWD Ranking Config Entity
 * Stores configurable ranking weights for search results.
 * Single-row configuration pattern (only one active config).
 *
 * @entity
 * @table kwd_ranking_config
 */
@Entity({ tableName: 'kwd_ranking_config' })
export class RankingConfigEntity {
  @PrimaryKey({ type: 'integer', autoincrement: true })
  id: number = 1;

  @Property({ type: 'jsonb' })
  weights!: RankingWeights;

  @Property({ type: 'uuid' })
  updated_by!: string;

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();
}
