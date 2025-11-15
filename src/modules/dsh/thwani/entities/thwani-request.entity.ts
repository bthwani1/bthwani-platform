import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum ThwaniRequestStatus {
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

export enum ThwaniRoutingType {
  CAPTAIN = 'captain',
  MANUAL_QUEUE = 'manual_queue',
}

/**
 * Thwani Request Entity (ثواني)
 *
 * Represents an instant help request in the DSH platform.
 * All requests are instant help type (no specialized services).
 */
@Entity({ tableName: 'thwani_requests' })
@Index({ properties: ['requester_id', 'status', 'created_at'] })
@Index({ properties: ['status', 'created_at'] })
@Index({ properties: ['category_id', 'status'] })
@Index({ properties: ['routing_type', 'status'] })
@Index({ properties: ['assigned_captain_id', 'status'] })
@Index({ properties: ['idempotency_key'] })
@Index({ properties: ['ledger_transaction_id'] })
export class ThwaniRequestEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 255 })
  requester_id!: string;

  @Property({ type: 'uuid', nullable: true })
  category_id?: string;

  @Property({ type: 'varchar', length: 100, nullable: true })
  dsh_category_code?: string; // e.g., 'dsh_quick_task' for Thwani

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

  @Property({ type: 'varchar', length: 255, nullable: true })
  region?: string;

  @Enum(() => ThwaniRequestStatus)
  status: ThwaniRequestStatus = ThwaniRequestStatus.PENDING;

  @Property({ type: 'varchar', length: 50, nullable: true })
  routing_type?: ThwaniRoutingType;

  @Property({ type: 'varchar', length: 255, nullable: true })
  assigned_captain_id?: string;

  // Pricing (scope-based: global → region → category → category+region)
  @Property({ type: 'integer', nullable: true })
  price_min_yer?: number;

  @Property({ type: 'integer', nullable: true })
  price_max_yer?: number;

  @Property({ type: 'integer', nullable: true })
  price_final_yer?: number;

  @Property({ type: 'boolean', default: false })
  pricing_requires_review: boolean = false;

  // Proof of close (6-digit code)
  @Property({ type: 'varchar', length: 6, nullable: true })
  close_code?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  close_recipient_name?: string;

  @Property({ type: 'timestamp', nullable: true })
  closed_at?: Date;

  // Ledger integration (Wallet=Ledger constraint: ledger entries only, no bank payouts)
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

