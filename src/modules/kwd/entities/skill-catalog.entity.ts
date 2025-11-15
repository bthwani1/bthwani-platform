import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

/**
 * KWD Skill Catalog Entity
 * Represents a skill with synonyms for search/filter.
 *
 * @entity
 * @table kwd_skill_catalog
 */
@Entity({ tableName: 'kwd_skill_catalog' })
@Index({ properties: ['name'] })
export class SkillCatalogEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Property({ type: 'jsonb' })
  synonyms: string[] = [];

  @Property({ type: 'boolean', default: true })
  is_active: boolean = true;

  @Property({ type: 'uuid', nullable: true })
  created_by?: string;

  @Property({ type: 'uuid', nullable: true })
  updated_by?: string;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();
}
