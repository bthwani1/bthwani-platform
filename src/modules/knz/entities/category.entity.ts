import { Entity, PrimaryKey, Property, Enum, OneToMany, Collection } from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { ListingEntity } from './listing.entity';

export enum CategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

@Entity({ tableName: 'knz_categories' })
export class CategoryEntity {
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

  @Property({ type: 'uuid', nullable: true })
  parent_id?: string;

  @Property({ type: 'integer', default: 0 })
  sort_order: number = 0;

  @Enum(() => CategoryStatus)
  status: CategoryStatus = CategoryStatus.ACTIVE;

  @Property({ type: 'boolean', default: false })
  is_sensitive: boolean = false;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @OneToMany(() => ListingEntity, (listing) => listing.category)
  listings = new Collection<ListingEntity>(this);

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();

  @Property({ type: 'varchar', length: 255, nullable: true })
  created_by?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  updated_by?: string;
}
