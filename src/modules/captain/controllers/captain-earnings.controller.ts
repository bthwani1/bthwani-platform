import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { CaptainEarningsService } from '../services/captain-earnings.service';
import {
  GetEarningsQueryDto,
  CreatePayoutRequestDto,
} from '../dto/earnings/earnings.dto';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtPayload } from '../../../core/strategies/jwt.strategy';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { IdempotencyGuard } from '../../../core/guards/idempotency.guard';
import { StepUpGuard } from '../../../core/guards/step-up.guard';
import { Roles } from '../../../core/guards/rbac.guard';

@ApiTags('APP-CAPTAIN Earnings')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@Roles('captain')
@ApiBearerAuth()
export class CaptainEarningsController {
  constructor(private readonly earningsService: CaptainEarningsService) {}

  @Get('me/balance')
  @ApiOperation({
    summary: 'Get captain wallet balance',
    operationId: 'captain_wallet_balance',
  })
  async getBalance(@CurrentUser() user: JwtPayload): Promise<{
    available: number;
    pending: number;
    currency: string;
  }> {
    return this.earningsService.getBalance(user.sub);
  }

  @Get('me/earnings')
  @ApiOperation({
    summary: 'Get captain earnings breakdown',
    operationId: 'captain_wallet_earnings',
  })
  async getEarnings(
    @CurrentUser() user: JwtPayload,
    @Query() query: GetEarningsQueryDto,
  ): Promise<{
    period: string;
    service?: string;
    total: number;
    breakdown: unknown[];
  }> {
    return this.earningsService.getEarnings(user.sub, query);
  }

  @Post('payouts')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(IdempotencyGuard, StepUpGuard)
  @ApiOperation({
    summary: 'Create payout request (step-up required)',
    operationId: 'captain_wallet_payouts_create',
  })
  @ApiHeader({ name: 'Idempotency-Key', required: true, description: 'Idempotency key' })
  async createPayoutRequest(
    @CurrentUser() user: JwtPayload,
    @Body() createDto: CreatePayoutRequestDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<{
    payout_id: string;
    amount: number;
    channel: string;
    status: string;
  }> {
    return this.earningsService.createPayoutRequest(user.sub, createDto, idempotencyKey);
  }

  @Get('payouts')
  @ApiOperation({
    summary: 'Get payout history',
    operationId: 'captain_wallet_payouts_list',
  })
  async getPayoutHistory(
    @CurrentUser() user: JwtPayload,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ): Promise<{
    items: unknown[];
    nextCursor?: string;
  }> {
    return this.earningsService.getPayoutHistory(user.sub, { cursor, limit });
  }
}

