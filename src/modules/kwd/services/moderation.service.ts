import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ListingRepository } from '../repositories/listing.repository';
import { ModerationLogRepository } from '../repositories/moderation-log.repository';
import { ListingEntity, ListingStatus } from '../entities/listing.entity';
import { ModerationLogEntity, ModerationAction } from '../entities/moderation-log.entity';

/**
 * KWD Moderation Service
 * Handles listing approval/rejection and moderation actions.
 */
@Injectable()
export class ModerationService {
  constructor(
    private readonly listingRepository: ListingRepository,
    private readonly moderationLogRepository: ModerationLogRepository,
  ) {}

  /**
   * Approve listing (admin)
   */
  async approveListing(
    listing_id: string,
    approved_by: string,
    role: string,
    reason?: string,
  ): Promise<ListingEntity> {
    const listing = await this.listingRepository.findOne(listing_id);
    if (!listing) {
      throw new NotFoundException(`Listing ${listing_id} not found`);
    }
    if (listing.status !== ListingStatus.PENDING_REVIEW) {
      throw new BadRequestException('Only pending listings can be approved');
    }
    listing.status = ListingStatus.PUBLISHED;
    listing.approved_by = approved_by;
    listing.approved_at = new Date();
    await this.listingRepository.update(listing);
    const log = new ModerationLogEntity();
    log.listing_id = listing_id;
    log.action = ModerationAction.APPROVE;
    log.reason = reason || 'Approved by admin';
    log.applied_by = approved_by;
    log.applied_by_role = role;
    await this.moderationLogRepository.create(log);
    return listing;
  }

  /**
   * Reject listing (admin)
   */
  async rejectListing(
    listing_id: string,
    rejected_by: string,
    role: string,
    reason: string,
  ): Promise<ListingEntity> {
    const listing = await this.listingRepository.findOne(listing_id);
    if (!listing) {
      throw new NotFoundException(`Listing ${listing_id} not found`);
    }
    if (listing.status !== ListingStatus.PENDING_REVIEW) {
      throw new BadRequestException('Only pending listings can be rejected');
    }
    if (!reason) {
      throw new BadRequestException('Rejection reason is required');
    }
    listing.status = ListingStatus.REJECTED;
    listing.rejection_reason = reason;
    await this.listingRepository.update(listing);
    const log = new ModerationLogEntity();
    log.listing_id = listing_id;
    log.action = ModerationAction.REJECT;
    log.reason = reason;
    log.applied_by = rejected_by;
    log.applied_by_role = role;
    await this.moderationLogRepository.create(log);
    return listing;
  }

  /**
   * Hide listing (support)
   */
  async hideListing(
    listing_id: string,
    hidden_by: string,
    role: string,
    reason: string,
  ): Promise<ListingEntity> {
    const listing = await this.listingRepository.findOne(listing_id);
    if (!listing) {
      throw new NotFoundException(`Listing ${listing_id} not found`);
    }
    listing.status = ListingStatus.HIDDEN;
    listing.hidden_at = new Date();
    await this.listingRepository.update(listing);
    const log = new ModerationLogEntity();
    log.listing_id = listing_id;
    log.action = ModerationAction.HIDE;
    log.reason = reason;
    log.applied_by = hidden_by;
    log.applied_by_role = role;
    await this.moderationLogRepository.create(log);
    return listing;
  }

  /**
   * Soft delete listing (support)
   */
  async softDeleteListing(
    listing_id: string,
    deleted_by: string,
    role: string,
    reason: string,
  ): Promise<void> {
    const listing = await this.listingRepository.findOne(listing_id);
    if (!listing) {
      throw new NotFoundException(`Listing ${listing_id} not found`);
    }
    await this.listingRepository.softDelete(listing);
    const log = new ModerationLogEntity();
    log.listing_id = listing_id;
    log.action = ModerationAction.SOFT_DELETE;
    log.reason = reason;
    log.applied_by = deleted_by;
    log.applied_by_role = role;
    await this.moderationLogRepository.create(log);
  }

  /**
   * Get moderation history for listing
   */
  async getModerationHistory(listing_id: string): Promise<ModerationLogEntity[]> {
    return this.moderationLogRepository.findByListing(listing_id);
  }

  /**
   * Calculate rejection rate (KPI)
   */
  async calculateRejectionRate(days: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const totalReviewed =
      (await this.moderationLogRepository.countByAction(ModerationAction.APPROVE)) +
      (await this.moderationLogRepository.countByAction(ModerationAction.REJECT));
    const rejected = await this.moderationLogRepository.countByAction(ModerationAction.REJECT);
    return totalReviewed > 0 ? rejected / totalReviewed : 0;
  }
}
