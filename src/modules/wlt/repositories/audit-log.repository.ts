import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { AuditLogEntity } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repository: EntityRepository<AuditLogEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(log: AuditLogEntity): Promise<AuditLogEntity> {
    this.em.persist(log);
    await this.em.flush();
    return log;
  }

  async findOne(id: string): Promise<AuditLogEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    options?: {
      cursor?: string;
      limit?: number;
    },
  ): Promise<AuditLogEntity[]> {
    const where: Record<string, unknown> = {
      entity_type: entityType,
      entity_id: entityId,
    };
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      limit: options?.limit || 50,
      orderBy: { created_at: 'DESC' },
    });
  }

  async findByUser(
    userId: string,
    options?: {
      cursor?: string;
      limit?: number;
    },
  ): Promise<AuditLogEntity[]> {
    const where: Record<string, unknown> = { user_id: userId };
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      limit: options?.limit || 50,
      orderBy: { created_at: 'DESC' },
    });
  }

  async findByTraceId(traceId: string): Promise<AuditLogEntity[]> {
    return this.repository.find({ trace_id: traceId }, { orderBy: { created_at: 'ASC' } });
  }
}
