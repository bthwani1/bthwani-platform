import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { BookingChatMessageEntity } from '../entities/booking-chat-message.entity';

@Injectable()
export class BookingChatMessageRepository {
  constructor(
    @InjectRepository(BookingChatMessageEntity)
    private readonly repository: EntityRepository<BookingChatMessageEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(message: BookingChatMessageEntity): Promise<BookingChatMessageEntity> {
    this.em.persist(message);
    await this.em.flush();
    return message;
  }

  async findOne(id: string): Promise<BookingChatMessageEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<BookingChatMessageEntity | null> {
    return this.repository.findOne({ idempotency_key: idempotencyKey });
  }

  async findByBooking(
    bookingId: string,
    options?: {
      cursor?: string;
      limit?: number;
    },
  ): Promise<BookingChatMessageEntity[]> {
    const where: Record<string, unknown> = { booking_id: bookingId };
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
      ...(options?.limit !== undefined && { limit: options.limit + 1 }),
    });
  }

  async findByParticipants(
    bookingId: string,
    senderId: string,
    recipientId: string,
    options?: {
      cursor?: string;
      limit?: number;
    },
  ): Promise<BookingChatMessageEntity[]> {
    const where: Record<string, unknown> = {
      booking_id: bookingId,
      $or: [
        { sender_id: senderId, recipient_id: recipientId },
        { sender_id: recipientId, recipient_id: senderId },
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

  async markAsRead(messageId: string, userId: string): Promise<void> {
    const message = await this.repository.findOne({ id: messageId, recipient_id: userId });
    if (message && !message.is_read) {
      message.is_read = true;
      message.read_at = new Date();
      await this.em.flush();
    }
  }

  async update(message: BookingChatMessageEntity): Promise<BookingChatMessageEntity> {
    await this.em.flush();
    return message;
  }
}
