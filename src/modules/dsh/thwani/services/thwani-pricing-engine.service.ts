import { Injectable, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../../core/services/logger.service';
import { ThwaniPricingProfileRepository } from '../repositories/thwani-pricing-profile.repository';
import { ThwaniRequestEntity } from '../entities/thwani-request.entity';
import { ThwaniPricingScope } from '../entities/thwani-pricing-profile.entity';

export interface ThwaniPricingResult {
  min_price_yer: number;
  max_price_yer: number;
  requires_review: boolean;
}

/**
 * Thwani Pricing Engine Service
 *
 * Calculates pricing for instant help requests using DSH pricing pattern:
 * Scope hierarchy: category+region → category → region → global
 */
@Injectable()
export class ThwaniPricingEngineService {
  constructor(
    private readonly pricingProfileRepository: ThwaniPricingProfileRepository,
    private readonly logger: LoggerService,
  ) {}

  async calculatePricing(request: ThwaniRequestEntity, region?: string): Promise<ThwaniPricingResult> {
    let profile = null;

    // Priority: category+region → category → region → global
    if (request.category_id && region) {
      profile = await this.pricingProfileRepository.findByCategoryAndRegion(
        request.category_id,
        region,
      );
    }

    if (!profile && request.category_id) {
      profile = await this.pricingProfileRepository.findByCategory(request.category_id);
    }

    if (!profile && region) {
      profile = await this.pricingProfileRepository.findByRegion(region);
    }

    if (!profile) {
      profile = await this.pricingProfileRepository.findGlobal();
    }

    if (!profile) {
      this.logger.warn('No pricing profile found, using defaults', {
        categoryId: request.category_id,
        region,
      });
      return {
        min_price_yer: 0,
        max_price_yer: 100000,
        requires_review: true,
      };
    }

    return {
      min_price_yer: profile.min_price_yer,
      max_price_yer: profile.max_price_yer,
      requires_review: profile.requires_review,
    };
  }
}

