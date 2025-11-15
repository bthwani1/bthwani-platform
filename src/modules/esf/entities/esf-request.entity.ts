import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum EsfRequestStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  CLOSED = 'closed',
}

export enum BloodType {
  A = 'A',
  B = 'B',
  AB = 'AB',
  O = 'O',
}

export enum RhFactor {
  POSITIVE = '+',
  NEGATIVE = '-',
}

@Entity({ tableName: 'esf_requests' })
@Index({ properties: ['requester_id', 'created_at'] })
@Index({ properties: ['city', 'status', 'created_at'] })
@Index({ properties: ['abo_type', 'rh_factor', 'status'] })
@Index({ properties: ['idempotency_key'] })
export class EsfRequestEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 255 })
  requester_id!: string;

  @Property({ type: 'varchar', length: 255 })
  patient_name!: string;

  @Property({ type: 'varchar', length: 255 })
  hospital_name!: string;

  @Property({ type: 'varchar', length: 255 })
  city!: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  district?: string;

  @Property({ type: 'varchar', length: 500, nullable: true })
  hospital_address?: string;

  @Property({ type: 'jsonb', nullable: true })
  location?: { lat: number; lon: number };

  @Enum(() => BloodType)
  abo_type!: BloodType;

  @Enum(() => RhFactor)
  rh_factor!: RhFactor;

  @Enum(() => EsfRequestStatus)
  status: EsfRequestStatus = EsfRequestStatus.PENDING;

  @Property({ type: 'text', nullable: true })
  notes?: string;

  @Property({ type: 'uuid', nullable: true })
  idempotency_key?: string;

  @Property({ type: 'timestamp', nullable: true })
  matched_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  confirmed_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  completed_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  cancelled_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  closed_at?: Date;

  @Property({ type: 'integer', nullable: true })
  match_time_minutes?: number;

  @Property({ type: 'boolean', default: false })
  is_abuse: boolean = false;

  @Property({ type: 'varchar', length: 500, nullable: true })
  abuse_reason?: string;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();
}
