import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { SettlementBatchEntity, BatchStatus } from '../entities/settlement-batch.entity';

@Injectable()
export class SettlementBatchRepository {
  constructor(
    @InjectRepository(SettlementBatchEntity)
    private readonly repository: EntityRepository<SettlementBatchEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(batch: SettlementBatchEntity): Promise<SettlementBatchEntity> {
    this.em.persist(batch);
    await this.em.flush();
    return batch;
  }

  async findOne(id: string): Promise<SettlementBatchEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByStatus(
    status: BatchStatus,
    options?: {
      cursor?: string;
      limit?: number;
    },
  ): Promise<SettlementBatchEntity[]> {
    const where: Record<string, unknown> = { status };
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      limit: options?.limit || 50,
      orderBy: { created_at: 'DESC' },
    });
  }

  async findByPartner(
    partnerId: string,
    options?: {
      status?: BatchStatus;
      cursor?: string;
      limit?: number;
    },
  ): Promise<SettlementBatchEntity[]> {
    const where: Record<string, unknown> = { partner_id: partnerId };
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      limit: options?.limit || 50,
      orderBy: { created_at: 'DESC' },
    });
  }

  async update(batch: SettlementBatchEntity): Promise<SettlementBatchEntity> {
    await this.em.flush();
    return batch;
  }
}
