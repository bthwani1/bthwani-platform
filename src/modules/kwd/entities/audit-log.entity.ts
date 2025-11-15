import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

/**
 * KWD Audit Log Entity
 * Immutable audit trail for admin/support actions.
 * Retention: 365 days.
 *
 * @entity
 * @table kwd_audit_logs
 */
@Entity({ tableName: 'kwd_audit_logs' })
@Index({ properties: ['entity_type', 'entity_id'] })
@Index({ properties: ['user_id', 'created_at'] })
@Index({ properties: ['action'] })
export class AuditLogEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 50 })
  @Index()
  entity_type!: string;

  @Property({ type: 'uuid' })
  @Index()
  entity_id!: string;

  @Property({ type: 'varchar', length: 100 })
  @Index()
  action!: string;

  @Property({ type: 'uuid' })
  @Index()
  user_id!: string;

  @Property({ type: 'varchar', length: 50 })
  user_role!: string;

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

  @Property({ type: 'timestamp', default: 'now()' })
  @Index()
  created_at: Date = new Date();
}
