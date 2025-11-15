import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ListingRepository } from '../repositories/listing.repository';
import { ListingEntity, ListingStatus, EntityType } from '../entities/listing.entity';
import { CreateListingDto } from '../dto/public/create-listing.dto';
import { UpdateListingDto } from '../dto/public/update-listing.dto';

/**
 * KWD Listing Command Service
 * Handles listing mutations (create, update, delete).
 * No financial fields (free service).
 */
@Injectable()
export class ListingCommandService {
  constructor(private readonly listingRepository: ListingRepository) {}

  /**
   * Create a new job listing
   */
  async createListing(dto: CreateListingDto, owner_id: string): Promise<ListingEntity> {
    const listing = new ListingEntity();
    listing.entity_type = dto.entity_type as EntityType;
    listing.title = dto.title;
    listing.description = dto.description;
    listing.location = dto.location;
    listing.skills = dto.skills;
    listing.experience_years = dto.experience_years;
    if (dto.attachments) {
      listing.attachments = dto.attachments;
    }
    listing.owner_id = owner_id;
    listing.status = ListingStatus.PENDING_REVIEW;
    listing.is_sponsored = false;
    listing.boost_score = 0;
    return this.listingRepository.create(listing);
  }

  /**
   * Update existing listing
   * Owner or Admin only
   */
  async updateListing(
    id: string,
    dto: UpdateListingDto,
    user_id: string,
    is_admin: boolean = false,
  ): Promise<ListingEntity> {
    const listing = await this.listingRepository.findOne(id);
    if (!listing) {
      throw new NotFoundException(`Listing ${id} not found`);
    }
    if (listing.owner_id !== user_id && !is_admin) {
      throw new ForbiddenException('You do not have permission to update this listing');
    }
    if (dto.title !== undefined) {
      listing.title = dto.title;
    }
    if (dto.description !== undefined) {
      listing.description = dto.description;
    }
    if (dto.location !== undefined) {
      listing.location = dto.location;
    }
    if (dto.skills !== undefined) {
      listing.skills = dto.skills;
    }
    if (dto.experience_years !== undefined) {
      listing.experience_years = dto.experience_years;
    }
    if (dto.attachments !== undefined) {
      listing.attachments = dto.attachments || undefined;
    }
    if (dto.status !== undefined) {
      if (dto.status === 'closed') {
        listing.status = ListingStatus.CLOSED;
        listing.closed_at = new Date();
      } else if (
        dto.status === 'published' &&
        (is_admin || listing.status === ListingStatus.PUBLISHED)
      ) {
        listing.status = ListingStatus.PUBLISHED;
      }
    }
    return this.listingRepository.update(listing);
  }

  /**
   * Delete/close listing
   * Owner or Admin only
   */
  async deleteListing(id: string, user_id: string, is_admin: boolean = false): Promise<void> {
    const listing = await this.listingRepository.findOne(id);
    if (!listing) {
      throw new NotFoundException(`Listing ${id} not found`);
    }
    if (listing.owner_id !== user_id && !is_admin) {
      throw new ForbiddenException('You do not have permission to delete this listing');
    }
    await this.listingRepository.softDelete(listing);
  }

  /**
   * Set listing as sponsored (admin only)
   */
  async setSponsored(
    id: string,
    is_sponsored: boolean,
    boost_score: number = 0,
  ): Promise<ListingEntity> {
    const listing = await this.listingRepository.findOne(id);
    if (!listing) {
      throw new NotFoundException(`Listing ${id} not found`);
    }
    listing.is_sponsored = is_sponsored;
    listing.boost_score = boost_score;
    return this.listingRepository.update(listing);
  }
}
