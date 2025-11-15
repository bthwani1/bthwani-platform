import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CategoryRepository } from '../repositories/category.repository';
import { CategoryEntity, CategoryStatus } from '../entities/category.entity';
import { CreateCategoryDto } from '../dto/categories/create-category.dto';
import { UpdateCategoryDto } from '../dto/categories/update-category.dto';
import { ListCategoriesDto } from '../dto/categories/list-categories.dto';
import { AuditLogService } from './audit-log.service';
import { AuditAction, AuditEntityType } from '../entities/audit-log.entity';
import { Request } from 'express';

@Injectable()
export class CategoriesAdminService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createCategory(
    createDto: CreateCategoryDto,
    userId: string,
    userEmail: string,
    request?: Request,
  ): Promise<CategoryEntity> {
    const existing = await this.categoryRepository.findByCode(createDto.code);
    if (existing) {
      throw new ConflictException(`Category with code ${createDto.code} already exists`);
    }

    if (createDto.parent_id) {
      const parent = await this.categoryRepository.findOne(createDto.parent_id);
      if (!parent) {
        throw new NotFoundException(`Parent category ${createDto.parent_id} not found`);
      }
    }

    const category = new CategoryEntity();
    category.code = createDto.code;
    category.name_ar = createDto.name_ar;
    category.name_en = createDto.name_en;
    category.description_ar = createDto.description_ar;
    category.description_en = createDto.description_en;
    category.parent_id = createDto.parent_id;
    category.sort_order = createDto.sort_order ?? 0;
    category.is_sensitive = createDto.is_sensitive ?? false;
    category.metadata = createDto.metadata;
    category.created_by = userId;
    category.updated_by = userId;

    const saved = await this.categoryRepository.create(category);

    await this.auditLogService.log({
      entityType: AuditEntityType.CATEGORY,
      entityId: saved.id,
      action: AuditAction.CREATE,
      userId,
      userEmail,
      newValues: { code: saved.code, name_ar: saved.name_ar, name_en: saved.name_en },
      request,
    });

    return saved;
  }

  async updateCategory(
    categoryId: string,
    updateDto: UpdateCategoryDto,
    userId: string,
    userEmail: string,
    request?: Request,
  ): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne(categoryId);
    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }

    const oldValues = {
      name_ar: category.name_ar,
      name_en: category.name_en,
      status: category.status,
      is_sensitive: category.is_sensitive,
    };

    if (updateDto.name_ar !== undefined) {
      category.name_ar = updateDto.name_ar;
    }
    if (updateDto.name_en !== undefined) {
      category.name_en = updateDto.name_en;
    }
    if (updateDto.description_ar !== undefined) {
      category.description_ar = updateDto.description_ar;
    }
    if (updateDto.description_en !== undefined) {
      category.description_en = updateDto.description_en;
    }
    if (updateDto.parent_id !== undefined) {
      if (updateDto.parent_id && updateDto.parent_id === categoryId) {
        throw new BadRequestException('Category cannot be its own parent');
      }
      if (updateDto.parent_id) {
        const parent = await this.categoryRepository.findOne(updateDto.parent_id);
        if (!parent) {
          throw new NotFoundException(`Parent category ${updateDto.parent_id} not found`);
        }
      }
      category.parent_id = updateDto.parent_id;
    }
    if (updateDto.sort_order !== undefined) {
      category.sort_order = updateDto.sort_order;
    }
    if (updateDto.status !== undefined) {
      category.status = updateDto.status;
    }
    if (updateDto.is_sensitive !== undefined) {
      category.is_sensitive = updateDto.is_sensitive;
    }
    if (updateDto.metadata !== undefined) {
      category.metadata = updateDto.metadata;
    }
    category.updated_by = userId;

    const updated = await this.categoryRepository.update(category);

    await this.auditLogService.log({
      entityType: AuditEntityType.CATEGORY,
      entityId: updated.id,
      action: AuditAction.UPDATE,
      userId,
      userEmail,
      oldValues,
      newValues: {
        name_ar: updated.name_ar,
        name_en: updated.name_en,
        status: updated.status,
        is_sensitive: updated.is_sensitive,
      },
      request,
    });

    return updated;
  }

  async getCategory(categoryId: string): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne(categoryId);
    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }
    return category;
  }

  async listCategories(query: ListCategoriesDto): Promise<CategoryEntity[]> {
    return this.categoryRepository.findAll({
      status: query.status,
      parent_id: query.parent_id,
      is_sensitive: query.is_sensitive,
      limit: query.limit,
      offset: query.offset,
    });
  }

  async enableCategory(
    categoryId: string,
    userId: string,
    userEmail: string,
    request?: Request,
  ): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne(categoryId);
    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }

    const oldStatus = category.status;
    category.status = CategoryStatus.ACTIVE;
    category.updated_by = userId;

    const updated = await this.categoryRepository.update(category);

    await this.auditLogService.log({
      entityType: AuditEntityType.CATEGORY,
      entityId: updated.id,
      action: AuditAction.ENABLE,
      userId,
      userEmail,
      oldValues: { status: oldStatus },
      newValues: { status: updated.status },
      request,
    });

    return updated;
  }

  async disableCategory(
    categoryId: string,
    userId: string,
    userEmail: string,
    request?: Request,
  ): Promise<CategoryEntity> {
    const category = await this.categoryRepository.findOne(categoryId);
    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }

    const oldStatus = category.status;
    category.status = CategoryStatus.INACTIVE;
    category.updated_by = userId;

    const updated = await this.categoryRepository.update(category);

    await this.auditLogService.log({
      entityType: AuditEntityType.CATEGORY,
      entityId: updated.id,
      action: AuditAction.DISABLE,
      userId,
      userEmail,
      oldValues: { status: oldStatus },
      newValues: { status: updated.status },
      request,
    });

    return updated;
  }
}
