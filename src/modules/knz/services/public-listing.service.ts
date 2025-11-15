import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ListingRepository } from '../repositories/listing.repository';
import { FavoriteRepository } from '../repositories/favorite.repository';
import { ListingEntity, ListingStatus } from '../entities/listing.entity';
import { FavoriteEntity } from '../entities/favorite.entity';

@Injectable()
export class PublicListingService {
  constructor(
    private readonly listingRepository: ListingRepository,
    private readonly favoriteRepository: FavoriteRepository,
  ) {}

  async getListing(listingId: string, userId?: string): Promise<ListingEntity> {
    const listing = await this.listingRepository.findOne(listingId);
    if (!listing || listing.status !== ListingStatus.ACTIVE) {
      throw new NotFoundException(`Listing ${listingId} not found or not available`);
    }

    if (userId) {
      listing.view_count += 1;
      await this.listingRepository.update(listing);
    }

    return listing;
  }

  async toggleFavorite(listingId: string, userId: string): Promise<{ is_favorite: boolean }> {
    const listing = await this.listingRepository.findOne(listingId);
    if (!listing || listing.status !== ListingStatus.ACTIVE) {
      throw new NotFoundException(`Listing ${listingId} not found or not available`);
    }

    const existing = await this.favoriteRepository.findOne(userId, listingId);
    if (existing) {
      await this.favoriteRepository.delete(userId, listingId);
      return { is_favorite: false };
    } else {
      const favorite = new FavoriteEntity();
      favorite.user_id = userId;
      favorite.listing_id = listingId;
      await this.favoriteRepository.create(favorite);
      return { is_favorite: true };
    }
  }

  async getFavorites(
    userId: string,
    options?: {
      cursor?: string;
      limit?: number;
    },
  ): Promise<{
    items: FavoriteEntity[];
    nextCursor?: string;
  }> {
    const limit = options?.limit || 20;
    const favorites = await this.favoriteRepository.findByUser(userId, {
      cursor: options?.cursor,
      limit: limit + 1,
    });

    const hasMore = favorites.length > limit;
    const items = hasMore ? favorites.slice(0, limit) : favorites;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }

  async isFavorite(listingId: string, userId: string): Promise<boolean> {
    return this.favoriteRepository.isFavorited(userId, listingId);
  }
}
