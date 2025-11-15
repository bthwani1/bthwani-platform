import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ReportRepository } from '../repositories/report.repository';
import { ListingRepository } from '../repositories/listing.repository';
import { ReportEntity, ReportStatus, ReportReason } from '../entities/report.entity';
import { ReportListingDto } from '../dto/public/report-listing.dto';

/**
 * KWD Report Service
 * Handles listing abuse/fraud reports.
 */
@Injectable()
export class ReportService {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly listingRepository: ListingRepository,
  ) {}

  /**
   * Create a new report
   */
  async createReport(
    listing_id: string,
    reporter_id: string,
    dto: ReportListingDto,
  ): Promise<ReportEntity> {
    const listing = await this.listingRepository.findOne(listing_id);
    if (!listing) {
      throw new NotFoundException(`Listing ${listing_id} not found`);
    }
    const hasReported = await this.reportRepository.hasReported(listing_id, reporter_id);
    if (hasReported) {
      throw new ConflictException('You have already reported this listing');
    }
    const report = new ReportEntity();
    report.listing_id = listing_id;
    report.reporter_id = reporter_id;
    report.reason = dto.reason as ReportReason;
    if (dto.description) {
      report.description = dto.description;
    }
    report.status = ReportStatus.PENDING;
    await this.reportRepository.create(report);
    await this.listingRepository.incrementReportCount(listing_id);
    return report;
  }

  /**
   * Get report by ID
   */
  async getReport(id: string): Promise<ReportEntity> {
    const report = await this.reportRepository.findOne(id);
    if (!report) {
      throw new NotFoundException(`Report ${id} not found`);
    }
    return report;
  }

  /**
   * Get reports by listing
   */
  async getReportsByListing(listing_id: string): Promise<ReportEntity[]> {
    return this.reportRepository.findByListing(listing_id);
  }

  /**
   * Get reports with filters (support)
   */
  async getReports(filters?: {
    status?: ReportStatus;
    reason?: ReportReason;
    cursor?: string;
    limit?: number;
  }): Promise<{ data: ReportEntity[]; has_next: boolean }> {
    const limit = filters?.limit || 20;
    const reports = await this.reportRepository.findAll({
      ...filters,
      limit: limit + 1,
    });
    const hasNext = reports.length > limit;
    const data = hasNext ? reports.slice(0, limit) : reports;
    return { data, has_next: hasNext };
  }

  /**
   * Mark report as under review (support)
   */
  async markUnderReview(report_id: string): Promise<ReportEntity> {
    const report = await this.reportRepository.findOne(report_id);
    if (!report) {
      throw new NotFoundException(`Report ${report_id} not found`);
    }
    report.status = ReportStatus.UNDER_REVIEW;
    return this.reportRepository.update(report);
  }

  /**
   * Resolve report (support)
   */
  async resolveReport(
    report_id: string,
    resolved_by: string,
    resolution: string,
  ): Promise<ReportEntity> {
    const report = await this.reportRepository.findOne(report_id);
    if (!report) {
      throw new NotFoundException(`Report ${report_id} not found`);
    }
    return this.reportRepository.resolve(report, resolved_by, resolution);
  }

  /**
   * Dismiss report (support)
   */
  async dismissReport(
    report_id: string,
    resolved_by: string,
    resolution: string,
  ): Promise<ReportEntity> {
    const report = await this.reportRepository.findOne(report_id);
    if (!report) {
      throw new NotFoundException(`Report ${report_id} not found`);
    }
    return this.reportRepository.dismiss(report, resolved_by, resolution);
  }

  /**
   * Calculate reports per 100 listings (KPI)
   */
  async calculateReportsPerHundred(): Promise<number> {
    const totalListings = await this.listingRepository.countActive();
    const totalReports = await this.reportRepository.countPending();
    return totalListings > 0 ? (totalReports / totalListings) * 100 : 0;
  }
}
