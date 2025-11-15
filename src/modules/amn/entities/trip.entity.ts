import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

/**
 * AMN Trip Entity
 *
 * Placeholder entity for AMN service
 */
@Entity({ tableName: 'amn_trips' })
export class TripEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();
}

