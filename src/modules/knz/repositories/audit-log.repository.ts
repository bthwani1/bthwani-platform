import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { AuditLogEntity, AuditAction, AuditEntityType } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repository: EntityRepository<AuditLogEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(auditLog: AuditLogEntity): Promise<AuditLogEntity> {
    this.em.persist(auditLog);
    await this.em.flush();
    return auditLog;
  }

  async findOne(id: string): Promise<AuditLogEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByEntity(
    entityType: AuditEntityType,
    entityId: string,
    options?: {
      limit?: number;
      offset?: number;
    },
  ): Promise<AuditLogEntity[]> {
    return this.repository.find(
      { entity_type: entityType, entity_id: entityId },
      {
        limit: options?.limit,
        offset: options?.offset,
        orderBy: { created_at: 'DESC' },
      },
    );
  }

  async findByUser(
    userId: string,
    options?: {
      action?: AuditAction;
      entityType?: AuditEntityType;
      cursor?: string;
      limit?: number;
    },
  ): Promise<AuditLogEntity[]> {
    const where: Record<string, unknown> = { user_id: userId };
    if (options?.action) {
      where.action = options.action;
    }
    if (options?.entityType) {
      where.entity_type = options.entityType;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }
    return this.repository.find(where, {
      limit: options?.limit,
      orderBy: { created_at: 'DESC' },
    });
  }

  async findAll(options?: {
    action?: AuditAction;
    entityType?: AuditEntityType;
    userId?: string;
    cursor?: string;
    limit?: number;
  }): Promise<AuditLogEntity[]> {
    const where: Record<string, unknown> = {};
    if (options?.action) {
      where.action = options.action;
    }
    if (options?.entityType) {
      where.entity_type = options.entityType;
    }
    if (options?.userId) {
      where.user_id = options.userId;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }
    return this.repository.find(where, {
      limit: options?.limit,
      orderBy: { created_at: 'DESC' },
    });
  }
}
