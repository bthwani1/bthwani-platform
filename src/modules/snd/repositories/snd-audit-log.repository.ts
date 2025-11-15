import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { SndAuditLogEntity } from '../entities/snd-audit-log.entity';

@Injectable()
export class SndAuditLogRepository {
  constructor(
    @InjectRepository(SndAuditLogEntity)
    private readonly repository: EntityRepository<SndAuditLogEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(log: SndAuditLogEntity): Promise<SndAuditLogEntity> {
    this.em.persist(log);
    await this.em.flush();
    return log;
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    options?: {
      cursor?: string;
      limit?: number;
    },
  ): Promise<SndAuditLogEntity[]> {
    const where: Record<string, unknown> = {
      entity_type: entityType,
      entity_id: entityId,
    };
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    const findOptions: { limit: number; orderBy: { created_at: 'DESC' } } = {
      limit: options?.limit ?? 50,
      orderBy: { created_at: 'DESC' },
    };
    return this.repository.find(where, findOptions);
  }

  async findByUser(
    userId: string,
    options?: {
      cursor?: string;
      limit?: number;
    },
  ): Promise<SndAuditLogEntity[]> {
    const where: Record<string, unknown> = { user_id: userId };
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    const findOptions: { limit: number; orderBy: { created_at: 'DESC' } } = {
      limit: options?.limit ?? 50,
      orderBy: { created_at: 'DESC' },
    };
    return this.repository.find(where, findOptions);
  }

  async findByAction(
    action: string,
    options?: {
      cursor?: string;
      limit?: number;
    },
  ): Promise<SndAuditLogEntity[]> {
    const where: Record<string, unknown> = { action };
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    const findOptions: { limit: number; orderBy: { created_at: 'DESC' } } = {
      limit: options?.limit ?? 50,
      orderBy: { created_at: 'DESC' },
    };
    return this.repository.find(where, findOptions);
  }
}
