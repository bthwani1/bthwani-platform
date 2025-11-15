import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { DshCategoryEntity, DshCategoryStatus } from '../entities/dsh-category.entity';

@Injectable()
export class DshCategoryRepository {
  constructor(
    @InjectRepository(DshCategoryEntity)
    private readonly repository: EntityRepository<DshCategoryEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(category: DshCategoryEntity): Promise<DshCategoryEntity> {
    this.em.persist(category);
    await this.em.flush();
    return category;
  }

  async findOne(id: string): Promise<DshCategoryEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByCode(code: string): Promise<DshCategoryEntity | null> {
    return this.repository.findOne({ code });
  }

  async findAll(options?: {
    status?: DshCategoryStatus;
    is_active?: boolean;
    is_featured?: boolean;
    region?: string;
    city?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<DshCategoryEntity[]> {
    const where: Record<string, unknown> = {};

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.is_active !== undefined) {
      where.is_active = options.is_active;
    }

    if (options?.is_featured !== undefined) {
      where.is_featured = options.is_featured;
    }

    if (options?.tags && options.tags.length > 0) {
      where.tags = { $contains: options.tags };
    }

    // Region/City filtering
    if (options?.region || options?.city) {
      where.$or = [
        { available_regions: null },
        ...(options.region ? [{ available_regions: { $contains: [options.region] } }] : []),
        { available_cities: null },
        ...(options.city ? [{ available_cities: { $contains: [options.city] } }] : []),
      ];
    }

    return this.repository.find(where, {
      limit: options?.limit,
      offset: options?.offset,
      orderBy: [
        { is_featured: 'DESC' },
        { sort_order: 'ASC' },
        { created_at: 'ASC' },
      ],
    });
  }

  async findActive(options?: {
    region?: string;
    city?: string;
    tags?: string[];
  }): Promise<DshCategoryEntity[]> {
    return this.findAll({
      status: DshCategoryStatus.ACTIVE,
      is_active: true,
      ...options,
    });
  }

  async findFeatured(options?: {
    region?: string;
    city?: string;
  }): Promise<DshCategoryEntity[]> {
    return this.findAll({
      status: DshCategoryStatus.ACTIVE,
      is_active: true,
      is_featured: true,
      ...options,
    });
  }

  async update(category: DshCategoryEntity): Promise<DshCategoryEntity> {
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

