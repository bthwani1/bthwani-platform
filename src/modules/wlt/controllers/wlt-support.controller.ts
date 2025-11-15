import { Controller, Get, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BalanceService } from '../services/balance.service';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';

@ApiTags('WLT Support')
@Controller('wallet/support')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WltSupportController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get('accounts/:account_id/snapshot')
  @ApiOperation({ summary: 'Masked snapshot for support diagnostics' })
  @ApiResponse({ status: 200, description: 'Snapshot retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getAccountSnapshot(
    @Param('account_id') accountId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    const balance = await this.balanceService.getBalance(accountId);
    const transactions = await this.balanceService.listTransactions(accountId, {
      limit: 20,
    });

    return {
      account_id: this.maskId(accountId),
      balance: {
        ...balance,
        account_id: this.maskId(balance.accountId),
      },
      recent_transactions: transactions.items.map((tx) => ({
        ...tx,
        id: this.maskId(tx.id),
        transaction_ref: this.maskId(tx.transactionRef),
      })),
    };
  }

  private maskId(id: string): string {
    if (!id || id.length < 8) {
      return '****';
    }
    return `${id.substring(0, 4)}****${id.substring(id.length - 4)}`;
  }
}
