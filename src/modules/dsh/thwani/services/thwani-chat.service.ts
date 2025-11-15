import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ThwaniChatMessageRepository } from '../repositories/thwani-chat-message.repository';
import { ThwaniRequestRepository } from '../repositories/thwani-request.repository';
import {
  ThwaniChatMessageEntity,
  ThwaniChatMessageDirection,
} from '../entities/thwani-chat-message.entity';
import { LoggerService } from '../../../../core/services/logger.service';
import { ThwaniNotificationAdapter } from '../adapters/thwani-notification.adapter';
import { ThwaniRequestEntity } from '../entities/thwani-request.entity';
import * as crypto from 'crypto';

export interface CreateChatMessageDto {
  body: string;
}

export interface ListChatMessagesDto {
  cursor?: string;
  limit?: number;
}

/**
 * Thwani Chat Service
 *
 * Encrypted chat messages with phone masking for instant help requests.
 * Reuses DSH chat encryption pattern (AES-256-GCM).
 */
@Injectable()
export class ThwaniChatService {
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-gcm';
  private readonly retentionDays: number;

  constructor(
    private readonly chatMessageRepository: ThwaniChatMessageRepository,
    private readonly requestRepository: ThwaniRequestRepository,
    private readonly notificationAdapter: ThwaniNotificationAdapter,
    private readonly logger: LoggerService,
  ) {
    this.encryptionKey =
      process.env.VAR_THWANI_CHAT_ENCRYPTION_KEY ||
      process.env.CHAT_ENCRYPTION_KEY ||
      'default-key-change-in-production';
    this.retentionDays = parseInt(process.env.VAR_THWANI_CHAT_RETENTION_DAYS || '30', 10);
  }

  async getMessages(
    requestId: string,
    userId: string,
    query: ListChatMessagesDto,
  ): Promise<{ items: ThwaniChatMessageEntity[]; nextCursor?: string }> {
    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/thwani/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'THWANI-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    const isRequester = request.requester_id === userId;
    const isCaptain = request.assigned_captain_id === userId;

    if (!isRequester && !isCaptain) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/thwani/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'THWANI-403-UNAUTHORIZED',
        detail: 'You are not authorized to view this chat',
      });
    }

    const otherUserId = isRequester ? request.assigned_captain_id : request.requester_id;

    if (!otherUserId) {
      return { items: [] };
    }

    const messages = await this.chatMessageRepository.findByParticipants(
      requestId,
      userId,
      otherUserId,
      {
        ...(query.cursor !== undefined && { cursor: query.cursor }),
        limit: query.limit ? query.limit + 1 : 51,
      },
    );

    const hasMore = query.limit && messages.length > query.limit;
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
    requestId: string,
    userId: string,
    createDto: CreateChatMessageDto,
    idempotencyKey: string,
  ): Promise<ThwaniChatMessageEntity> {
    const existing = await this.chatMessageRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return this.decryptMessage(existing);
    }

    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/thwani/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'THWANI-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    const isRequester = request.requester_id === userId;
    const isCaptain = request.assigned_captain_id === userId;

    if (!isRequester && !isCaptain) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/thwani/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'THWANI-403-UNAUTHORIZED',
        detail: 'You are not authorized to send messages in this chat',
      });
    }

    const recipientId = isRequester ? request.assigned_captain_id : request.requester_id;
    if (!recipientId) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/thwani/no_recipient',
        title: 'No Recipient',
        status: 400,
        code: 'THWANI-400-NO-RECIPIENT',
        detail: 'No recipient assigned to this request',
      });
    }

    const direction = isRequester
      ? ThwaniChatMessageDirection.REQUESTER_TO_CAPTAIN
      : ThwaniChatMessageDirection.CAPTAIN_TO_REQUESTER;

    const encryptedBody = this.encryptMessage(createDto.body);

    const message = new ThwaniChatMessageEntity();
    message.request_id = requestId;
    message.sender_id = userId;
    message.recipient_id = recipientId;
    message.direction = direction;
    message.body_encrypted = encryptedBody;
    message.idempotency_key = idempotencyKey;

    const saved = await this.chatMessageRepository.create(message);

    await this.notificationAdapter.notifyNewMessage(request, saved);

    return this.decryptMessage(saved);
  }

  private encryptMessage(plaintext: string): string {
    const key = Buffer.from(this.encryptionKey, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex'),
    });
  }

  private decryptMessage(message: ThwaniChatMessageEntity): ThwaniChatMessageEntity {
    try {
      const key = Buffer.from(this.encryptionKey, 'hex');
      const data = JSON.parse(message.body_encrypted);
      const iv = Buffer.from(data.iv, 'hex');
      const authTag = Buffer.from(data.authTag, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const decryptedMessage = { ...message };
      (decryptedMessage as unknown as { body_decrypted: string }).body_decrypted = decrypted;

      return decryptedMessage;
    } catch (error) {
      this.logger.error('Failed to decrypt message', error instanceof Error ? error.stack : String(error));
      return message;
    }
  }
}

