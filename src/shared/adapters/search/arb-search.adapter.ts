import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { BaseSearchAdapter, SearchAdapterQuery, SearchSuggestion } from './base-search.adapter';
import { SearchResult } from '../../services/unified-search.service';
import { LoggerService } from '../../../core/services/logger.service';
import { OfferRepository } from '../../../modules/arb/repositories/offer.repository';
import { OfferEntity, OfferStatus } from '../../../modules/arb/entities/offer.entity';

/**
 * ARB Search Adapter
 *
 * Provides search functionality for ARB (bookings/escrow) service
 */
@Injectable()
export class ArbSearchAdapter implements BaseSearchAdapter {
  constructor(
    @Inject(forwardRef(() => OfferRepository))
    private readonly offerRepository: OfferRepository,
    private readonly logger: LoggerService,
  ) {}

  getServiceName(): string {
    return 'arb';
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

    // Search in active offers
    const offers = await this.offerRepository.search({
      status: OfferStatus.ACTIVE,
      limit: limit * 2, // Get more to filter by relevance
    });

    for (const offer of offers) {
      const titleAr = offer.title_ar.toLowerCase();
      const titleEn = offer.title_en.toLowerCase();
      const descAr = offer.description_ar?.toLowerCase() || '';
      const descEn = offer.description_en?.toLowerCase() || '';

      if (
        titleAr.includes(queryLower) ||
        titleEn.includes(queryLower) ||
        descAr.includes(queryLower) ||
        descEn.includes(queryLower)
      ) {
        // Location filtering
        if (options?.city && offer.location?.city) {
          if (offer.location.city.toLowerCase() !== options.city.toLowerCase()) {
            continue;
          }
        }

        // Region filtering
        if (options?.region && offer.region_code) {
          if (offer.region_code.toLowerCase() !== options.region.toLowerCase()) {
            continue;
          }
        }

        suggestions.push({
          id: offer.id,
          title_ar: offer.title_ar,
          title_en: offer.title_en,
          type: 'offer',
          relevance_score: this.calculateRelevance(
            offer.title_ar,
            offer.title_en,
            query,
            offer.view_count,
            offer.booking_count,
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

    // Search in active offers
    const offers = await this.offerRepository.search({
      status: OfferStatus.ACTIVE,
      category_id: query.category,
      region_code: query.region,
      limit: limit + 1,
    });

    for (const offer of offers) {
      const titleAr = offer.title_ar.toLowerCase();
      const titleEn = offer.title_en.toLowerCase();
      const descAr = offer.description_ar?.toLowerCase() || '';
      const descEn = offer.description_en?.toLowerCase() || '';

      if (
        titleAr.includes(queryLower) ||
        titleEn.includes(queryLower) ||
        descAr.includes(queryLower) ||
        descEn.includes(queryLower)
      ) {
        // Location filtering
        if (query.city && offer.location?.city) {
          if (offer.location.city.toLowerCase() !== query.city.toLowerCase()) {
            continue;
          }
        }

        results.push({
          service: 'arb',
          type: 'arb_offer',
          id: offer.id,
          title_ar: offer.title_ar,
          title_en: offer.title_en,
          description_ar: offer.description_ar,
          description_en: offer.description_en,
          image_url: offer.images?.[0],
          relevance_score: this.calculateRelevance(
            offer.title_ar,
            offer.title_en,
            query.q,
            offer.view_count,
            offer.booking_count,
          ),
          metadata: {
            category_id: offer.category_id,
            subcategory_id: offer.subcategory_id,
            price: offer.price,
            deposit_amount: offer.deposit_amount,
            location: offer.location,
            region_code: offer.region_code,
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
    bookingCount: number = 0,
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

    // Engagement bonus (views + bookings)
    score += Math.min(30, (viewCount + bookingCount * 2) / 10);

    return score;
  }
}

