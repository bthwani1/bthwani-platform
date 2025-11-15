import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum SndCategoryType {
  INSTANT_ONLY = 'instant_only',
  SPECIALIZED_ONLY = 'specialized_only',
  BOTH = 'both',
}

@Entity({ tableName: 'snd_categories' })
@Index({ properties: ['code'] })
@Index({ properties: ['type', 'is_active'] })
export class SndCategoryEntity {
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

  @Enum(() => SndCategoryType)
  type: SndCategoryType = SndCategoryType.BOTH;

  @Property({ type: 'varchar', length: 255, nullable: true })
  icon_url?: string;

  @Property({ type: 'integer', default: 0 })
  sort_order: number = 0;

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true;

  @Property({ type: 'boolean', default: false })
  pricing_requires_review: boolean = false;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();
}
