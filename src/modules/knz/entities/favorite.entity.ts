import { Entity, PrimaryKey, Property, Unique, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

@Entity({ tableName: 'knz_favorites' })
@Unique({ properties: ['user_id', 'listing_id'] })
@Index({ properties: ['user_id', 'created_at'] })
@Index({ properties: ['listing_id'] })
export class FavoriteEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 255 })
  user_id!: string;

  @Property({ type: 'uuid' })
  listing_id!: string;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();
}
