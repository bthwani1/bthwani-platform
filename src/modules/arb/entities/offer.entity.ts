import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum OfferStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  EXPIRED = 'expired',
  DELETED = 'deleted',
}

export enum DepositPolicy {
  FULL_REFUND = 'full_refund',
  PARTIAL_REFUND = 'partial_refund',
  NO_REFUND = 'no_refund',
}

@Entity({ tableName: 'arb_offers' })
@Index({ properties: ['partner_id', 'status', 'created_at'] })
@Index({ properties: ['category_id', 'subcategory_id', 'status'] })
@Index({ properties: ['region_code', 'status'] })
@Index({ properties: ['idempotency_key'] })
export class OfferEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 255 })
  partner_id!: string;

  @Property({ type: 'varchar', length: 500 })
  title_ar!: string;

  @Property({ type: 'varchar', length: 500 })
  title_en!: string;

  @Property({ type: 'text', nullable: true })
  description_ar?: string;

  @Property({ type: 'text', nullable: true })
  description_en?: string;

  @Property({ type: 'jsonb' })
  images!: string[];

  @Property({ type: 'jsonb' })
  price!: {
    amount: string;
    currency: string;
  };

  @Property({ type: 'jsonb' })
  deposit_amount!: {
    amount: string;
    currency: string;
  };

  @Property({ type: 'uuid', nullable: true })
  category_id?: string;

  @Property({ type: 'uuid', nullable: true })
  subcategory_id?: string;

  @Property({ type: 'varchar', length: 50, nullable: true })
  region_code?: string;

  @Property({ type: 'jsonb', nullable: true })
  location?: {
    city?: string;
    district?: string;
    coordinates?: { lat: number; lon: number };
  };

  @Enum(() => OfferStatus)
  status: OfferStatus = OfferStatus.DRAFT;

  @Enum(() => DepositPolicy)
  deposit_policy: DepositPolicy = DepositPolicy.FULL_REFUND;

  @Property({ type: 'integer', nullable: true })
  release_days?: number;

  @Property({ type: 'jsonb', nullable: true })
  slots?: Array<{
    id: string;
    start_time: string;
    end_time: string;
    date: string;
    available: boolean;
  }>;

  @Property({ type: 'jsonb', nullable: true })
  calendar_config?: {
    timezone?: string;
    working_hours?: Record<string, { start: string; end: string }>;
    blocked_dates?: string[];
  };

  @Property({ type: 'integer', default: 0 })
  booking_count: number = 0;

  @Property({ type: 'integer', default: 0 })
  view_count: number = 0;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'uuid', nullable: true })
  idempotency_key?: string;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();

  @Property({ type: 'timestamp', nullable: true })
  published_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  expired_at?: Date;
}
