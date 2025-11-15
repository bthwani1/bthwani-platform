import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

/**
 * KWD Listing status enum
 */
export enum ListingStatus {
  PENDING_REVIEW = 'pending_review',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  CLOSED = 'closed',
  HIDDEN = 'hidden',
}

/**
 * Entity type enum (employer type)
 */
export enum EntityType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
}

/**
 * Location value object
 */
export interface Location {
  region: string;
  city: string;
  geo?: {
    lat: number;
    lon: number;
  };
}

/**
 * Attachment value object
 */
export interface Attachment {
  url: string;
  type: 'image' | 'document';
  filename?: string;
}

/**
 * KWD Listing Entity
 * Represents a job listing on KoWADER platform.
 *
 * @entity
 * @table kwd_listings
 */
@Entity({ tableName: 'kwd_listings' })
@Index({ properties: ['status', 'created_at'] })
@Index({ properties: ['owner_id'] })
@Index({ properties: ['is_sponsored', 'boost_score'] })
export class ListingEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Enum(() => EntityType)
  entity_type!: EntityType;

  @Property({ type: 'varchar', length: 200 })
  @Index()
  title!: string;

  @Property({ type: 'text' })
  description!: string;

  @Property({ type: 'jsonb' })
  location!: Location;

  @Property({ type: 'jsonb' })
  skills!: string[];

  @Property({ type: 'smallint' })
  experience_years!: number;

  @Property({ type: 'jsonb', nullable: true })
  attachments?: Attachment[];

  @Property({ type: 'boolean', default: false })
  @Index()
  is_sponsored: boolean = false;

  @Property({ type: 'float', default: 0 })
  boost_score: number = 0;

  @Enum(() => ListingStatus)
  @Index()
  status: ListingStatus = ListingStatus.PENDING_REVIEW;

  @Property({ type: 'uuid' })
  @Index()
  owner_id!: string;

  @Property({ type: 'varchar', length: 500, nullable: true })
  rejection_reason?: string;

  @Property({ type: 'uuid', nullable: true })
  approved_by?: string;

  @Property({ type: 'timestamp', nullable: true })
  approved_at?: Date;

  @Property({ type: 'integer', default: 0 })
  view_count: number = 0;

  @Property({ type: 'integer', default: 0 })
  report_count: number = 0;

  @Property({ type: 'timestamp', default: 'now()' })
  @Index()
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();

  @Property({ type: 'timestamp', nullable: true })
  closed_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  hidden_at?: Date;
}
