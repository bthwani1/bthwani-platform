import { Entity, PrimaryKey, Property, Enum, Index, Unique } from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { BloodType, RhFactor } from './esf-request.entity';

@Entity({ tableName: 'esf_donor_profiles' })
@Unique({ properties: ['user_id'] })
@Index({ properties: ['is_available', 'abo_type', 'rh_factor', 'city'] })
@Index({ properties: ['last_donation_at'] })
export class EsfDonorProfileEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 255 })
  user_id!: string;

  @Enum(() => BloodType)
  @Property({ type: 'varchar', length: 10, nullable: true })
  abo_type?: BloodType;

  @Enum(() => RhFactor)
  @Property({ type: 'varchar', length: 1, nullable: true })
  rh_factor?: RhFactor;

  @Property({ type: 'boolean', default: false })
  is_available: boolean = false;

  @Property({ type: 'varchar', length: 255, nullable: true })
  city?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  district?: string;

  @Property({ type: 'jsonb', nullable: true })
  location?: { lat: number; lon: number };

  @Property({ type: 'timestamp', nullable: true })
  last_donation_at?: Date;

  @Property({ type: 'integer', nullable: true })
  cooldown_days?: number;

  @Property({ type: 'timestamp', nullable: true })
  cooldown_until?: Date;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();
}
