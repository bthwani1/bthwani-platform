import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { BannerEntity, BannerType, BannerStatus } from '../entities/banner.entity';

@Injectable()
export class BannerRepository {
  constructor(
    @InjectRepository(BannerEntity)
    private readonly repository: EntityRepository<BannerEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(banner: BannerEntity): Promise<BannerEntity> {
    this.em.persist(banner);
    await this.em.flush();
    return banner;
  }

  async findOne(id: string): Promise<BannerEntity | null> {
    return this.repository.findOne({ id });
  }

  async findAll(options?: {
    type?: BannerType;
    status?: BannerStatus;
    is_active?: boolean;
    region?: string;
    city?: string;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<BannerEntity[]> {
    const where: Record<string, unknown> = {};
    const now = new Date();

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.is_active !== undefined) {
      where.is_active = options.is_active;
    }

    // Date filtering
    where.$and = [
      {
        $or: [{ start_date: null }, { start_date: { $lte: now } }],
      },
      {
        $or: [{ end_date: null }, { end_date: { $gte: now } }],
      },
    ];

    if (options?.tags && options.tags.length > 0) {
      where.tags = { $contains: options.tags };
    }

    // Region/City filtering
    if (options?.region || options?.city) {
      const regionCityFilter = {
        $or: [
          { available_regions: null },
          ...(options.region ? [{ available_regions: { $contains: [options.region] } }] : []),
          { available_cities: null },
          ...(options.city ? [{ available_cities: { $contains: [options.city] } }] : []),
        ],
      };
      if (Array.isArray(where.$and)) {
        where.$and.push(regionCityFilter);
      } else {
        where.$and = [regionCityFilter];
      }
    }

    return this.repository.find(where, {
      limit: options?.limit,
      offset: options?.offset,
      orderBy: [
        { priority: 'DESC' },
        { created_at: 'DESC' },
      ],
    });
  }

  async findActive(options?: {
    type?: BannerType;
    region?: string;
    city?: string;
    tags?: string[];
  }): Promise<BannerEntity[]> {
    return this.findAll({
      status: BannerStatus.ACTIVE,
      is_active: true,
      ...options,
    });
  }

  async update(banner: BannerEntity): Promise<BannerEntity> {
    await this.em.flush();
    return banner;
  }

  async delete(id: string): Promise<void> {
    const banner = await this.repository.findOne({ id });
    if (banner) {
      await this.em.removeAndFlush(banner);
    }
  }
}

