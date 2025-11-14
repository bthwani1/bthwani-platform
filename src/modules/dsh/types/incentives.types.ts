export interface MoneyValue {
  amount: string;
  currency: string;
}

export interface SubscriptionPlanFeature {
  readonly free_deliveries_per_cycle?: number;
  readonly delivery_fee_pct_discount?: number;
  readonly delivery_fee_flat_discount_yer?: number;
  readonly min_delivery_fee_after_discount_yer?: number;
  readonly priority_routing?: boolean;
  readonly priority_support?: boolean;
  readonly family_shared?: boolean;
  readonly family_max_members?: number;
  readonly extra_rewards_multiplier?: number;
}

export interface SubscriptionPlanScope {
  readonly cities: string[];
  readonly categories: string[];
}

export interface SubscriptionPlanVars {
  readonly [key: string]: string | number | boolean;
}

export interface UserSubscriptionPlan {
  readonly id: string;
  readonly name_ar: string;
  readonly type: 'user';
  readonly billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  readonly price_yer: number;
  readonly active: boolean;
  readonly features: SubscriptionPlanFeature;
  readonly scope: SubscriptionPlanScope;
  readonly vars: SubscriptionPlanVars;
}

export interface PartnerSubscriptionPlan {
  readonly id: string;
  readonly name_ar: string;
  readonly type: 'partner';
  readonly billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  readonly price_yer: number;
  readonly active: boolean;
  readonly effects: {
    readonly base_commission_pct: number;
    readonly default_commission_pct_without_plan: number;
    readonly listing_rank_boost: number;
    readonly featured_badge: boolean;
    readonly access_to_shared_coupons: boolean;
    readonly access_to_marketing_tools: boolean;
  };
  readonly scope: SubscriptionPlanScope;
  readonly vars: SubscriptionPlanVars;
}

export interface CaptainLevel {
  readonly id: string;
  readonly name_ar: string;
  readonly min_orders_per_month: number;
  readonly min_rating: number;
  readonly share_pct_of_delivery_fee: number;
  readonly priority_score: number;
  readonly monthly_bonus_yer: number;
  readonly vars: SubscriptionPlanVars;
}

export interface DiscountRuleEffect {
  readonly target: 'delivery_fee' | 'basket_total' | 'both';
  readonly type: 'percent' | 'flat' | 'free';
  readonly value_pct?: number;
  readonly value_yer?: number;
  readonly max_discount_yer?: number;
}

export interface DiscountRuleScope {
  readonly service: string;
  readonly cities?: string[];
  readonly categories?: string[];
  readonly partners?: string[];
  readonly days_of_week?: string[];
  readonly time_range?: {
    readonly from: string;
    readonly to: string;
  };
}

export interface DiscountRuleCondition {
  readonly min_basket_total_yer?: number | null;
  readonly max_basket_total_yer?: number | null;
}

export interface DiscountRuleFunding {
  readonly mode: 'platform' | 'partner' | 'hybrid';
  readonly platform_pct?: number;
  readonly partner_pct?: number;
}

export interface DiscountRuleStacking {
  readonly applies_after_subscription_discounts?: boolean;
  readonly allows_coupon_stack?: boolean;
}

export interface DiscountRuleLedger {
  readonly discount_account_code: string;
  readonly platform_share_account_code?: string;
  readonly partner_share_account_code?: string;
}

export interface DiscountRule {
  readonly id: string;
  readonly name_ar: string;
  readonly active: boolean;
  readonly scope: DiscountRuleScope;
  readonly condition?: DiscountRuleCondition;
  readonly effect: DiscountRuleEffect;
  readonly funding: DiscountRuleFunding;
  readonly stacking?: DiscountRuleStacking;
  readonly ledger?: DiscountRuleLedger;
  readonly vars?: SubscriptionPlanVars;
}

export interface CouponScope {
  readonly service: string;
  readonly cities: string[];
  readonly categories: string[];
  readonly partners: string[];
  readonly eligible_user_types: Array<'all' | 'new_users_only' | 'subscribers_only'>;
}

export interface CouponEffect {
  readonly target: 'basket_total' | 'delivery_fee';
  readonly type: 'percent' | 'flat' | 'free';
  readonly value_pct?: number;
  readonly value_yer?: number;
  readonly max_discount_yer?: number;
}

