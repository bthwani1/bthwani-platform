import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum DshCategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

/**
 * DSH Category Entity
 *
 * Represents subcategories within DSH service:
 * - dsh_restaurants (مطاعم)
 * - dsh_supermarkets (سوبرماركت/بقالات)
 * - dsh_fruits_veggies (خضار وفواكه)
 * - dsh_fashion (أناقتي)
 * - dsh_sweets_cafes (حلا)
 * - dsh_global_stores (متاجر عالمية)
 * - dsh_quick_task (طلبات فورية/مهام سريعة - Thwani)
 */
@Entity({ tableName: 'dsh_categories' })
@Index({ properties: ['code'] })
@Index({ properties: ['status', 'sort_order'] })
@Index({ properties: ['is_featured'] })
export class DshCategoryEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 100, unique: true })
  code!: string;

  @Property({ type: 'varchar', length: 255 })
  name_ar!: string;

  @Property({ type: 'varchar', length: 255 })
  name_en!: string;

  @Property({ type: 'text', nullable: true })
  description_ar?: string;

  @Property({ type: 'text', nullable: true })
  description_en?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  icon_url?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  image_url?: string;

  @Enum(() => DshCategoryStatus)
  status: DshCategoryStatus = DshCategoryStatus.ACTIVE;

  @Property({ type: 'integer', default: 0 })
  sort_order: number = 0;

  @Property({ type: 'boolean', default: false })
  is_featured: boolean = false;

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true;

  // Smart Engine Tags
  @Property({ type: 'jsonb', nullable: true })
  tags?: string[]; // NEARBY, NEW, TRENDING, FAVORITE, SEASONAL, HIGH_VALUE

  // Region/City scoping
  @Property({ type: 'jsonb', nullable: true })
  available_regions?: string[]; // null = all regions

  @Property({ type: 'jsonb', nullable: true })
  available_cities?: string[]; // null = all cities

  // Runtime Variables
  @Property({ type: 'varchar', length: 255, nullable: true })
  var_enabled?: string; // e.g., VAR_DSH_CAT_RESTAURANTS_ENABLED

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

