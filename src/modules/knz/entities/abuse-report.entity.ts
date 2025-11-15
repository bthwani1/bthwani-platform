import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum AbuseReportType {
  SPAM = 'spam',
  FRAUD = 'fraud',
  INAPPROPRIATE_CONTENT = 'inappropriate_content',
  COUNTERFEIT = 'counterfeit',
  WRONG_CATEGORY = 'wrong_category',
  MISLEADING = 'misleading',
  OTHER = 'other',
}

export enum AbuseReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
  ESCALATED = 'escalated',
}

@Entity({ tableName: 'knz_abuse_reports' })
export class AbuseReportEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'uuid' })
  listing_id!: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  reporter_id?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  reporter_email?: string;

  @Enum(() => AbuseReportType)
  report_type!: AbuseReportType;

  @Property({ type: 'text' })
  description!: string;

  @Property({ type: 'jsonb', nullable: true })
  evidence?: string[];

  @Enum(() => AbuseReportStatus)
  status: AbuseReportStatus = AbuseReportStatus.PENDING;

  @Property({ type: 'varchar', length: 255, nullable: true })
  reviewed_by?: string;

  @Property({ type: 'text', nullable: true })
  review_notes?: string;

  @Property({ type: 'jsonb', nullable: true })
  moderation_action?: {
    action: 'warn' | 'hide' | 'soft_block' | 'hard_block' | 'escalate';
    reason: string;
    effective_until?: Date;
  };

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();

  @Property({ type: 'timestamp', nullable: true })
  resolved_at?: Date;
}
