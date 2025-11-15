import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { RankingConfigEntity, RankingWeights } from '../entities/ranking-config.entity';

/**
 * KWD Ranking Config Repository
 * Handles persistence operations for ranking configuration.
 * Single-row configuration pattern (only one active config).
 */
@Injectable()
export class RankingConfigRepository {
  constructor(
    @InjectRepository(RankingConfigEntity)
    private readonly repository: EntityRepository<RankingConfigEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  /**
   * Get current ranking config (singleton)
   */
  async getCurrent(): Promise<RankingConfigEntity | null> {
    return this.repository.findOne({ id: 1 });
  }

  /**
   * Update ranking config (or create if not exists)
   */
  async updateOrCreate(weights: RankingWeights, updated_by: string): Promise<RankingConfigEntity> {
    let config = await this.getCurrent();
    if (!config) {
      config = new RankingConfigEntity();
      config.id = 1;
      this.em.persist(config);
    }
    config.weights = weights;
    config.updated_by = updated_by;
    config.updated_at = new Date();
    await this.em.flush();
    return config;
  }

  /**
   * Initialize with default weights
   */
  async initializeDefaults(updated_by: string): Promise<RankingConfigEntity> {
    const defaultWeights: RankingWeights = {
      sponsored: 0.4,
      freshness: 0.3,
      proximity: 0.2,
      text_score: 0.1,
    };
    return this.updateOrCreate(defaultWeights, updated_by);
  }
}
