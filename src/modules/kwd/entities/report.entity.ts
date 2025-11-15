import { Entity, PrimaryKey, Property, Enum, Index, ManyToOne } from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { ListingEntity } from './listing.entity';

/**
 * Report reason enum
 */
export enum ReportReason {
  FRAUD = 'fraud',
  SPAM = 'spam',
  OFFENSIVE = 'offensive',
  MISLEADING = 'misleading',
  DUPLICATE = 'duplicate',
  OTHER = 'other',
}

/**
 * Report status enum
 */
export enum ReportStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

/**
 * KWD Report Entity
 * Represents an abuse/fraud report for a job listing.
 *
 * @entity
 * @table kwd_reports
 */
@Entity({ tableName: 'kwd_reports' })
@Index({ properties: ['status', 'created_at'] })
@Index({ properties: ['listing_id', 'reporter_id'] })
export class ReportEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'uuid' })
  @Index()
  listing_id!: string;

  @ManyToOne(() => ListingEntity, { nullable: true })
  listing?: ListingEntity;

  @Property({ type: 'uuid' })
  @Index()
  reporter_id!: string;

  @Enum(() => ReportReason)
  @Index()
  reason!: ReportReason;

  @Property({ type: 'varchar', length: 1000, nullable: true })
  description?: string;

  @Enum(() => ReportStatus)
  @Index()
  status: ReportStatus = ReportStatus.PENDING;

  @Property({ type: 'varchar', length: 1000, nullable: true })
  resolution?: string;

  @Property({ type: 'uuid', nullable: true })
  resolved_by?: string;

  @Property({ type: 'timestamp', default: 'now()' })
  @Index()
  created_at: Date = new Date();

  @Property({ type: 'timestamp', nullable: true })
  resolved_at?: Date;

  @Property({ type: 'smallint', default: 1 })
  severity: number = 1;
}
