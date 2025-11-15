import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { AuditLogEntity } from '../entities/audit-log.entity';

/**
 * KWD Audit Log Repository
 * Handles persistence operations for audit logs.
 * Immutable audit trail with 365-day retention.
 */
@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repository: EntityRepository<AuditLogEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  /**
   * Create audit log entry (immutable)
   */
  async create(log: AuditLogEntity): Promise<AuditLogEntity> {
    this.em.persist(log);
    await this.em.flush();
    return log;
  }

  /**
   * Find audit logs by entity
   */
  async findByEntity(entity_type: string, entity_id: string): Promise<AuditLogEntity[]> {
    return this.repository.find({ entity_type, entity_id }, { orderBy: { created_at: 'DESC' } });
  }

  /**
   * Find audit logs by user
   */
  async findByUser(user_id: string, limit: number = 100): Promise<AuditLogEntity[]> {
    return this.repository.find({ user_id }, { limit, orderBy: { created_at: 'DESC' } });
  }

  /**
   * Find audit logs by action
   */
  async findByAction(action: string, limit: number = 100): Promise<AuditLogEntity[]> {
    return this.repository.find({ action }, { limit, orderBy: { created_at: 'DESC' } });
  }

  /**
   * Find recent audit logs
   */
  async findRecent(limit: number = 100): Promise<AuditLogEntity[]> {
    return this.repository.find({}, { limit, orderBy: { created_at: 'DESC' } });
  }

  /**
   * Find old logs for retention cleanup (365 days)
   */
  async findForRetention(daysOld: number = 365): Promise<AuditLogEntity[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    return this.repository.find({
      created_at: { $lt: cutoffDate },
    });
  }

  /**
   * Count logs by user and date range
   */
  async countByUserAndDateRange(user_id: string, startDate: Date, endDate: Date): Promise<number> {
    return this.repository.count({
      user_id,
      created_at: { $gte: startDate, $lte: endDate },
    });
  }
}
