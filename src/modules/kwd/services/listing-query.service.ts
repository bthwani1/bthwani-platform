import { Injectable, NotFoundException } from '@nestjs/common';
import { ListingRepository } from '../repositories/listing.repository';
import { ListingEntity, ListingStatus } from '../entities/listing.entity';
import { SearchListingsDto } from '../dto/public/search-listings.dto';

/**
 * KWD Listing Query Service
 * Handles listing queries (search, details, filters).
 */
@Injectable()
export class ListingQueryService {
  constructor(private readonly listingRepository: ListingRepository) {}

  /**
   * Get listing details by ID
   */
  async getListing(id: string): Promise<ListingEntity> {
    const listing = await this.listingRepository.findOne(id);
    if (!listing) {
      throw new NotFoundException(`Listing ${id} not found`);
    }
    await this.listingRepository.incrementViewCount(id);
    return listing;
  }

  /**
   * Search listings with filters
   * (Ranking handled by RankingEngine or SearchAdapter)
   */
  async searchListings(
    dto: SearchListingsDto,
  ): Promise<{ data: ListingEntity[]; has_next: boolean }> {
    const filters: {
      status?: ListingStatus;
      region?: string;
      city?: string;
      cursor?: string;
      limit?: number;
    } = {
      status: dto.status === 'closed' ? ListingStatus.CLOSED : ListingStatus.PUBLISHED,
      limit: (dto.limit || 20) + 1,
    };
    if (dto.region) filters.region = dto.region;
    if (dto.city) filters.city = dto.city;
    if (dto.cursor) filters.cursor = dto.cursor;

    const listings = await this.listingRepository.findAll(filters);
    const hasNext = listings.length > (dto.limit || 20);
    const data = hasNext ? listings.slice(0, dto.limit || 20) : listings;
    return { data, has_next: hasNext };
  }

  /**
   * Get listings by owner
   */
  async getListingsByOwner(owner_id: string, limit: number = 100): Promise<ListingEntity[]> {
    return this.listingRepository.findByOwner(owner_id, limit);
  }

  /**
   * Get listings by status (admin)
   */
  async getListingsByStatus(status: ListingStatus, limit: number = 100): Promise<ListingEntity[]> {
    return this.listingRepository.findByStatus(status, limit);
  }

  /**
   * Get active listings count
   */
  async getActiveCount(): Promise<number> {
    return this.listingRepository.countActive();
  }
}
