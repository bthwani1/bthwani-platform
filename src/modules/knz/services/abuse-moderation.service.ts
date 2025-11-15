import { Injectable, NotFoundException } from '@nestjs/common';
import { AbuseReportRepository } from '../repositories/abuse-report.repository';
import { ListingRepository } from '../repositories/listing.repository';
import { AbuseReportEntity, AbuseReportStatus } from '../entities/abuse-report.entity';
import { ListingEntity, ListingStatus } from '../entities/listing.entity';
import { ModerateListingDto, ModerationAction } from '../dto/abuse/moderate-listing.dto';
import { ResolveReportDto, ResolutionAction } from '../dto/abuse/resolve-report.dto';
import { AuditLogService } from './audit-log.service';
import { AuditAction, AuditEntityType } from '../entities/audit-log.entity';
import { Request } from 'express';

@Injectable()
export class AbuseModerationService {
  constructor(
    private readonly abuseReportRepository: AbuseReportRepository,
    private readonly listingRepository: ListingRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getAbuseReport(reportId: string): Promise<AbuseReportEntity> {
    const report = await this.abuseReportRepository.findOne(reportId);
    if (!report) {
      throw new NotFoundException(`Abuse report ${reportId} not found`);
    }
    return report;
  }

  async moderateListing(
    listingId: string,
    moderateDto: ModerateListingDto,
    userId: string,
    userEmail: string,
    request?: Request,
  ): Promise<ListingEntity> {
    const listing = await this.listingRepository.findOne(listingId);
    if (!listing) {
      throw new NotFoundException(`Listing ${listingId} not found`);
    }

    const oldStatus = listing.status;
    let newStatus: ListingStatus = listing.status;

    switch (moderateDto.action) {
      case ModerationAction.WARN:
        break;
      case ModerationAction.HIDE:
        newStatus = ListingStatus.SOFT_DISABLED;
        break;
      case ModerationAction.SOFT_BLOCK:
        newStatus = ListingStatus.SOFT_DISABLED;
        break;
      case ModerationAction.HARD_BLOCK:
        newStatus = ListingStatus.HARD_DISABLED;
        break;
      case ModerationAction.ESCALATE:
        newStatus = ListingStatus.FLAGGED;
        break;
    }

    listing.status = newStatus;
    const updated = await this.listingRepository.update(listing);

    await this.auditLogService.log({
      entityType: AuditEntityType.LISTING,
      entityId: listingId,
      action: AuditAction.MODERATE,
      userId,
      userEmail,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
      reason: moderateDto.reason,
      request,
      metadata: {
        action: moderateDto.action,
        effective_until: moderateDto.effective_until,
      },
    });

    return updated;
  }

  async resolveReport(
    reportId: string,
    resolveDto: ResolveReportDto,
    userId: string,
    userEmail: string,
    request?: Request,
  ): Promise<AbuseReportEntity> {
    const report = await this.abuseReportRepository.findOne(reportId);
    if (!report) {
      throw new NotFoundException(`Abuse report ${reportId} not found`);
    }

    const oldStatus = report.status;
    let newStatus: AbuseReportStatus;

    switch (resolveDto.action) {
      case ResolutionAction.DISMISS:
        newStatus = AbuseReportStatus.DISMISSED;
        break;
      case ResolutionAction.RESOLVE:
        newStatus = AbuseReportStatus.RESOLVED;
        break;
      case ResolutionAction.ESCALATE:
        newStatus = AbuseReportStatus.ESCALATED;
        break;
    }

    report.status = newStatus;
    report.reviewed_by = userId;
    report.review_notes = resolveDto.review_notes;
    if (newStatus === AbuseReportStatus.RESOLVED || newStatus === AbuseReportStatus.DISMISSED) {
      report.resolved_at = new Date();
    }

    const updated = await this.abuseReportRepository.update(report);

    await this.auditLogService.log({
      entityType: AuditEntityType.ABUSE_REPORT,
      entityId: reportId,
      action: AuditAction.UPDATE,
      userId,
      userEmail,
      oldValues: { status: oldStatus },
      newValues: { status: newStatus },
      reason: resolveDto.review_notes,
      request,
      metadata: {
        resolution_action: resolveDto.action,
      },
    });

    return updated;
  }
}
