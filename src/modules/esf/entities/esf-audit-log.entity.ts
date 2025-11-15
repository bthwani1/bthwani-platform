import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum EsfAuditAction {
  CREATE_REQUEST = 'create_request',
  UPDATE_REQUEST = 'update_request',
  CANCEL_REQUEST = 'cancel_request',
  CLOSE_REQUEST = 'close_request',
  UPDATE_AVAILABILITY = 'update_availability',
  CREATE_MESSAGE = 'create_message',
  MARK_ABUSE = 'mark_abuse',
  APPLY_ACTION = 'apply_action',
  UPDATE_CONFIG = 'update_config',
}

export enum EsfAuditEntityType {
  REQUEST = 'request',
  DONOR_PROFILE = 'donor_profile',
  CHAT_MESSAGE = 'chat_message',
  MATCH = 'match',
  CONFIG = 'config',
}

@Entity({ tableName: 'esf_audit_logs' })
@Index({ properties: ['entity_type', 'entity_id', 'created_at'] })
@Index({ properties: ['user_id', 'created_at'] })
@Index({ properties: ['action', 'created_at'] })
export class EsfAuditLogEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Enum(() => EsfAuditEntityType)
  entity_type!: EsfAuditEntityType;

  @Property({ type: 'varchar', length: 255 })
  entity_id!: string;

  @Enum(() => EsfAuditAction)
  action!: EsfAuditAction;

  @Property({ type: 'varchar', length: 255, nullable: true })
  user_id?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  user_email?: string;

  @Property({ type: 'jsonb', nullable: true })
  old_values?: Record<string, unknown>;

  @Property({ type: 'jsonb', nullable: true })
  new_values?: Record<string, unknown>;

  @Property({ type: 'varchar', length: 500, nullable: true })
  reason?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  ip_address?: string;

  @Property({ type: 'varchar', length: 500, nullable: true })
  user_agent?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  trace_id?: string;

  @Property({ type: 'jsonb', nullable: true })
  request_metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();
}
