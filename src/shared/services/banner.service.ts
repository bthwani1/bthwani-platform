import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../core/services/logger.service';
import { RuntimeVariablesService } from './runtime-variables.service';
import { BannerRepository } from '../repositories/banner.repository';
import { BannerEntity, BannerType } from '../entities/banner.entity';

export interface Banner {
  id: string;
  type: 'dsh' | 'knz' | 'arb';
  title_ar: string;
  title_en: string;
  description_ar?: string;
  description_en?: string;
  image_url: string;
  action_type: 'open_category' | 'open_store' | 'open_listing' | 'open_offer' | 'open_flow';
  action_target: string; // category code, store id, listing id, etc.
  priority: number;
  tags?: string[];
  available_regions?: string[];
  available_cities?: string[];
  start_date?: Date;
  end_date?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Banner Service
 *
 * Manages dynamic banners for DSH, KNZ, and ARB
 * Controlled via Runtime Variables
 */
@Injectable()
export class BannerService {
  constructor(
    private readonly logger: LoggerService,
    private readonly runtimeVars: RuntimeVariablesService,
    private readonly bannerRepository: BannerRepository,
  ) {}

  /**
   * Get banners for a service
   */
  async getBanners(
    type: 'dsh' | 'knz' | 'arb',
    options?: {
      region?: string;
      city?: string;
      userId?: string;
      limit?: number;
    },
  ): Promise<Banner[]> {
    // Check if banners are enabled for this service
    const enabled = await this.runtimeVars.isUIFeatureEnabled(`BANNER_${type.toUpperCase()}`, {
      region: options?.region,
      city: options?.city,
    });

    if (!enabled) {
      return [];
    }

    const banners = await this.bannerRepository.findActive({
      type,
      region: options?.region,
      city: options?.city,
      limit: options?.limit || 10,
    });

    return banners.map((banner) => ({
      id: banner.id,
      type: banner.type,
      title_ar: banner.title_ar,
      title_en: banner.title_en,
      description_ar: banner.description_ar,
      description_en: banner.description_en,
      image_url: banner.image_url,
      action_type: banner.action_type,
      action_target: banner.action_target,
      priority: banner.priority,
      tags: banner.tags,
      available_regions: banner.available_regions,
      available_cities: banner.available_cities,
      start_date: banner.start_date,
      end_date: banner.end_date,
      metadata: banner.metadata,
    }));
  }

  /**
   * Get refresh interval for banners
   */
  async getRefreshInterval(): Promise<number> {
    const value = await this.runtimeVars.getVar('VAR_UI_BANNER_REFRESH_INTERVAL', {
      defaultValue: 300, // 5 minutes default
    });
    return typeof value === 'number' ? value : parseInt(String(value), 10);
  }
}

