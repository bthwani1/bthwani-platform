import { Controller, Get, Param, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BalanceService } from '../services/balance.service';
import { GetBalanceDto } from '../dto/get-balance.dto';
import { ListTransactionsDto } from '../dto/list-transactions.dto';
import { EntryCategory } from '../entities/journal-entry.entity';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';

@ApiTags('Wallet Accounts')
@Controller('wallet/accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WltAccountsController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get(':account_id/balance')
  @ApiOperation({ summary: 'Get current balance for a specific wallet account' })
  @ApiResponse({ status: 200, description: 'Balance retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async getBalance(
    @Param() params: GetBalanceDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<unknown> {
    return this.balanceService.getBalance(params.account_id);
  }

  @Get(':account_id/transactions')
  @ApiOperation({ summary: 'List ledger transactions (cursor pagination)' })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async listTransactions(
    @Param() params: GetBalanceDto,
    @CurrentUser() user: JwtPayload,
    @Query() query: Omit<ListTransactionsDto, 'account_id'>,
  ): Promise<unknown> {
    const options: {
      cursor?: string;
      limit?: number;
      category?: EntryCategory;
      serviceRef?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {};
    if (query.cursor !== undefined) {
      options.cursor = query.cursor;
    }
    if (query.limit !== undefined) {
      options.limit = query.limit;
    }
    if (query.category !== undefined) {
      options.category = query.category;
    }
    if (query.service_ref !== undefined) {
      options.serviceRef = query.service_ref;
    }
    if (query.date_from !== undefined) {
      options.dateFrom = new Date(query.date_from);
    }
    if (query.date_to !== undefined) {
      options.dateTo = new Date(query.date_to);
    }
    return this.balanceService.listTransactions(params.account_id, options);
  }
}
