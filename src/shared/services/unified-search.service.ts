import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../core/services/logger.service';
import { ConfigService } from '@nestjs/config';
import { BaseSearchAdapter } from '../adapters/search/base-search.adapter';
import { DshSearchAdapter } from '../adapters/search/dsh-search.adapter';
import { KnzSearchAdapter } from '../adapters/search/knz-search.adapter';
import { ArbSearchAdapter } from '../adapters/search/arb-search.adapter';
import {
  BaseVoiceAdapter,
  GoogleVoiceAdapter,
  AzureVoiceAdapter,
  AwsVoiceAdapter,
} from '../adapters/voice';
import {
  BaseImageAdapter,
  GoogleImageAdapter,
  AzureImageAdapter,
  AwsImageAdapter,
} from '../adapters/image';

export interface SearchResult {
  service: string;
  type: 'dsh_category' | 'dsh_store' | 'dsh_product' | 'knz_listing' | 'arb_offer' | 'amn_ride' | 'kwd_job';
  id: string;
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  image_url?: string;
  relevance_score: number;
  metadata?: Record<string, unknown>;
}

export interface SearchQuery {
  q: string;
  service?: 'dsh' | 'knz' | 'arb' | 'amn' | 'kwd' | 'all';
  category?: string;
  region?: string;
  city?: string;
  lat?: number;
  lon?: number;
  tags?: string[];
  limit?: number;
  cursor?: string;
}

export interface SearchSuggestions {
  products: Array<{ id: string; title_ar: string; title_en: string }>;
  categories: Array<{ code: string; name_ar: string; name_en: string }>;
  stores: Array<{ id: string; name_ar: string; name_en: string }>;
  listings?: Array<{ id: string; title_ar: string; title_en: string }>;
}

/**
 * Unified Search Service
 *
 * Provides unified search across all services (DSH, KNZ, ARB, AMN, KWD)
 * Supports text, voice (via text conversion), and image (via tag extraction) search
 */
