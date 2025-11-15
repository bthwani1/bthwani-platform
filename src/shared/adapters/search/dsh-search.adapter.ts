import { Injectable } from '@nestjs/common';
import { BaseSearchAdapter, SearchAdapterQuery, SearchSuggestion } from './base-search.adapter';
import { SearchResult } from '../../services/unified-search.service';
import { Inject, forwardRef } from '@nestjs/common';
import { DshCategoryService } from '../../../modules/dsh/services/dsh-category.service';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * DSH Search Adapter
 *
 * Provides search functionality for DSH service:
 * - Categories (restaurants, supermarkets, fashion, etc.)
 * - Stores (via DSH orders/stores - TODO: implement when stores entity exists)
 * - Products (via DSH products - TODO: implement when products entity exists)
 */
@Injectable()
export class DshSearchAdapter implements BaseSearchAdapter {
  constructor(
    @Inject(forwardRef(() => DshCategoryService))
    private readonly categoryService: DshCategoryService,
    private readonly logger: LoggerService,
  ) {}

  getServiceName(): string {
    return 'dsh';
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

    // Search in categories
    const categories = await this.categoryService.findActive({
      region: options?.region,
      city: options?.city,
    });

    for (const category of categories) {
      const nameAr = category.name_ar.toLowerCase();
      const nameEn = category.name_en.toLowerCase();
      const queryLower = query.toLowerCase();

      if (nameAr.includes(queryLower) || nameEn.includes(queryLower)) {
        suggestions.push({
          id: category.id,
          title_ar: category.name_ar,
          title_en: category.name_en,
          type: 'category',
          relevance_score: this.calculateRelevance(category.name_ar, category.name_en, query),
        });
      }
    }

    // TODO: Search in stores when stores entity exists
    // TODO: Search in products when products entity exists

    // Sort by relevance and limit
    suggestions.sort((a, b) => b.relevance_score - a.relevance_score);
    return suggestions.slice(0, options?.limit || 10);
  }

  async search(query: SearchAdapterQuery): Promise<{
    items: SearchResult[];
    nextCursor?: string;
  }> {
    const results: SearchResult[] = [];

    // Search categories
    if (!query.category || query.category === 'all') {
      const categories = await this.categoryService.findActive({
        region: query.region,
        city: query.city,
      });

      for (const category of categories) {
        const nameAr = category.name_ar.toLowerCase();
        const nameEn = category.name_en.toLowerCase();
        const queryLower = query.q.toLowerCase();

        if (nameAr.includes(queryLower) || nameEn.includes(queryLower)) {
          results.push({
            service: 'dsh',
            type: 'dsh_category',
            id: category.id,
            title_ar: category.name_ar,
            title_en: category.name_en,
            description_ar: category.description_ar,
            description_en: category.description_en,
            image_url: category.image_url,
            relevance_score: this.calculateRelevance(category.name_ar, category.name_en, query.q),
            metadata: {
              code: category.code,
              tags: category.tags,
            },
          });
        }
      }
    }

    // TODO: Search in stores when stores entity exists
    // TODO: Search in products when products entity exists

    // Sort by relevance
    results.sort((a, b) => b.relevance_score - a.relevance_score);

    // Apply limit and cursor
    const limit = query.limit || 20;
    let items = results;
    if (query.cursor) {
      // TODO: Implement cursor-based pagination
      const cursorIndex = items.findIndex((item) => item.id === query.cursor);
      if (cursorIndex >= 0) {
        items = items.slice(cursorIndex + 1);
      }
    }
    items = items.slice(0, limit);

    const nextCursor = results.length > limit && items.length > 0 ? items[items.length - 1]?.id : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }

  private calculateRelevance(nameAr: string, nameEn: string, query: string): number {
    const queryLower = query.toLowerCase();
    const nameArLower = nameAr.toLowerCase();
    const nameEnLower = nameEn.toLowerCase();

    let score = 0;

    // Exact match
    if (nameArLower === queryLower || nameEnLower === queryLower) {
      score += 100;
    }
    // Starts with
    else if (nameArLower.startsWith(queryLower) || nameEnLower.startsWith(queryLower)) {
      score += 80;
    }
    // Contains
    else if (nameArLower.includes(queryLower) || nameEnLower.includes(queryLower)) {
      score += 50;
    }

    // Length similarity bonus
    const lengthDiff = Math.abs(nameAr.length - query.length);
    score += Math.max(0, 20 - lengthDiff);

    return score;
  }
}

