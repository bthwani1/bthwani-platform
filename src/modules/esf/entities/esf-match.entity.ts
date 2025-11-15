import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum EsfMatchStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

@Entity({ tableName: 'esf_matches' })
@Index({ properties: ['request_id', 'created_at'] })
@Index({ properties: ['donor_id', 'status'] })
@Index({ properties: ['request_id', 'donor_id'] })
export class EsfMatchEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'uuid' })
  request_id!: string;

  @Property({ type: 'varchar', length: 255 })
  donor_id!: string;

  @Enum(() => EsfMatchStatus)
  status: EsfMatchStatus = EsfMatchStatus.PENDING;

  @Property({ type: 'integer', nullable: true })
  distance_km?: number;

  @Property({ type: 'timestamp', nullable: true })
  notified_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  accepted_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  declined_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  expired_at?: Date;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();
}
