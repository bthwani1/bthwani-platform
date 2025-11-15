import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../../../core/services/logger.service';

interface ListPartnersOptions {
  cursor?: string;
  limit?: number;
  status?: string;
  search?: string;
}

/**
 * Field Partner Onboarding Adapter
 *
 * Adapter for Partner Onboarding Core service.
 */
@Injectable()
export class FieldPartnerOnboardingAdapter {
  private readonly partnerOnboardingBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.partnerOnboardingBaseUrl =
      this.configService.get<string>('PARTNER_ONBOARDING_SERVICE_URL') ||
      'http://localhost:3003';
  }

  async createPartnerLead(
    data: {
      legal_name: string;
      trade_name: string;
      category: string;
      address: string;
      latitude: number;
      longitude: number;
      contacts: Array<{
        name: string;
        phone: string;
        email?: string;
        role?: string;
      }>;
      notes?: string;
    },
    agentId: string,
    idempotencyKey: string,
  ): Promise<{ id: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.partnerOnboardingBaseUrl}/partner/leads`,
          {
            ...data,
            created_by: agentId,
          },
          {
            headers: { 'idempotency-key': idempotencyKey },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Partner onboarding adapter: Create lead failed', error instanceof Error ? error.message : 'Unknown error', {
        agentId,
      });
      throw error;
    }
  }

  async updatePartnerLead(
    partnerId: string,
    data: Record<string, unknown>,
    agentId: string,
    idempotencyKey: string,
  ): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(
          `${this.partnerOnboardingBaseUrl}/partner/leads/${partnerId}`,
          {
            ...data,
            updated_by: agentId,
          },
          {
            headers: { 'idempotency-key': idempotencyKey },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Partner onboarding adapter: Update lead failed', error instanceof Error ? error.message : 'Unknown error', {
        partnerId,
        agentId,
      });
      throw error;
    }
  }

  async submitSiteSurvey(
    partnerId: string,
    data: {
      verified_address: string;
      latitude: number;
      longitude: number;
      accuracy_meters?: number;
      facility_basics?: string;
      photo_media_ids?: string[];
      notes?: string;
    },
    agentId: string,
    idempotencyKey: string,
  ): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.partnerOnboardingBaseUrl}/partner/${partnerId}/site-survey`,
          {
            ...data,
            submitted_by: agentId,
          },
          {
            headers: { 'idempotency-key': idempotencyKey },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Partner onboarding adapter: Submit site survey failed', error instanceof Error ? error.message : 'Unknown error', {
        partnerId,
        agentId,
      });
      throw error;
    }
  }

  async submitKycDocs(
    partnerId: string,
    documents: Array<{
      type: string;
      media_id: string;
      document_number?: string;
      expiry_date?: string;
    }>,
    agentId: string,
    idempotencyKey: string,
  ): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.partnerOnboardingBaseUrl}/partner/${partnerId}/kyc-docs`,
          {
            documents,
            submitted_by: agentId,
          },
          {
            headers: { 'idempotency-key': idempotencyKey },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Partner onboarding adapter: Submit KYC docs failed', error instanceof Error ? error.message : 'Unknown error', {
        partnerId,
        agentId,
      });
      throw error;
    }
  }

  async submitConsent(
    partnerId: string,
    data: {
      consent_given: boolean;
      signature_media_id?: string;
      terms_version?: string;
    },
    agentId: string,
    idempotencyKey: string,
  ): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.partnerOnboardingBaseUrl}/partner/${partnerId}/consent`,
          {
            ...data,
            submitted_by: agentId,
          },
          {
            headers: { 'idempotency-key': idempotencyKey },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Partner onboarding adapter: Submit consent failed', error instanceof Error ? error.message : 'Unknown error', {
        partnerId,
        agentId,
      });
      throw error;
    }
  }

  async submitReadiness(
    partnerId: string,
    data: {
      checks: Array<{
        item_id: string;
        passed: boolean;
        notes?: string;
      }>;
      status: 'ready' | 'needs_followup';
      followup_notes?: string;
    },
    agentId: string,
    idempotencyKey: string,
  ): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.partnerOnboardingBaseUrl}/partner/${partnerId}/readiness`,
          {
            ...data,
            submitted_by: agentId,
          },
          {
            headers: { 'idempotency-key': idempotencyKey },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Partner onboarding adapter: Submit readiness failed', error instanceof Error ? error.message : 'Unknown error', {
        partnerId,
        agentId,
      });
      throw error;
    }
  }

  async listPartners(agentId: string, options: ListPartnersOptions): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.partnerOnboardingBaseUrl}/partner`, {
          params: {
            agent_id: agentId,
            ...options,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Partner onboarding adapter: List partners failed', error instanceof Error ? error.message : 'Unknown error', {
        agentId,
      });
      throw error;
    }
  }

  async getPartner(partnerId: string, agentId: string): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.partnerOnboardingBaseUrl}/partner/${partnerId}`,
          {
            params: { agent_id: agentId },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Partner onboarding adapter: Get partner failed', error instanceof Error ? error.message : 'Unknown error', {
        partnerId,
        agentId,
      });
      return null;
    }
  }

  async createUnplannedVisit(
    partnerId: string,
    data: { agent_id: string; purpose: string; notes?: string },
    idempotencyKey: string,
  ): Promise<unknown> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.partnerOnboardingBaseUrl}/partner/${partnerId}/visits`,
          data,
          {
            headers: { 'idempotency-key': idempotencyKey },
          },
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Partner onboarding adapter: Create unplanned visit failed', error instanceof Error ? error.message : 'Unknown error', {
        partnerId,
      });
      throw error;
    }
  }
}

