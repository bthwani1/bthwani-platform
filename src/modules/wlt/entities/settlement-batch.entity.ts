import { Entity, PrimaryKey, Property, Index, Enum } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum BatchStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  EXPORTED = 'exported',
  RECONCILED = 'reconciled',
}

@Entity({ tableName: 'wlt_settlement_batches' })
@Index({ properties: ['status', 'created_at'] })
@Index({ properties: ['partner_id', 'status'] })
@Index({ properties: ['period_start', 'period_end'] })
export class SettlementBatchEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 255, nullable: true })
  partner_id?: string;

  @Enum(() => BatchStatus)
  status: BatchStatus = BatchStatus.DRAFT;

  @Property({ type: 'bigint', default: 0 })
  total_amount: number = 0;

  @Property({ type: 'varchar', length: 3, default: 'YER' })
  currency: string = 'YER';

  @Property({ type: 'timestamp' })
  period_start!: Date;

  @Property({ type: 'timestamp' })
  period_end!: Date;

  @Property({ type: 'uuid', nullable: true })
  first_approver_id?: string;

  @Property({ type: 'timestamp', nullable: true })
  first_approved_at?: Date;

  @Property({ type: 'uuid', nullable: true })
  second_approver_id?: string;

  @Property({ type: 'timestamp', nullable: true })
  second_approved_at?: Date;

  @Property({ type: 'varchar', length: 512, nullable: true })
  export_file_url?: string;

  @Property({ type: 'timestamp', nullable: true })
  exported_at?: Date;

  @Property({ type: 'jsonb', nullable: true })
  criteria?: {
    partner_ids?: string[];
    service_refs?: string[];
    date_from?: string;
    date_to?: string;
  };

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', default: 'now()', onUpdate: () => new Date() })
  updated_at: Date = new Date();
}
