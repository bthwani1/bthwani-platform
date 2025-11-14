import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';
import { dshIncentivesConfig } from '../config/dsh-incentives.config';
import {
  CouponDefinition,
  DiscountRule,
  IncentiveAdjustment,
  IncentivesCalculationContext,
  IncentivesCalculationResult,
  IncentiveTarget,
} from '../types/incentives.types';

interface IncentiveTotalsState {
  subtotalYer: number;
  deliveryFeeYer: number;
}

@Injectable()
export class DshIncentivesService {
  private readonly config = dshIncentivesConfig;

  constructor(private readonly logger: LoggerService) {}

  applyIncentives(context: IncentivesCalculationContext): IncentivesCalculationResult {
    const totals: IncentiveTotalsState = {
      subtotalYer: context.baseSubtotalYer,
      deliveryFeeYer: context.baseDeliveryFeeYer,
    };
    const adjustments: IncentiveAdjustment[] = [];
    const guardrailViolations: string[] = [];

    this.applySubscriptionPlan(context, totals, adjustments);
    this.applyDiscountRules(context, totals, adjustments);
    const pointsRedeemed = this.applyRewards(context, totals, adjustments);
    const appliedCouponCode = this.applyCoupon(context, totals, adjustments);
    this.enforceGuardrails(context, totals, adjustments, guardrailViolations);

    const result: IncentivesCalculationResult = {
      subtotalYer: totals.subtotalYer,
      deliveryFeeYer: totals.deliveryFeeYer,
      totalYer: totals.subtotalYer + totals.deliveryFeeYer,
      adjustments,
      ...(guardrailViolations.length > 0 ? { guardrailViolations } : {}),
      ...(appliedCouponCode ? { appliedCouponCode } : {}),
      ...(pointsRedeemed > 0 ? { pointsRedeemed } : {}),
    };
    return result;
  }

  private applySubscriptionPlan(
    context: IncentivesCalculationContext,
    totals: IncentiveTotalsState,
    adjustments: IncentiveAdjustment[],
  ): void {
    if (!context.subscriptionPlanId) {
      return;
    }

    const plan = this.config.subscriptions.user_plans.find(
      (candidate) => candidate.id === context.subscriptionPlanId && candidate.active,
    );
    if (!plan) {
      this.logger.warn('Subscription plan not found or inactive', {
        subscriptionPlanId: context.subscriptionPlanId,
      });
      return;
    }

    const pctDiscount = plan.features.delivery_fee_pct_discount ?? 0;
    if (pctDiscount > 0) {
      const discountValue = this.calculatePercentageDiscount(totals.deliveryFeeYer, pctDiscount);
      if (discountValue > 0) {
        const minDeliveryFee = plan.features.min_delivery_fee_after_discount_yer ?? 0;
        const maxDiscount = Math.max(totals.deliveryFeeYer - minDeliveryFee, 0);
        const appliedAmount = Math.min(discountValue, maxDiscount);
        this.applyAdjustment(totals, adjustments, {
          id: `subscription:${plan.id}`,
          label: `Subscription (${plan.name_ar})`,
          source: 'subscription',
          target: 'delivery_fee',
          amountYer: appliedAmount,
          mode: 'discount',
          metadata: {
            planId: plan.id,
            maxDiscountPossibleYer: maxDiscount,
          },
        });
      }
    }

    const flatDiscount = plan.features.delivery_fee_flat_discount_yer ?? 0;
    if (flatDiscount > 0) {
      this.applyAdjustment(totals, adjustments, {
        id: `subscription-flat:${plan.id}`,
        label: `Subscription flat discount (${plan.name_ar})`,
        source: 'subscription',
        target: 'delivery_fee',
        amountYer: flatDiscount,
        mode: 'discount',
        metadata: {
          planId: plan.id,
        },
      });
    }
  }

  private applyDiscountRules(
    context: IncentivesCalculationContext,
    totals: IncentiveTotalsState,
    adjustments: IncentiveAdjustment[],
  ): void {
    const now = context.timestamp ?? new Date();
    const dayOfWeek = this.getDayOfWeek(now);
    const timeOfDay = this.getTimeOfDay(now);
    for (const rule of this.config.discount_rules) {
      if (!rule.active) {
        continue;
      }
      if (!this.matchesScope(rule, context, dayOfWeek, timeOfDay)) {
        continue;
      }
      if (!this.matchesDiscountCondition(rule, context)) {
        continue;
      }
      const amount = this.calculateEffectAmount(rule.effect, totals);
      if (amount <= 0) {
        continue;
      }
      this.applyAdjustment(totals, adjustments, {
        id: `discount:${rule.id}`,
        label: rule.name_ar,
        source: 'discount_rule',
        target: this.mapTarget(rule.effect.target),
        amountYer: amount,
        mode: 'discount',
        metadata: {
          funding: rule.funding,
          ledger: rule.ledger,
        },
      });
    }
  }

