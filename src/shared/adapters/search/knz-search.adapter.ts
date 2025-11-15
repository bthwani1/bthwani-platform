import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { BaseSearchAdapter, SearchAdapterQuery, SearchSuggestion } from './base-search.adapter';
import { SearchResult } from '../../services/unified-search.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ListingRepository } from '../../../modules/knz/repositories/listing.repository';
import { ListingEntity, ListingStatus } from '../../../modules/knz/entities/listing.entity';

/**
 * KNZ Search Adapter
 *
 * Provides search functionality for KNZ (marketplace) service
 */
@Injectable()
export class KnzSearchAdapter implements BaseSearchAdapter {
  constructor(
    @Inject(forwardRef(() => ListingRepository))
    private readonly listingRepository: ListingRepository,
    private readonly logger: LoggerService,
  ) {}

  getServiceName(): string {
    return 'knz';
  }

  async getSuggestions(
    query: string,
    options?: {
      region?: string;
      city?: string;
      limit?: number;
    },
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();
    const limit = options?.limit || 10;

    // Search in active listings
    const listings = await this.listingRepository.findAll({
      status: ListingStatus.ACTIVE,
      limit: limit * 2, // Get more to filter by relevance
    });

    for (const listing of listings) {
      const titleAr = listing.title_ar.toLowerCase();
      const titleEn = listing.title_en.toLowerCase();
      const descAr = listing.description_ar?.toLowerCase() || '';
      const descEn = listing.description_en?.toLowerCase() || '';

      if (
        titleAr.includes(queryLower) ||
        titleEn.includes(queryLower) ||
        descAr.includes(queryLower) ||
        descEn.includes(queryLower)
      ) {
        // Location filtering
        if (options?.city && listing.location?.city) {
          if (listing.location.city.toLowerCase() !== options.city.toLowerCase()) {
            continue;
          }
        }

        suggestions.push({
          id: listing.id,
          title_ar: listing.title_ar,
          title_en: listing.title_en,
          type: 'listing',
          relevance_score: this.calculateRelevance(
            listing.title_ar,
            listing.title_en,
            query,
            listing.view_count,
            listing.click_count,
          ),
        });
      }
    }

    // Sort by relevance and limit
    suggestions.sort((a, b) => b.relevance_score - a.relevance_score);
    return suggestions.slice(0, limit);
  }

  async search(query: SearchAdapterQuery): Promise<{
    items: SearchResult[];
    nextCursor?: string;
  }> {
    const results: SearchResult[] = [];
    const queryLower = query.q.toLowerCase();
    const limit = query.limit || 20;

    // Search in active listings
    const listings = await this.listingRepository.findAll({
      status: ListingStatus.ACTIVE,
      category_id: query.category,
      cursor: query.cursor,
      limit: limit + 1,
    });

    for (const listing of listings) {
      const titleAr = listing.title_ar.toLowerCase();
      const titleEn = listing.title_en.toLowerCase();
      const descAr = listing.description_ar?.toLowerCase() || '';
      const descEn = listing.description_en?.toLowerCase() || '';

      if (
        titleAr.includes(queryLower) ||
        titleEn.includes(queryLower) ||
        descAr.includes(queryLower) ||
        descEn.includes(queryLower)
      ) {
        // Location filtering
        if (query.city && listing.location?.city) {
          if (listing.location.city.toLowerCase() !== query.city.toLowerCase()) {
            continue;
          }
        }

        results.push({
          service: 'knz',
          type: 'knz_listing',
          id: listing.id,
          title_ar: listing.title_ar,
          title_en: listing.title_en,
          description_ar: listing.description_ar,
          description_en: listing.description_en,
          image_url: listing.images?.[0],
          relevance_score: this.calculateRelevance(
            listing.title_ar,
            listing.title_en,
            query.q,
            listing.view_count,
            listing.click_count,
          ),
          metadata: {
            category_id: listing.category_id,
            price: listing.price,
            location: listing.location,
            priority: listing.priority,
          },
        });
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance_score - a.relevance_score);

    // Apply limit and cursor
    const items = results.slice(0, limit);
    const nextCursor =
      results.length > limit && items.length > 0 ? items[items.length - 1]?.id : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }

  private calculateRelevance(
    titleAr: string,
    titleEn: string,
    query: string,
    viewCount: number = 0,
    clickCount: number = 0,
  ): number {
    const queryLower = query.toLowerCase();
    const titleArLower = titleAr.toLowerCase();
    const titleEnLower = titleEn.toLowerCase();

    let score = 0;

    // Exact match
    if (titleArLower === queryLower || titleEnLower === queryLower) {
      score += 100;
    }
    // Starts with
    else if (titleArLower.startsWith(queryLower) || titleEnLower.startsWith(queryLower)) {
      score += 80;
    }
    // Contains
    else if (titleArLower.includes(queryLower) || titleEnLower.includes(queryLower)) {
      score += 50;
    }

    // Length similarity bonus
    const lengthDiff = Math.abs(titleAr.length - query.length);
    score += Math.max(0, 20 - lengthDiff);

    // Engagement bonus (views + clicks)
    score += Math.min(30, (viewCount + clickCount) / 10);

    return score;
  }
}

