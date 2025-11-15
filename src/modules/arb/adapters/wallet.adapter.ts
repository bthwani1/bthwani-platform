import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { LoggerService } from '../../../core/services/logger.service';

export interface EscrowHoldRequest {
  booking_id: string;
  customer_id: string;
  partner_id: string;
  amount_yer: number;
  currency?: string;
}

export interface EscrowHoldResponse {
  escrow_id: string;
  transaction_id: string;
  status: string;
  amount_yer: number;
  currency: string;
}

export interface EscrowReleaseRequest {
  escrow_id: string;
  transaction_id: string;
  reason_code: string;
  amount_yer?: number;
}

export interface EscrowReleaseResponse {
  escrow_id: string;
  transaction_id: string;
  status: string;
  released_amount_yer: number;
}

export interface EscrowRefundRequest {
  escrow_id: string;
  transaction_id: string;
  reason_code: string;
  amount_yer?: number;
}

export interface EscrowRefundResponse {
  escrow_id: string;
  transaction_id: string;
  status: string;
  refunded_amount_yer: number;
}

export interface EscrowCaptureRequest {
  escrow_id: string;
  transaction_id: string;
  amount_yer?: number;
}

export interface EscrowCaptureResponse {
  escrow_id: string;
  transaction_id: string;
  status: string;
  captured_amount_yer: number;
}

@Injectable()
export class ArbWalletAdapter {
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
    request: EscrowHoldRequest,
    idempotencyKey?: string,
  ): Promise<EscrowHoldResponse> {
    this.logger.log('Creating escrow hold via WLT', {
      bookingId: request.booking_id,
      customerId: request.customer_id,
      amountYer: request.amount_yer,
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Service-Name': 'arb',
      };
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }

      const response = await this.httpClient.post<EscrowHoldResponse>(
        `${this.wltApiUrl}/api/wlt/arb/escrow/hold`,
        {
          booking_id: request.booking_id,
          user_id: request.customer_id,
          partner_id: request.partner_id,
          amount_yer: request.amount_yer,
          currency: request.currency || 'YER',
        },
        { headers },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to create escrow hold',
        error instanceof Error ? error.stack : String(error),
        {
          bookingId: request.booking_id,
          customerId: request.customer_id,
        },
      );
      throw error;
    }
  }

  async releaseEscrow(
    request: EscrowReleaseRequest,
    idempotencyKey?: string,
  ): Promise<EscrowReleaseResponse> {
    this.logger.log('Releasing escrow via WLT', {
      escrowId: request.escrow_id,
      transactionId: request.transaction_id,
      reasonCode: request.reason_code,
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Service-Name': 'arb',
      };
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }

      const response = await this.httpClient.post<EscrowReleaseResponse>(
        `${this.wltApiUrl}/api/wlt/arb/escrow/release`,
        {
          escrow_id: request.escrow_id,
          transaction_id: request.transaction_id,
          reason_code: request.reason_code,
          amount_yer: request.amount_yer,
        },
        { headers },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to release escrow',
        error instanceof Error ? error.stack : String(error),
        {
          escrowId: request.escrow_id,
          transactionId: request.transaction_id,
        },
      );
      throw error;
    }
  }

  async refundEscrow(
    request: EscrowRefundRequest,
    idempotencyKey?: string,
  ): Promise<EscrowRefundResponse> {
    this.logger.log('Refunding escrow via WLT', {
      escrowId: request.escrow_id,
      transactionId: request.transaction_id,
      reasonCode: request.reason_code,
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Service-Name': 'arb',
      };
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }

      const response = await this.httpClient.post<EscrowRefundResponse>(
        `${this.wltApiUrl}/api/wlt/arb/escrow/refund`,
        {
          escrow_id: request.escrow_id,
          transaction_id: request.transaction_id,
          reason_code: request.reason_code,
          amount_yer: request.amount_yer,
        },
        { headers },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to refund escrow',
        error instanceof Error ? error.stack : String(error),
        {
          escrowId: request.escrow_id,
          transactionId: request.transaction_id,
        },
      );
      throw error;
    }
  }

  async captureEscrow(
    request: EscrowCaptureRequest,
    idempotencyKey?: string,
  ): Promise<EscrowCaptureResponse> {
    this.logger.log('Capturing escrow via WLT', {
      escrowId: request.escrow_id,
      transactionId: request.transaction_id,
    });

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Service-Name': 'arb',
      };
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }

      const response = await this.httpClient.post<EscrowCaptureResponse>(
        `${this.wltApiUrl}/api/wlt/arb/escrow/capture`,
        {
          escrow_id: request.escrow_id,
          transaction_id: request.transaction_id,
          amount_yer: request.amount_yer,
        },
        { headers },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to capture escrow',
        error instanceof Error ? error.stack : String(error),
        {
          escrowId: request.escrow_id,
          transactionId: request.transaction_id,
        },
      );
      throw error;
    }
  }
}
