import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum EsfChatMessageDirection {
  REQUESTER_TO_DONOR = 'requester_to_donor',
  DONOR_TO_REQUESTER = 'donor_to_requester',
}

@Entity({ tableName: 'esf_chat_messages' })
@Index({ properties: ['request_id', 'created_at'] })
@Index({ properties: ['sender_id', 'recipient_id', 'created_at'] })
export class EsfChatMessageEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'uuid' })
  request_id!: string;

  @Property({ type: 'varchar', length: 255 })
  sender_id!: string;

  @Property({ type: 'varchar', length: 255 })
  recipient_id!: string;

  @Enum(() => EsfChatMessageDirection)
  direction!: EsfChatMessageDirection;

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

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'uuid', nullable: true })
  idempotency_key?: string;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();
}
