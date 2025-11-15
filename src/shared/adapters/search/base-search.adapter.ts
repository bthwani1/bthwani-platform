import { SearchResult } from '../../services/unified-search.service';

export interface SearchAdapterQuery {
  q: string;
  category?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
  tags?: string[];
  limit?: number;
  cursor?: string;
}

export interface SearchSuggestion {
  id: string;
  title_ar: string;
  title_en: string;
  type: 'product' | 'category' | 'store' | 'listing' | 'offer';
  relevance_score: number;
}

/**
 * Base Search Adapter Interface
 *
 * All service-specific search adapters must implement this interface
 */
export interface BaseSearchAdapter {
  /**
   * Get search suggestions (Typeahead)
   */
  getSuggestions(query: string, options?: {
    region?: string;
    city?: string;
    limit?: number;
  }): Promise<SearchSuggestion[]>;

  /**
   * Perform search
   */
  search(query: SearchAdapterQuery): Promise<{
    items: SearchResult[];
    nextCursor?: string;
  }>;

  /**
   * Get service name
   */
  getServiceName(): string;
}

