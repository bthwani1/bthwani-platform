import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EsfChatMessageRepository } from '../repositories/esf-chat-message.repository';
import { EsfRequestRepository } from '../repositories/esf-request.repository';
import { EsfMatchRepository } from '../repositories/esf-match.repository';
import { EsfChatMessageEntity, EsfChatMessageDirection } from '../entities/esf-chat-message.entity';
import { CreateMessageDto } from '../dto/create-message.dto';
import { ListMessagesDto } from '../dto/list-messages.dto';
import { LoggerService } from '../../../core/services/logger.service';
import { EsfNotificationAdapter } from './esf-notification.adapter';
import * as crypto from 'crypto';

@Injectable()
export class EsfChatService {
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-gcm';
  private readonly retentionDays: number;

  constructor(
    private readonly chatMessageRepository: EsfChatMessageRepository,
    private readonly requestRepository: EsfRequestRepository,
    private readonly matchRepository: EsfMatchRepository,
    private readonly notificationAdapter: EsfNotificationAdapter,
    private readonly logger: LoggerService,
  ) {
    this.encryptionKey =
      process.env.VAR_MSG_FIELD_ENCRYPTION_KEY ||
      process.env.CHAT_ENCRYPTION_KEY ||
      'default-key-change-in-production';
    this.retentionDays = parseInt(process.env.VAR_CHAT_RETENTION_DAYS || '30', 10);
  }

  async getMessages(
    requestId: string,
    userId: string,
    query: ListMessagesDto,
  ): Promise<{ items: EsfChatMessageEntity[]; nextCursor?: string }> {
    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/esf/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'ESF-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    const isRequester = request.requester_id === userId;
    if (!isRequester) {
      const matches = await this.matchRepository.findByRequest(requestId);
      const isMatchedDonor = matches.some((m) => m.donor_id === userId);
      if (!isMatchedDonor) {
        throw new NotFoundException({
          type: 'https://errors.bthwani.com/esf/request_not_found',
          title: 'Request Not Found',
          status: 404,
          code: 'ESF-404-REQUEST-NOT-FOUND',
          detail: `Request ${requestId} not found`,
        });
      }
    }

    const otherUserId = isRequester
      ? (await this.matchRepository.findByRequest(requestId))[0]?.donor_id
      : request.requester_id;

    if (!otherUserId) {
      return { items: [] };
    }

    const messages = await this.chatMessageRepository.findByParticipants(
      requestId,
      userId,
      otherUserId,
      {
        cursor: query.cursor,
        limit: query.limit,
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
    createDto: CreateMessageDto,
    idempotencyKey: string,
  ): Promise<EsfChatMessageEntity> {
    const existing = await this.chatMessageRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      return this.decryptMessage(existing);
    }

    const request = await this.requestRepository.findOne(requestId);
    if (!request) {
      throw new NotFoundException({
        type: 'https://errors.bthwani.com/esf/request_not_found',
        title: 'Request Not Found',
        status: 404,
        code: 'ESF-404-REQUEST-NOT-FOUND',
        detail: `Request ${requestId} not found`,
      });
    }

    const isRequester = request.requester_id === userId;
    let recipientId: string;
    let direction: EsfChatMessageDirection;

    if (isRequester) {
      const matches = await this.matchRepository.findByRequest(requestId);
      const acceptedMatch = matches.find((m) => m.status === 'accepted');
      if (!acceptedMatch) {
        throw new BadRequestException({
          type: 'https://errors.bthwani.com/esf/no_match',
          title: 'No Match',
          status: 400,
          code: 'ESF-400-NO-MATCH',
          detail: 'No accepted match found for this request',
        });
      }
      recipientId = acceptedMatch.donor_id;
      direction = EsfChatMessageDirection.REQUESTER_TO_DONOR;
    } else {
      const matches = await this.matchRepository.findByRequest(requestId);
      const isMatchedDonor = matches.some((m) => m.donor_id === userId && m.status === 'accepted');
      if (!isMatchedDonor) {
        throw new BadRequestException({
          type: 'https://errors.bthwani.com/esf/no_match',
          title: 'No Match',
          status: 400,
          code: 'ESF-400-NO-MATCH',
          detail: 'You are not a matched donor for this request',
        });
      }
      recipientId = request.requester_id;
      direction = EsfChatMessageDirection.DONOR_TO_REQUESTER;
    }

    const filteredBody = this.filterContent(createDto.body);

    const message = new EsfChatMessageEntity();
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

  private encryptMessage(body: string): string {
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
  }

  private decryptMessage(message: EsfChatMessageEntity): EsfChatMessageEntity {
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
      this.logger.error('Failed to decrypt message', { error, messageId: message.id });
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
