import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderChatMessageRepository } from '../repositories/order-chat-message.repository';
import { OrderRepository } from '../repositories/order.repository';
import { OrderChatMessageEntity } from '../entities/order-chat-message.entity';
import { LoggerService } from '../../../core/services/logger.service';

export interface CreateChatMessageRequest {
  body: string;
}

@Injectable()
export class DshOrderChatService {
  constructor(
    private readonly chatMessageRepository: OrderChatMessageRepository,
    private readonly orderRepository: OrderRepository,
    private readonly logger: LoggerService,
  ) {}

  async getMessages(
    orderId: string,
    userId: string,
    cursor?: string,
    limit: number = 50,
  ): Promise<{ items: OrderChatMessageEntity[]; nextCursor?: string }> {
    const order = await this.orderRepository.findOne(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Verify user is part of the order (partner or customer)
    if (order.partner_id !== userId && order.customer_id !== userId) {
      throw new NotFoundException('Order not found');
    }

    const messages = await this.chatMessageRepository.findByOrder(
      orderId,
      cursor,
      limit + 1,
    );

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor =
      hasMore && items.length > 0
        ? items[items.length - 1]?.created_at.toISOString()
        : undefined;

    return { items, nextCursor };
  }

  async createMessage(
    orderId: string,
    userId: string,
    request: CreateChatMessageRequest,
    idempotencyKey: string,
  ): Promise<OrderChatMessageEntity> {
    const order = await this.orderRepository.findOne(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Verify user is part of the order
    if (order.partner_id !== userId && order.customer_id !== userId) {
      throw new NotFoundException('Order not found');
    }

    // Check idempotency
    const existing = await this.chatMessageRepository.findByIdempotencyKey(
      idempotencyKey,
    );
    if (existing) {
      this.logger.log('Chat message creation is idempotent', {
        orderId,
        userId,
        idempotencyKey,
      });
      return existing;
    }

    // Determine recipient
    const recipientId =
      order.partner_id === userId ? order.customer_id : order.partner_id;

    // Mask phone numbers and links
    let maskedBody = request.body;
    const phoneRegex = /(\+?967|0)?[0-9]{9}/g;
    maskedBody = maskedBody.replace(phoneRegex, (match) => {
      return match.length > 4 ? `${match.substring(0, 2)}****${match.substring(match.length - 2)}` : '****';
    });

    const linkRegex = /https?:\/\/[^\s]+/g;
    maskedBody = maskedBody.replace(linkRegex, '[Link masked]');

    const message = new OrderChatMessageEntity();
    message.order_id = orderId;
    message.sender_id = userId;
    message.recipient_id = recipientId;
    message.body = maskedBody;
    message.phone_masked = true;
    message.links_masked = true;
    message.idempotency_key = idempotencyKey;

    const created = await this.chatMessageRepository.create(message);

    this.logger.log('Chat message created', {
      orderId,
      userId,
      messageId: created.id,
      idempotencyKey,
    });

    return created;
  }

  async markAsRead(
    orderId: string,
    userId: string,
    messageIds?: string[],
  ): Promise<void> {
    const order = await this.orderRepository.findOne(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (messageIds && messageIds.length > 0) {
      for (const messageId of messageIds) {
        await this.chatMessageRepository.markAsRead(messageId);
      }
    } else {
      // Mark all unread messages as read
      const messages = await this.chatMessageRepository.findByOrder(orderId);
      const unreadMessages = messages.filter(
        (m) => !m.is_read && m.recipient_id === userId,
      );
      for (const message of unreadMessages) {
        await this.chatMessageRepository.markAsRead(message.id);
      }
    }
  }
}