export interface CouponLimits {
  readonly per_user_usage_limit?: number;
  readonly global_usage_limit?: number;
  readonly min_basket_total_yer?: number;
}

export interface CouponValidity {
  readonly starts_at: string;
  readonly ends_at: string;
}

export interface CouponFunding extends DiscountRuleFunding {}

export interface CouponStacking {
  readonly allows_with_subscription_discounts: boolean;
  readonly allows_with_other_coupons: boolean;
}

export interface CouponDefinition {
  readonly code: string;
  readonly name_ar: string;
  readonly active: boolean;
  readonly scope: CouponScope;
  readonly effect: CouponEffect;
  readonly limits: CouponLimits;
  readonly validity: CouponValidity;
  readonly funding: CouponFunding;
  readonly stacking: CouponStacking;
  readonly vars?: SubscriptionPlanVars;
}

export interface RewardsConversionRule {
  readonly name_ar: string;
  readonly points_to_yer_ratio: {
    readonly points: number;
    readonly yer: number;
  };
  readonly vars?: SubscriptionPlanVars;
}

export interface RewardsLimits {
  readonly max_discount_pct_per_order?: number;
  readonly min_basket_total_yer_to_redeem?: number;
  readonly apply_to?: 'delivery_fee_first_then_basket' | 'basket_only' | 'delivery_fee_only';
  readonly vars?: SubscriptionPlanVars;
}

export interface RewardsRedemptionRules {
  readonly enabled: boolean;
  readonly conversion: RewardsConversionRule;
  readonly limits: RewardsLimits;
}

export interface RewardsProgram {
  readonly enabled: boolean;
  readonly earning_rules: Record<string, unknown>;
  readonly redemption_rules: RewardsRedemptionRules;
  readonly expiry_policy: {
    readonly enabled: boolean;
    readonly expiry_days_after_earn: number;
    readonly grace_period_days: number;
    readonly vars?: SubscriptionPlanVars;
  };
  readonly anti_fraud: {
    readonly earn_only_after_order_status: string;
    readonly revoke_on_refund_or_cancel: boolean;
    readonly step_up_for_mass_redeem: boolean;
  };
}

export interface StackingPolicy {
  readonly order_of_application: string[];
  readonly guards: {
    readonly min_net_total_yer?: number;
    readonly max_total_discount_pct?: number;
    readonly prevent_negative_or_zero_price?: boolean;
  };
  readonly vars?: SubscriptionPlanVars;
}

export interface DshIncentivesConfig {
  readonly meta: {
    readonly service_code: string;
    readonly version: string;
    readonly wallet_mode: string;
    readonly currency: string;
    readonly note: string;
  };
  readonly subscriptions: {
    readonly user_plans: UserSubscriptionPlan[];
    readonly partner_plans: PartnerSubscriptionPlan[];
    readonly captain_levels: CaptainLevel[];
  };
  readonly discount_rules: DiscountRule[];
  readonly coupon_definitions: CouponDefinition[];
  readonly rewards_program: RewardsProgram;
  readonly stacking_policy: StackingPolicy;
}

export type IncentiveSource = 'subscription' | 'discount_rule' | 'coupon' | 'rewards' | 'guard';

export type IncentiveTarget = 'delivery_fee' | 'basket_total' | 'order_total';

export type IncentiveMode = 'discount' | 'surcharge';

export interface IncentiveAdjustment {
  readonly id: string;
  readonly label: string;
  readonly source: IncentiveSource;
  readonly target: IncentiveTarget;
  readonly amountYer: number;
  readonly mode: IncentiveMode;
  readonly metadata?: Record<string, unknown>;
}

export interface IncentivesCalculationContext {
  readonly baseSubtotalYer: number;
  readonly baseDeliveryFeeYer: number;
  readonly city?: string;
  readonly primaryCategory?: string;
  readonly subscriptionPlanId?: string;
  readonly couponCode?: string;
  readonly pointsToRedeem?: number;
  readonly userType?: 'new' | 'existing' | 'subscriber';
  readonly timestamp?: Date;
}

export interface IncentivesCalculationResult {
  readonly subtotalYer: number;
  readonly deliveryFeeYer: number;
  readonly totalYer: number;
  readonly adjustments: IncentiveAdjustment[];
  readonly appliedCouponCode?: string;
  readonly pointsRedeemed?: number;
  readonly guardrailViolations?: string[];
}
