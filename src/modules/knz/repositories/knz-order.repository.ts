import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { KnzOrderEntity, KnzOrderStatus } from '../entities/knz-order.entity';

@Injectable()
export class KnzOrderRepository {
  constructor(
    @InjectRepository(KnzOrderEntity)
    private readonly repository: EntityRepository<KnzOrderEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(order: KnzOrderEntity): Promise<KnzOrderEntity> {
    this.em.persist(order);
    await this.em.flush();
    return order;
  }

  async findOne(id: string): Promise<KnzOrderEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<KnzOrderEntity | null> {
    return this.repository.findOne({ idempotency_key: idempotencyKey });
  }

  async findByBuyer(
    buyerId: string,
    options?: {
      status?: KnzOrderStatus;
      cursor?: string;
      limit?: number;
    },
  ): Promise<KnzOrderEntity[]> {
    const where: Record<string, unknown> = { buyer_id: buyerId };
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }
    return this.repository.find(where, {
      limit: options?.limit,
      orderBy: { created_at: 'DESC' },
    });
  }

  async findBySeller(
    sellerId: string,
    options?: {
      status?: KnzOrderStatus;
      cursor?: string;
      limit?: number;
    },
  ): Promise<KnzOrderEntity[]> {
    const where: Record<string, unknown> = { seller_id: sellerId };
    if (options?.status) {
      where.status = options.status;
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
    status?: KnzOrderStatus;
    cursor?: string;
    limit?: number;
  }): Promise<KnzOrderEntity[]> {
    const where: Record<string, unknown> = {};
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }
    return this.repository.find(where, {
      limit: options?.limit,
      orderBy: { created_at: 'DESC' },
    });
  }

  async update(order: KnzOrderEntity): Promise<KnzOrderEntity> {
    await this.em.flush();
    return order;
  }
}
