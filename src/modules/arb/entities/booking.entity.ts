import { Entity, PrimaryKey, Property, Enum, Index, ManyToOne } from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { OfferEntity } from './offer.entity';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ATTENDED = 'attended',
  NO_SHOW = 'no_show',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  DISPUTED = 'disputed',
  RESOLVED = 'resolved',
}

export enum EscrowStatus {
  HOLD = 'hold',
  RELEASED = 'released',
  PARTIAL_RELEASE = 'partial_release',
  REFUNDED = 'refunded',
  CAPTURED = 'captured',
  ON_DISPUTE = 'on_dispute',
}

@Entity({ tableName: 'arb_bookings' })
@Index({ properties: ['customer_id', 'status', 'created_at'] })
@Index({ properties: ['partner_id', 'status', 'created_at'] })
@Index({ properties: ['offer_id', 'status'] })
@Index({ properties: ['idempotency_key'] })
@Index({ properties: ['escrow_transaction_id'] })
export class BookingEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'uuid' })
  offer_id!: string;

  @ManyToOne(() => OfferEntity, { nullable: true })
  offer?: OfferEntity;

  @Property({ type: 'varchar', length: 255 })
  customer_id!: string;

  @Property({ type: 'varchar', length: 255 })
  partner_id!: string;

  @Enum(() => BookingStatus)
  status: BookingStatus = BookingStatus.PENDING;

  @Enum(() => EscrowStatus)
  escrow_status: EscrowStatus = EscrowStatus.HOLD;

  @Property({ type: 'varchar', length: 255, nullable: true })
  escrow_transaction_id?: string;

  @Property({ type: 'jsonb' })
  deposit_amount!: {
    amount: string;
    currency: string;
  };

  @Property({ type: 'jsonb', nullable: true })
  final_amount?: {
    amount: string;
    currency: string;
  };

  @Property({ type: 'jsonb', nullable: true })
  slot?: {
    id: string;
    start_time: string;
    end_time: string;
    date: string;
  };

  @Property({ type: 'text', nullable: true })
  customer_notes?: string;

  @Property({ type: 'text', nullable: true })
  partner_notes?: string;

  @Property({ type: 'boolean', default: false })
  is_escalated: boolean = false;

  @Property({ type: 'varchar', length: 255, nullable: true })
  escalated_by?: string;

  @Property({ type: 'timestamp', nullable: true })
  escalated_at?: Date;

  @Property({ type: 'uuid', nullable: true })
  idempotency_key?: string;

  @Property({ type: 'timestamp', nullable: true })
  confirmed_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  attended_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  no_show_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  cancelled_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  dispute_raised_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  resolved_at?: Date;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();
}
