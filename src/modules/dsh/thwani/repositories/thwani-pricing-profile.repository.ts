import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { ThwaniPricingProfileEntity, ThwaniPricingScope } from '../entities/thwani-pricing-profile.entity';

@Injectable()
export class ThwaniPricingProfileRepository {
  constructor(
    @InjectRepository(ThwaniPricingProfileEntity)
    private readonly repository: EntityRepository<ThwaniPricingProfileEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(profile: ThwaniPricingProfileEntity): Promise<ThwaniPricingProfileEntity> {
    this.em.persist(profile);
    await this.em.flush();
    return profile;
  }

  async findOne(id: string): Promise<ThwaniPricingProfileEntity | null> {
    return this.repository.findOne({ id });
  }

  async findActive(options?: {
    scope?: ThwaniPricingScope;
    scopeValue?: string;
    categoryId?: string;
    region?: string;
  }): Promise<ThwaniPricingProfileEntity[]> {
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
    if (options?.region) {
      where.region = options.region;
    }

    return this.repository.find(where, {
      orderBy: [{ scope: 'ASC' }, { created_at: 'DESC' }],
    });
  }

  async findByCategory(categoryId: string): Promise<ThwaniPricingProfileEntity | null> {
    const profiles = await this.findActive({
      categoryId,
      scope: ThwaniPricingScope.CATEGORY,
    });
    return profiles.length > 0 ? (profiles[0] ?? null) : null;
  }

  async findByCategoryAndRegion(
    categoryId: string,
    region: string,
  ): Promise<ThwaniPricingProfileEntity | null> {
    const profiles = await this.repository.find(
      {
        category_id: categoryId,
        region,
        scope: ThwaniPricingScope.CATEGORY_REGION,
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

  async findByRegion(region: string): Promise<ThwaniPricingProfileEntity | null> {
    const profiles = await this.findActive({
      region,
      scope: ThwaniPricingScope.REGION,
    });
    return profiles.length > 0 ? (profiles[0] ?? null) : null;
  }

  async findGlobal(): Promise<ThwaniPricingProfileEntity | null> {
    const profiles = await this.findActive({
      scope: ThwaniPricingScope.GLOBAL,
    });
    return profiles.length > 0 ? (profiles[0] ?? null) : null;
  }

  async update(profile: ThwaniPricingProfileEntity): Promise<ThwaniPricingProfileEntity> {
    await this.em.flush();
    return profile;
  }
}

