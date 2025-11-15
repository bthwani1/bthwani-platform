import { Entity, PrimaryKey, Property, Enum, ManyToOne } from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { CategoryEntity } from './category.entity';

export enum ListingStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  PAUSED = 'paused',
  SOLD_OUT = 'sold_out',
  EXPIRED = 'expired',
  FLAGGED = 'flagged',
  SOFT_DISABLED = 'soft_disabled',
  HARD_DISABLED = 'hard_disabled',
}

export enum ListingPriority {
  NORMAL = 'normal',
  FEATURED = 'featured',
  SPONSORED = 'sponsored',
}

@Entity({ tableName: 'knz_listings' })
export class ListingEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 255 })
  seller_id!: string;

  @ManyToOne(() => CategoryEntity, { nullable: true })
  category?: CategoryEntity;

  @Property({ type: 'uuid', nullable: true })
  category_id?: string;

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

  @Property({ type: 'jsonb', nullable: true })
  price?: {
    amount: string;
    currency: string;
  };

  @Property({ type: 'integer', nullable: true })
  quantity?: number;

  @Enum(() => ListingStatus)
  status: ListingStatus = ListingStatus.DRAFT;

  @Enum(() => ListingPriority)
  priority: ListingPriority = ListingPriority.NORMAL;

  @Property({ type: 'integer', default: 0 })
  view_count: number = 0;

  @Property({ type: 'integer', default: 0 })
  search_count: number = 0;

  @Property({ type: 'integer', default: 0 })
  click_count: number = 0;

  @Property({ type: 'integer', default: 0 })
  report_count: number = 0;

  @Property({ type: 'jsonb', nullable: true })
  location?: {
    city?: string;
    district?: string;
    coordinates?: { lat: number; lon: number };
  };

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();

  @Property({ type: 'timestamp', nullable: true })
  approved_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  published_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  expired_at?: Date;

  @Property({ type: 'varchar', length: 255, nullable: true })
  approved_by?: string;
}
