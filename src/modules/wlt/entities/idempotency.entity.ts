import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

@Entity({ tableName: 'wlt_idempotency' })
@Index({ properties: ['idempotency_key'] })
@Index({ properties: ['expires_at'] })
export class IdempotencyEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 255, unique: true })
  idempotency_key!: string;

  @Property({ type: 'varchar', length: 64 })
  operation!: string;

  @Property({ type: 'jsonb', nullable: true })
  request_hash?: string;

  @Property({ type: 'jsonb', nullable: true })
  response?: Record<string, unknown>;

  @Property({ type: 'integer', nullable: true })
  status_code?: number;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp' })
  expires_at!: Date;
}
