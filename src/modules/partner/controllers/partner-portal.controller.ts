import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';
import { Roles } from '../../../core/guards/rbac.guard';
import { PartnerRoleService } from '../services/partner-role.service';
import { DshPartnersService } from '../../dsh/services/dsh-partners.service';
import { BookingQueryService } from '../../arb/services/booking-query.service';
import { BookingCommandService } from '../../arb/services/booking-command.service';
import { BalanceService } from '../../wlt/services/balance.service';
import { SettlementService } from '../../wlt/services/settlement.service';
import { ExportService } from '../../wlt/services/export.service';
import { AccountService } from '../../wlt/services/account.service';
import { SubscriptionService } from '../../wlt/services/subscription.service';
import { CoaMappingService } from '../../wlt/services/coa-mapping.service';
import { AccountType } from '../../wlt/entities/account.entity';
import { EntryCategory } from '../../wlt/entities/journal-entry.entity';

/**
 * Partner Portal Controller (WEB-PARTNER)
 * 
 * This controller provides web portal endpoints for partners on partner.bthwani.com
 * It shares the same functionality as APP-PARTNER but optimized for web interface.
 * 
 * All endpoints require:
 * - JWT authentication
 * - Partner role
 * - Idempotency-Key for mutating operations
 */
@ApiTags('WEB-PARTNER Portal')
@Controller('partner/portal')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Roles('partner')
export class PartnerPortalController {
  constructor(
    private readonly roleService: PartnerRoleService,
    private readonly dshPartnersService: DshPartnersService,
    private readonly bookingQueryService: BookingQueryService,
    private readonly bookingCommandService: BookingCommandService,
    private readonly balanceService: BalanceService,
    private readonly settlementService: SettlementService,
    private readonly exportService: ExportService,
    private readonly accountService: AccountService,
    private readonly subscriptionService: SubscriptionService,
    private readonly coaMappingService: CoaMappingService,
  ) {}

  // ==================== Dashboard ====================

  @Get('dashboard')
  @ApiOperation({ summary: 'Get partner dashboard overview' })
  async getDashboard(@CurrentUser() user: JwtPayload): Promise<unknown> {
    // Get partner account
    const account = await this.accountService.getAccountByOwnerAndType(
      user.sub,
      AccountType.PARTNER,
    );

    // Get today's orders count
    const orders = await this.dshPartnersService.listOrders(user.sub, {
      limit: 100,
    });

    // Get today's bookings count
    const bookings = await this.bookingQueryService.findByPartner(user.sub, {
      limit: 100,
    });

    // Get finance overview
    const balance = account
      ? await this.balanceService.getBalance(account.id)
      : { balance: 0, currency: 'YER' };

    return {
      store_status: {
        is_open: true, // TODO: Get from store entity
        updated_at: new Date().toISOString(),
      },
      today: {
        orders_count: orders.items.length,
        bookings_count: (bookings as any).items?.length || 0,
        cancellations: 0, // TODO: Calculate
      },
      revenue_today: {
        amount: '0',
        currency: 'YER',
      },
      alerts: [], // TODO: Add alerts
    };
  }

  // ==================== Orders (DSH) ====================

