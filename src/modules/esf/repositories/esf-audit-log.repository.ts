import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import {
  EsfAuditLogEntity,
  EsfAuditEntityType,
  EsfAuditAction,
} from '../entities/esf-audit-log.entity';

@Injectable()
export class EsfAuditLogRepository {
  constructor(
    @InjectRepository(EsfAuditLogEntity)
    private readonly repository: EntityRepository<EsfAuditLogEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(auditLog: EsfAuditLogEntity): Promise<EsfAuditLogEntity> {
    this.em.persist(auditLog);
    await this.em.flush();
    return auditLog;
  }

  async findByEntity(
    entityType: EsfAuditEntityType,
    entityId: string,
    options?: { cursor?: string; limit?: number },
  ): Promise<EsfAuditLogEntity[]> {
    const where: Record<string, unknown> = {
      entity_type: entityType,
      entity_id: entityId,
    };

    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
      ...(options?.limit !== undefined && { limit: options.limit + 1 }),
    });
  }

  async findByUser(
    userId: string,
    options?: { cursor?: string; limit?: number },
  ): Promise<EsfAuditLogEntity[]> {
    const where: Record<string, unknown> = { user_id: userId };

    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
      ...(options?.limit !== undefined && { limit: options.limit + 1 }),
    });
  }

  async findByAction(
    action: EsfAuditAction,
    options?: { cursor?: string; limit?: number },
  ): Promise<EsfAuditLogEntity[]> {
    const where: Record<string, unknown> = { action };

    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
      ...(options?.limit !== undefined && { limit: options.limit + 1 }),
    });
  }
}
