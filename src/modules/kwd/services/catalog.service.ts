import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { SkillCatalogRepository } from '../repositories/skill-catalog.repository';
import { SkillCatalogEntity } from '../entities/skill-catalog.entity';
import {
  UpdateSkillsCatalogDto,
  CatalogOperationDto,
} from '../dto/admin/update-skills-catalog.dto';

/**
 * KWD Catalog Service
 * Manages skills catalog and synonyms.
 */
@Injectable()
export class CatalogService {
  constructor(private readonly skillCatalogRepository: SkillCatalogRepository) {}

  /**
   * Get all active skills
   */
  async getAllSkills(): Promise<SkillCatalogEntity[]> {
    return this.skillCatalogRepository.findAllActive();
  }

  /**
   * Get skill by name
   */
  async getSkillByName(name: string): Promise<SkillCatalogEntity | null> {
    return this.skillCatalogRepository.findByName(name);
  }

  /**
   * Search skills
   */
  async searchSkills(query: string): Promise<SkillCatalogEntity[]> {
    return this.skillCatalogRepository.search(query);
  }

  /**
   * Update skills catalog (admin)
   * Supports add, update, remove operations
   */
  async updateCatalog(
    dto: UpdateSkillsCatalogDto,
    updated_by: string,
  ): Promise<SkillCatalogEntity[]> {
    const results: SkillCatalogEntity[] = [];
    for (const operation of dto.operations) {
      const result = await this.applyOperation(operation, updated_by);
      if (result) {
        results.push(result);
      }
    }
    return results;
  }

  /**
   * Apply single catalog operation
   */
  private async applyOperation(
    operation: CatalogOperationDto,
    updated_by: string,
  ): Promise<SkillCatalogEntity | null> {
    switch (operation.op) {
      case 'add':
        return this.addSkill(operation.skill.name, operation.skill.synonyms, updated_by);
      case 'update':
        if (!operation.skill.id) {
          throw new ConflictException('Skill ID required for update operation');
        }
        return this.updateSkill(
          operation.skill.id,
          operation.skill.name,
          operation.skill.synonyms,
          updated_by,
        );
      case 'remove':
        if (!operation.skill.id) {
          throw new ConflictException('Skill ID required for remove operation');
        }
        await this.removeSkill(operation.skill.id);
        return null;
      default:
        throw new ConflictException(`Unknown operation: ${operation.op}`);
    }
  }

  /**
   * Add new skill
   */
  private async addSkill(
    name: string,
    synonyms: string[],
    created_by: string,
  ): Promise<SkillCatalogEntity> {
    const existing = await this.skillCatalogRepository.findByName(name);
    if (existing) {
      throw new ConflictException(`Skill ${name} already exists`);
    }
    const skill = new SkillCatalogEntity();
    skill.name = name;
    skill.synonyms = synonyms;
    skill.created_by = created_by;
    skill.updated_by = created_by;
    return this.skillCatalogRepository.create(skill);
  }

  /**
   * Update existing skill
   */
  private async updateSkill(
    id: string,
    name: string,
    synonyms: string[],
    updated_by: string,
  ): Promise<SkillCatalogEntity> {
    const skill = await this.skillCatalogRepository.findOne(id);
    if (!skill) {
      throw new NotFoundException(`Skill ${id} not found`);
    }
    skill.name = name;
    skill.synonyms = synonyms;
    skill.updated_by = updated_by;
    return this.skillCatalogRepository.update(skill);
  }

  /**
   * Remove skill (deactivate)
   */
  private async removeSkill(id: string): Promise<void> {
    const skill = await this.skillCatalogRepository.findOne(id);
    if (!skill) {
      throw new NotFoundException(`Skill ${id} not found`);
    }
    await this.skillCatalogRepository.deactivate(skill);
  }
}
