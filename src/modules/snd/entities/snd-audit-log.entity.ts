import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

@Entity({ tableName: 'snd_audit_logs' })
@Index({ properties: ['entity_type', 'entity_id', 'created_at'] })
@Index({ properties: ['user_id', 'created_at'] })
@Index({ properties: ['action', 'created_at'] })
export class SndAuditLogEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 100 })
  entity_type!: string;

  @Property({ type: 'uuid' })
  entity_id!: string;

  @Property({ type: 'varchar', length: 100 })
  action!: string;

  @Property({ type: 'varchar', length: 255 })
  user_id!: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  user_role?: string;

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

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();
}
