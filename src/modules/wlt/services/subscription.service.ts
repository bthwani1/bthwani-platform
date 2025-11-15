import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AccountService } from './account.service';
import { LedgerEngine } from './ledger-engine.service';
import { BalanceService } from './balance.service';
import { AccountType, AccountEntity } from '../entities/account.entity';
import { EntryType, EntryCategory } from '../entities/journal-entry.entity';
import { LoggerService } from '../../../core/services/logger.service';
import { AuditLoggerService } from './audit-logger.service';

export interface SubscriptionPlan {
  code: string;
  name: string;
  name_ar: string;
  price: { amount: string; currency: string };
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  benefits: string[];
  commission_discount_pct?: number;
  base_commission_pct?: number;
  default_commission_pct_without_plan?: number;
  listing_rank_boost?: number;
  featured_badge?: boolean;
  access_to_shared_coupons?: boolean;
  access_to_marketing_tools?: boolean;
}

export interface SubscriptionStatus {
  plan_code: string;
  plan_name: string;
  status: 'active' | 'expired' | 'cancelled';
  start_date: Date;
  end_date?: Date;
  commission_effect?: {
    base_commission_pct: number;
    default_commission_pct_without_plan: number;
  };
}

export interface SubscriptionCheckoutRequest {
  plan_code: string;
  billing_cycle: 'monthly' | 'quarterly' | 'yearly';
  payment_method?: 'settlement_deduction' | 'wallet_balance';
}

@Injectable()
export class SubscriptionService {
  private readonly plans: SubscriptionPlan[] = [
    {
      code: 'partner_free',
      name: 'Free Plan',
      name_ar: 'الخطة المجانية',
      price: { amount: '0', currency: 'YER' },
      billing_cycle: 'monthly',
      benefits: ['Standard commission rates', 'Basic reports', 'Standard support'],
    },
    {
      code: 'partner_pro',
      name: 'Partner Pro',
      name_ar: 'شريك مميز',
      price: { amount: '0', currency: 'YER' }, // TODO: Set actual price
      billing_cycle: 'monthly',
      benefits: [
        'Commission discount',
        'Priority listing',
        'Featured badge',
        'Extended reports',
        'Priority support',
      ],
      commission_discount_pct: 4, // Example: 8% instead of 12%
      base_commission_pct: 8,
      default_commission_pct_without_plan: 12,
      listing_rank_boost: 20,
      featured_badge: true,
      access_to_shared_coupons: true,
      access_to_marketing_tools: true,
    },
    {
      code: 'partner_pro_plus',
      name: 'Partner Pro+',
      name_ar: 'شريك مميز+',
      price: { amount: '0', currency: 'YER' }, // TODO: Set actual price
      billing_cycle: 'monthly',
      benefits: [
        'All Pro benefits',
        'Shared marketing campaigns',
        'Performance consulting',
      ],
      commission_discount_pct: 6, // Example: 6% instead of 12%
      base_commission_pct: 6,
      default_commission_pct_without_plan: 12,
      listing_rank_boost: 30,
      featured_badge: true,
      access_to_shared_coupons: true,
      access_to_marketing_tools: true,
    },
  ];

