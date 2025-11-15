import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import {
  AbuseReportEntity,
  AbuseReportStatus,
  AbuseReportType,
} from '../entities/abuse-report.entity';

@Injectable()
export class AbuseReportRepository {
  constructor(
    @InjectRepository(AbuseReportEntity)
    private readonly repository: EntityRepository<AbuseReportEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(report: AbuseReportEntity): Promise<AbuseReportEntity> {
    this.em.persist(report);
    await this.em.flush();
    return report;
  }

  async findOne(id: string): Promise<AbuseReportEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByListing(
    listingId: string,
    options?: {
      status?: AbuseReportStatus;
      limit?: number;
    },
  ): Promise<AbuseReportEntity[]> {
    const where: Record<string, unknown> = { listing_id: listingId };
    if (options?.status) {
      where.status = options.status;
    }
    return this.repository.find(where, {
      limit: options?.limit,
      orderBy: { created_at: 'DESC' },
    });
  }

  async findAll(options?: {
    status?: AbuseReportStatus;
    report_type?: AbuseReportType;
    listing_id?: string;
    cursor?: string;
    limit?: number;
  }): Promise<AbuseReportEntity[]> {
    const where: Record<string, unknown> = {};
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.report_type) {
      where.report_type = options.report_type;
    }
    if (options?.listing_id) {
      where.listing_id = options.listing_id;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }
    return this.repository.find(where, {
      limit: options?.limit,
      orderBy: { created_at: 'DESC' },
    });
  }

  async update(report: AbuseReportEntity): Promise<AbuseReportEntity> {
    await this.em.flush();
    return report;
  }

  async countByListing(listingId: string): Promise<number> {
    return this.repository.count({ listing_id: listingId });
  }
}
