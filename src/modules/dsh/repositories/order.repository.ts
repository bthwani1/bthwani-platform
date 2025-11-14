import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { OrderEntity, OrderStatus } from '../entities/order.entity';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: EntityRepository<OrderEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(order: OrderEntity): Promise<OrderEntity> {
    this.em.persist(order);
    await this.em.flush();
    return order;
  }

  async findOne(id: string): Promise<OrderEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByCustomerId(
    customerId: string,
    cursor?: string,
    limit: number = 20,
  ): Promise<OrderEntity[]> {
    const where: Record<string, unknown> = { customer_id: customerId };
    
    if (cursor) {
      where.created_at = { $lt: new Date(cursor) };
    }

    return this.repository.find(where, {
      limit,
      orderBy: { created_at: 'DESC' },
    });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<OrderEntity | null> {
    return this.repository.findOne({ idempotency_key: idempotencyKey });
  }

  async findByStatus(status: OrderStatus, limit: number = 100): Promise<OrderEntity[]> {
    return this.repository.find({ status }, { limit, orderBy: { created_at: 'DESC' } });
  }
}
