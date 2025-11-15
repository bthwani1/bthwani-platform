import { Entity, PrimaryKey, Property, Enum, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

/**
 * Moderation action enum
 */
export enum ModerationAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  HIDE = 'hide',
  SOFT_DELETE = 'soft_delete',
  WARN = 'warn',
  TEMP_BLOCK = 'temp_block',
}

/**
 * KWD Moderation Log Entity
 * Immutable audit log for all moderation actions.
 *
 * @entity
 * @table kwd_moderation_logs
 */
@Entity({ tableName: 'kwd_moderation_logs' })
@Index({ properties: ['listing_id', 'created_at'] })
@Index({ properties: ['applied_by'] })
export class ModerationLogEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'uuid' })
  @Index()
  listing_id!: string;

  @Enum(() => ModerationAction)
  action!: ModerationAction;

  @Property({ type: 'varchar', length: 1000 })
  reason!: string;

  @Property({ type: 'uuid' })
  applied_by!: string;

  @Property({ type: 'varchar', length: 50 })
  applied_by_role!: string;

  @Property({ type: 'integer', nullable: true })
  duration_days?: number;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  @Index()
  created_at: Date = new Date();
}
