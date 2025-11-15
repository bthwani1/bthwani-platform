import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum ChatMessageDirection {
  USER_TO_SELLER = 'user_to_seller',
  SELLER_TO_USER = 'seller_to_user',
}

@Entity({ tableName: 'knz_chat_messages' })
@Index({ properties: ['listing_id', 'created_at'] })
@Index({ properties: ['sender_id', 'recipient_id', 'created_at'] })
export class ChatMessageEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'uuid' })
  listing_id!: string;

  @Property({ type: 'varchar', length: 255 })
  sender_id!: string;

  @Property({ type: 'varchar', length: 255 })
  recipient_id!: string;

  @Enum(() => ChatMessageDirection)
  direction!: ChatMessageDirection;

  @Property({ type: 'text' })
  body_encrypted!: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  phone_masked?: string;

  @Property({ type: 'jsonb', nullable: true })
  links_masked?: string[];

  @Property({ type: 'boolean', default: false })
  is_read: boolean = false;

  @Property({ type: 'timestamp', nullable: true })
  read_at?: Date;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();
}
