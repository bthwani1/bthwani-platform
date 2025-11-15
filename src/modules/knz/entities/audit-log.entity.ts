import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  ENABLE = 'enable',
  DISABLE = 'disable',
  EXPORT = 'export',
  MODERATE = 'moderate',
  CONFIGURE = 'configure',
}

export enum AuditEntityType {
  CATEGORY = 'category',
  FEE_PROFILE = 'fee_profile',
  LISTING = 'listing',
  ORDER = 'order',
  ABUSE_REPORT = 'abuse_report',
  EXPORT = 'export',
  SSOT_DECISION = 'ssot_decision',
}

@Entity({ tableName: 'knz_audit_logs' })
@Index({ properties: ['entity_type', 'entity_id'] })
@Index({ properties: ['user_id', 'created_at'] })
@Index({ properties: ['action', 'created_at'] })
export class AuditLogEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Enum(() => AuditEntityType)
  entity_type!: AuditEntityType;

  @Property({ type: 'uuid', nullable: true })
  entity_id?: string;

  @Enum(() => AuditAction)
  action!: AuditAction;

  @Property({ type: 'varchar', length: 255 })
  user_id!: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  user_email?: string;

  @Property({ type: 'varchar', length: 500, nullable: true })
  resource_path?: string;

  @Property({ type: 'jsonb', nullable: true })
  old_values?: Record<string, unknown>;

  @Property({ type: 'jsonb', nullable: true })
  new_values?: Record<string, unknown>;

  @Property({ type: 'text', nullable: true })
  reason?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  ip_address?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  user_agent?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  trace_id?: string;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();
}
