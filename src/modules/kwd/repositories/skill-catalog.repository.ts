import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { SkillCatalogEntity } from '../entities/skill-catalog.entity';

/**
 * KWD Skill Catalog Repository
 * Handles persistence operations for skills catalog.
 */
@Injectable()
export class SkillCatalogRepository {
  constructor(
    @InjectRepository(SkillCatalogEntity)
    private readonly repository: EntityRepository<SkillCatalogEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  /**
   * Create a new skill
   */
  async create(skill: SkillCatalogEntity): Promise<SkillCatalogEntity> {
    this.em.persist(skill);
    await this.em.flush();
    return skill;
  }

  /**
   * Find skill by ID
   */
  async findOne(id: string): Promise<SkillCatalogEntity | null> {
    return this.repository.findOne({ id });
  }

  /**
   * Find skill by name
   */
  async findByName(name: string): Promise<SkillCatalogEntity | null> {
    return this.repository.findOne({ name });
  }

  /**
   * Find all active skills
   */
  async findAllActive(): Promise<SkillCatalogEntity[]> {
    return this.repository.find({ is_active: true }, { orderBy: { name: 'ASC' } });
  }

  /**
   * Find all skills (including inactive)
   */
  async findAll(): Promise<SkillCatalogEntity[]> {
    return this.repository.find({}, { orderBy: { name: 'ASC' } });
  }

  /**
   * Update skill (flush changes)
   */
  async update(skill: SkillCatalogEntity): Promise<SkillCatalogEntity> {
    await this.em.flush();
    return skill;
  }

  /**
   * Deactivate skill
   */
  async deactivate(skill: SkillCatalogEntity): Promise<void> {
    skill.is_active = false;
    await this.em.flush();
  }

  /**
   * Remove skill (hard delete)
   */
  async remove(skill: SkillCatalogEntity): Promise<void> {
    this.em.remove(skill);
    await this.em.flush();
  }

  /**
   * Search skills by name or synonym
   */
  async search(query: string): Promise<SkillCatalogEntity[]> {
    return this.repository.find({
      $or: [{ name: { $ilike: `%${query}%` } }, { synonyms: { $contains: [query] } }],
      is_active: true,
    });
  }
}
