import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from '../services/subscription.service';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';
import { Roles } from '../../../core/guards/rbac.guard';

@ApiTags('APP-PARTNER Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Roles('partner')
export class WltSubscriptionsController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get subscription status' })
  async getStatus(@CurrentUser() user: JwtPayload): Promise<unknown> {
    const status = await this.subscriptionService.getStatus(user.sub);
    return {
      plan_code: status.plan_code,
      plan_name: status.plan_name,
      status: status.status,
      start_date: status.start_date.toISOString().split('T')[0],
      end_date: status.end_date?.toISOString().split('T')[0] || null,
      commission_effect: status.commission_effect,
    };
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get subscription plans' })
  async getPlans(): Promise<unknown> {
    const plans = await this.subscriptionService.getPlans();
    return {
      plans: plans.map((plan) => ({
        code: plan.code,
        name: plan.name,
        name_ar: plan.name_ar,
        price: plan.price,
        billing_cycle: plan.billing_cycle,
        benefits: plan.benefits,
        commission_discount_pct: plan.commission_discount_pct,
        base_commission_pct: plan.base_commission_pct,
        default_commission_pct_without_plan: plan.default_commission_pct_without_plan,
        listing_rank_boost: plan.listing_rank_boost,
        featured_badge: plan.featured_badge,
        access_to_shared_coupons: plan.access_to_shared_coupons,
        access_to_marketing_tools: plan.access_to_marketing_tools,
      })),
    };
  }

  @Post('checkout')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Checkout subscription' })
  @HttpCode(HttpStatus.OK)
  async checkout(
    @CurrentUser() user: JwtPayload,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body()
    body: {
      plan_code: string;
      billing_cycle: 'monthly' | 'quarterly' | 'yearly';
      payment_method?: 'settlement_deduction' | 'wallet_balance';
    },
  ): Promise<unknown> {
    const status = await this.subscriptionService.checkout(
      user.sub,
      {
        plan_code: body.plan_code,
        billing_cycle: body.billing_cycle,
        payment_method: body.payment_method !== undefined ? body.payment_method : 'settlement_deduction',
      },
      idempotencyKey,
    );

    return {
      plan_code: status.plan_code,
      plan_name: status.plan_name,
      status: status.status,
      start_date: status.start_date.toISOString().split('T')[0],
      end_date: status.end_date?.toISOString().split('T')[0] || null,
      commission_effect: status.commission_effect,
    };
  }
}

