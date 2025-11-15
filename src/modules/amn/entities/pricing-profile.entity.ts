import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

/**
 * AMN Pricing Profile Entity
 *
 * Placeholder entity for AMN service
 */
@Entity({ tableName: 'amn_pricing_profiles' })
export class PricingProfileEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();
}

