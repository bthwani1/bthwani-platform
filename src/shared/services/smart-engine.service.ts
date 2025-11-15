import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../core/services/logger.service';
import { RuntimeVariablesService } from './runtime-variables.service';

export interface SmartRankingOptions {
  userId?: string;
  region?: string;
  city?: string;
  userPreferences?: {
    favoriteStores?: string[];
    favoriteCategories?: string[];
    recentOrders?: string[];
  };
}

export interface SmartSuggestion {
  type: 'service' | 'category' | 'store' | 'product' | 'listing' | 'offer';
  id: string;
  title_ar: string;
  title_en: string;
  reason: string; // Why this is suggested
  score: number;
  metadata?: Record<string, unknown>;
}

/**
 * Smart Engine Service
 *
 * Provides intelligent ranking, suggestions, and personalization
 * across 3 levels:
 * 1. Service level (Primary/Secondary/Rare)
 * 2. Category level (within DSH/KNZ/ARB)
 * 3. Item level (stores/products/listings/offers)
 */
@Injectable()
export class SmartEngineService {
  constructor(
    private readonly logger: LoggerService,
    private readonly runtimeVars: RuntimeVariablesService,
  ) {}

  /**
   * Rank items based on smart criteria
   */
  async rankItems<T extends { id: string; tags?: string[] }>(
    items: T[],
    options: SmartRankingOptions,
  ): Promise<T[]> {
    const ranked = items.map((item) => ({
      item,
      score: this.calculateScore(item, options),
    }));

    ranked.sort((a, b) => b.score - a.score);

    return ranked.map((r) => r.item);
  }

  /**
   * Generate smart suggestions for user
   */
  async generateSuggestions(options: SmartRankingOptions): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

    // Check if smart suggestions are enabled
    const enabled = await this.runtimeVars.isUIFeatureEnabled('SMART_SUGGESTIONS', {
      region: options.region,
      city: options.city,
    });

    if (!enabled) {
      return [];
    }

    // TODO: Implement actual suggestion logic
    // This will:
    // 1. Analyze user behavior (orders, searches, favorites)
    // 2. Consider location (region, city)
    // 3. Consider time of day
    // 4. Consider trending items
    // 5. Apply service flags and category flags

    this.logger.log('Generating smart suggestions', { options });

    return suggestions;
  }

  /**
   * Get personalized category order for DSH
   */
  async getPersonalizedCategoryOrder(
    categories: Array<{ code: string; tags?: string[] }>,
    options: SmartRankingOptions,
  ): Promise<Array<{ code: string; tags?: string[] }>> {
    // Rank categories based on:
    // 1. User preferences (favorite categories)
    // 2. Usage history (recent orders)
    // 3. Location (region/city popularity)
    // 4. Tags (NEW, TRENDING, SEASONAL)
    // 5. Featured status

    const ranked = await this.rankItems(categories, options);
    return ranked;
  }

  /**
   * Calculate relevance score for an item
   */
  private calculateScore<T extends { id: string; tags?: string[] }>(
    item: T,
    options: SmartRankingOptions,
  ): number {
    let score = 0;

    // Favorite boost
    if (options.userPreferences?.favoriteStores?.includes(item.id)) {
      score += 100;
    }

    // Recent usage boost
    if (options.userPreferences?.recentOrders?.includes(item.id)) {
      score += 50;
    }

    // Tags boost
    if (item.tags) {
      if (item.tags.includes('TRENDING')) score += 30;
      if (item.tags.includes('NEW')) score += 20;
      if (item.tags.includes('SEASONAL')) score += 15;
      if (item.tags.includes('HIGH_VALUE')) score += 25;
    }

    return score;
  }
}

