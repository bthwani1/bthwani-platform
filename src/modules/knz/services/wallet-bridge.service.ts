import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { LoggerService } from '../../../core/services/logger.service';
import { CreateEscrowHoldDto } from '../dto/bridge/escrow-hold.dto';
import { ReleaseEscrowDto } from '../dto/bridge/escrow-release.dto';
import { ForfeitEscrowDto } from '../dto/bridge/escrow-forfeit.dto';
import { CreateRefundDto } from '../dto/bridge/create-refund.dto';

export interface EscrowHoldResponse {
  escrow_id: string;
  status: string;
  amount_yer: number;
  currency: string;
}

export interface EscrowReleaseResponse {
  escrow_id: string;
  status: string;
  released_amount_yer: number;
}

export interface EscrowForfeitResponse {
  escrow_id: string;
  status: string;
  forfeited_amount_yer: number;
  refunded_amount_yer: number;
}

export interface RefundResponse {
  refund_id: string;
  status: string;
  amount_yer: number;
  created_at: Date;
}

export interface WalletBalanceResponse {
  available_yer: number;
  frozen_yer: number;
  total_yer: number;
}

@Injectable()
export class WalletBridgeService {
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

  async createEscrowHold(
    dto: CreateEscrowHoldDto,
    idempotencyKey?: string,
  ): Promise<EscrowHoldResponse> {
    this.logger.log('Creating escrow hold via WLT', {
      orderId: dto.order_id,
      userId: dto.user_id,
      amountYer: dto.amount_yer,
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }

      const response = await this.httpClient.post<EscrowHoldResponse>(
        `${this.wltApiUrl}/api/wlt/knz/escrow/hold`,
        dto,
        { headers },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to create escrow hold',
        error instanceof Error ? error.stack : String(error),
        {
          orderId: dto.order_id,
          userId: dto.user_id,
        },
      );
      throw error;
    }
  }

  async releaseEscrow(
    dto: ReleaseEscrowDto,
    idempotencyKey?: string,
  ): Promise<EscrowReleaseResponse> {
    this.logger.log('Releasing escrow via WLT', {
      escrowId: dto.escrow_id,
      reasonCode: dto.reason_code,
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }

      const response = await this.httpClient.post<EscrowReleaseResponse>(
        `${this.wltApiUrl}/api/wlt/knz/escrow/release`,
        dto,
        { headers },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to release escrow',
        error instanceof Error ? error.stack : String(error),
        {
          escrowId: dto.escrow_id,
        },
      );
      throw error;
    }
  }

  async forfeitEscrow(
    dto: ForfeitEscrowDto,
    idempotencyKey?: string,
  ): Promise<EscrowForfeitResponse> {
    this.logger.log('Forfeiting escrow via WLT', {
      escrowId: dto.escrow_id,
      forfeitPct: dto.forfeit_pct,
      reasonCode: dto.reason_code,
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }

      const response = await this.httpClient.post<EscrowForfeitResponse>(
        `${this.wltApiUrl}/api/wlt/knz/escrow/forfeit`,
        dto,
        { headers },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to forfeit escrow',
        error instanceof Error ? error.stack : String(error),
        {
          escrowId: dto.escrow_id,
        },
      );
      throw error;
    }
  }

  async getEscrow(escrowId: string): Promise<unknown> {
    try {
      const response = await this.httpClient.get(
        `${this.wltApiUrl}/api/wlt/knz/escrow/${escrowId}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to get escrow',
        error instanceof Error ? error.stack : String(error),
        {
          escrowId,
        },
      );
      throw error;
    }
  }

  async listEscrows(options?: {
    user_id?: string;
    status?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{ items: unknown[]; next_cursor?: string }> {
    try {
      const params = new URLSearchParams();
      if (options?.user_id) params.append('user_id', options.user_id);
      if (options?.status) params.append('status', options.status);
      if (options?.cursor) params.append('cursor', options.cursor);
      if (options?.limit) params.append('limit', options.limit.toString());

      const response = await this.httpClient.get<{ items: unknown[]; next_cursor?: string }>(
        `${this.wltApiUrl}/api/wlt/knz/escrow?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to list escrows',
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async getWalletBalance(userId: string): Promise<WalletBalanceResponse> {
    try {
      const response = await this.httpClient.get<WalletBalanceResponse>(
        `${this.wltApiUrl}/api/wlt/knz/wallets/${userId}/balance`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to get wallet balance',
        error instanceof Error ? error.stack : String(error),
        {
          userId,
        },
      );
      throw error;
    }
  }

  async createRefund(dto: CreateRefundDto, idempotencyKey?: string): Promise<RefundResponse> {
    this.logger.log('Creating refund via WLT', {
      orderId: dto.order_id,
      userId: dto.user_id,
      amountYer: dto.amount_yer,
      reasonCode: dto.reason_code,
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }

      const response = await this.httpClient.post<RefundResponse>(
        `${this.wltApiUrl}/api/wlt/knz/refunds`,
        dto,
        {
          headers,
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to create refund',
        error instanceof Error ? error.stack : String(error),
        {
          orderId: dto.order_id,
          userId: dto.user_id,
        },
      );
      throw error;
    }
  }
}