  @Get('orders')
  @ApiOperation({ summary: 'List partner orders' })
  async listOrders(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<unknown> {
    this.roleService.requirePermission(user.roles || [], 'orders', 'read');
    return this.dshPartnersService.listOrders(user.sub, {
      ...(status ? { status } : {}),
      ...(cursor ? { cursor } : {}),
      ...(limit ? { limit } : {}),
    });
  }

  @Get('orders/:order_id')
  @ApiOperation({ summary: 'Get order details' })
  async getOrder(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
  ): Promise<unknown> {
    this.roleService.requirePermission(user.roles || [], 'orders', 'read');
    return this.dshPartnersService.getOrder(user.sub, orderId);
  }

  @Post('orders/:order_id/accept')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Accept order' })
  @HttpCode(HttpStatus.OK)
  async acceptOrder(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<unknown> {
    this.roleService.requirePermission(user.roles || [], 'orders', 'update');
    return this.dshPartnersService.acceptOrder(user.sub, orderId, idempotencyKey);
  }

  @Post('orders/:order_id/reject')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Reject order' })
  @HttpCode(HttpStatus.OK)
  async rejectOrder(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() body: { reason: string },
  ): Promise<unknown> {
    this.roleService.requirePermission(user.roles || [], 'orders', 'update');
    return this.dshPartnersService.rejectOrder(
      user.sub,
      orderId,
      idempotencyKey,
      body.reason,
    );
  }

  @Post('orders/:order_id/ready')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Mark order as ready' })
  @HttpCode(HttpStatus.OK)
  async markOrderReady(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<unknown> {
    this.roleService.requirePermission(user.roles || [], 'orders', 'update');
    return this.dshPartnersService.markReady(user.sub, orderId, idempotencyKey);
  }

  @Post('orders/:order_id/handoff')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Handoff order to platform' })
  @HttpCode(HttpStatus.OK)
  async handoffOrder(
    @CurrentUser() user: JwtPayload,
    @Param('order_id') orderId: string,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<unknown> {
    this.roleService.requirePermission(user.roles || [], 'orders', 'update');
    return this.dshPartnersService.handoffOrder(
      user.sub,
      orderId,
      idempotencyKey,
    );
  }

  // ==================== Bookings (ARB) ====================

  @Get('bookings')
  @ApiOperation({ summary: 'List partner bookings' })
  async listBookings(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<unknown> {
    this.roleService.requirePermission(user.roles || [], 'bookings', 'read');
    return this.bookingQueryService.findByPartner(user.sub, {
      ...(status ? { status: status as any } : {}),
      ...(cursor ? { cursor } : {}),
      ...(limit ? { limit } : {}),
    });
  }

  @Get('bookings/:booking_id')
  @ApiOperation({ summary: 'Get booking details' })
  async getBooking(
    @CurrentUser() user: JwtPayload,
    @Param('booking_id') bookingId: string,
  ): Promise<unknown> {
    this.roleService.requirePermission(user.roles || [], 'bookings', 'read');
    return this.bookingQueryService.findOne(bookingId, user.sub, 'partner');
  }

  @Post('bookings/:booking_id/confirm')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Confirm booking' })
  @HttpCode(HttpStatus.OK)
  async confirmBooking(
    @CurrentUser() user: JwtPayload,
    @Param('booking_id') bookingId: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() body?: { notes?: string },
  ): Promise<unknown> {
    this.roleService.requirePermission(user.roles || [], 'bookings', 'update');
    return this.bookingCommandService.updateStatus(
      bookingId,
      user.sub,
      {
        status: 'confirmed' as any,
        ...(body?.notes ? { notes: body.notes } : {}),
      },
      idempotencyKey,
    );
  }

  @Post('bookings/:booking_id/reject')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Reject booking' })
  @HttpCode(HttpStatus.OK)
  async rejectBooking(
    @CurrentUser() user: JwtPayload,
    @Param('booking_id') bookingId: string,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() body: { reason: string; notes?: string },
  ): Promise<unknown> {
    this.roleService.requirePermission(user.roles || [], 'bookings', 'update');
    return this.bookingCommandService.updateStatus(
      bookingId,
      user.sub,
      {
        status: 'cancelled' as any,
        notes: body.notes || body.reason,
      },
      idempotencyKey,
    );
  }

  // ==================== Finance ====================

  @Get('finance/overview')
  @ApiOperation({ summary: 'Get finance overview' })
  async getFinanceOverview(@CurrentUser() user: JwtPayload): Promise<unknown> {
    this.roleService.requirePermission(user.roles || [], 'finance', 'read');
    const account = await this.accountService.getAccountByOwnerAndType(
      user.sub,
      AccountType.PARTNER,
    );
    if (!account) {
      return {
        total_sales: {
          dsh: { amount: '0', currency: 'YER' },
          arb: { amount: '0', currency: 'YER' },
          total: { amount: '0', currency: 'YER' },
        },
        total_commissions: {
          dsh: { amount: '0', currency: 'YER' },
          arb: { amount: '0', currency: 'YER' },
          total: { amount: '0', currency: 'YER' },
        },
        net_payable: { amount: '0', currency: 'YER' },
        pending_balance: { amount: '0', currency: 'YER' },
        next_settlement: null,
      };
    }

    const balance = await this.balanceService.getBalance(account.id);
    const transactions = await this.balanceService.listTransactions(account.id, {
      limit: 100,
    });

    let totalSalesDsh = 0;
    let totalSalesArb = 0;
    let totalCommissionsDsh = 0;
    let totalCommissionsArb = 0;

    transactions.items.forEach((tx) => {
      if (tx.serviceRef === 'DSH') {
        if (tx.category === 'sale' && tx.entryType === 'CREDIT') {
          totalSalesDsh += tx.amount;
        } else if (tx.category === 'commission' && tx.entryType === 'DEBIT') {
          totalCommissionsDsh += tx.amount;
        }
      } else if (tx.serviceRef === 'ARB') {
        if (tx.category === 'sale' && tx.entryType === 'CREDIT') {
          totalSalesArb += tx.amount;
        } else if (tx.category === 'commission' && tx.entryType === 'DEBIT') {
          totalCommissionsArb += tx.amount;
        }
      }
    });

    const totalSales = totalSalesDsh + totalSalesArb;
    const totalCommissions = totalCommissionsDsh + totalCommissionsArb;
    const netPayable = totalSales - totalCommissions;

    return {
      total_sales: {
        dsh: { amount: totalSalesDsh.toString(), currency: 'YER' },
        arb: { amount: totalSalesArb.toString(), currency: 'YER' },
        total: { amount: totalSales.toString(), currency: 'YER' },
      },
      total_commissions: {
        dsh: { amount: totalCommissionsDsh.toString(), currency: 'YER' },
        arb: { amount: totalCommissionsArb.toString(), currency: 'YER' },
        total: { amount: totalCommissions.toString(), currency: 'YER' },
      },
      net_payable: { amount: netPayable.toString(), currency: 'YER' },
      pending_balance: { amount: balance.balance.toString(), currency: balance.currency },
      next_settlement: null,
    };
  }

  @Get('finance/ledger')
  @ApiOperation({ summary: 'Get ledger transactions' })
  async getLedger(
    @CurrentUser() user: JwtPayload,
    @Query('service') service?: string,
    @Query('category') category?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<unknown> {
    this.roleService.requirePermission(user.roles || [], 'finance', 'read');
    const account = await this.accountService.getAccountByOwnerAndType(
      user.sub,
      AccountType.PARTNER,
    );
    if (!account) {
      return { items: [], next_cursor: null };
    }

    const transactions = await this.balanceService.listTransactions(account.id, {
      ...(cursor ? { cursor } : {}),
      limit: limit ? Math.min(limit, 100) : 20,
      ...(category ? { category: category as any } : {}),
      ...(service ? { serviceRef: service } : {}),
    });

    const items = transactions.items.map((tx) => ({
      id: tx.id,
      date: tx.createdAt.toISOString(),
      reference: tx.transactionRef,
      description: tx.description || `${tx.category} - ${tx.serviceRef || 'unknown'}`,
      amount: tx.entryType === 'CREDIT' ? tx.amount.toString() : `-${tx.amount}`,
      type: tx.category,
      service: tx.serviceRef,
      coa_code: this.getCoaCode(tx.category, tx.serviceRef),
      settlement_status: null,
    }));

    return {
      items,
      next_cursor: transactions.nextCursor || null,
    };
  }

  @Get('finance/settlements')
  @ApiOperation({ summary: 'List settlements' })
  async listSettlements(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<unknown> {
    this.roleService.requirePermission(user.roles || [], 'settlements', 'read');
    const account = await this.accountService.getAccountByOwnerAndType(
      user.sub,
      AccountType.PARTNER,
    );
    if (!account) {
      return { items: [], next_cursor: null };
    }

    const settlements = await this.settlementService.listBatches({
      ...(status ? { status: status as any } : {}),
      partnerId: user.sub,
      ...(cursor ? { cursor } : {}),
      limit: limit ? Math.min(limit, 100) : 20,
    });

    const items = (settlements as any).items?.map((batch: any) => ({
      id: batch.id,
      period_start: batch.period_start?.toISOString().split('T')[0],
      period_end: batch.period_end?.toISOString().split('T')[0],
      total_sales: { amount: '0', currency: 'YER' },
      total_commissions: { amount: '0', currency: 'YER' },
      net_amount: {
        amount: batch.total_amount?.toString() || '0',
        currency: batch.currency || 'YER',
      },
      status: batch.status,
      bank_reference: null,
      created_at: batch.created_at?.toISOString(),
    })) || [];

    return {
      items,
      next_cursor: (settlements as any).nextCursor || null,
    };
  }

  @Post('finance/exports')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Export finance report' })
  @HttpCode(HttpStatus.ACCEPTED)
  async exportFinanceReport(
    @CurrentUser() user: JwtPayload,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body()
    body: {
      period_start: string;
      period_end: string;
      detail_level?: string;
      include_coa?: boolean;
      format: string;
    },
  ): Promise<unknown> {
    this.roleService.requirePermission(user.roles || [], 'exports', 'create');
    const account = await this.accountService.getAccountByOwnerAndType(
      user.sub,
      AccountType.PARTNER,
    );
    if (!account) {
      throw new Error('Partner account not found');
    }

    const exportResult = await this.exportService.exportStatement({
      accountIds: [account.id],
      dateFrom: new Date(body.period_start),
      dateTo: new Date(body.period_end),
      privacyLevel: 'masked',
      userId: user.sub,
      userRole: 'partner',
    });

    return {
      export_id: exportResult.exportId,
      status: 'pending',
      download_url: exportResult.signedUrl,
    };
  }

  // ==================== Subscriptions ====================

  @Get('subscriptions/status')
  @ApiOperation({ summary: 'Get subscription status' })
  async getSubscriptionStatus(@CurrentUser() user: JwtPayload): Promise<unknown> {
    this.roleService.requirePermission(user.roles || [], 'subscription', 'read');
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

  @Get('subscriptions/plans')
  @ApiOperation({ summary: 'Get subscription plans' })
  async getSubscriptionPlans(): Promise<unknown> {
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
      })),
    };
  }

  @Post('subscriptions/checkout')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Checkout subscription' })
  @HttpCode(HttpStatus.OK)
  async checkoutSubscription(
    @CurrentUser() user: JwtPayload,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body()
    body: {
      plan_code: string;
      billing_cycle: 'monthly' | 'quarterly' | 'yearly';
      payment_method?: 'settlement_deduction' | 'wallet_balance';
    },
  ): Promise<unknown> {
    this.roleService.requirePermission(user.roles || [], 'subscription', 'request');
    const status = await this.subscriptionService.checkout(
      user.sub,
      {
        plan_code: body.plan_code,
        billing_cycle: body.billing_cycle,
        payment_method: body.payment_method || 'settlement_deduction',
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

  // ==================== Store Management ====================

  @Post('store/toggle')
  @UseGuards(IdempotencyGuard)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOperation({ summary: 'Toggle store open/close' })
  @HttpCode(HttpStatus.OK)
  async toggleStore(
    @CurrentUser() user: JwtPayload,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body() body: { is_open: boolean },
  ): Promise<unknown> {
    this.roleService.requirePermission(user.roles || [], 'store', 'toggle');
    // TODO: Implement store toggle
    return {
      is_open: body.is_open,
      updated_at: new Date().toISOString(),
    };
  }

  @Get('branches')
  @ApiOperation({ summary: 'List partner branches' })
  async listBranches(@CurrentUser() user: JwtPayload): Promise<unknown> {
    // TODO: Fetch from partner entity
    return {
      items: [
        { id: 'branch_1', name: 'Main Branch', address: 'Address 1' },
        { id: 'branch_2', name: 'Branch 2', address: 'Address 2' },
      ],
    };
  }

  // ==================== Helper Methods ====================

  private getCoaCode(category: string, serviceRef?: string): string | null {
    const entryCategory = category as EntryCategory;
    return this.coaMappingService.getCoACode(entryCategory, serviceRef);
  }
}

