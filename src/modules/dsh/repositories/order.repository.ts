import { EntityRepository, EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
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
    const qb = this.repository
      .createQueryBuilder('o')
      .where({ customer_id: customerId })
      .orderBy({ created_at: 'DESC' })
      .limit(limit);

    if (cursor) {
      qb.andWhere('o.created_at < ?', [new Date(cursor)]);
    }

    return qb.getResult();
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<OrderEntity | null> {
    return this.repository.findOne({ idempotency_key: idempotencyKey });
  }

  async findByStatus(status: OrderStatus, limit: number = 100): Promise<OrderEntity[]> {
    return this.repository.find({ status }, { limit, orderBy: { created_at: 'DESC' } });
  }
}
