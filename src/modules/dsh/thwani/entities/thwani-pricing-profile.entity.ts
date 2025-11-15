import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

/**
 * Pricing Scope for Thwani requests
 *
 * Follows DSH pricing pattern: global → region → category → category+region
 */
export enum ThwaniPricingScope {
  GLOBAL = 'global',
  REGION = 'region',
  CATEGORY = 'category',
  CATEGORY_REGION = 'category_region',
}

/**
 * Thwani Pricing Profile Entity
 *
 * Defines price ranges and ceilings for instant help requests.
 * Reuses DSH pricing scope pattern (global → region → category → category+region).
 */
@Entity({ tableName: 'thwani_pricing_profiles' })
@Index({ properties: ['scope', 'scope_value'] })
@Index({ properties: ['category_id', 'is_active'] })
@Index({ properties: ['region', 'is_active'] })
export class ThwaniPricingProfileEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Enum(() => ThwaniPricingScope)
  scope!: ThwaniPricingScope;

  @Property({ type: 'varchar', length: 255, nullable: true })
  scope_value?: string;

  @Property({ type: 'uuid', nullable: true })
  category_id?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  region?: string;

  @Property({ type: 'integer' })
  min_price_yer!: number;

  @Property({ type: 'integer' })
  max_price_yer!: number;

  @Property({ type: 'boolean', default: false })
  requires_review: boolean = false;

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true;

  @Property({ type: 'timestamp', nullable: true })
  effective_from?: Date;

  @Property({ type: 'timestamp', nullable: true })
  effective_until?: Date;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();
}

