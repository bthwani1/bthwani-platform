import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';

/**
 * Runtime configuration entity for control panel managed settings
 * Stores configuration values that can be updated without code deployment
 */
@Entity({ tableName: 'runtime_config' })
@Index({ properties: ['key'], unique: true })
export class RuntimeConfigEntity {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string;

  @Property({ type: 'varchar', length: 255, unique: true })
  key!: string;

  @Property({ type: 'text', nullable: true })
  value: string | null = null;

  @Property({ type: 'varchar', length: 50, nullable: true })
  type: 'string' | 'number' | 'boolean' | 'json' | null = null;

  @Property({ type: 'text', nullable: true })
  description: string | null = null;

  @Property({ type: 'boolean', default: false })
  isPlaceholder: boolean = false;

  @Property({ type: 'boolean', default: true })
  isActive: boolean = true;

  @Property({ type: 'boolean', default: false })
  isSensitive: boolean = false;

  @Property({ type: 'timestamp', defaultRaw: 'CURRENT_TIMESTAMP' })
  createdAt: Date = new Date();

  @Property({
    type: 'timestamp',
    defaultRaw: 'CURRENT_TIMESTAMP',
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();

  @Property({ type: 'varchar', length: 255, nullable: true })
  updatedBy: string | null = null;
}

