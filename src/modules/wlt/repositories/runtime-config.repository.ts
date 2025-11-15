import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { RuntimeConfigEntity, ConfigScope, ConfigStatus } from '../entities/runtime-config.entity';

@Injectable()
export class RuntimeConfigRepository {
  constructor(
    @InjectRepository(RuntimeConfigEntity)
    private readonly repository: EntityRepository<RuntimeConfigEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(config: RuntimeConfigEntity): Promise<RuntimeConfigEntity> {
    this.em.persist(config);
    await this.em.flush();
    return config;
  }

  async findOne(id: string): Promise<RuntimeConfigEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByKey(
    key: string,
    scope?: ConfigScope,
    scopeValue?: string,
  ): Promise<RuntimeConfigEntity | null> {
    const where: Record<string, unknown> = { key, status: ConfigStatus.PUBLISHED };
    if (scope) {
      where.scope = scope;
    }
    if (scopeValue) {
      where.scope_value = scopeValue;
    }

    return this.repository.findOne(where, { orderBy: { updated_at: 'DESC' } });
  }

  async findPublished(key: string): Promise<RuntimeConfigEntity[]> {
    return this.repository.find(
      { key, status: ConfigStatus.PUBLISHED },
      { orderBy: [{ scope: 'DESC' }, { updated_at: 'DESC' }] },
    );
  }

  async findDraft(key: string): Promise<RuntimeConfigEntity | null> {
    return this.repository.findOne(
      { key, status: ConfigStatus.DRAFT },
      { orderBy: { updated_at: 'DESC' } },
    );
  }

  async update(config: RuntimeConfigEntity): Promise<RuntimeConfigEntity> {
    await this.em.flush();
    return config;
  }
}
