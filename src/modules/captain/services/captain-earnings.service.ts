import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';
import {
  GetEarningsQueryDto,
  CreatePayoutRequestDto,
} from '../dto/earnings/earnings.dto';
import { CaptainWalletAdapter } from '../adapters/captain-wallet.adapter';
import { IdempotencyService } from '../../wlt/services/idempotency.service';

@Injectable()
export class CaptainEarningsService {
  constructor(
    private readonly logger: LoggerService,
    private readonly walletAdapter: CaptainWalletAdapter,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async getBalance(captainId: string): Promise<{
    available: number;
    pending: number;
    currency: string;
  }> {
    this.logger.log('Get captain balance', { captainId });

    try {
      return await this.walletAdapter.getBalance(captainId);
    } catch (error) {
      this.logger.error('Get balance failed', {
        captainId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getEarnings(
    captainId: string,
    query: GetEarningsQueryDto,
  ): Promise<{
    period: string;
    service?: string;
    total: number;
    breakdown: unknown[];
    nextCursor?: string;
  }> {
    this.logger.log('Get captain earnings', { captainId, query });

    try {
      const result = await this.walletAdapter.getEarnings(captainId, {
        period: query.period,
        service: query.service,
        cursor: undefined, // TODO: Add cursor support
        limit: 100,
      });

      return {
        period: query.period || 'week',
        service: query.service,
        total: result.total,
        breakdown: result.items,
        nextCursor: result.nextCursor,
      };
    } catch (error) {
      this.logger.error('Get earnings failed', {
        captainId,
        query,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async createPayoutRequest(
    captainId: string,
    createDto: CreatePayoutRequestDto,
    idempotencyKey: string,
  ): Promise<{
    payout_id: string;
    amount: number;
    channel: string;
    status: string;
  }> {
    this.logger.log('Create payout request', {
      captainId,
      amount: createDto.amount,
      channel: createDto.channel,
      idempotencyKey,
    });

    // Check idempotency
    const existing = await this.idempotencyService.checkIdempotency({
      idempotencyKey,
      operation: 'captain_wallet_payouts_create',
      requestBody: {
        captain_id: captainId,
        amount: createDto.amount,
        channel: createDto.channel,
      },
    });

    if (existing && existing.response) {
      this.logger.log('Idempotency hit for payout request', { idempotencyKey });
      return existing.response as {
        payout_id: string;
        amount: number;
        channel: string;
        status: string;
      };
    }

    // Validate amount (min/max constraints)
    if (createDto.amount < 1000) {
      throw new UnprocessableEntityException({
        type: 'https://errors.bthwani.com/captain/payout_limit',
        title: 'Payout Amount Out of Limits',
        status: 422,
        code: 'CAP-PAYOUT-LIMIT',
        detail: 'المبلغ المطلوب يخالف الحدود',
      });
    }

    // Check available balance
    const balance = await this.walletAdapter.getBalance(captainId);
    if (createDto.amount > balance.available) {
      throw new UnprocessableEntityException({
        type: 'https://errors.bthwani.com/captain/payout_limit',
        title: 'Payout Amount Out of Limits',
        status: 422,
        code: 'CAP-PAYOUT-LIMIT',
        detail: 'المبلغ المطلوب يخالف الحدود',
      });
    }

    try {
      const payout = await this.walletAdapter.createPayoutRequest(
        captainId,
        createDto.amount,
        createDto.channel,
        idempotencyKey,
      );

      // Store idempotency
      await this.idempotencyService.storeIdempotency({
        idempotencyKey,
        operation: 'captain_wallet_payouts_create',
        requestBody: {
          captain_id: captainId,
          amount: createDto.amount,
          channel: createDto.channel,
        },
        response: payout,
        statusCode: 201,
      });

      return {
        payout_id: payout.payout_id,
        amount: payout.amount,
        channel: payout.channel,
        status: payout.status,
      };
    } catch (error) {
      this.logger.error('Create payout failed', {
        captainId,
        amount: createDto.amount,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getPayoutHistory(
    captainId: string,
    filters: { cursor?: string; limit?: number },
  ): Promise<{
    items: unknown[];
    nextCursor?: string;
  }> {
    this.logger.log('Get payout history', { captainId, filters });

    try {
      return await this.walletAdapter.getPayoutHistory(captainId, filters);
    } catch (error) {
      this.logger.error('Get payout history failed', {
        captainId,
        filters,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