@Injectable()
export class UnifiedSearchService {
  private readonly autosuggestEnabled: boolean;
  private readonly autosuggestMinChars: number;
  private readonly voiceEnabled: boolean;
  private readonly imageEnabled: boolean;
  private readonly adapters: Map<string, BaseSearchAdapter> = new Map();
  private readonly voiceAdapters: Map<string, BaseVoiceAdapter> = new Map();
  private readonly imageAdapters: Map<string, BaseImageAdapter> = new Map();
  private voiceProvider: string;
  private imageProvider: string;

  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
    private readonly dshAdapter: DshSearchAdapter,
    private readonly knzAdapter: KnzSearchAdapter,
    private readonly arbAdapter: ArbSearchAdapter,
    private readonly googleVoiceAdapter: GoogleVoiceAdapter,
    private readonly azureVoiceAdapter: AzureVoiceAdapter,
    private readonly awsVoiceAdapter: AwsVoiceAdapter,
    private readonly googleImageAdapter: GoogleImageAdapter,
    private readonly azureImageAdapter: AzureImageAdapter,
    private readonly awsImageAdapter: AwsImageAdapter,
  ) {
    this.autosuggestEnabled =
      this.configService.get<string>('VAR_SEARCH_AUTOSUGGEST_ENABLED', 'true') === 'true';
    this.autosuggestMinChars = parseInt(
      this.configService.get<string>('VAR_SEARCH_AUTOSUGGEST_MIN_CHARS', '2'),
      10,
    );
    this.voiceEnabled =
      this.configService.get<string>('VAR_SEARCH_VOICE_ENABLED_GLOBAL', 'false') === 'true';
    this.imageEnabled =
      this.configService.get<string>('VAR_SEARCH_IMAGE_ENABLED_DSH', 'false') === 'true';

    // Register search adapters
    this.adapters.set('dsh', this.dshAdapter);
    this.adapters.set('knz', this.knzAdapter);
    this.adapters.set('arb', this.arbAdapter);

    // Register voice adapters
    this.voiceAdapters.set('google', this.googleVoiceAdapter);
    this.voiceAdapters.set('azure', this.azureVoiceAdapter);
    this.voiceAdapters.set('aws', this.awsVoiceAdapter);

    // Register image adapters
    this.imageAdapters.set('google', this.googleImageAdapter);
    this.imageAdapters.set('azure', this.azureImageAdapter);
    this.imageAdapters.set('aws', this.awsImageAdapter);

    // Get provider from config
    this.voiceProvider = this.configService.get<string>('VAR_SEARCH_VOICE_PROVIDER', 'google');
    this.imageProvider = this.configService.get<string>('VAR_SEARCH_IMAGE_PROVIDER', 'google');
  }

  /**
   * Get search suggestions (Typeahead)
   */
  async getSuggestions(query: string, options?: {
    region?: string;
    city?: string;
    service?: 'dsh' | 'knz' | 'arb' | 'all';
  }): Promise<SearchSuggestions> {
    if (!this.autosuggestEnabled || query.length < this.autosuggestMinChars) {
      return { products: [], categories: [], stores: [] };
    }

    const suggestions: SearchSuggestions = {
      products: [],
      categories: [],
      stores: [],
    };

    const services = options?.service === 'all' || !options?.service
      ? ['dsh', 'knz', 'arb']
      : [options.service];

    for (const service of services) {
      const adapter = this.adapters.get(service);
      if (!adapter) continue;

      try {
        const adapterSuggestions = await adapter.getSuggestions(query, {
          region: options?.region,
          city: options?.city,
          limit: 5,
        });

        for (const suggestion of adapterSuggestions) {
          if (suggestion.type === 'category') {
            suggestions.categories.push({
              code: suggestion.id,
              name_ar: suggestion.title_ar,
              name_en: suggestion.title_en,
            });
          } else if (suggestion.type === 'store') {
            suggestions.stores.push({
              id: suggestion.id,
              name_ar: suggestion.title_ar,
              name_en: suggestion.title_en,
            });
          } else if (suggestion.type === 'product') {
            suggestions.products.push({
              id: suggestion.id,
              title_ar: suggestion.title_ar,
              title_en: suggestion.title_en,
            });
          }
        }
      } catch (error) {
        this.logger.error(
          `Error getting suggestions from ${service} adapter`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    return suggestions;
  }

  /**
   * Perform unified search across all services
   */
  async search(query: SearchQuery): Promise<{
    items: SearchResult[];
    nextCursor?: string;
    suggestions?: SearchSuggestions;
  }> {
    const results: SearchResult[] = [];

    const services = query.service === 'all' || !query.service
      ? ['dsh', 'knz', 'arb']
      : [query.service];

    // Search in each service
    for (const service of services) {
      const adapter = this.adapters.get(service);
      if (!adapter) continue;

      try {
        const adapterQuery: import('../adapters/search/base-search.adapter').SearchAdapterQuery = {
          q: query.q,
          category: query.category,
          region: query.region,
          city: query.city,
          lat: query.lat,
          lon: query.lon,
          tags: query.tags,
          limit: query.limit ? Math.ceil(query.limit / services.length) : 20,
          cursor: query.cursor,
        };

        const adapterResults = await adapter.search(adapterQuery);
        results.push(...adapterResults.items);
      } catch (error) {
        this.logger.error(
          `Error searching in ${service} adapter`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevance_score - a.relevance_score);

    // Apply limit and cursor pagination
    const limit = query.limit || 20;
    let items = results;
    if (query.cursor) {
      const cursorIndex = items.findIndex((item) => item.id === query.cursor);
      if (cursorIndex >= 0) {
        items = items.slice(cursorIndex + 1);
      }
    }
    items = items.slice(0, limit);

    const nextCursor =
      results.length > limit && items.length > 0 ? items[items.length - 1]?.id : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }

  /**
   * Convert voice input to text
   *
   * @param audioData - Audio buffer (WAV, MP3, etc.)
   * @returns Transcribed text
   *
   * Implementation Notes:
   * - Supports: Google Speech-to-Text, Azure Speech Services, AWS Transcribe
   * - Language: Auto-detect or use user's preferred language (ar/en)
   * - Format: Accepts common audio formats (WAV, MP3, FLAC, OGG)
   * - Config: VAR_SEARCH_VOICE_PROVIDER, VAR_SEARCH_VOICE_LANGUAGE
   */
  async voiceToText(audioData: Buffer): Promise<string> {
    if (!this.voiceEnabled) {
      throw new Error('Voice search is not enabled');
    }

    const provider = this.voiceProvider;
    const language = this.configService.get<string>('VAR_SEARCH_VOICE_LANGUAGE', 'ar-YE');

    const adapter = this.voiceAdapters.get(provider);
    if (!adapter) {
      throw new Error(`Unsupported voice provider: ${provider}. Available: ${Array.from(this.voiceAdapters.keys()).join(', ')}`);
    }

    this.logger.log('Converting voice to text', {
      audioLength: audioData.length,
      provider,
      language,
    });

    try {
      return await adapter.transcribe(audioData, {
        language,
        autoDetectLanguage: language === 'auto',
      });
    } catch (error) {
      this.logger.error(
        'Voice transcription failed',
        error instanceof Error ? error.stack : String(error),
        { provider, language },
      );
      throw error;
    }
  }

  /**
   * Extract tags from image
   *
   * @param imageData - Image buffer (JPEG, PNG, etc.)
   * @returns Array of tags in Arabic/English
   *
   * Implementation Notes:
   * - Supports: Google Vision API, AWS Rekognition, Azure Computer Vision
   * - Language: Returns tags in user's preferred language (ar/en)
   * - Format: Accepts common image formats (JPEG, PNG, WEBP)
   * - Config: VAR_SEARCH_IMAGE_PROVIDER, VAR_SEARCH_IMAGE_LANGUAGE
   * - Returns: Array of relevant tags like ["مشروب غازي", "بيبسي 330مل", "شيبس ليز"]
   */
  async imageToTags(imageData: Buffer): Promise<string[]> {
    if (!this.imageEnabled) {
      throw new Error('Image search is not enabled');
    }

    const provider = this.imageProvider;
    const language = this.configService.get<string>('VAR_SEARCH_IMAGE_LANGUAGE', 'ar');

    const adapter = this.imageAdapters.get(provider);
    if (!adapter) {
      throw new Error(`Unsupported image provider: ${provider}. Available: ${Array.from(this.imageAdapters.keys()).join(', ')}`);
    }

    this.logger.log('Extracting tags from image', {
      imageLength: imageData.length,
      provider,
      language,
    });

    try {
      return await adapter.extractTags(imageData, {
        language,
        maxResults: 10,
        minConfidence: 0.5,
      });
    } catch (error) {
      this.logger.error(
        'Image tag extraction failed',
        error instanceof Error ? error.stack : String(error),
        { provider, language },
      );
      throw error;
    }
  }
}

