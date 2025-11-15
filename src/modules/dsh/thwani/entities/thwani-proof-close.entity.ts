import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

/**
 * Thwani Proof of Close Entity
 *
 * Stores 6-digit close codes for instant help request completion.
 * Reuses DSH proof-of-delivery pattern.
 */
@Entity({ tableName: 'thwani_proof_closes' })
@Index({ properties: ['request_id'] })
@Index({ properties: ['close_code'] })
@Index({ properties: ['idempotency_key'] })
export class ThwaniProofCloseEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'uuid', unique: true })
  request_id!: string;

  @Property({ type: 'varchar', length: 6 })
  close_code!: string;

  @Property({ type: 'varchar', length: 255 })
  recipient_name!: string;

  @Property({ type: 'varchar', length: 255 })
  verified_by_id!: string;

  @Property({ type: 'boolean', default: false })
  is_verified: boolean = false;

  @Property({ type: 'timestamp', nullable: true })
  verified_at?: Date;

  @Property({ type: 'uuid', nullable: true })
  idempotency_key?: string;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();
}

