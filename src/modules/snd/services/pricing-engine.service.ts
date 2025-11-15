import { Injectable, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';
import { SndPricingProfileRepository } from '../repositories/pricing-profile.repository';
import { SndCategoryRepository } from '../repositories/category.repository';
import { SndRequestEntity, SndRequestType } from '../entities/request.entity';
import { SndPricingScope } from '../entities/pricing-profile.entity';

export interface PricingResult {
  min_price_yer: number;
  max_price_yer: number;
  requires_review: boolean;
}

@Injectable()
export class PricingEngineService {
  constructor(
    private readonly pricingProfileRepository: SndPricingProfileRepository,
    private readonly categoryRepository: SndCategoryRepository,
    private readonly logger: LoggerService,
  ) {}

  async calculatePricing(request: SndRequestEntity, region?: string): Promise<PricingResult> {
    if (request.type !== SndRequestType.INSTANT) {
      throw new BadRequestException({
        type: 'https://errors.bthwani.com/snd/pricing_not_applicable',
        title: 'Pricing Not Applicable',
        status: 400,
        code: 'SND-400-PRICING-NOT-APPLICABLE',
        detail: 'Pricing is only applicable for instant requests',
      });
    }

    let profile = null;

    if (request.category_id && region) {
      profile = await this.pricingProfileRepository.findByCategoryAndRegion(
        request.category_id,
        region,
      );
    }

    if (!profile && request.category_id) {
      profile = await this.pricingProfileRepository.findByCategory(request.category_id);
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

    const category = request.category_id
      ? await this.categoryRepository.findOne(request.category_id)
      : null;

    const requiresReview = profile.requires_review || (category?.pricing_requires_review ?? false);

    return {
      min_price_yer: profile.min_price_yer,
      max_price_yer: profile.max_price_yer,
      requires_review: requiresReview,
    };
  }
}
