import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum FeeProfileScope {
  GLOBAL = 'global',
  REGION = 'region',
  CATEGORY = 'category',
  SUBCATEGORY = 'subcategory',
}

export enum FeeProfileStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

@Entity({ tableName: 'knz_fee_profiles' })
export class FeeProfileEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 100, unique: true })
  code!: string;

  @Property({ type: 'varchar', length: 255 })
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Enum(() => FeeProfileScope)
  scope!: FeeProfileScope;

  @Property({ type: 'varchar', length: 100, nullable: true })
  region_code?: string;

  @Property({ type: 'uuid', nullable: true })
  category_id?: string;

  @Property({ type: 'uuid', nullable: true })
  subcategory_id?: string;

  @Property({ type: 'decimal', precision: 5, scale: 2 })
  fee_percentage!: string;

  @Property({ type: 'jsonb', nullable: true })
  fee_overrides?: Array<{
    condition: Record<string, unknown>;
    fee_percentage: string;
    effective_from?: Date;
    effective_until?: Date;
  }>;

  @Enum(() => FeeProfileStatus)
  status: FeeProfileStatus = FeeProfileStatus.ACTIVE;

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
