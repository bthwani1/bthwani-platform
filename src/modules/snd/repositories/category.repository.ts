import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { SndCategoryEntity, SndCategoryType } from '../entities/category.entity';

@Injectable()
export class SndCategoryRepository {
  constructor(
    @InjectRepository(SndCategoryEntity)
    private readonly repository: EntityRepository<SndCategoryEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(category: SndCategoryEntity): Promise<SndCategoryEntity> {
    this.em.persist(category);
    await this.em.flush();
    return category;
  }

  async findOne(id: string): Promise<SndCategoryEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByCode(code: string): Promise<SndCategoryEntity | null> {
    return this.repository.findOne({ code });
  }

  async findActive(options?: { type?: SndCategoryType }): Promise<SndCategoryEntity[]> {
    const where: Record<string, unknown> = { is_active: true };
    if (options?.type) {
      where.type = options.type;
    }

    return this.repository.find(where, {
      orderBy: { sort_order: 'ASC', name_en: 'ASC' },
    });
  }

  async findAll(options?: { type?: SndCategoryType }): Promise<SndCategoryEntity[]> {
    const where: Record<string, unknown> = {};
    if (options?.type) {
      where.type = options.type;
    }

    return this.repository.find(where, {
      orderBy: { sort_order: 'ASC', name_en: 'ASC' },
    });
  }

  async update(category: SndCategoryEntity): Promise<SndCategoryEntity> {
    await this.em.flush();
    return category;
  }
}
