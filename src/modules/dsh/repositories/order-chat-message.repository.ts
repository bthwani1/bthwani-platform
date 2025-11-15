import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { OrderChatMessageEntity } from '../entities/order-chat-message.entity';

@Injectable()
export class OrderChatMessageRepository {
  constructor(
    @InjectRepository(OrderChatMessageEntity)
    private readonly repository: EntityRepository<OrderChatMessageEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(message: OrderChatMessageEntity): Promise<OrderChatMessageEntity> {
    this.em.persist(message);
    await this.em.flush();
    return message;
  }

  async findByOrder(
    orderId: string,
    cursor?: string,
    limit: number = 50,
  ): Promise<OrderChatMessageEntity[]> {
    const where: Record<string, unknown> = { order_id: orderId };
    if (cursor) {
      where.created_at = { $lt: new Date(cursor) };
    }

    return this.repository.find(where, {
      limit,
      orderBy: { created_at: 'DESC' },
    });
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<OrderChatMessageEntity | null> {
    return this.repository.findOne({ idempotency_key: idempotencyKey });
  }

  async markAsRead(messageId: string): Promise<void> {
    const message = await this.repository.findOne(messageId);
    if (message) {
      message.is_read = true;
      message.read_at = new Date();
      await this.em.flush();
    }
  }
}

