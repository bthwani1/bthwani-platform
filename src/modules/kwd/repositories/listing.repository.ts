import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { ListingEntity, ListingStatus } from '../entities/listing.entity';

/**
 * KWD Listing Repository
 * Handles persistence operations for job listings.
 */
@Injectable()
export class ListingRepository {
  constructor(
    @InjectRepository(ListingEntity)
    private readonly repository: EntityRepository<ListingEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  /**
   * Create a new listing
   */
  async create(listing: ListingEntity): Promise<ListingEntity> {
    this.em.persist(listing);
    await this.em.flush();
    return listing;
  }

  /**
   * Find listing by ID
   */
  async findOne(id: string): Promise<ListingEntity | null> {
    return this.repository.findOne({ id });
  }

  /**
   * Find listings with filters and cursor pagination
   */
  async findAll(options?: {
    status?: ListingStatus;
    owner_id?: string;
    region?: string;
    city?: string;
    cursor?: string;
    limit?: number;
  }): Promise<ListingEntity[]> {
    const where: Record<string, unknown> = {};
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.owner_id) {
      where.owner_id = options.owner_id;
    }
    if (options?.region) {
      where['location.region'] = options.region;
    }
    if (options?.city) {
      where['location.city'] = options.city;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }
    return this.repository.find(where, {
      limit: options?.limit || 20,
      orderBy: { created_at: 'DESC' },
    });
  }

  /**
   * Find listings by status
   */
  async findByStatus(status: ListingStatus, limit: number = 100): Promise<ListingEntity[]> {
    return this.repository.find({ status }, { limit, orderBy: { created_at: 'DESC' } });
  }

  /**
   * Find listings by owner
   */
  async findByOwner(owner_id: string, limit: number = 100): Promise<ListingEntity[]> {
    return this.repository.find({ owner_id }, { limit, orderBy: { created_at: 'DESC' } });
  }

  /**
   * Update listing (flush changes)
   */
  async update(listing: ListingEntity): Promise<ListingEntity> {
    await this.em.flush();
    return listing;
  }

  /**
   * Soft delete listing
   */
  async softDelete(listing: ListingEntity): Promise<void> {
    listing.status = ListingStatus.CLOSED;
    listing.closed_at = new Date();
    await this.em.flush();
  }

  /**
   * Count listings by status
   */
  async countByStatus(status: ListingStatus): Promise<number> {
    return this.repository.count({ status });
  }

  /**
   * Count total active listings
   */
  async countActive(): Promise<number> {
    return this.repository.count({ status: ListingStatus.PUBLISHED });
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    const listing = await this.findOne(id);
    if (listing) {
      listing.view_count += 1;
      await this.em.flush();
    }
  }

  /**
   * Increment report count
   */
  async incrementReportCount(id: string): Promise<void> {
    const listing = await this.findOne(id);
    if (listing) {
      listing.report_count += 1;
      await this.em.flush();
    }
  }

  /**
   * Aggregate metrics for KPIs
   */
  async aggregateMetrics(): Promise<{
    total_listings: number;
    active_listings: number;
    pending_review: number;
    rejected: number;
    closed: number;
    hidden: number;
  }> {
    const totalListings = await this.repository.count({});
    const activeListings = await this.repository.count({ status: ListingStatus.PUBLISHED });
    const pendingReview = await this.repository.count({ status: ListingStatus.PENDING_REVIEW });
    const rejected = await this.repository.count({ status: ListingStatus.REJECTED });
    const closed = await this.repository.count({ status: ListingStatus.CLOSED });
    const hidden = await this.repository.count({ status: ListingStatus.HIDDEN });
    return {
      total_listings: totalListings,
      active_listings: activeListings,
      pending_review: pendingReview,
      rejected,
      closed,
      hidden,
    };
  }

  /**
   * Find old listings for retention cleanup (180 days)
   */
  async findForRetention(daysOld: number = 180): Promise<ListingEntity[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    return this.repository.find({
      created_at: { $lt: cutoffDate },
    });
  }
}
