import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum ThwaniChatMessageDirection {
  REQUESTER_TO_CAPTAIN = 'requester_to_captain',
  CAPTAIN_TO_REQUESTER = 'captain_to_requester',
}

/**
 * Thwani Chat Message Entity
 *
 * Encrypted chat messages with phone masking for instant help requests.
 * Reuses DSH chat encryption pattern (AES-256-GCM).
 */
@Entity({ tableName: 'thwani_chat_messages' })
@Index({ properties: ['request_id', 'created_at'] })
@Index({ properties: ['sender_id', 'recipient_id', 'created_at'] })
@Index({ properties: ['idempotency_key'] })
export class ThwaniChatMessageEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'uuid' })
  request_id!: string;

  @Property({ type: 'varchar', length: 255 })
  sender_id!: string;

  @Property({ type: 'varchar', length: 255 })
  recipient_id!: string;

  @Enum(() => ThwaniChatMessageDirection)
  direction!: ThwaniChatMessageDirection;

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

  @Property({ type: 'boolean', default: false })
  is_urgent: boolean = false;

  @Property({ type: 'uuid', nullable: true })
  idempotency_key?: string;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();
}

