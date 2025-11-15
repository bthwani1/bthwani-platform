import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { SndConfigEntity, SndConfigScope } from '../entities/snd-config.entity';

@Injectable()
export class SndConfigRepository {
  constructor(
    @InjectRepository(SndConfigEntity)
    private readonly repository: EntityRepository<SndConfigEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(config: SndConfigEntity): Promise<SndConfigEntity> {
    this.em.persist(config);
    await this.em.flush();
    return config;
  }

  async findOne(id: string): Promise<SndConfigEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByKey(
    key: string,
    options?: {
      scope?: SndConfigScope;
      scopeValue?: string;
      categoryId?: string;
    },
  ): Promise<SndConfigEntity | null> {
    const where: Record<string, unknown> = {
      key,
      is_active: true,
    };

    if (options?.scope) {
      where.scope = options.scope;
    }
    if (options?.scopeValue) {
      where.scope_value = options.scopeValue;
    }
    if (options?.categoryId) {
      where.category_id = options.categoryId;
    }

    return this.repository.findOne(where, {
      orderBy: [{ scope: 'ASC' }, { created_at: 'DESC' }],
    });
  }

  async findAll(options?: {
    scope?: SndConfigScope;
    isActive?: boolean;
  }): Promise<SndConfigEntity[]> {
    const where: Record<string, unknown> = {};
    if (options?.scope) {
      where.scope = options.scope;
    }
    if (options?.isActive !== undefined) {
      where.is_active = options.isActive;
    }

    return this.repository.find(where, {
      orderBy: [{ scope: 'ASC' }, { key: 'ASC' }],
    });
  }

  async update(config: SndConfigEntity): Promise<SndConfigEntity> {
    await this.em.flush();
    return config;
  }
}
