import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { LoggerService } from '../../../../core/services/logger.service';
import { ThwaniRequestEntity } from '../entities/thwani-request.entity';

export interface LedgerEntryRequest {
  request_id: string;
  requester_id: string;
  assigned_id?: string;
  amount_yer: number;
  currency?: string;
  entry_type: string;
}

export interface LedgerEntryResponse {
  transaction_id: string;
  entry_id: string;
  status: string;
  amount_yer: number;
}

/**
 * Thwani Wallet Adapter
 *
 * Integrates with WLT service for ledger entries only.
 * Wallet=Ledger constraint: no bank payouts, ledger entries only.
 */
@Injectable()
export class ThwaniWalletAdapter {
  private readonly wltApiUrl: string;
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.wltApiUrl = this.configService.get<string>('WLT_API_URL', 'http://localhost:3001');
    this.httpClient = axios.create({
      baseURL: this.wltApiUrl,
      timeout: 30000,
    });
  }

  async createLedgerEntry(
    request: ThwaniRequestEntity,
    amountYer: number,
    idempotencyKey?: string,
  ): Promise<LedgerEntryResponse> {
    this.logger.log('Creating ledger entry via WLT (Wallet=Ledger constraint)', {
      requestId: request.id,
      requesterId: request.requester_id,
      amountYer,
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Service-Name': 'dsh-thwani',
      };
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }

      const payload: LedgerEntryRequest = {
        request_id: request.id,
        requester_id: request.requester_id,
        amount_yer: amountYer,
        currency: 'YER',
        entry_type: 'thwani_instant_completion',
      };

      if (request.assigned_captain_id) {
        payload.assigned_id = request.assigned_captain_id;
      }

      // Wallet=Ledger constraint: ledger entries only, no bank payouts
      const response = await this.httpClient.post<LedgerEntryResponse>(
        `${this.wltApiUrl}/api/wlt/dsh/thwani/ledger/entry`,
        payload,
        { headers },
      );

      // Update request with ledger transaction ID
      request.ledger_transaction_id = response.data.transaction_id;
      request.ledger_entry_type = payload.entry_type;

      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to create ledger entry',
        error instanceof Error ? error.stack : String(error),
        {
          requestId: request.id,
          amountYer,
        },
      );
      throw error;
    }
  }
}

