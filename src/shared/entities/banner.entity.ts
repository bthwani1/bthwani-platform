import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum BannerType {
  DSH = 'dsh',
  KNZ = 'knz',
  ARB = 'arb',
}

export enum BannerActionType {
  OPEN_CATEGORY = 'open_category',
  OPEN_STORE = 'open_store',
  OPEN_LISTING = 'open_listing',
  OPEN_OFFER = 'open_offer',
  OPEN_FLOW = 'open_flow',
}

export enum BannerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

/**
 * Banner Entity
 *
 * Dynamic banners for DSH, KNZ, and ARB services
 */
@Entity({ tableName: 'banners' })
@Index({ properties: ['type', 'status', 'priority'] })
@Index({ properties: ['start_date', 'end_date'] })
@Index({ properties: ['is_active'] })
export class BannerEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Enum(() => BannerType)
  type!: BannerType;

  @Property({ type: 'varchar', length: 255 })
  title_ar!: string;

  @Property({ type: 'varchar', length: 255 })
  title_en!: string;

  @Property({ type: 'text', nullable: true })
  description_ar?: string;

  @Property({ type: 'text', nullable: true })
  description_en?: string;

  @Property({ type: 'varchar', length: 500 })
  image_url!: string;

  @Enum(() => BannerActionType)
  action_type!: BannerActionType;

  @Property({ type: 'varchar', length: 500 })
  action_target!: string; // category code, store id, listing id, etc.

  @Property({ type: 'integer', default: 0 })
  priority: number = 0;

  @Property({ type: 'jsonb', nullable: true })
  tags?: string[]; // NEARBY, NEW, TRENDING, SEASONAL, HIGH_VALUE

  @Property({ type: 'jsonb', nullable: true })
  available_regions?: string[]; // null = all regions

  @Property({ type: 'jsonb', nullable: true })
  available_cities?: string[]; // null = all cities

  @Property({ type: 'timestamp', nullable: true })
  start_date?: Date;

  @Property({ type: 'timestamp', nullable: true })
  end_date?: Date;

  @Enum(() => BannerStatus)
  status: BannerStatus = BannerStatus.ACTIVE;

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();

  @Property({ type: 'varchar', length: 255, nullable: true })
  created_by?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  updated_by?: string;
}