  private applyRewards(
    context: IncentivesCalculationContext,
    totals: IncentiveTotalsState,
    adjustments: IncentiveAdjustment[],
  ): number {
    if (!context.pointsToRedeem || context.pointsToRedeem <= 0) {
      return 0;
    }

    const rewards = this.config.rewards_program;
    if (!rewards.enabled || !rewards.redemption_rules.enabled) {
      this.logger.warn('Rewards redemption disabled', { pointsRequested: context.pointsToRedeem });
      return 0;
    }

    const limits = rewards.redemption_rules.limits;
    if (
      limits.min_basket_total_yer_to_redeem &&
      context.baseSubtotalYer < limits.min_basket_total_yer_to_redeem
    ) {
      this.logger.warn('Rewards redemption skipped due to min basket total', {
        minBasketTotal: limits.min_basket_total_yer_to_redeem,
        basketTotal: context.baseSubtotalYer,
      });
      return 0;
    }

    const ratio = rewards.redemption_rules.conversion.points_to_yer_ratio;
    if (!ratio.points || !ratio.yer) {
      return 0;
    }

    const valuePerPoint = ratio.yer / ratio.points;
    const requestedDiscountValue = Math.floor(context.pointsToRedeem * valuePerPoint);
    if (requestedDiscountValue <= 0) {
      return 0;
    }

    const grossTotal = context.baseSubtotalYer + context.baseDeliveryFeeYer;
    let allowedValue = requestedDiscountValue;
    if (limits.max_discount_pct_per_order) {
      const limitValue = Math.floor((grossTotal * limits.max_discount_pct_per_order) / 100);
      allowedValue = Math.min(allowedValue, limitValue);
    }

    if (allowedValue <= 0) {
      return 0;
    }

    let remainingDiscount = allowedValue;
    let pointsRedeemed = 0;

    const applyToDeliveryFirst =
      limits.apply_to === 'delivery_fee_first_then_basket' ||
      limits.apply_to === 'delivery_fee_only';
    if (applyToDeliveryFirst && remainingDiscount > 0) {
      const applied = this.applyAdjustment(totals, adjustments, {
        id: 'rewards:delivery',
        label: 'Rewards Redemption (delivery)',
        source: 'rewards',
        target: 'delivery_fee',
        amountYer: remainingDiscount,
        mode: 'discount',
        metadata: {
          pointsRequested: context.pointsToRedeem,
        },
      });
      remainingDiscount -= applied;
      pointsRedeemed += Math.floor(applied / valuePerPoint);
    }

    if (limits.apply_to !== 'delivery_fee_only' && remainingDiscount > 0) {
      const applied = this.applyAdjustment(totals, adjustments, {
        id: 'rewards:basket',
        label: 'Rewards Redemption (basket)',
        source: 'rewards',
        target: 'basket_total',
        amountYer: remainingDiscount,
        mode: 'discount',
        metadata: {
          pointsRequested: context.pointsToRedeem,
        },
      });
      remainingDiscount -= applied;
      pointsRedeemed += Math.floor(applied / valuePerPoint);
    }

    return pointsRedeemed;
  }

  private applyCoupon(
    context: IncentivesCalculationContext,
    totals: IncentiveTotalsState,
    adjustments: IncentiveAdjustment[],
  ): string | null {
    if (!context.couponCode) {
      return null;
    }

    const coupon = this.findCoupon(context.couponCode);
    if (!coupon) {
      this.logger.warn('Coupon not found or inactive', { couponCode: context.couponCode });
      return null;
    }

    if (!this.isCouponEligible(coupon, context)) {
      this.logger.warn('Coupon not eligible for this context', {
        couponCode: context.couponCode,
        userType: context.userType,
      });
      return null;
    }

    const amount = this.calculateEffectAmount(coupon.effect, totals, coupon.effect.target);
    if (amount <= 0) {
      return null;
    }

    this.applyAdjustment(totals, adjustments, {
      id: `coupon:${coupon.code}`,
      label: coupon.name_ar,
      source: 'coupon',
      target: this.mapTarget(coupon.effect.target),
      amountYer: amount,
      mode: 'discount',
      metadata: {
        funding: coupon.funding,
      },
    });

    return coupon.code;
  }

