import { LoggerService } from '../../../core/services/logger.service';
import { DshIncentivesService } from './dsh-incentives.service';
import { DshIncentivesConfig } from '../types/incentives.types';

type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>;
};

describe('DshIncentivesService', () => {
  let service: DshIncentivesService;
  let logger: LoggerService;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new LoggerService();
    jest.spyOn(logger, 'log').mockImplementation(() => undefined);
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    jest.spyOn(logger, 'debug').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
    service = new DshIncentivesService(logger);
  });

  it('applies subscription delivery discount when plan is active', () => {
    const result = service.applyIncentives({
      baseSubtotalYer: 20000,
      baseDeliveryFeeYer: 5000,
      subscriptionPlanId: 'sub_user_pro_monthly',
    });

    expect(result.deliveryFeeYer).toBe(3500); // 30% discount
    expect(result.adjustments.some((adj) => adj.source === 'subscription')).toBe(true);
  });

  it('applies coupon discount for eligible new users', () => {
    const result = service.applyIncentives({
      baseSubtotalYer: 15000,
      baseDeliveryFeeYer: 5000,
      couponCode: 'WELCOME10',
      userType: 'new',
    });

    expect(result.subtotalYer).toBe(13500);
    expect(result.adjustments.some((adj) => adj.source === 'coupon')).toBe(true);
  });

  it('redeems rewards points respecting max percentage limit', () => {
    const result = service.applyIncentives({
      baseSubtotalYer: 20000,
      baseDeliveryFeeYer: 5000,
      pointsToRedeem: 400, // worth 4000 YER before guards
    });

    expect(result.totalYer).toBeLessThan(25000);
    expect(result.adjustments.some((adj) => adj.source === 'rewards')).toBe(true);
    expect(result.pointsRedeemed).toBeGreaterThan(0);
  });

  it('enforces guardrails for net total minimum', () => {
    const configRef = (service as unknown as { config: Mutable<DshIncentivesConfig> }).config;
    const guards = configRef.stacking_policy.guards as unknown as { min_net_total_yer?: number };
    const originalMin = guards.min_net_total_yer ?? 1000;
    guards.min_net_total_yer = 5000;

    try {
      const result = service.applyIncentives({
        baseSubtotalYer: 6000,
        baseDeliveryFeeYer: 500,
        couponCode: 'WELCOME10',
        userType: 'new',
        pointsToRedeem: 2000,
      });

      expect(result.totalYer).toBeGreaterThanOrEqual(5000);
      expect(result.guardrailViolations).toContain('min_net_total_yer');
    } finally {
      guards.min_net_total_yer = originalMin;
    }
  });

  it('warns when subscription plan is missing or inactive', () => {
    service.applyIncentives({
      baseSubtotalYer: 10000,
      baseDeliveryFeeYer: 2000,
      subscriptionPlanId: 'non-existent-plan',
    });

    expect(warnSpy).toHaveBeenCalledWith('Subscription plan not found or inactive', {
      subscriptionPlanId: 'non-existent-plan',
    });
  });

  it('applies subscription flat discount when configured', () => {
    const configRef = (service as unknown as { config: Mutable<DshIncentivesConfig> }).config;
    const plan = configRef.subscriptions.user_plans.find((p) => p.id === 'sub_user_pro_monthly');
    expect(plan).toBeDefined();
    const originalFlat = plan!.features.delivery_fee_flat_discount_yer ?? 0;
    plan!.features.delivery_fee_flat_discount_yer = 500;

    try {
      const result = service.applyIncentives({
        baseSubtotalYer: 10000,
        baseDeliveryFeeYer: 1000,
        subscriptionPlanId: 'sub_user_pro_monthly',
      });

      expect(result.deliveryFeeYer).toBeLessThan(1000);
      expect(result.adjustments.find((adj) => adj.id.startsWith('subscription-flat'))).toBeDefined();
    } finally {
      plan!.features.delivery_fee_flat_discount_yer = originalFlat;
    }
  });

  it('applies scoped discount rule for supermarket weekend', () => {
    const result = service.applyIncentives({
      baseSubtotalYer: 40000,
      baseDeliveryFeeYer: 6000,
      city: 'Sanaa',
      primaryCategory: 'supermarket',
      timestamp: new Date('2025-06-13T18:00:00Z'), // Friday evening Asia/Aden
    });

    expect(result.adjustments.some((adj) => adj.id === 'discount:disc_supermarket_weekend')).toBe(
      true,
    );
  });

  it('enforces guardrail max total discount percentage', () => {
    const configRef = (service as unknown as { config: Mutable<DshIncentivesConfig> }).config;
    const guards = configRef.stacking_policy.guards as unknown as {
      max_total_discount_pct?: number | undefined;
    };
    const original = guards.max_total_discount_pct;
    guards.max_total_discount_pct = 20;

    try {
      const result = service.applyIncentives({
        baseSubtotalYer: 20000,
        baseDeliveryFeeYer: 5000,
        subscriptionPlanId: 'sub_user_pro_monthly',
        couponCode: 'WELCOME10',
        userType: 'new',
        pointsToRedeem: 500,
      });

      expect(result.guardrailViolations).toContain('max_total_discount_pct');
    } finally {
      if (original !== undefined) {
        guards.max_total_discount_pct = original;
      } else {
        delete guards.max_total_discount_pct;
      }
    }
  });

  it('prevents negative totals by rolling back discounts', () => {
    const configRef = (service as unknown as { config: Mutable<DshIncentivesConfig> }).config;
    const guards = configRef.stacking_policy.guards as unknown as {
      max_total_discount_pct?: number | undefined;
      min_net_total_yer?: number | undefined;
    };
    const rewardsRules = configRef.rewards_program
      .redemption_rules as unknown as {
      enabled: boolean;
      limits: {
        max_discount_pct_per_order?: number | undefined;
        min_basket_total_yer_to_redeem?: number | undefined;
      };
    };
    const original = {
      maxPct: guards.max_total_discount_pct,
      minNet: guards.min_net_total_yer,
      maxDiscountPct: rewardsRules.limits.max_discount_pct_per_order,
    };
    delete guards.max_total_discount_pct;
    delete guards.min_net_total_yer;
    rewardsRules.limits.max_discount_pct_per_order = 100;

    try {
      const result = service.applyIncentives({
        baseSubtotalYer: 10000,
        baseDeliveryFeeYer: 0,
        couponCode: 'WELCOME10',
        userType: 'new',
        pointsToRedeem: 2000,
      });

      expect(result.guardrailViolations).toContain('prevent_negative_or_zero_price');
      expect(result.totalYer).toBeGreaterThan(0);
    } finally {
      if (original.maxPct !== undefined) {
        guards.max_total_discount_pct = original.maxPct;
      } else {
        delete guards.max_total_discount_pct;
      }
      if (original.minNet !== undefined) {
        guards.min_net_total_yer = original.minNet;
      } else {
        delete guards.min_net_total_yer;
      }
      if (original.maxDiscountPct !== undefined) {
        rewardsRules.limits.max_discount_pct_per_order = original.maxDiscountPct;
      } else {
        delete rewardsRules.limits.max_discount_pct_per_order;
      }
    }
  });

  it('warns when rewards redemption is disabled', () => {
    const configRef = (service as unknown as { config: Mutable<DshIncentivesConfig> }).config;
    const rules = configRef.rewards_program
      .redemption_rules as unknown as {
      enabled: boolean;
      limits: { min_basket_total_yer_to_redeem?: number | undefined };
    };
    const originalEnabled = rules.enabled;
    rules.enabled = false;

    warnSpy.mockClear();
    try {
      service.applyIncentives({
        baseSubtotalYer: 10000,
        baseDeliveryFeeYer: 2000,
        pointsToRedeem: 200,
      });

      expect(warnSpy).toHaveBeenCalledWith('Rewards redemption disabled', {
        pointsRequested: 200,
      });
    } finally {
      rules.enabled = originalEnabled;
    }
  });

  it('warns when basket total below rewards minimum', () => {
    const configRef = (service as unknown as { config: DshIncentivesConfig }).config;
    const rules = configRef.rewards_program
      .redemption_rules as unknown as {
      enabled: boolean;
      limits: { min_basket_total_yer_to_redeem?: number };
    };
    const originalMin = rules.limits.min_basket_total_yer_to_redeem;
    rules.limits.min_basket_total_yer_to_redeem = 5000;

    warnSpy.mockClear();
    try {
      service.applyIncentives({
        baseSubtotalYer: 1000,
        baseDeliveryFeeYer: 500,
        pointsToRedeem: 200,
      });

      expect(warnSpy).toHaveBeenCalledWith('Rewards redemption skipped due to min basket total', {
        minBasketTotal: 5000,
        basketTotal: 1000,
      });
    } finally {
      if (originalMin !== undefined) {
        rules.limits.min_basket_total_yer_to_redeem = originalMin;
      } else {
        delete rules.limits.min_basket_total_yer_to_redeem;
      }
    }
  });

  it('skips rewards when conversion ratio is invalid', () => {
    const configRef = (service as unknown as { config: Mutable<DshIncentivesConfig> }).config;
    const ratio = configRef.rewards_program.redemption_rules.conversion
      .points_to_yer_ratio as Mutable<DshIncentivesConfig['rewards_program']['redemption_rules']['conversion']['points_to_yer_ratio']>;
    const original = { points: ratio.points, yer: ratio.yer };
    ratio.points = 0;

    try {
      const result = service.applyIncentives({
        baseSubtotalYer: 10000,
        baseDeliveryFeeYer: 2000,
        pointsToRedeem: 100,
      });

      expect(result.pointsRedeemed).toBeUndefined();
    } finally {
      ratio.points = original.points;
      ratio.yer = original.yer;
    }
  });

  it('skips rewards when computed discount rounds down to zero', () => {
    const configRef = (service as unknown as { config: Mutable<DshIncentivesConfig> }).config;
    const ratio = configRef.rewards_program.redemption_rules.conversion
      .points_to_yer_ratio as Mutable<DshIncentivesConfig['rewards_program']['redemption_rules']['conversion']['points_to_yer_ratio']>;
    const original = { points: ratio.points, yer: ratio.yer };
    ratio.points = 1000;
    ratio.yer = 1;

    try {
      const result = service.applyIncentives({
        baseSubtotalYer: 10000,
        baseDeliveryFeeYer: 2000,
        pointsToRedeem: 1,
      });

      expect(result.pointsRedeemed).toBeUndefined();
    } finally {
      ratio.points = original.points;
      ratio.yer = original.yer;
    }
  });

  it('skips rewards when max discount percentage reduces allowance to zero', () => {
    const configRef = (service as unknown as { config: Mutable<DshIncentivesConfig> }).config;
    const limits = configRef.rewards_program.redemption_rules.limits as Mutable<
      DshIncentivesConfig['rewards_program']['redemption_rules']['limits']
    >;
    const originalMaxPct = limits.max_discount_pct_per_order;
    limits.max_discount_pct_per_order = 0.0001;

    try {
      const result = service.applyIncentives({
        baseSubtotalYer: 10000,
        baseDeliveryFeeYer: 2000,
        pointsToRedeem: 1000,
      });

      expect(result.pointsRedeemed).toBeUndefined();
    } finally {
      if (originalMaxPct !== undefined) {
      limits.max_discount_pct_per_order = originalMaxPct;
      } else {
        delete limits.max_discount_pct_per_order;
      }
    }
  });

  it('warns when coupon is not eligible for user type', () => {
    warnSpy.mockClear();

    const result = service.applyIncentives({
      baseSubtotalYer: 12000,
      baseDeliveryFeeYer: 4000,
      couponCode: 'WELCOME10',
      userType: 'existing',
    });

    expect(result.adjustments.some((adj) => adj.source === 'coupon')).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith('Coupon not eligible for this context', {
      couponCode: 'WELCOME10',
      userType: 'existing',
    });
  });
});
