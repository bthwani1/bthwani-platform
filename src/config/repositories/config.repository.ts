import { Injectable } from '@nestjs/common';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { RuntimeConfigEntity } from '../entities/runtime-config.entity';

@Injectable()
export class ConfigRepository {
  constructor(
    @InjectRepository(RuntimeConfigEntity)
    private readonly repository: EntityRepository<RuntimeConfigEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  /**
   * Find configuration by key
   */
  async findByKey(key: string): Promise<RuntimeConfigEntity | null> {
    return this.repository.findOne({ key, isActive: true });
  }

  /**
   * Find all active configurations
   */
  async findAllActive(): Promise<RuntimeConfigEntity[]> {
    return this.repository.find({ isActive: true });
  }

  /**
   * Upsert configuration
   */
  async upsert(
    key: string,
    value: string | number | boolean | object,
    options?: {
      type?: 'string' | 'number' | 'boolean' | 'json';
      description?: string;
      isPlaceholder?: boolean;
      isSensitive?: boolean;
      updatedBy?: string;
    },
  ): Promise<RuntimeConfigEntity> {
    const existing = await this.findByKey(key);

    const serializedValue =
      typeof value === 'object' ? JSON.stringify(value) : String(value);
    const configType = options?.type || this.inferType(value);

    if (existing) {
      existing.value = serializedValue;
      existing.type = configType;
      existing.isPlaceholder = options?.isPlaceholder ?? false;
      existing.isSensitive = options?.isSensitive ?? false;
      existing.updatedAt = new Date();
      existing.updatedBy = options?.updatedBy || null;
      if (options?.description) {
        existing.description = options.description;
      }
      await this.em.flush();
      return existing;
    }

    const newConfig = this.repository.create({
      key,
      value: serializedValue,
      type: configType,
      description: options?.description || null,
      isPlaceholder: options?.isPlaceholder ?? false,
      isSensitive: options?.isSensitive ?? false,
      updatedBy: options?.updatedBy || null,
    });

    await this.em.persistAndFlush(newConfig);
    return newConfig;
  }

  /**
   * Delete configuration (soft delete by setting isActive = false)
   */
  async delete(key: string): Promise<void> {
    const config = await this.findByKey(key);
    if (config) {
      config.isActive = false;
      config.updatedAt = new Date();
      await this.em.flush();
    }
  }

  /**
   * Find all placeholder configurations
   */
  async findPlaceholders(): Promise<RuntimeConfigEntity[]> {
    return this.repository.find({ isPlaceholder: true, isActive: true });
  }

  /**
   * Infer value type
   */
  private inferType(value: any): 'string' | 'number' | 'boolean' | 'json' {
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    if (typeof value === 'number') {
      return 'number';
    }
    if (typeof value === 'object') {
      return 'json';
    }
    return 'string';
  }
}