  private enforceGuardrails(
    context: IncentivesCalculationContext,
    totals: IncentiveTotalsState,
    adjustments: IncentiveAdjustment[],
    guardrailViolations: string[],
  ): void {
    const guards = this.config.stacking_policy.guards;
    const baseTotal = context.baseSubtotalYer + context.baseDeliveryFeeYer;
    const currentTotal = totals.subtotalYer + totals.deliveryFeeYer;

    if (guards.max_total_discount_pct !== undefined && baseTotal > 0) {
      const minNetTotal = Math.ceil(baseTotal * (1 - guards.max_total_discount_pct / 100));
      if (currentTotal < minNetTotal) {
        const rollbackAmount = minNetTotal - currentTotal;
        const applied = this.applyAdjustment(totals, adjustments, {
          id: 'guard:max_discount_pct',
          label: 'Guardrail rollback (max discount pct)',
          source: 'guard',
          target: 'delivery_fee',
          amountYer: rollbackAmount,
          mode: 'surcharge',
          metadata: {
            maxPct: guards.max_total_discount_pct,
          },
        });
        if (applied > 0) {
          guardrailViolations.push('max_total_discount_pct');
        }
      }
    }

    if (
      guards.min_net_total_yer !== undefined &&
      totals.subtotalYer + totals.deliveryFeeYer < guards.min_net_total_yer
    ) {
      const rollbackAmount =
        guards.min_net_total_yer - (totals.subtotalYer + totals.deliveryFeeYer);
      const applied = this.applyAdjustment(totals, adjustments, {
        id: 'guard:min_net_total',
        label: 'Guardrail rollback (min net total)',
        source: 'guard',
        target: 'delivery_fee',
        amountYer: rollbackAmount,
        mode: 'surcharge',
        metadata: {
          minNetTotal: guards.min_net_total_yer,
        },
      });
      if (applied > 0) {
        guardrailViolations.push('min_net_total_yer');
      }
    }

    if (guards.prevent_negative_or_zero_price && totals.subtotalYer + totals.deliveryFeeYer <= 0) {
      const applied = this.applyAdjustment(totals, adjustments, {
        id: 'guard:prevent_negative',
        label: 'Guardrail rollback (prevent zero/negative)',
        source: 'guard',
        target: 'delivery_fee',
        amountYer: 1,
        mode: 'surcharge',
        metadata: {},
      });
      if (applied > 0) {
        guardrailViolations.push('prevent_negative_or_zero_price');
      }
    }
  }

  private matchesScope(
    rule: DiscountRule,
    context: IncentivesCalculationContext,
    currentDay: string,
    currentTime: string,
  ): boolean {
    const scope = rule.scope;
    if (scope.service && scope.service !== 'DSH') {
      return false;
    }
    if (scope.cities && !this.matchesStringScope(scope.cities, context.city)) {
      return false;
    }
    if (scope.categories && !this.matchesStringScope(scope.categories, context.primaryCategory)) {
      return false;
    }
    if (scope.days_of_week && !scope.days_of_week.includes(currentDay)) {
      return false;
    }
    if (
      scope.time_range &&
      !this.isWithinTimeRange(scope.time_range.from, scope.time_range.to, currentTime)
    ) {
      return false;
    }
    return true;
  }

  private matchesDiscountCondition(
    rule: DiscountRule,
    context: IncentivesCalculationContext,
  ): boolean {
    const condition = rule.condition;
    if (!condition) {
      return true;
    }
    if (
      condition.min_basket_total_yer !== null &&
      condition.min_basket_total_yer !== undefined &&
      context.baseSubtotalYer < condition.min_basket_total_yer
    ) {
      return false;
    }
    if (
      condition.max_basket_total_yer !== null &&
      condition.max_basket_total_yer !== undefined &&
      context.baseSubtotalYer > condition.max_basket_total_yer
    ) {
      return false;
    }
    return true;
  }

  private findCoupon(code: string): CouponDefinition | undefined {
    const normalized = code.trim().toUpperCase();
    return this.config.coupon_definitions.find(
      (coupon) => coupon.code.toUpperCase() === normalized && coupon.active,
    );
  }

