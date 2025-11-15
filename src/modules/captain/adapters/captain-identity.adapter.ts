import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Captain Identity Adapter
 *
 * Adapter for Identity & Captain Registry service.
 */
@Injectable()
export class CaptainIdentityAdapter {
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

  async requestOtp(phone: string): Promise<{ expires_in: number }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.identityBaseUrl}/auth/captain/otp`, {
          phone,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Identity adapter: OTP request failed', {
        phone,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async verifyOtp(
    phone: string,
    otp: string,
  ): Promise<{
    authenticated: boolean;
    captain_id: string;
    access_token: string;
    refresh_token: string;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.identityBaseUrl}/auth/captain/verify`, {
          phone,
          otp,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Identity adapter: OTP verification failed', {
        phone,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getCaptainProfile(captainId: string): Promise<{
    id: string;
    name?: string;
    phone: string;
    city?: string;
    services: string[];
    amn_eligible: boolean;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.identityBaseUrl}/api/identity/captains/${captainId}`),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Identity adapter: Get captain profile failed', {
        captainId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getCaptainEligibility(captainId: string): Promise<{
    dsh: { eligible: boolean; status: string };
    amn: { eligible: boolean; status: string; reason?: string };
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.identityBaseUrl}/api/identity/captains/${captainId}/eligibility`,
        ),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Identity adapter: Get eligibility failed', {
        captainId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.identityBaseUrl}/auth/captain/refresh`, {
          refresh_token: refreshToken,
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error('Identity adapter: Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async logout(captainId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.identityBaseUrl}/auth/captain/logout`,
          { captain_id: captainId },
        ),
      );
    } catch (error) {
      this.logger.error('Identity adapter: Logout failed', {
        captainId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

