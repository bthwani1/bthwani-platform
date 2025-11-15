import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum SndChatMessageDirection {
  REQUESTER_TO_CAPTAIN = 'requester_to_captain',
  CAPTAIN_TO_REQUESTER = 'captain_to_requester',
  REQUESTER_TO_PROVIDER = 'requester_to_provider',
  PROVIDER_TO_REQUESTER = 'provider_to_requester',
}

@Entity({ tableName: 'snd_chat_messages' })
@Index({ properties: ['request_id', 'created_at'] })
@Index({ properties: ['sender_id', 'recipient_id', 'created_at'] })
@Index({ properties: ['idempotency_key'] })
export class SndChatMessageEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'uuid' })
  request_id!: string;

  @Property({ type: 'varchar', length: 255 })
  sender_id!: string;

  @Property({ type: 'varchar', length: 255 })
  recipient_id!: string;

  @Enum(() => SndChatMessageDirection)
  direction!: SndChatMessageDirection;

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
