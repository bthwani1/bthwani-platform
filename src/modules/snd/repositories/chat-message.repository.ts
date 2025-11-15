import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { SndChatMessageEntity } from '../entities/chat-message.entity';

@Injectable()
export class SndChatMessageRepository {
  constructor(
    @InjectRepository(SndChatMessageEntity)
    private readonly repository: EntityRepository<SndChatMessageEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(message: SndChatMessageEntity): Promise<SndChatMessageEntity> {
    this.em.persist(message);
    await this.em.flush();
    return message;
  }

  async findOne(id: string): Promise<SndChatMessageEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<SndChatMessageEntity | null> {
    return this.repository.findOne({ idempotency_key: idempotencyKey });
  }

  async findByRequest(
    requestId: string,
    options?: {
      cursor?: string;
      limit?: number;
    },
  ): Promise<SndChatMessageEntity[]> {
    const where: Record<string, unknown> = { request_id: requestId };
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    const findOptions: { limit: number; orderBy: { created_at: 'DESC' } } = {
      limit: options?.limit ?? 50,
      orderBy: { created_at: 'DESC' },
    };
    return this.repository.find(where, findOptions);
  }

  async findByParticipants(
    requestId: string,
    userId1: string,
    userId2: string,
    options?: {
      cursor?: string;
      limit?: number;
    },
  ): Promise<SndChatMessageEntity[]> {
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

    const findOptions: { limit: number; orderBy: { created_at: 'DESC' } } = {
      limit: options?.limit ?? 50,
      orderBy: { created_at: 'DESC' },
    };
    return this.repository.find(where, findOptions);
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

  async update(message: SndChatMessageEntity): Promise<SndChatMessageEntity> {
    await this.em.flush();
    return message;
  }
}
