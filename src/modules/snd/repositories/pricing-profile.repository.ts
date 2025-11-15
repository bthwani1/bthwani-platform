import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { SndPricingProfileEntity, SndPricingScope } from '../entities/pricing-profile.entity';

@Injectable()
export class SndPricingProfileRepository {
  constructor(
    @InjectRepository(SndPricingProfileEntity)
    private readonly repository: EntityRepository<SndPricingProfileEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(profile: SndPricingProfileEntity): Promise<SndPricingProfileEntity> {
    this.em.persist(profile);
    await this.em.flush();
    return profile;
  }

  async findOne(id: string): Promise<SndPricingProfileEntity | null> {
    return this.repository.findOne({ id });
  }

  async findActive(options?: {
    scope?: SndPricingScope;
    scopeValue?: string;
    categoryId?: string;
  }): Promise<SndPricingProfileEntity[]> {
    const where: Record<string, unknown> = {
      is_active: true,
      $or: [{ effective_until: null }, { effective_until: { $gte: new Date() } }],
      $and: [
        {
          $or: [{ effective_from: null }, { effective_from: { $lte: new Date() } }],
        },
      ],
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

    return this.repository.find(where, {
      orderBy: [{ scope: 'ASC' }, { created_at: 'DESC' }],
    });
  }

  async findByCategory(categoryId: string): Promise<SndPricingProfileEntity | null> {
    const profiles = await this.findActive({
      categoryId,
      scope: SndPricingScope.CATEGORY,
    });
    return profiles.length > 0 ? (profiles[0] ?? null) : null;
  }

  async findByCategoryAndRegion(
    categoryId: string,
    region: string,
  ): Promise<SndPricingProfileEntity | null> {
    const profiles = await this.repository.find(
      {
        category_id: categoryId,
        scope_value: region,
        scope: SndPricingScope.CATEGORY_REGION,
        is_active: true,
        $or: [{ effective_until: null }, { effective_until: { $gte: new Date() } }],
      },
      {
        orderBy: { created_at: 'DESC' },
        limit: 1,
      },
    );
    return profiles.length > 0 ? (profiles[0] ?? null) : null;
  }

  async findGlobal(): Promise<SndPricingProfileEntity | null> {
    const profiles = await this.findActive({
      scope: SndPricingScope.GLOBAL,
    });
    return profiles.length > 0 ? (profiles[0] ?? null) : null;
  }

  async update(profile: SndPricingProfileEntity): Promise<SndPricingProfileEntity> {
    await this.em.flush();
    return profile;
  }
}
