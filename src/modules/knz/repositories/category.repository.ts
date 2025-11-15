import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { CategoryEntity, CategoryStatus } from '../entities/category.entity';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly repository: EntityRepository<CategoryEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(category: CategoryEntity): Promise<CategoryEntity> {
    this.em.persist(category);
    await this.em.flush();
    return category;
  }

  async findOne(id: string): Promise<CategoryEntity | null> {
    return this.repository.findOne({ id }, { populate: ['listings'] });
  }

  async findByCode(code: string): Promise<CategoryEntity | null> {
    return this.repository.findOne({ code });
  }

  async findAll(options?: {
    status?: CategoryStatus;
    parent_id?: string | null;
    is_sensitive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<CategoryEntity[]> {
    const where: Record<string, unknown> = {};
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.parent_id !== undefined) {
      where.parent_id = options.parent_id;
    }
    if (options?.is_sensitive !== undefined) {
      where.is_sensitive = options.is_sensitive;
    }
    return this.repository.find(where, {
      limit: options?.limit,
      offset: options?.offset,
      orderBy: { sort_order: 'ASC', created_at: 'ASC' },
    });
  }

  async update(category: CategoryEntity): Promise<CategoryEntity> {
    await this.em.flush();
    return category;
  }

  async delete(id: string): Promise<void> {
    const category = await this.repository.findOne({ id });
    if (category) {
      await this.em.removeAndFlush(category);
    }
  }
}