  private isCouponEligible(
    coupon: CouponDefinition,
    context: IncentivesCalculationContext,
  ): boolean {
    if (!this.matchesStringScope(coupon.scope.cities, context.city)) {
      return false;
    }
    if (!this.matchesStringScope(coupon.scope.categories, context.primaryCategory)) {
      return false;
    }
    const userType = context.userType ?? 'existing';
    const eligible = coupon.scope.eligible_user_types;
    const isEligible =
      eligible.includes('all') ||
      (eligible.includes('new_users_only') && userType === 'new') ||
      (eligible.includes('subscribers_only') && Boolean(context.subscriptionPlanId));
    if (!isEligible) {
      return false;
    }
    if (
      coupon.limits.min_basket_total_yer &&
      context.baseSubtotalYer < coupon.limits.min_basket_total_yer
    ) {
      return false;
    }
    return true;
  }

  private calculateEffectAmount(
    effect: DiscountRule['effect'] | CouponDefinition['effect'],
    totals: IncentiveTotalsState,
    overrideTarget?: 'basket_total' | 'delivery_fee',
  ): number {
    const target = overrideTarget ?? effect.target;
    const subject =
      target === 'basket_total'
        ? totals.subtotalYer
        : target === 'delivery_fee'
          ? totals.deliveryFeeYer
          : totals.deliveryFeeYer;

    if (subject <= 0) {
      return 0;
    }

    let discount = 0;

    if (effect.type === 'percent') {
      discount = this.calculatePercentageDiscount(subject, effect.value_pct ?? 0);
    } else if (effect.type === 'flat') {
      discount = effect.value_yer ?? 0;
    } else if (effect.type === 'free') {
      discount = subject;
    }

    if (effect.max_discount_yer !== undefined && effect.max_discount_yer !== null) {
      discount = Math.min(discount, effect.max_discount_yer);
    }

    return Math.max(0, Math.min(discount, subject));
  }

  private calculatePercentageDiscount(amount: number, pct: number): number {
    if (pct <= 0) {
      return 0;
    }
    return Math.floor((amount * pct) / 100);
  }

  private applyAdjustment(
    totals: IncentiveTotalsState,
    adjustments: IncentiveAdjustment[],
    adjustment: IncentiveAdjustment,
  ): number {
    const targetAmount = this.getTargetAmount(totals, adjustment.target);
    const maxApplicable =
      adjustment.mode === 'discount'
        ? Math.min(targetAmount, adjustment.amountYer)
        : adjustment.amountYer;

    if (maxApplicable <= 0) {
      return 0;
    }

    const record: IncentiveAdjustment = {
      ...adjustment,
      amountYer: maxApplicable,
    };
    adjustments.push(record);

    const signedDelta = adjustment.mode === 'discount' ? -maxApplicable : maxApplicable;
    this.updateTotals(totals, adjustment.target, signedDelta);

    return maxApplicable;
  }

  private getTargetAmount(totals: IncentiveTotalsState, target: IncentiveTarget): number {
    if (target === 'basket_total') {
      return totals.subtotalYer;
    }
    return totals.deliveryFeeYer;
  }

  private updateTotals(
    totals: IncentiveTotalsState,
    target: IncentiveTarget,
    signedDelta: number,
  ): void {
    if (target === 'basket_total') {
      totals.subtotalYer = Math.max(0, totals.subtotalYer + signedDelta);
    } else {
      totals.deliveryFeeYer = Math.max(0, totals.deliveryFeeYer + signedDelta);
    }
  }

  private matchesStringScope(scopeValues: string[], candidate?: string): boolean {
    if (!scopeValues || scopeValues.length === 0) {
      return true;
    }
    if (scopeValues.includes('ALL')) {
      return true;
    }
    if (!candidate) {
      return false;
    }
    return scopeValues.includes(candidate);
  }

  private isWithinTimeRange(from: string, to: string, current: string): boolean {
    return current >= from && current <= to;
  }

  private getDayOfWeek(date: Date): string {
    return date
      .toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: 'Asia/Aden',
      })
      .toUpperCase();
  }

  private getTimeOfDay(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Aden',
    });
  }

  private mapTarget(target: 'delivery_fee' | 'basket_total' | 'both'): IncentiveTarget {
    if (target === 'basket_total') {
      return 'basket_total';
    }
    return 'delivery_fee';
  }
}
