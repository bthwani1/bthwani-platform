import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

/**
 * AMN Quote Entity
 *
 * Placeholder entity for AMN service
 */
@Entity({ tableName: 'amn_quotes' })
export class QuoteEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();
}

