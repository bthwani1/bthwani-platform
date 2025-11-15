import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

@Entity({ tableName: 'esf_config' })
@Index({ properties: ['scope', 'key'] })
export class EsfConfigEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 100 })
  scope!: string;

  @Property({ type: 'varchar', length: 255 })
  key!: string;

  @Property({ type: 'text' })
  value!: string;

  @Property({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  updated_by?: string;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();
}
