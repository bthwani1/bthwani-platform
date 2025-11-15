import { Entity, PrimaryKey, Property, Index, Enum } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum AccountType {
  USER = 'user',
  PARTNER = 'partner',
  CAPTAIN = 'captain',
  PLATFORM = 'platform',
  SERVICE = 'service',
  CHANNEL = 'channel',
}

export enum AccountStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  CLOSED = 'closed',
}

@Entity({ tableName: 'wlt_accounts' })
@Index({ properties: ['account_type', 'status'] })
@Index({ properties: ['owner_id', 'account_type'] })
@Index({ properties: ['created_at'] })
export class AccountEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Enum(() => AccountType)
  account_type!: AccountType;

  @Property({ type: 'varchar', length: 255, nullable: true })
  owner_id?: string;

  @Property({ type: 'varchar', length: 64, nullable: true })
  service_ref?: string;

  @Enum(() => AccountStatus)
  status: AccountStatus = AccountStatus.ACTIVE;

  @Property({ type: 'jsonb', nullable: true })
  limits?: {
    max_balance?: number;
    max_transfer?: number;
    daily_limit?: number;
  };

  @Property({ type: 'jsonb', nullable: true })
  attributes?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', default: 'now()', onUpdate: () => new Date() })
  updated_at: Date = new Date();
}
