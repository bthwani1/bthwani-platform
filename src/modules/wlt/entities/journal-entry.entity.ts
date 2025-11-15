import { Entity, PrimaryKey, Property, Index, Enum, ManyToOne } from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { AccountEntity } from './account.entity';

export enum EntryType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export enum EntryCategory {
  TRANSFER = 'transfer',
  HOLD = 'hold',
  RELEASE = 'release',
  CAPTURE = 'capture',
  CHARGE = 'charge',
  REFUND = 'refund',
  SETTLEMENT = 'settlement',
  ADJUSTMENT = 'adjustment',
  FEE = 'fee',
  SUBSCRIPTION_FEE = 'subscription_fee',
  SALE = 'sale',
  COMMISSION = 'commission',
  REVENUE = 'revenue',
}

export enum EntryStatus {
  PENDING = 'pending',
  POSTED = 'posted',
  REVERSED = 'reversed',
}

@Entity({ tableName: 'wlt_journal_entries' })
@Index({ properties: ['account_id', 'created_at'] })
@Index({ properties: ['transaction_ref', 'entry_type'] })
@Index({ properties: ['service_ref', 'category'] })
@Index({ properties: ['batch_id'] })
@Index({ properties: ['created_at'] })
export class JournalEntryEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne(() => AccountEntity)
  account!: AccountEntity;

  @Property({ type: 'uuid' })
  account_id!: string;

  @Enum(() => EntryType)
  entry_type!: EntryType;

  @Enum(() => EntryCategory)
  category!: EntryCategory;

  @Property({ type: 'bigint' })
  amount!: number;

  @Property({ type: 'varchar', length: 3, default: 'YER' })
  currency: string = 'YER';

  @Property({ type: 'varchar', length: 255, nullable: true })
  transaction_ref?: string;

  @Property({ type: 'varchar', length: 64, nullable: true })
  service_ref?: string;

  @Property({ type: 'uuid', nullable: true })
  batch_id?: string;

  @Enum(() => EntryStatus)
  status: EntryStatus = EntryStatus.PENDING;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', nullable: true })
  posted_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  reversed_at?: Date;
}
