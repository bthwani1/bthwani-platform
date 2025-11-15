import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../../core/services/logger.service';

export interface RuntimeVariable {
  key: string;
  value: string | number | boolean;
  scope?: 'global' | 'region' | 'city' | 'user_segment';
  scope_value?: string;
  description?: string;
  default_value?: string | number | boolean;
}

/**
 * Runtime Variables Service
 *
 * Centralized service for managing runtime variables (VAR_*)
 * Supports scoping (global, region, city, user segment)
 * Provides type-safe access to service flags, UX flags, and feature toggles
 */
@Injectable()
export class RuntimeVariablesService {
  private readonly cache: Map<string, RuntimeVariable> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Get runtime variable value
   */
  async getVar(
    key: string,
    options?: {
      region?: string;
      city?: string;
      userSegment?: string;
      defaultValue?: string | number | boolean;
    },
  ): Promise<string | number | boolean | null> {
    // Check cache first
    const cacheKey = this.buildCacheKey(key, options);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!.value;
    }

    // Try scoped lookup first (region > city > user_segment > global)
    let value: string | number | boolean | null = null;

    if (options?.region) {
      value = this.configService.get<string>(`${key}_REGION_${options.region}`);
    }
    if (!value && options?.city) {
      value = this.configService.get<string>(`${key}_CITY_${options.city}`);
    }
    if (!value && options?.userSegment) {
      value = this.configService.get<string>(`${key}_SEGMENT_${options.userSegment}`);
    }
    if (!value) {
      value = this.configService.get<string>(key);
    }

    // Use default if provided
    if (value === null || value === undefined) {
      value = options?.defaultValue ?? null;
    }

    // Cache the result
    if (value !== null) {
      this.cache.set(cacheKey, {
        key,
        value,
        scope: options?.region ? 'region' : options?.city ? 'city' : 'global',
        scope_value: options?.region || options?.city || undefined,
      });
    }

    return value;
  }

  /**
   * Check if service is enabled
   */
  async isServiceEnabled(
    service: 'dsh' | 'knz' | 'wlt' | 'arb' | 'amn' | 'kwd' | 'mrf' | 'esf' | 'snd',
    options?: { region?: string; city?: string },
  ): Promise<boolean> {
    const key = `VAR_SVC_${service.toUpperCase()}_ENABLED`;
    const value = await this.getVar(key, {
      ...options,
      defaultValue: true, // Default: enabled
    });
    return value === true || value === 'true';
  }

  /**
   * Check if UX feature is enabled
   */
  async isUIFeatureEnabled(
    feature: string,
    options?: { region?: string; city?: string },
  ): Promise<boolean> {
    const key = `VAR_UI_${feature.toUpperCase()}_ENABLED`;
    const value = await this.getVar(key, {
      ...options,
      defaultValue: false, // Default: disabled
    });
    return value === true || value === 'true';
  }

  /**
   * Check if search feature is enabled
   */
  async isSearchFeatureEnabled(
    feature: 'autosuggest' | 'voice' | 'image',
    service?: 'dsh' | 'knz' | 'global',
    options?: { region?: string; city?: string },
  ): Promise<boolean> {
    const serviceSuffix = service ? `_${service.toUpperCase()}` : '_GLOBAL';
    const key = `VAR_SEARCH_${feature.toUpperCase()}${serviceSuffix}_ENABLED`;
    const value = await this.getVar(key, {
      ...options,
      defaultValue: feature === 'autosuggest', // autosuggest enabled by default
    });
    return value === true || value === 'true';
  }

  /**
   * Get search autosuggest minimum characters
   */
  async getSearchAutosuggestMinChars(): Promise<number> {
    const value = await this.getVar('VAR_SEARCH_AUTOSUGGEST_MIN_CHARS', {
      defaultValue: 2,
    });
    return typeof value === 'number' ? value : parseInt(String(value), 10);
  }

  /**
   * Get UI interest configuration
   */
  async getUIInterestConfig(): Promise<{
    minUsage: number;
    windowDays: number;
    forgetDays: number;
  }> {
    const minUsage = await this.getVar('VAR_UI_INTEREST_MIN_USAGE', { defaultValue: 3 });
    const windowDays = await this.getVar('VAR_UI_INTEREST_WINDOW_DAYS', { defaultValue: 30 });
    const forgetDays = await this.getVar('VAR_UI_INTEREST_FORGET_DAYS', { defaultValue: 90 });

    return {
      minUsage: typeof minUsage === 'number' ? minUsage : parseInt(String(minUsage), 10),
      windowDays: typeof windowDays === 'number' ? windowDays : parseInt(String(windowDays), 10),
      forgetDays: typeof forgetDays === 'number' ? forgetDays : parseInt(String(forgetDays), 10),
    };
  }

  /**
   * Clear cache (useful for testing or when vars are updated)
   */
  clearCache(): void {
    this.cache.clear();
  }

  private buildCacheKey(key: string, options?: {
    region?: string;
    city?: string;
    userSegment?: string;
  }): string {
    const parts = [key];
    if (options?.region) parts.push(`region:${options.region}`);
    if (options?.city) parts.push(`city:${options.city}`);
    if (options?.userSegment) parts.push(`segment:${options.userSegment}`);
    return parts.join('|');
  }
}

