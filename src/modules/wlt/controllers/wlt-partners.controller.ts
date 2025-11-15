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
import { BalanceService } from '../services/balance.service';
import { SettlementService } from '../services/settlement.service';
import { ExportService } from '../services/export.service';
import { AccountService } from '../services/account.service';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';
import { Roles } from '../../../core/guards/rbac.guard';
import { AccountType } from '../entities/account.entity';

@ApiTags('APP-PARTNER Finance')
@Controller('wallet/partner')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Roles('partner')
export class WltPartnersController {
  constructor(
    private readonly balanceService: BalanceService,
    private readonly settlementService: SettlementService,
    private readonly exportService: ExportService,
    private readonly accountService: AccountService,
  ) {}

  @Get('finance/overview')
  @ApiOperation({ summary: 'Get partner finance overview' })
  async getFinanceOverview(@CurrentUser() user: JwtPayload): Promise<unknown> {
    // Get partner account
    const account = await this.accountService.getAccountByOwnerAndType(user.sub, AccountType.PARTNER);
    if (!account) {
      return {
        total_sales: { dsh: { amount: '0', currency: 'YER' }, arb: { amount: '0', currency: 'YER' }, total: { amount: '0', currency: 'YER' } },
        total_commissions: { dsh: { amount: '0', currency: 'YER' }, arb: { amount: '0', currency: 'YER' }, total: { amount: '0', currency: 'YER' } },
        net_payable: { amount: '0', currency: 'YER' },
        pending_balance: { amount: '0', currency: 'YER' },
        next_settlement: null,
      };
    }

    const balance = await this.balanceService.getBalance(account.id);
    const transactions = await this.balanceService.listTransactions(account.id, {
      limit: 100,
    });

    // Calculate totals from transactions
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
      next_settlement: null, // TODO: Calculate next settlement date
    };
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Get partner ledger transactions' })
  async getLedger(
    @CurrentUser() user: JwtPayload,
    @Query('service') service?: string,
    @Query('category') category?: string,
    @Query('settlement_status') settlementStatus?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ): Promise<unknown> {
    // Get partner account
    const account = await this.accountService.getAccountByOwnerAndType(user.sub, AccountType.PARTNER);
    if (!account) {
      return { items: [], next_cursor: null, prev_cursor: null };
    }

    const transactions = await this.balanceService.listTransactions(account.id, {
      ...(cursor ? { cursor } : {}),
      limit: limit ? Math.min(limit, 100) : 20,
      ...(category ? { category: category as any } : {}),
      ...(service ? { serviceRef: service } : {}),
      ...(dateFrom ? { dateFrom: new Date(dateFrom) } : {}),
      ...(dateTo ? { dateTo: new Date(dateTo) } : {}),
    });

    // Transform transactions to ledger entries
    const items = transactions.items.map((tx) => ({
      id: tx.id,
      date: tx.createdAt.toISOString(),
      reference: tx.transactionRef,
      description: tx.description || `${tx.category} - ${tx.serviceRef || 'unknown'}`,
      amount: tx.entryType === 'CREDIT' ? tx.amount.toString() : `-${tx.amount}`,
      type: tx.category,
      service: tx.serviceRef,
      coa_code: null, // TODO: Add CoA mapping
      settlement_status: null, // TODO: Add settlement status
    }));

    return {
      items,
      next_cursor: transactions.nextCursor || null,
      prev_cursor: null,
    };
  }

  @Get('settlements')
  @ApiOperation({ summary: 'List partner settlements (read-only)' })
  async listSettlements(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<unknown> {
    // Get partner account
    const account = await this.accountService.getAccountByOwnerAndType(user.sub, AccountType.PARTNER);
    if (!account) {
      return { items: [], next_cursor: null, prev_cursor: null };
    }

    const settlements = await this.settlementService.listBatches({
      ...(status ? { status: status as any } : {}),
      partnerId: user.sub,
      ...(cursor ? { cursor } : {}),
      limit: limit ? Math.min(limit, 100) : 20,
    });

    // Transform settlements to partner view
    const items = (settlements as any).items?.map((batch: any) => ({
      id: batch.id,
      period_start: batch.period_start?.toISOString().split('T')[0],
      period_end: batch.period_end?.toISOString().split('T')[0],
      total_sales: { amount: '0', currency: 'YER' }, // TODO: Calculate from transactions
      total_commissions: { amount: '0', currency: 'YER' }, // TODO: Calculate from transactions
      net_amount: { amount: batch.total_amount?.toString() || '0', currency: batch.currency || 'YER' },
      status: batch.status,
      bank_reference: null, // TODO: Add bank reference (masked)
      created_at: batch.created_at?.toISOString(),
    })) || [];

    return {
      items,
      next_cursor: (settlements as any).nextCursor || null,
      prev_cursor: null,
    };
  }

  @Get('settlements/:settlement_id')
  @ApiOperation({ summary: 'Get settlement details' })
  async getSettlement(
    @CurrentUser() user: JwtPayload,
    @Param('settlement_id') settlementId: string,
  ): Promise<unknown> {
    // Get partner account
    const account = await this.accountService.getAccountByOwnerAndType(user.sub, AccountType.PARTNER);
    if (!account) {
      throw new Error('Partner account not found');
    }

    const batch = await this.settlementService.getBatch(settlementId);
    if (!batch || (batch as any).partner_id !== user.sub) {
      throw new Error('Settlement not found');
    }

    // Get transactions for this settlement
    const transactions = await this.balanceService.listTransactions(account.id, {
      limit: 1000,
    });

    return {
      id: (batch as any).id,
      period_start: (batch as any).period_start?.toISOString().split('T')[0],
      period_end: (batch as any).period_end?.toISOString().split('T')[0],
      total_sales: { amount: '0', currency: 'YER' }, // TODO: Calculate from transactions
      total_commissions: { amount: '0', currency: 'YER' }, // TODO: Calculate from transactions
      net_amount: { amount: (batch as any).total_amount?.toString() || '0', currency: (batch as any).currency || 'YER' },
      status: (batch as any).status,
      bank_reference: null, // TODO: Add bank reference (masked)
      transactions: transactions.items.map((tx) => ({
        id: tx.id,
        date: tx.createdAt.toISOString(),
        reference: tx.transactionRef,
        description: tx.description || `${tx.category} - ${tx.serviceRef || 'unknown'}`,
        amount: tx.entryType === 'CREDIT' ? tx.amount.toString() : `-${tx.amount}`,
        type: tx.category,
        service: tx.serviceRef,
        coa_code: null, // TODO: Add CoA mapping
        settlement_status: null, // TODO: Add settlement status
      })),
      created_at: (batch as any).created_at?.toISOString(),
    };
  }

  @Post('exports')
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
    // Get partner account
    const account = await this.accountService.getAccountByOwnerAndType(user.sub, AccountType.PARTNER);
    if (!account) {
      throw new Error('Partner account not found');
    }

    const exportResult = await this.exportService.exportStatement({
      accountIds: [account.id],
      dateFrom: new Date(body.period_start),
      dateTo: new Date(body.period_end),
      privacyLevel: 'masked', // Always masked for partners
      userId: user.sub,
      userRole: (user.roles && user.roles.length > 0 && user.roles[0]) ? user.roles[0] : 'partner',
    });

    return {
      export_id: exportResult.exportId,
      status: 'pending',
      download_url: exportResult.signedUrl,
    };
  }
}

