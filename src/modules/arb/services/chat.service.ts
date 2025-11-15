import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BookingChatMessageRepository } from '../repositories/booking-chat-message.repository';
import { BookingRepository } from '../repositories/booking.repository';
import {
  BookingChatMessageEntity,
  BookingChatMessageDirection,
} from '../entities/booking-chat-message.entity';
import { CreateChatMessageDto } from '../dto/chat/create-message.dto';
import { ListChatMessagesDto } from '../dto/chat/list-messages.dto';
import { LoggerService } from '../../../core/services/logger.service';
import { ArbNotificationAdapter } from '../adapters/notification.adapter';
import * as crypto from 'crypto';

@Injectable()
export class ArbChatService {
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-gcm';
  private readonly retentionDays: number;

  constructor(
    private readonly chatMessageRepository: BookingChatMessageRepository,
    private readonly bookingRepository: BookingRepository,
    private readonly notificationAdapter: ArbNotificationAdapter,
    private readonly logger: LoggerService,
  ) {
    this.encryptionKey =
      process.env.VAR_ARB_CHAT_ENCRYPTION_KEY ||
      process.env.CHAT_ENCRYPTION_KEY ||
      'default-key-change-in-production';
    this.retentionDays = parseInt(process.env.VAR_ARB_CHAT_RETENTION_DAYS || '30', 10);
  }

  async getMessages(
    bookingId: string,
    userId: string,
    query: ListChatMessagesDto,
  ): Promise<{ items: BookingChatMessageEntity[]; nextCursor?: string }> {
    const booking = await this.bookingRepository.findOne(bookingId);
    if (!booking) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/arb/booking_not_found',
        title: 'Booking Not Found',
        status: 404,
        code: 'ARB-404-BOOKING-NOT-FOUND',
        detail: `Booking ${bookingId} not found`,
      });
    }

    const isCustomer = booking.customer_id === userId;
    const isPartner = booking.partner_id === userId;

    if (!isCustomer && !isPartner) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/arb/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'ARB-403-UNAUTHORIZED',
        detail: 'You are not authorized to view this chat',
      });
    }

    const otherUserId = isCustomer ? booking.partner_id : booking.customer_id;

    const limit = query.limit || 50;
    const messages = await this.chatMessageRepository.findByParticipants(
      bookingId,
      userId,
      otherUserId,
      {
        ...(query.cursor !== undefined && { cursor: query.cursor }),
        limit: limit + 1,
      },
    );

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, query.limit) : messages;
    const decryptedItems = items.map((msg) => this.decryptMessage(msg));
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items: decryptedItems,
      ...(nextCursor && { nextCursor }),
    };
  }

  async createMessage(
    bookingId: string,
    userId: string,
    createDto: CreateChatMessageDto,
    idempotencyKey: string,
  ): Promise<BookingChatMessageEntity> {
    const existing = await this.chatMessageRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return this.decryptMessage(existing);
    }

    const booking = await this.bookingRepository.findOne(bookingId);
    if (!booking) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/arb/booking_not_found',
        title: 'Booking Not Found',
        status: 404,
        code: 'ARB-404-BOOKING-NOT-FOUND',
        detail: `Booking ${bookingId} not found`,
      });
    }

    const isCustomer = booking.customer_id === userId;
    const isPartner = booking.partner_id === userId;

    if (!isCustomer && !isPartner) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/arb/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'ARB-403-UNAUTHORIZED',
        detail: 'You are not authorized to send messages in this chat',
      });
    }

    const recipientId = isCustomer ? booking.partner_id : booking.customer_id;
    const direction = isCustomer
      ? BookingChatMessageDirection.CUSTOMER_TO_PARTNER
      : BookingChatMessageDirection.PARTNER_TO_CUSTOMER;

    const filteredBody = this.filterContent(createDto.body);

    const message = new BookingChatMessageEntity();
    message.booking_id = bookingId;
    message.sender_id = userId;
    message.recipient_id = recipientId;
    message.direction = direction;
    message.body_encrypted = this.encryptMessage(filteredBody);
    message.phone_masked = this.maskPhone(userId);
    message.links_masked = this.extractAndMaskLinks(filteredBody);
    message.is_urgent = createDto.is_urgent || false;
    message.idempotency_key = idempotencyKey;

    const saved = await this.chatMessageRepository.create(message);

    await this.notificationAdapter.notifyNewMessage(
      recipientId,
      bookingId,
      saved.id,
      createDto.is_urgent || false,
    );

    return this.decryptMessage(saved);
  }

  async getAuditMessages(bookingId: string): Promise<BookingChatMessageEntity[]> {
    const messages = await this.chatMessageRepository.findByBooking(bookingId, {});
    return messages.map((msg) => {
      const decrypted = this.decryptMessage(msg);
      return decrypted;
    });
  }

  private encryptMessage(body: string): string {
    try {
      const key = Buffer.from(this.encryptionKey, 'hex');
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      let encrypted = cipher.update(body, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();
      return JSON.stringify({
        iv: iv.toString('hex'),
        encrypted,
        authTag: authTag.toString('hex'),
      });
    } catch (error) {
      this.logger.error(`Failed to encrypt message: ${error}`);
      throw error;
    }
  }

  private decryptMessage(message: BookingChatMessageEntity): BookingChatMessageEntity {
    try {
      const data = JSON.parse(message.body_encrypted);
      const key = Buffer.from(this.encryptionKey, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, key, Buffer.from(data.iv, 'hex'));
      decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const decryptedMessage = { ...message };
      decryptedMessage.body_encrypted = decrypted;
      return decryptedMessage;
    } catch (error) {
      this.logger.error(`Failed to decrypt message: ${error} (messageId: ${message.id})`);
      return message;
    }
  }

  private maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return '***';
    return `${phone.substring(0, 2)}***${phone.substring(phone.length - 2)}`;
  }

  private extractAndMaskLinks(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    if (!matches) return [];
    return matches.map(() => '***');
  }

  private filterContent(body: string): string {
    let filtered = body;
    const phoneRegex = /(\+?[0-9]{10,})/g;
    filtered = filtered.replace(phoneRegex, '***');
    const paymentRegex = /(?:payment|pay|money|wallet|account|card|credit|debit)/gi;
    filtered = filtered.replace(paymentRegex, '***');
    return filtered;
  }
}
