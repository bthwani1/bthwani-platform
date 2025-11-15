import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum AmendmentType {
  PRICE_QUOTE = 'price_quote',
  SCHEDULE_CHANGE = 'schedule_change',
}

export enum AmendmentStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity({ tableName: 'arb_booking_amendments' })
@Index({ properties: ['booking_id', 'status', 'created_at'] })
@Index({ properties: ['idempotency_key'] })
export class BookingAmendmentEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'uuid' })
  booking_id!: string;

  @Property({ type: 'varchar', length: 255 })
  initiator_id!: string;

  @Enum(() => AmendmentType)
  type!: AmendmentType;

  @Enum(() => AmendmentStatus)
  status: AmendmentStatus = AmendmentStatus.PENDING;

  @Property({ type: 'jsonb', nullable: true })
  price_change?: {
    old_amount: { amount: string; currency: string };
    new_amount: { amount: string; currency: string };
    reason?: string;
  };

  @Property({ type: 'jsonb', nullable: true })
  schedule_change?: {
    old_slot?: { id: string; start_time: string; end_time: string; date: string };
    new_slot: { id: string; start_time: string; end_time: string; date: string };
    reason?: string;
  };

  @Property({ type: 'text', nullable: true })
  notes?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  accepted_by?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  rejected_by?: string;

  @Property({ type: 'timestamp', nullable: true })
  accepted_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  rejected_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  expired_at?: Date;

  @Property({ type: 'uuid', nullable: true })
  idempotency_key?: string;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();
}
