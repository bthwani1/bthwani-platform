import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { ReportEntity, ReportStatus, ReportReason } from '../entities/report.entity';

/**
 * KWD Report Repository
 * Handles persistence operations for listing reports.
 */
@Injectable()
export class ReportRepository {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly repository: EntityRepository<ReportEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  /**
   * Create a new report
   */
  async create(report: ReportEntity): Promise<ReportEntity> {
    this.em.persist(report);
    await this.em.flush();
    return report;
  }

  /**
   * Find report by ID
   */
  async findOne(id: string): Promise<ReportEntity | null> {
    return this.repository.findOne({ id }, { populate: ['listing'] });
  }

  /**
   * Find reports by listing ID
   */
  async findByListing(listing_id: string): Promise<ReportEntity[]> {
    return this.repository.find({ listing_id }, { orderBy: { created_at: 'DESC' } });
  }

  /**
   * Find reports with filters and pagination
   */
  async findAll(options?: {
    status?: ReportStatus;
    reason?: ReportReason;
    listing_id?: string;
    cursor?: string;
    limit?: number;
  }): Promise<ReportEntity[]> {
    const where: Record<string, unknown> = {};
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.reason) {
      where.reason = options.reason;
    }
    if (options?.listing_id) {
      where.listing_id = options.listing_id;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }
    return this.repository.find(where, {
      limit: options?.limit || 20,
      orderBy: { created_at: 'DESC' },
      populate: ['listing'],
    });
  }

  /**
   * Update report (flush changes)
   */
  async update(report: ReportEntity): Promise<ReportEntity> {
    await this.em.flush();
    return report;
  }

  /**
   * Resolve report
   */
  async resolve(
    report: ReportEntity,
    resolved_by: string,
    resolution: string,
  ): Promise<ReportEntity> {
    report.status = ReportStatus.RESOLVED;
    report.resolved_by = resolved_by;
    report.resolution = resolution;
    report.resolved_at = new Date();
    await this.em.flush();
    return report;
  }

  /**
   * Dismiss report
   */
  async dismiss(
    report: ReportEntity,
    resolved_by: string,
    resolution: string,
  ): Promise<ReportEntity> {
    report.status = ReportStatus.DISMISSED;
    report.resolved_by = resolved_by;
    report.resolution = resolution;
    report.resolved_at = new Date();
    await this.em.flush();
    return report;
  }

  /**
   * Count reports by listing
   */
  async countByListing(listing_id: string): Promise<number> {
    return this.repository.count({ listing_id });
  }

  /**
   * Count pending reports
   */
  async countPending(): Promise<number> {
    return this.repository.count({ status: ReportStatus.PENDING });
  }

  /**
   * Find old reports for retention cleanup (365 days)
   */
  async findForRetention(daysOld: number = 365): Promise<ReportEntity[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    return this.repository.find({
      created_at: { $lt: cutoffDate },
    });
  }

  /**
   * Check if user has already reported this listing
   */
  async hasReported(listing_id: string, reporter_id: string): Promise<boolean> {
    const count = await this.repository.count({ listing_id, reporter_id });
    return count > 0;
  }
}
