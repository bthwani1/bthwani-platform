import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { ListingEntity, ListingStatus } from '../entities/listing.entity';

@Injectable()
export class ListingRepository {
  constructor(
    @InjectRepository(ListingEntity)
    private readonly repository: EntityRepository<ListingEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(listing: ListingEntity): Promise<ListingEntity> {
    this.em.persist(listing);
    await this.em.flush();
    return listing;
  }

  async findOne(id: string): Promise<ListingEntity | null> {
    return this.repository.findOne({ id }, { populate: ['category'] });
  }

  async findAll(options?: {
    status?: ListingStatus;
    seller_id?: string;
    category_id?: string;
    cursor?: string;
    limit?: number;
  }): Promise<ListingEntity[]> {
    const where: Record<string, unknown> = {};
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.seller_id) {
      where.seller_id = options.seller_id;
    }
    if (options?.category_id) {
      where.category_id = options.category_id;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }
    return this.repository.find(where, {
      limit: options?.limit,
      orderBy: { created_at: 'DESC' },
    });
  }

  async findByStatus(status: ListingStatus, limit: number = 100): Promise<ListingEntity[]> {
    return this.repository.find({ status }, { limit, orderBy: { created_at: 'DESC' } });
  }

  async update(listing: ListingEntity): Promise<ListingEntity> {
    await this.em.flush();
    return listing;
  }

  async countByStatus(status: ListingStatus): Promise<number> {
    return this.repository.count({ status });
  }

  async aggregateMetrics(): Promise<{
    total_listings: number;
    active_listings: number;
    pending_review: number;
    flagged: number;
  }> {
    const totalListings = await this.repository.count({});
    const activeListings = await this.repository.count({ status: ListingStatus.ACTIVE });
    const pendingReview = await this.repository.count({ status: ListingStatus.PENDING_REVIEW });
    const flagged = await this.repository.count({ status: ListingStatus.FLAGGED });
    return {
      total_listings: totalListings,
      active_listings: activeListings,
      pending_review: pendingReview,
      flagged: flagged,
    };
  }
}
