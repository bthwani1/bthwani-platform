import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Field Identity Adapter
 *
 * Adapter for Identity & HR/Agent Registry service.
 */
@Injectable()
export class FieldIdentityAdapter {
  private readonly identityBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.identityBaseUrl =
      this.configService.get<string>('IDENTITY_SERVICE_URL') ||
      'http://localhost:3001';
  }

  async requestOtp(identifier: string): Promise<{ expires_in: number }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.identityBaseUrl}/auth/field/otp`, {
          identifier,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Identity adapter: OTP request failed', error instanceof Error ? error.message : 'Unknown error', {
        identifier,
      });
      throw error;
    }
  }

  async verifyOtp(
    identifier: string,
    otp: string,
  ): Promise<{ authenticated: boolean; agent_id: string; access_token: string; refresh_token: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.identityBaseUrl}/auth/field/verify`, {
          identifier,
          otp,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Identity adapter: OTP verification failed', error instanceof Error ? error.message : 'Unknown error', {
        identifier,
      });
      throw error;
    }
  }

  async getAgentProfile(agentId: string): Promise<{
    id: string;
    name: string;
    phone: string;
    role: string;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.identityBaseUrl}/agents/${agentId}`),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Identity adapter: Get profile failed', error instanceof Error ? error.message : 'Unknown error', {
        agentId,
      });
      throw error;
    }
  }

  async markTutorialComplete(
    agentId: string,
    idempotencyKey?: string,
  ): Promise<void> {
    try {
      const headers: Record<string, string> = {};
      if (idempotencyKey) {
        headers['idempotency-key'] = idempotencyKey;
      }

      await firstValueFrom(
        this.httpService.post(
          `${this.identityBaseUrl}/agents/${agentId}/tutorial/complete`,
          {},
          { headers },
        ),
      );
    } catch (error) {
      this.logger.error('Identity adapter: Mark tutorial complete failed', error instanceof Error ? error.message : 'Unknown error', {
        agentId,
      });
      throw error;
    }
  }
}

