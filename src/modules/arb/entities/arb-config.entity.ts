import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum ConfigScope {
  GLOBAL = 'global',
  REGION = 'region',
  CATEGORY = 'category',
  SUBCATEGORY = 'subcategory',
}

@Entity({ tableName: 'arb_configs' })
@Index({ properties: ['scope', 'scope_value', 'is_active'] })
@Index({ properties: ['idempotency_key'] })
export class ArbConfigEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Enum(() => ConfigScope)
  scope!: ConfigScope;

  @Property({ type: 'varchar', length: 255, nullable: true })
  scope_value?: string;

  @Property({ type: 'integer', nullable: true })
  release_days?: number;

  @Property({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  no_show_keep_pct?: number;

  @Property({ type: 'jsonb', nullable: true })
  no_show_cap?: {
    amount: string;
    currency: string;
  };

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true;

  @Property({ type: 'varchar', length: 255, nullable: true })
  created_by?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  updated_by?: string;

  @Property({ type: 'uuid', nullable: true })
  idempotency_key?: string;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();
}
