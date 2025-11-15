import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { ModerationLogEntity, ModerationAction } from '../entities/moderation-log.entity';

/**
 * KWD Moderation Log Repository
 * Handles persistence operations for moderation logs.
 * Immutable audit trail.
 */
@Injectable()
export class ModerationLogRepository {
  constructor(
    @InjectRepository(ModerationLogEntity)
    private readonly repository: EntityRepository<ModerationLogEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  /**
   * Create moderation log entry (immutable)
   */
  async create(log: ModerationLogEntity): Promise<ModerationLogEntity> {
    this.em.persist(log);
    await this.em.flush();
    return log;
  }

  /**
   * Find moderation logs by listing ID
   */
  async findByListing(listing_id: string): Promise<ModerationLogEntity[]> {
    return this.repository.find({ listing_id }, { orderBy: { created_at: 'DESC' } });
  }

  /**
   * Find moderation logs by moderator
   */
  async findByModerator(applied_by: string, limit: number = 100): Promise<ModerationLogEntity[]> {
    return this.repository.find({ applied_by }, { limit, orderBy: { created_at: 'DESC' } });
  }

  /**
   * Find recent moderation logs
   */
  async findRecent(limit: number = 100): Promise<ModerationLogEntity[]> {
    return this.repository.find({}, { limit, orderBy: { created_at: 'DESC' } });
  }

  /**
   * Count moderation actions by type
   */
  async countByAction(action: ModerationAction): Promise<number> {
    return this.repository.count({ action });
  }

  /**
   * Calculate average approval time
   */
  async calculateAverageApprovalTime(days: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const logs = await this.repository.find({
      action: ModerationAction.APPROVE,
      created_at: { $gte: cutoffDate },
    });
    if (logs.length === 0) {
      return 0;
    }
    return logs.length;
  }
}
