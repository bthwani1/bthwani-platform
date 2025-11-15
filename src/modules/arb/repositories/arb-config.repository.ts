import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { ArbConfigEntity, ConfigScope } from '../entities/arb-config.entity';

@Injectable()
export class ArbConfigRepository {
  constructor(
    @InjectRepository(ArbConfigEntity)
    private readonly repository: EntityRepository<ArbConfigEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(config: ArbConfigEntity): Promise<ArbConfigEntity> {
    this.em.persist(config);
    await this.em.flush();
    return config;
  }

  async findOne(id: string): Promise<ArbConfigEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<ArbConfigEntity | null> {
    return this.repository.findOne({ idempotency_key: idempotencyKey });
  }

  async findByScope(scope: ConfigScope, scopeValue?: string): Promise<ArbConfigEntity | null> {
    const where: Record<string, unknown> = {
      scope,
      is_active: true,
    };
    if (scopeValue) {
      where.scope_value = scopeValue;
    }

    return this.repository.findOne(where, { orderBy: { created_at: 'DESC' } });
  }

  async findAllActive(): Promise<ArbConfigEntity[]> {
    return this.repository.find({ is_active: true }, { orderBy: { created_at: 'DESC' } });
  }

  async update(config: ArbConfigEntity): Promise<ArbConfigEntity> {
    await this.em.flush();
    return config;
  }
}
