import { Entity, PrimaryKey, Property, Index, Enum, ManyToOne } from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { AccountEntity } from './account.entity';

export enum HoldStatus {
  ACTIVE = 'active',
  RELEASED = 'released',
  CAPTURED = 'captured',
  FORFEITED = 'forfeited',
}

@Entity({ tableName: 'wlt_holds' })
@Index({ properties: ['account_id', 'status'] })
@Index({ properties: ['external_ref', 'service_ref'] })
@Index({ properties: ['created_at'] })
export class HoldEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne(() => AccountEntity)
  account!: AccountEntity;

  @Property({ type: 'uuid' })
  account_id!: string;

  @Enum(() => HoldStatus)
  status: HoldStatus = HoldStatus.ACTIVE;

  @Property({ type: 'bigint' })
  amount!: number;

  @Property({ type: 'varchar', length: 3, default: 'YER' })
  currency: string = 'YER';

  @Property({ type: 'varchar', length: 255 })
  external_ref!: string;

  @Property({ type: 'varchar', length: 64 })
  service_ref!: string;

  @Property({ type: 'jsonb', nullable: true })
  release_rules?: {
    release_days?: number;
    no_show_split?: number;
  };

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', nullable: true })
  released_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  captured_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  forfeited_at?: Date;
}
