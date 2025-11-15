import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SndChatMessageRepository } from '../repositories/chat-message.repository';
import { SndRequestRepository } from '../repositories/request.repository';
import { SndChatMessageEntity, SndChatMessageDirection } from '../entities/chat-message.entity';
import { CreateChatMessageDto } from '../dto/chat/create-message.dto';
import { ListChatMessagesDto } from '../dto/chat/list-messages.dto';
import { LoggerService } from '../../../core/services/logger.service';
import { SndNotificationAdapter } from '../adapters/notification.adapter';
import { SndRequestEntity, SndRequestType } from '../entities/request.entity';
import * as crypto from 'crypto';

@Injectable()
export class SndChatService {
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-gcm';
  private readonly retentionDays: number;

  constructor(
    private readonly chatMessageRepository: SndChatMessageRepository,
    private readonly requestRepository: SndRequestRepository,
    private readonly notificationAdapter: SndNotificationAdapter,
    private readonly logger: LoggerService,
  ) {
    this.encryptionKey =
      process.env.VAR_SND_CHAT_ENCRYPTION_KEY ||
      process.env.CHAT_ENCRYPTION_KEY ||
      'default-key-change-in-production';
    this.retentionDays = parseInt(process.env.VAR_SND_CHAT_RETENTION_DAYS || '30', 10);
  }

  async getMessages(
    requestId: string,
    userId: string,
    query: ListChatMessagesDto,
  ): Promise<{ items: SndChatMessageEntity[]; nextCursor?: string }> {
    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/snd/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'SND-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    const isRequester = request.requester_id === userId;
    const isCaptain = request.assigned_captain_id === userId;
    const isProvider = request.assigned_provider_id === userId;

    if (!isRequester && !isCaptain && !isProvider) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/snd/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'SND-403-UNAUTHORIZED',
        detail: 'You are not authorized to view this chat',
      });
    }

    const otherUserId = isRequester
      ? request.assigned_captain_id || request.assigned_provider_id
      : request.requester_id;

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
  ): Promise<SndChatMessageEntity> {
    const existing = await this.chatMessageRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return this.decryptMessage(existing);
    }

    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/snd/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'SND-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    const isRequester = request.requester_id === userId;
    const isCaptain = request.assigned_captain_id === userId;
    const isProvider = request.assigned_provider_id === userId;

    if (!isRequester && !isCaptain && !isProvider) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/snd/unauthorized',
        title: 'Unauthorized',
        status: 403,
        code: 'SND-403-UNAUTHORIZED',
        detail: 'You are not authorized to send messages in this chat',
      });
    }

    let recipientId: string;
    let direction: SndChatMessageDirection;

    if (isRequester) {
      if (request.type === SndRequestType.INSTANT && request.assigned_captain_id) {
        recipientId = request.assigned_captain_id;
        direction = SndChatMessageDirection.REQUESTER_TO_CAPTAIN;
      } else if (request.assigned_provider_id) {
        recipientId = request.assigned_provider_id;
        direction = SndChatMessageDirection.REQUESTER_TO_PROVIDER;
      } else {
        throw new BadRequestException({
          type: 'https://errors.bthwani.com/snd/no_assignment',
          title: 'No Assignment',
          status: 400,
          code: 'SND-400-NO-ASSIGNMENT',
          detail: 'Request has no assigned captain or provider',
        });
      }
    } else if (isCaptain) {
      recipientId = request.requester_id;
      direction = SndChatMessageDirection.CAPTAIN_TO_REQUESTER;
    } else {
      recipientId = request.requester_id;
      direction = SndChatMessageDirection.PROVIDER_TO_REQUESTER;
    }

    const filteredBody = this.filterContent(createDto.body);

    const message = new SndChatMessageEntity();
    message.request_id = requestId;
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
      requestId,
      saved.id,
      createDto.is_urgent || false,
    );

    return this.decryptMessage(saved);
  }

  async getAuditMessages(requestId: string): Promise<SndChatMessageEntity[]> {
    const messages = await this.chatMessageRepository.findByRequest(requestId, {});
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

  private decryptMessage(message: SndChatMessageEntity): SndChatMessageEntity {
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
