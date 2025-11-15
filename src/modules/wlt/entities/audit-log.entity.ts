import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

@Entity({ tableName: 'wlt_audit_logs' })
@Index({ properties: ['entity_type', 'entity_id'] })
@Index({ properties: ['user_id', 'created_at'] })
@Index({ properties: ['action'] })
@Index({ properties: ['trace_id'] })
export class AuditLogEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 64 })
  entity_type!: string;

  @Property({ type: 'uuid' })
  entity_id!: string;

  @Property({ type: 'varchar', length: 100 })
  action!: string;

  @Property({ type: 'uuid', nullable: true })
  user_id?: string;

  @Property({ type: 'varchar', length: 50, nullable: true })
  user_role?: string;

  @Property({ type: 'jsonb', nullable: true })
  before_state?: Record<string, unknown>;

  @Property({ type: 'jsonb', nullable: true })
  after_state?: Record<string, unknown>;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'varchar', length: 100, nullable: true })
  trace_id?: string;

  @Property({ type: 'varchar', length: 45, nullable: true })
  ip_address?: string;

  @Property({ type: 'varchar', length: 64, nullable: true })
  hash?: string;

  @Property({ type: 'timestamp', default: 'now()' })
  @Index()
  created_at: Date = new Date();
}
