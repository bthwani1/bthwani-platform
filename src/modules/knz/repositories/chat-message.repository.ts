import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { ChatMessageEntity } from '../entities/chat-message.entity';

@Injectable()
export class ChatMessageRepository {
  constructor(
    @InjectRepository(ChatMessageEntity)
    private readonly repository: EntityRepository<ChatMessageEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(message: ChatMessageEntity): Promise<ChatMessageEntity> {
    this.em.persist(message);
    await this.em.flush();
    return message;
  }

  async findOne(id: string): Promise<ChatMessageEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByListing(
    listingId: string,
    options?: {
      cursor?: string;
      limit?: number;
    },
  ): Promise<ChatMessageEntity[]> {
    const where: Record<string, unknown> = { listing_id: listingId };
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }
    return this.repository.find(where, {
      limit: options?.limit,
      orderBy: { created_at: 'DESC' },
    });
  }

  async findByParticipants(
    userId: string,
    otherUserId: string,
    listingId: string,
    options?: {
      cursor?: string;
      limit?: number;
    },
  ): Promise<ChatMessageEntity[]> {
    const where: Record<string, unknown> = {
      listing_id: listingId,
      $or: [
        { sender_id: userId, recipient_id: otherUserId },
        { sender_id: otherUserId, recipient_id: userId },
      ],
    };
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }
    return this.repository.find(where, {
      limit: options?.limit,
      orderBy: { created_at: 'DESC' },
    });
  }

  async markAsRead(messageIds: string[], userId: string): Promise<void> {
    const messages = await this.repository.find({
      id: { $in: messageIds },
      recipient_id: userId,
      is_read: false,
    });
    messages.forEach((msg) => {
      msg.is_read = true;
      msg.read_at = new Date();
    });
    await this.em.flush();
  }

  async update(message: ChatMessageEntity): Promise<ChatMessageEntity> {
    await this.em.flush();
    return message;
  }
}
