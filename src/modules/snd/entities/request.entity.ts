import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum SndRequestType {
  INSTANT = 'instant',
  SPECIALIZED = 'specialized',
}

export enum SndRequestStatus {
  PENDING = 'pending',
  PRICING_REVIEW = 'pricing_review',
  ROUTED = 'routed',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ESCALATED = 'escalated',
  DISPUTED = 'disputed',
  CLOSED = 'closed',
}

export enum SndRoutingType {
  CAPTAIN = 'captain',
  SPECIALIZED_PROVIDER = 'specialized_provider',
  MANUAL_QUEUE = 'manual_queue',
}

@Entity({ tableName: 'snd_requests' })
@Index({ properties: ['requester_id', 'status', 'created_at'] })
@Index({ properties: ['type', 'status', 'created_at'] })
@Index({ properties: ['category_id', 'status'] })
@Index({ properties: ['routing_type', 'status'] })
@Index({ properties: ['assigned_captain_id', 'status'] })
@Index({ properties: ['assigned_provider_id', 'status'] })
@Index({ properties: ['idempotency_key'] })
@Index({ properties: ['ledger_transaction_id'] })
export class SndRequestEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 255 })
  requester_id!: string;

  @Enum(() => SndRequestType)
  type!: SndRequestType;

  @Property({ type: 'uuid', nullable: true })
  category_id?: string;

  @Property({ type: 'varchar', length: 500 })
  title!: string;

  @Property({ type: 'text' })
  description!: string;

  @Property({ type: 'jsonb', nullable: true })
  images?: string[];

  @Property({ type: 'jsonb', nullable: true })
  location?: { lat: number; lon: number };

  @Property({ type: 'varchar', length: 255, nullable: true })
  address?: string;

  @Enum(() => SndRequestStatus)
  status: SndRequestStatus = SndRequestStatus.PENDING;

  @Property({ type: 'varchar', length: 50, nullable: true })
  routing_type?: SndRoutingType;

  @Property({ type: 'varchar', length: 255, nullable: true })
  assigned_captain_id?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  assigned_provider_id?: string;

  // Pricing (instant only)
  @Property({ type: 'integer', nullable: true })
  price_min_yer?: number;

  @Property({ type: 'integer', nullable: true })
  price_max_yer?: number;

  @Property({ type: 'integer', nullable: true })
  price_final_yer?: number;

  @Property({ type: 'boolean', default: false })
  pricing_requires_review: boolean = false;

  // Proof of close (instant only)
  @Property({ type: 'varchar', length: 6, nullable: true })
  close_code?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  close_recipient_name?: string;

  @Property({ type: 'timestamp', nullable: true })
  closed_at?: Date;

  // Ledger integration (instant only)
  @Property({ type: 'uuid', nullable: true })
  ledger_transaction_id?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  ledger_entry_type?: string;

  // Timestamps
  @Property({ type: 'timestamp', nullable: true })
  priced_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  routed_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  accepted_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  in_progress_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  cancelled_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  escalated_at?: Date;

  @Property({ type: 'uuid', nullable: true })
  idempotency_key?: string;

  @Property({ type: 'text', nullable: true })
  cancellation_reason?: string;

  @Property({ type: 'text', nullable: true })
  escalation_reason?: string;

  @Property({ type: 'text', nullable: true })
  dispute_reason?: string;

  @Property({ type: 'integer', nullable: true })
  resolution_time_minutes?: number;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();
}
