import { Injectable, NotFoundException } from '@nestjs/common';
import { DshCategoryRepository } from '../repositories/dsh-category.repository';
import { DshCategoryEntity, DshCategoryStatus } from '../entities/dsh-category.entity';
import { LoggerService } from '../../../core/services/logger.service';

export interface CreateDshCategoryDto {
  code: string;
  name_ar: string;
  name_en: string;
  description_ar?: string;
  description_en?: string;
  icon_url?: string;
  image_url?: string;
  sort_order?: number;
  is_featured?: boolean;
  tags?: string[];
  available_regions?: string[];
  available_cities?: string[];
  var_enabled?: string;
  metadata?: Record<string, unknown>;
}

/**
 * DSH Category Service
 *
 * Manages DSH subcategories (restaurants, supermarkets, fashion, etc.)
 * Includes Thwani (dsh_quick_task) as a category.
 */
@Injectable()
export class DshCategoryService {
  constructor(
    private readonly categoryRepository: DshCategoryRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateDshCategoryDto): Promise<DshCategoryEntity> {
    const existing = await this.categoryRepository.findByCode(dto.code);
    if (existing) {
      throw new Error(`Category with code ${dto.code} already exists`);
    }

    const category = new DshCategoryEntity();
    category.code = dto.code;
    category.name_ar = dto.name_ar;
    category.name_en = dto.name_en;
    category.description_ar = dto.description_ar;
    category.description_en = dto.description_en;
    category.icon_url = dto.icon_url;
    category.image_url = dto.image_url;
    category.sort_order = dto.sort_order ?? 0;
    category.is_featured = dto.is_featured ?? false;
    category.tags = dto.tags ?? [];
    category.available_regions = dto.available_regions;
    category.available_cities = dto.available_cities;
    category.var_enabled = dto.var_enabled;
    category.metadata = dto.metadata;

    return this.categoryRepository.create(category);
  }

  async findOne(id: string): Promise<DshCategoryEntity> {
    const category = await this.categoryRepository.findOne(id);
    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }
    return category;
  }

  async findByCode(code: string): Promise<DshCategoryEntity> {
    const category = await this.categoryRepository.findByCode(code);
    if (!category) {
      throw new NotFoundException(`Category with code ${code} not found`);
    }
    return category;
  }

  async findAll(options?: {
    status?: DshCategoryStatus;
    is_active?: boolean;
    is_featured?: boolean;
    region?: string;
    city?: string;
    tags?: string[];
  }): Promise<DshCategoryEntity[]> {
    return this.categoryRepository.findAll(options);
  }

  async findActive(options?: {
    region?: string;
    city?: string;
    tags?: string[];
  }): Promise<DshCategoryEntity[]> {
    return this.categoryRepository.findActive(options);
  }

  async findFeatured(options?: {
    region?: string;
    city?: string;
  }): Promise<DshCategoryEntity[]> {
    return this.categoryRepository.findFeatured(options);
  }

  /**
   * Get categories for user based on location and preferences
   */
  async getCategoriesForUser(options?: {
    userId?: string;
    region?: string;
    city?: string;
    includeThwani?: boolean;
  }): Promise<DshCategoryEntity[]> {
    const categories = await this.findActive({
      region: options?.region,
      city: options?.city,
    });

    // Filter out Thwani if not requested
    if (!options?.includeThwani) {
      return categories.filter((cat) => cat.code !== 'dsh_quick_task');
    }

    return categories;
  }

  async update(
    id: string,
    updates: Partial<CreateDshCategoryDto>,
  ): Promise<DshCategoryEntity> {
    const category = await this.findOne(id);

    if (updates.name_ar !== undefined) category.name_ar = updates.name_ar;
    if (updates.name_en !== undefined) category.name_en = updates.name_en;
    if (updates.description_ar !== undefined) category.description_ar = updates.description_ar;
    if (updates.description_en !== undefined) category.description_en = updates.description_en;
    if (updates.icon_url !== undefined) category.icon_url = updates.icon_url;
    if (updates.image_url !== undefined) category.image_url = updates.image_url;
    if (updates.sort_order !== undefined) category.sort_order = updates.sort_order;
    if (updates.is_featured !== undefined) category.is_featured = updates.is_featured;
    if (updates.tags !== undefined) category.tags = updates.tags;
    if (updates.available_regions !== undefined) category.available_regions = updates.available_regions;
    if (updates.available_cities !== undefined) category.available_cities = updates.available_cities;
    if (updates.var_enabled !== undefined) category.var_enabled = updates.var_enabled;
    if (updates.metadata !== undefined) category.metadata = updates.metadata;

    return this.categoryRepository.update(category);
  }

  async delete(id: string): Promise<void> {
    await this.categoryRepository.delete(id);
  }
}

