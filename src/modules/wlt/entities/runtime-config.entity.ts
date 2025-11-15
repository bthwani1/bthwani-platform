import { Entity, PrimaryKey, Property, Index, Enum } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum ConfigScope {
  GLOBAL = 'global',
  SERVICE = 'service',
  CITY = 'city',
  ZONE = 'zone',
}

export enum ConfigStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ROLLED_BACK = 'rolled_back',
}

@Entity({ tableName: 'wlt_runtime_config' })
@Index({ properties: ['key', 'scope', 'scope_value'] })
@Index({ properties: ['status', 'updated_at'] })
@Index({ properties: ['key', 'status', 'scope'] })
export class RuntimeConfigEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 128 })
  key!: string;

  @Enum(() => ConfigScope)
  scope!: ConfigScope;

  @Property({ type: 'varchar', length: 255, nullable: true })
  scope_value?: string;

  @Property({ type: 'text' })
  value!: string;

  @Enum(() => ConfigStatus)
  status: ConfigStatus = ConfigStatus.DRAFT;

  @Property({ type: 'uuid', nullable: true })
  published_by?: string;

  @Property({ type: 'timestamp', nullable: true })
  published_at?: Date;

  @Property({ type: 'uuid', nullable: true })
  rolled_back_by?: string;

  @Property({ type: 'timestamp', nullable: true })
  rolled_back_at?: Date;

  @Property({ type: 'jsonb', nullable: true })
  previous_value?: string;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', default: 'now()', onUpdate: () => new Date() })
  updated_at: Date = new Date();
}
