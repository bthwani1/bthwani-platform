import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

/**
 * Captain Availability Entity
 *
 * Tracks captain availability for AMN service
 * Note: This is a placeholder entity to fix migration discovery
 */
@Entity({ tableName: 'captain_availability' })
export class CaptainAvailabilityEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 255 })
  captain_id!: string;

  @Property({ type: 'boolean', default: true })
  is_available: boolean = true;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();
}

