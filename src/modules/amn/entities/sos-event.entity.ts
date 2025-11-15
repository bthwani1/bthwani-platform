import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

/**
 * AMN SOS Event Entity
 *
 * Placeholder entity for AMN service
 */
@Entity({ tableName: 'amn_sos_events' })
export class SosEventEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();
}

