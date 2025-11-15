import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum SndConfigScope {
  GLOBAL = 'global',
  REGION = 'region',
  CATEGORY = 'category',
  CATEGORY_REGION = 'category_region',
}

@Entity({ tableName: 'snd_configs' })
@Index({ properties: ['scope', 'scope_value', 'key'] })
export class SndConfigEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Enum(() => SndConfigScope)
  scope!: SndConfigScope;

  @Property({ type: 'varchar', length: 255, nullable: true })
  scope_value?: string;

  @Property({ type: 'uuid', nullable: true })
  category_id?: string;

  @Property({ type: 'varchar', length: 255 })
  key!: string;

  @Property({ type: 'jsonb' })
  value!: Record<string, unknown>;

  @Property({ type: 'text', nullable: true })
  description?: string;

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
