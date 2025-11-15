import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { ArbAuditLogEntity, ArbAuditEntityType } from '../entities/arb-audit-log.entity';

@Injectable()
export class ArbAuditLogRepository {
  constructor(
    @InjectRepository(ArbAuditLogEntity)
    private readonly repository: EntityRepository<ArbAuditLogEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(auditLog: ArbAuditLogEntity): Promise<ArbAuditLogEntity> {
    this.em.persist(auditLog);
    await this.em.flush();
    return auditLog;
  }

  async findOne(id: string): Promise<ArbAuditLogEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByEntity(
    entityType: ArbAuditEntityType,
    entityId: string,
    options?: {
      cursor?: string;
      limit?: number;
    },
  ): Promise<ArbAuditLogEntity[]> {
    const where: Record<string, unknown> = {
      entity_type: entityType,
      entity_id: entityId,
    };
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
      ...(options?.limit !== undefined && { limit: options.limit }),
    });
  }

  async findByUser(
    userId: string,
    options?: {
      cursor?: string;
      limit?: number;
    },
  ): Promise<ArbAuditLogEntity[]> {
    const where: Record<string, unknown> = { user_id: userId };
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
      ...(options?.limit !== undefined && { limit: options.limit }),
    });
  }

  async findByTraceId(traceId: string): Promise<ArbAuditLogEntity[]> {
    return this.repository.find({ trace_id: traceId }, { orderBy: { created_at: 'ASC' } });
  }
}
