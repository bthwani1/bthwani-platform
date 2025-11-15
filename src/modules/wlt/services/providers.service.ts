import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigService as WltConfigService } from './config.service';
import { LedgerEngine } from './ledger-engine.service';
import { EntryType, EntryCategory } from '../entities/journal-entry.entity';
import { LoggerService } from '../../../core/services/logger.service';
import { AuditLoggerService } from './audit-logger.service';
import axios, { AxiosInstance } from 'axios';

export interface ProviderChargeRequest {
  accountId: string;
  amount: number;
  currency?: string;
  providerCode: string;
  providerPayload?: Record<string, unknown>;
  serviceRef?: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderWebhookPayload {
  event: string;
  signature: string;
  issued_at: string;
  data: Record<string, unknown>;
}

@Injectable()
export class ProvidersService {
  private readonly httpClient: AxiosInstance;
  private readonly primaryProvider: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly wltConfigService: WltConfigService,
    private readonly ledgerEngine: LedgerEngine,
    private readonly logger: LoggerService,
    private readonly auditLogger: AuditLoggerService,
  ) {
    this.httpClient = axios.create({
      timeout: 30000,
    });
    this.primaryProvider = this.configService.get<string>(
      'VAR_WLT_PROVIDER_PRIMARY',
      'kuraimi_epay',
    );
  }

  async charge(request: ProviderChargeRequest): Promise<Record<string, unknown>> {
    const {
      accountId,
      amount,
      currency = 'YER',
      providerCode,
      providerPayload,
      serviceRef,
      metadata,
    } = request;

    if (amount <= 0) {
      throw new BadRequestException('Charge amount must be positive');
    }

    const provider = providerCode || this.primaryProvider;

    this.logger.log('Charging via provider', {
      accountId,
      amount,
      provider,
      serviceRef,
    });

    try {
      const providerResponse = await this.callProvider(provider, 'charge', {
        account_id: accountId,
        amount,
        currency,
        ...providerPayload,
      });

      const transactionRef = `charge_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const chargeMetadata: Record<string, unknown> = {
        provider,
        provider_response: providerResponse,
      };
      if (metadata !== undefined) {
        Object.assign(chargeMetadata, metadata);
      }

      const entry: {
        accountId: string;
        entryType: EntryType;
        category: EntryCategory;
        amount: number;
        currency?: string;
        serviceRef?: string;
        description?: string;
        metadata?: Record<string, unknown>;
      } = {
        accountId,
        entryType: EntryType.CREDIT,
        category: EntryCategory.CHARGE,
        amount,
        description: `Charge via ${provider}`,
        metadata: chargeMetadata,
      };
      if (currency !== undefined) {
        entry.currency = currency;
      }
      if (serviceRef !== undefined) {
        entry.serviceRef = serviceRef;
      }

      await this.ledgerEngine.post({
        transactionRef,
        entries: [entry],
      });

      const auditParams: {
        transactionRef: string;
        accountId: string;
        amount: number;
        provider: string;
        serviceRef?: string;
      } = {
        transactionRef,
        accountId,
        amount,
        provider,
      };
      if (serviceRef !== undefined) {
        auditParams.serviceRef = serviceRef;
      }
      await this.auditLogger.logProviderCharge(auditParams);

      this.logger.log('Provider charge completed', {
        transactionRef,
        accountId,
        amount,
        provider,
      });

      return {
        transaction_ref: transactionRef,
        status: 'succeeded',
        amount,
        currency,
        provider_response: providerResponse,
      };
    } catch (error) {
      this.logger.error(
        'Provider charge failed',
        error instanceof Error ? error.stack : String(error),
        {
          accountId,
          amount,
          provider,
        },
      );
      throw error;
    }
  }

  async handleWebhook(providerCode: string, payload: ProviderWebhookPayload): Promise<void> {
    const { event, signature, issued_at, data } = payload;

    const isValid = await this.verifyWebhookSignature(providerCode, payload);
    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const issuedAt = new Date(issued_at);
    const now = new Date();
    const replayWindow =
      this.configService.get<number>('VAR_WEBHOOK_REPLAY_WINDOW_SEC', 300) * 1000;

    if (now.getTime() - issuedAt.getTime() > replayWindow) {
      throw new BadRequestException('Webhook replay window exceeded');
    }

    this.logger.log('Processing provider webhook', {
      provider: providerCode,
      event,
      issued_at,
    });

    switch (event) {
      case 'refund.succeeded':
      case 'refund.failed':
      case 'chargeback.opened':
      case 'chargeback.closed':
        await this.processWebhookEvent(providerCode, event, data);
        break;
      default:
        this.logger.warn('Unknown webhook event', { provider: providerCode, event });
    }
  }

  private async callProvider(
    provider: string,
    operation: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const baseUrl = this.configService.get<string>(`VAR_${provider.toUpperCase()}_API_URL`);
    if (!baseUrl) {
      throw new BadRequestException(`Provider ${provider} is not configured`);
    }

    const response = await this.httpClient.post(`${baseUrl}/${operation}`, payload, {
      headers: {
        Authorization: `Bearer ${this.configService.get<string>(`VAR_${provider.toUpperCase()}_API_KEY`)}`,
      },
    });

    return response.data;
  }

  private async verifyWebhookSignature(
    providerCode: string,
    payload: ProviderWebhookPayload,
  ): Promise<boolean> {
    const secret = this.configService.get<string>(
      `VAR_${providerCode.toUpperCase()}_WEBHOOK_SECRET`,
    );
    if (!secret) {
      return false;
    }

    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload.data))
      .digest('hex');

    return expectedSignature === payload.signature;
  }

  private async processWebhookEvent(
    providerCode: string,
    event: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    this.logger.log('Processing webhook event', {
      provider: providerCode,
      event,
      data,
    });

    if (event === 'refund.succeeded' && data.transaction_ref) {
      const transactionRef = `refund_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const amount = data.amount as number;
      const accountId = data.account_id as string;

      const refundMetadata: Record<string, unknown> = {
        provider: providerCode,
        provider_event: event,
      };
      Object.assign(refundMetadata, data);

      const refundEntry: {
        accountId: string;
        entryType: EntryType;
        category: EntryCategory;
        amount: number;
        currency?: string;
        serviceRef?: string;
        description?: string;
        metadata?: Record<string, unknown>;
      } = {
        accountId,
        entryType: EntryType.DEBIT,
        category: EntryCategory.REFUND,
        amount,
        description: `Refund via ${providerCode}`,
        metadata: refundMetadata,
      };
      if (data.currency !== undefined) {
        refundEntry.currency = data.currency as string;
      } else {
        refundEntry.currency = 'YER';
      }
      if (data.service_ref !== undefined) {
        refundEntry.serviceRef = data.service_ref as string;
      }

      await this.ledgerEngine.post({
        transactionRef,
        entries: [refundEntry],
      });

      await this.auditLogger.logProviderRefund({
        transactionRef,
        accountId,
        amount,
        provider: providerCode,
      });
    }
  }
}
