import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { EsfConfigEntity } from '../entities/esf-config.entity';

@Injectable()
export class EsfConfigRepository {
  constructor(
    @InjectRepository(EsfConfigEntity)
    private readonly repository: EntityRepository<EsfConfigEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async findByScope(scope: string): Promise<EsfConfigEntity[]> {
    return this.repository.find({ scope }, { orderBy: { key: 'ASC' } });
  }

  async findByKey(scope: string, key: string): Promise<EsfConfigEntity | null> {
    return this.repository.findOne({ scope, key });
  }

  async upsert(
    scope: string,
    key: string,
    value: string,
    updatedBy?: string,
  ): Promise<EsfConfigEntity> {
    const existing = await this.repository.findOne({ scope, key });
    if (existing) {
      existing.value = value;
      if (updatedBy) {
        existing.updated_by = updatedBy;
      }
      await this.em.flush();
      return existing;
    }

    const config = new EsfConfigEntity();
    config.scope = scope;
    config.key = key;
    config.value = value;
    if (updatedBy) {
      config.updated_by = updatedBy;
    }
    await this.em.persistAndFlush(config);
    return config;
  }
}
