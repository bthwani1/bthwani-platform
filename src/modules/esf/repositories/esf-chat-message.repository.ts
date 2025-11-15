import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { EsfChatMessageEntity } from '../entities/esf-chat-message.entity';

@Injectable()
export class EsfChatMessageRepository {
  constructor(
    @InjectRepository(EsfChatMessageEntity)
    private readonly repository: EntityRepository<EsfChatMessageEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(message: EsfChatMessageEntity): Promise<EsfChatMessageEntity> {
    this.em.persist(message);
    await this.em.flush();
    return message;
  }

  async findOne(id: string): Promise<EsfChatMessageEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<EsfChatMessageEntity | null> {
    return this.repository.findOne({ idempotency_key: idempotencyKey });
  }

  async findByRequest(
    requestId: string,
    options?: { cursor?: string; limit?: number },
  ): Promise<EsfChatMessageEntity[]> {
    const where: Record<string, unknown> = { request_id: requestId };

    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
      ...(options?.limit !== undefined && { limit: options.limit + 1 }),
    });
  }

  async findByParticipants(
    requestId: string,
    userId1: string,
    userId2: string,
    options?: { cursor?: string; limit?: number },
  ): Promise<EsfChatMessageEntity[]> {
    const where: Record<string, unknown> = {
      request_id: requestId,
      $or: [
        { sender_id: userId1, recipient_id: userId2 },
        { sender_id: userId2, recipient_id: userId1 },
      ],
    };

    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
      ...(options?.limit !== undefined && { limit: options.limit + 1 }),
    });
  }

  async markAsRead(messageIds: string[], userId: string): Promise<void> {
    const messages = await this.repository.find({
      id: { $in: messageIds },
      recipient_id: userId,
      is_read: false,
    });

    for (const message of messages) {
      message.is_read = true;
      message.read_at = new Date();
    }

    await this.em.flush();
  }

  async findUnreadCount(requestId: string, userId: string): Promise<number> {
    return this.repository.count({
      request_id: requestId,
      recipient_id: userId,
      is_read: false,
    });
  }
}
