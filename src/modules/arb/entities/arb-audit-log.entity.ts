import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum ArbAuditEntityType {
  OFFER = 'offer',
  BOOKING = 'booking',
  CHAT = 'chat',
  AMENDMENT = 'amendment',
  CONFIG = 'config',
  ESCROW = 'escrow',
  DISPUTE = 'dispute',
}

export enum ArbAuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  STATUS_CHANGE = 'status_change',
  ESCROW_HOLD = 'escrow_hold',
  ESCROW_RELEASE = 'escrow_release',
  ESCROW_REFUND = 'escrow_refund',
  ESCROW_CAPTURE = 'escrow_capture',
  DISPUTE_RAISE = 'dispute_raise',
  DISPUTE_RESOLVE = 'dispute_resolve',
  CONFIG_UPDATE = 'config_update',
  OVERRIDE = 'override',
}

@Entity({ tableName: 'arb_audit_logs' })
@Index({ properties: ['entity_type', 'entity_id', 'created_at'] })
@Index({ properties: ['user_id', 'created_at'] })
@Index({ properties: ['trace_id'] })
export class ArbAuditLogEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Enum(() => ArbAuditEntityType)
  entity_type!: ArbAuditEntityType;

  @Property({ type: 'uuid' })
  entity_id!: string;

  @Enum(() => ArbAuditAction)
  action!: ArbAuditAction;

  @Property({ type: 'varchar', length: 255, nullable: true })
  user_id?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  user_email?: string;

  @Property({ type: 'jsonb', nullable: true })
  old_values?: Record<string, unknown>;

  @Property({ type: 'jsonb', nullable: true })
  new_values?: Record<string, unknown>;

  @Property({ type: 'text', nullable: true })
  reason?: string;

  @Property({ type: 'varchar', length: 45, nullable: true })
  ip_address?: string;

  @Property({ type: 'text', nullable: true })
  user_agent?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  trace_id?: string;

  @Property({ type: 'jsonb', nullable: true })
  request_metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();
}
