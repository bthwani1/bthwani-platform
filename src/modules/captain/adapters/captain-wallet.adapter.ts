import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../../../core/services/logger.service';

export interface WalletBalance {
  available: number;
  pending: number;
  currency: string;
}

export interface EarningsEntry {
  id: string;
  service: string;
  amount: number;
  currency: string;
  created_at: string;
}

export interface PayoutRequest {
  payout_id: string;
  amount: number;
  channel: string;
  status: string;
  created_at: string;
}

/**
 * Captain Wallet Adapter
 *
 * Adapter for Wallet & Ledger service (read-only + payout requests).
 */
@Injectable()
export class CaptainWalletAdapter {
  private readonly walletBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.walletBaseUrl =
      this.configService.get<string>('WLT_SERVICE_URL') ||
      'http://localhost:3002';
  }

  async getBalance(captainId: string): Promise<WalletBalance> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.walletBaseUrl}/wallet/accounts/${captainId}/balance`),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Wallet adapter: Get balance failed', {
        captainId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getEarnings(
    captainId: string,
    filters: { period?: string; service?: string; cursor?: string; limit?: number },
  ): Promise<{
    items: EarningsEntry[];
    nextCursor?: string;
    total: number;
  }> {
    try {
      const params = new URLSearchParams();
      if (filters.period) params.append('period', filters.period);
      if (filters.service) params.append('service', filters.service);
      if (filters.cursor) params.append('cursor', filters.cursor);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.walletBaseUrl}/wallet/accounts/${captainId}/earnings?${params.toString()}`,
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Wallet adapter: Get earnings failed', {
        captainId,
        filters,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async createPayoutRequest(
    captainId: string,
    amount: number,
    channel: string,
    idempotencyKey: string,
  ): Promise<PayoutRequest> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.walletBaseUrl}/wallet/payouts`,
          {
            account_id: captainId,
            amount,
            channel,
          },
          {
            headers: {
              'idempotency-key': idempotencyKey,
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Wallet adapter: Create payout failed', {
        captainId,
        amount,
        channel,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getPayoutHistory(
    captainId: string,
    filters: { cursor?: string; limit?: number },
  ): Promise<{
    items: PayoutRequest[];
    nextCursor?: string;
  }> {
    try {
      const params = new URLSearchParams();
      params.append('account_id', captainId);
      if (filters.cursor) params.append('cursor', filters.cursor);
      if (filters.limit) params.append('limit', filters.limit.toString());

      const response = await firstValueFrom(
        this.httpService.get(
          `${this.walletBaseUrl}/wallet/payouts?${params.toString()}`,
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Wallet adapter: Get payout history failed', {
        captainId,
        filters,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

