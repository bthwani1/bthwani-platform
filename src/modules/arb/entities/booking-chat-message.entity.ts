import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum BookingChatMessageDirection {
  CUSTOMER_TO_PARTNER = 'customer_to_partner',
  PARTNER_TO_CUSTOMER = 'partner_to_customer',
}

@Entity({ tableName: 'arb_booking_chat_messages' })
@Index({ properties: ['booking_id', 'created_at'] })
@Index({ properties: ['sender_id', 'recipient_id', 'created_at'] })
@Index({ properties: ['idempotency_key'] })
export class BookingChatMessageEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'uuid' })
  booking_id!: string;

  @Property({ type: 'varchar', length: 255 })
  sender_id!: string;

  @Property({ type: 'varchar', length: 255 })
  recipient_id!: string;

  @Enum(() => BookingChatMessageDirection)
  direction!: BookingChatMessageDirection;

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
