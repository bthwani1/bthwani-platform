import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ChatMessageRepository } from '../repositories/chat-message.repository';
import { ListingRepository } from '../repositories/listing.repository';
import { ChatMessageEntity, ChatMessageDirection } from '../entities/chat-message.entity';
import { CreateChatMessageDto } from '../dto/public/create-chat-message.dto';
import { ListChatMessagesDto } from '../dto/public/list-chat-messages.dto';
import * as crypto from 'crypto';

@Injectable()
export class ChatService {
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-gcm';

  constructor(
    private readonly chatMessageRepository: ChatMessageRepository,
    private readonly listingRepository: ListingRepository,
  ) {
    this.encryptionKey = process.env.CHAT_ENCRYPTION_KEY || 'default-key-change-in-production';
  }

  async getMessages(
    query: ListChatMessagesDto,
    userId: string,
  ): Promise<{
    items: ChatMessageEntity[];
    nextCursor?: string;
  }> {
    const listing = await this.listingRepository.findOne(query.listing_id);
    if (!listing) {
      throw new NotFoundException(`Listing ${query.listing_id} not found`);
    }

    const otherUserId = listing.seller_id === userId ? listing.seller_id : listing.seller_id;
    const limit = query.limit || 50;
    const messages = await this.chatMessageRepository.findByParticipants(
      userId,
      otherUserId,
      query.listing_id,
      {
        cursor: query.cursor,
        limit: limit + 1,
      },
    );

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const decryptedItems = items.map((msg) => this.decryptMessage(msg));
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items: decryptedItems,
      ...(nextCursor && { nextCursor }),
    };
  }

  async createMessage(createDto: CreateChatMessageDto, userId: string): Promise<ChatMessageEntity> {
    const listing = await this.listingRepository.findOne(createDto.listing_id);
    if (!listing) {
      throw new NotFoundException(`Listing ${createDto.listing_id} not found`);
    }

    if (listing.seller_id === userId) {
      throw new BadRequestException('Cannot send message to own listing');
    }

    const message = new ChatMessageEntity();
    message.listing_id = createDto.listing_id;
    message.sender_id = userId;
    message.recipient_id = listing.seller_id;
    message.direction = ChatMessageDirection.USER_TO_SELLER;
    message.body_encrypted = this.encryptMessage(createDto.body);
    message.phone_masked = this.maskPhone(userId);
    message.links_masked = this.extractAndMaskLinks(createDto.body);

    const saved = await this.chatMessageRepository.create(message);
    return this.decryptMessage(saved);
  }

  async markAsRead(messageIds: string[], userId: string): Promise<void> {
    await this.chatMessageRepository.markAsRead(messageIds, userId);
  }

  private encryptMessage(body: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      Buffer.from(this.encryptionKey, 'hex'),
      iv,
    );
    let encrypted = cipher.update(body, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted,
      authTag: authTag.toString('hex'),
    });
  }

  private decryptMessage(message: ChatMessageEntity): ChatMessageEntity {
    try {
      const data = JSON.parse(message.body_encrypted);
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        Buffer.from(this.encryptionKey, 'hex'),
        Buffer.from(data.iv, 'hex'),
      );
      decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      const decryptedMessage = { ...message };
      decryptedMessage.body_encrypted = decrypted;
      return decryptedMessage;
    } catch (error) {
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
    return matches.map((url) => url.replace(/(https?:\/\/[^\s]+)/, '***'));
  }
}