  constructor(
    private readonly accountService: AccountService,
    private readonly ledgerEngine: LedgerEngine,
    private readonly balanceService: BalanceService,
    private readonly logger: LoggerService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  async getPlans(): Promise<SubscriptionPlan[]> {
    return this.plans;
  }

  async getStatus(partnerId: string): Promise<SubscriptionStatus> {
    // TODO: Fetch from subscription entity/repository
    // For now, return default free plan
    return {
      plan_code: 'partner_free',
      plan_name: 'Free Plan',
      status: 'active',
      start_date: new Date(),
      commission_effect: {
        base_commission_pct: 12,
        default_commission_pct_without_plan: 12,
      },
    };
  }

  async checkout(
    partnerId: string,
    request: SubscriptionCheckoutRequest,
    idempotencyKey: string,
  ): Promise<SubscriptionStatus> {
    const plan = this.plans.find((p) => p.code === request.plan_code);
    if (!plan) {
      throw new NotFoundException(`Plan not found: ${request.plan_code}`);
    }

    // Get partner account
    const account = await this.accountService.getAccountByOwnerAndType(
      partnerId,
      AccountType.PARTNER,
    );
    if (!account) {
      throw new NotFoundException(`Partner account not found: ${partnerId}`);
    }

    // Calculate price based on billing cycle
    const price = this.calculatePrice(plan, request.billing_cycle);

    // Check payment method
    if (request.payment_method === 'wallet_balance') {
      const balance = await this.balanceService.getBalance(account.id);
      if (balance.balance < price) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      // Get or create platform account
      let platformAccount = await this.accountService.getAccountByOwnerAndType(
        'platform',
        AccountType.PLATFORM,
      );
      if (!platformAccount) {
        // Create platform account if it doesn't exist
        platformAccount = await this.accountService.createAccount({
          accountType: AccountType.PLATFORM,
          ownerId: 'platform',
          serviceRef: 'GLOBAL',
          attributes: {
            currency: 'YER',
          } as Record<string, unknown>,
        });
      }

      const debitEntry: {
        accountId: string;
        entryType: EntryType;
        category: EntryCategory;
        amount: number;
        currency: string;
        serviceRef: string;
        description: string;
        metadata: Record<string, unknown>;
      } = {
        accountId: account.id,
        entryType: EntryType.DEBIT,
        category: EntryCategory.SUBSCRIPTION_FEE,
        amount: price,
        currency: 'YER',
        serviceRef: 'GLOBAL',
        description: `Subscription fee for ${plan.name} (${request.billing_cycle})`,
        metadata: {
          plan_code: plan.code,
          billing_cycle: request.billing_cycle,
        },
      };

      const creditEntry: {
        accountId: string;
        entryType: EntryType;
        category: EntryCategory;
        amount: number;
        currency: string;
        serviceRef: string;
        description: string;
        metadata: Record<string, unknown>;
      } = {
        accountId: platformAccount.id,
        entryType: EntryType.CREDIT,
        category: EntryCategory.REVENUE,
        amount: price,
        currency: 'YER',
        serviceRef: 'GLOBAL',
        description: `Subscription revenue from ${partnerId}`,
        metadata: {
          plan_code: plan.code,
          billing_cycle: request.billing_cycle,
        },
      };

      await this.ledgerEngine.post({
        transactionRef: `subscription_${idempotencyKey}`,
        entries: [debitEntry, creditEntry],
      });
    } else {
      // Deduct from next settlement (deferred payment)
      // TODO: Create subscription entity with deferred payment
      // For now, just log the subscription
      this.logger.log('Subscription checkout with settlement deduction', {
        partnerId,
        planCode: plan.code,
        billingCycle: request.billing_cycle,
        idempotencyKey,
      });
    }

    // TODO: Create subscription entity
    // TODO: Update partner account attributes with subscription info

    const auditParams: {
      partnerId: string;
      planCode: string;
      billingCycle: string;
      paymentMethod: string;
      idempotencyKey: string;
    } = {
      partnerId,
      planCode: plan.code,
      billingCycle: request.billing_cycle,
      paymentMethod: request.payment_method || 'settlement_deduction',
      idempotencyKey,
    };
    await this.auditLogger.logSubscriptionCheckout(auditParams);

    return {
      plan_code: plan.code,
      plan_name: plan.name,
      status: 'active',
      start_date: new Date(),
      end_date: this.calculateEndDate(request.billing_cycle),
      commission_effect: {
        base_commission_pct: plan.base_commission_pct || 12,
        default_commission_pct_without_plan: plan.default_commission_pct_without_plan || 12,
      },
    };
  }

  private calculatePrice(plan: SubscriptionPlan, billingCycle: string): number {
    const basePrice = parseInt(plan.price.amount, 10);
    switch (billingCycle) {
      case 'monthly':
        return basePrice;
      case 'quarterly':
        return basePrice * 3 * 0.9; // 10% discount
      case 'yearly':
        return basePrice * 12 * 0.8; // 20% discount
      default:
        return basePrice;
    }
  }

  private calculateEndDate(billingCycle: string): Date {
    const endDate = new Date();
    switch (billingCycle) {
      case 'monthly':
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case 'quarterly':
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case 'yearly':
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }
    return endDate;
  }
}

