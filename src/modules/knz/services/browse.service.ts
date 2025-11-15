import { Injectable } from '@nestjs/common';
import { CategoryRepository } from '../repositories/category.repository';
import { ListingRepository } from '../repositories/listing.repository';
import { CategoryEntity, CategoryStatus } from '../entities/category.entity';
import { ListingEntity, ListingStatus } from '../entities/listing.entity';
import { HomeFeedDto } from '../dto/public/home-feed.dto';
import { SearchListingsDto } from '../dto/public/search-listings.dto';

@Injectable()
export class BrowseService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly listingRepository: ListingRepository,
  ) {}

  async getHomeFeed(
    query: HomeFeedDto,
    userId?: string,
  ): Promise<{
    categories: CategoryEntity[];
    featured_listings: ListingEntity[];
    recent_listings: ListingEntity[];
    nextCursor?: string;
  }> {
    const categories = await this.categoryRepository.findAll({
      status: CategoryStatus.ACTIVE,
      parent_id: null,
      limit: 10,
    });

    const limit = query.limit || 20;
    const listings = await this.listingRepository.findAll({
      status: ListingStatus.ACTIVE,
      cursor: query.cursor,
      limit: limit * 2,
    });

    const featuredListings = listings
      .filter((l) => l.priority === 'featured' || l.priority === 'sponsored')
      .slice(0, limit);
    const recentListings = listings.filter((l) => l.priority === 'normal').slice(0, limit);

    const hasMore = listings.length > limit * 2;
    const nextCursor =
      hasMore && recentListings.length > 0
        ? recentListings[recentListings.length - 1]?.created_at.toISOString()
        : undefined;

    return {
      categories: this.filterSensitiveCategories(categories, userId),
      featured_listings: this.filterSensitiveListings(featuredListings, userId),
      recent_listings: this.filterSensitiveListings(recentListings, userId),
      ...(nextCursor && { nextCursor }),
    };
  }

  async searchListings(
    query: SearchListingsDto,
    userId?: string,
  ): Promise<{
    items: ListingEntity[];
    nextCursor?: string;
  }> {
    const limit = query.limit || 20;
    const where: Record<string, unknown> = { status: ListingStatus.ACTIVE };

    if (query.category_id) {
      where.category_id = query.category_id;
    }

    let listings = await this.listingRepository.findAll({
      status: ListingStatus.ACTIVE,
      category_id: query.category_id,
      cursor: query.cursor,
      limit: limit + 1,
    });

    if (query.q) {
      listings = listings.filter(
        (l) =>
          l.title_ar.toLowerCase().includes(query.q!.toLowerCase()) ||
          l.title_en.toLowerCase().includes(query.q!.toLowerCase()) ||
          l.description_ar?.toLowerCase().includes(query.q!.toLowerCase()) ||
          l.description_en?.toLowerCase().includes(query.q!.toLowerCase()),
      );
    }

    if (query.min_price || query.max_price) {
      listings = listings.filter((l) => {
        if (!l.price) return false;
        const price = Number.parseFloat(l.price.amount);
        if (query.min_price && price < query.min_price) return false;
        if (query.max_price && price > query.max_price) return false;
        return true;
      });
    }

    if (query.sort) {
      this.sortListings(listings, query.sort);
    }

    const hasMore = listings.length > limit;
    const items = hasMore ? listings.slice(0, limit) : listings;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items: this.filterSensitiveListings(items, userId),
      ...(nextCursor && { nextCursor }),
    };
  }

  async getCategories(parentId?: string): Promise<CategoryEntity[]> {
    return this.categoryRepository.findAll({
      status: CategoryStatus.ACTIVE,
      parent_id: parentId || null,
    });
  }

  private filterSensitiveCategories(
    categories: CategoryEntity[],
    userId?: string,
  ): CategoryEntity[] {
    return categories;
  }

  private filterSensitiveListings(listings: ListingEntity[], userId?: string): ListingEntity[] {
    return listings;
  }

  private sortListings(listings: ListingEntity[], sort: string): void {
    switch (sort) {
      case 'price_asc':
        listings.sort((a, b) => {
          const priceA = a.price ? Number.parseFloat(a.price.amount) : 0;
          const priceB = b.price ? Number.parseFloat(b.price.amount) : 0;
          return priceA - priceB;
        });
        break;
      case 'price_desc':
        listings.sort((a, b) => {
          const priceA = a.price ? Number.parseFloat(a.price.amount) : 0;
          const priceB = b.price ? Number.parseFloat(b.price.amount) : 0;
          return priceB - priceA;
        });
        break;
      case 'newest':
        listings.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        break;
      case 'oldest':
        listings.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
        break;
      case 'relevance':
      default:
        listings.sort((a, b) => {
          if (a.priority === 'sponsored' && b.priority !== 'sponsored') return -1;
          if (a.priority !== 'sponsored' && b.priority === 'sponsored') return 1;
          if (a.priority === 'featured' && b.priority !== 'featured') return -1;
          if (a.priority !== 'featured' && b.priority === 'featured') return 1;
          return b.created_at.getTime() - a.created_at.getTime();
        });
        break;
    }
  }
}
