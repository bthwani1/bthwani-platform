import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';
import { LoginDto, VerifyOtpDto } from '../dto/auth/login.dto';
import { CaptainIdentityAdapter } from '../adapters/captain-identity.adapter';
import { IdempotencyService } from '../../wlt/services/idempotency.service';

@Injectable()
export class CaptainAuthService {
  constructor(
    private readonly logger: LoggerService,
    private readonly identityAdapter: CaptainIdentityAdapter,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async requestOtp(phone: string): Promise<{ expires_in: number }> {
    this.logger.log('Captain OTP request', { phone });

    try {
      return await this.identityAdapter.requestOtp(phone);
    } catch (error) {
      this.logger.error('OTP request failed', {
        phone,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async verifyOtp(
    verifyDto: VerifyOtpDto,
    idempotencyKey: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    captain: {
      id: string;
      name?: string;
      phone: string;
      services: string[];
    };
  }> {
    this.logger.log('Captain OTP verification', {
      phone: verifyDto.phone,
      idempotencyKey,
    });

    // Check idempotency
    const existing = await this.idempotencyService.checkIdempotency({
      idempotencyKey,
      operation: 'captain_auth_verify_otp',
      requestBody: { phone: verifyDto.phone, code: verifyDto.code },
    });

    if (existing && existing.response) {
      this.logger.log('Idempotency hit for OTP verification', { idempotencyKey });
      return existing.response as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        captain: {
          id: string;
          name?: string;
          phone: string;
          services: string[];
        };
      };
    }

    try {
      const authResult = await this.identityAdapter.verifyOtp(
        verifyDto.phone,
        verifyDto.code,
      );

      if (!authResult.authenticated) {
        throw new UnauthorizedException({
          type: 'https://errors.bthwani.com/captain/invalid_otp',
          title: 'Invalid OTP',
          status: 401,
          code: 'CAP-OTP-INVALID',
          detail: 'رمز التحقق غير صحيح',
        });
      }

      const profile = await this.identityAdapter.getCaptainProfile(
        authResult.captain_id,
      );

      const response = {
        access_token: authResult.access_token,
        refresh_token: authResult.refresh_token,
        expires_in: 86400, // 24 hours
        captain: {
          id: profile.id,
          name: profile.name,
          phone: profile.phone,
          services: profile.services,
        },
      };

      // Store idempotency
      await this.idempotencyService.storeIdempotency({
        idempotencyKey,
        operation: 'captain_auth_verify_otp',
        requestBody: { phone: verifyDto.phone, code: verifyDto.code },
        response,
        statusCode: 200,
      });

      this.logger.log('Captain OTP verified', {
        captainId: profile.id,
        phone: verifyDto.phone,
      });

      return response;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('OTP verification failed', {
        phone: verifyDto.phone,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async refresh(
    refreshToken: string,
    idempotencyKey: string,
  ): Promise<{
    access_token: string;
    expires_in: number;
  }> {
    this.logger.log('Captain token refresh', { idempotencyKey });

    // Check idempotency
    const existing = await this.idempotencyService.checkIdempotency({
      idempotencyKey,
      operation: 'captain_auth_refresh',
      requestBody: { refresh_token: refreshToken },
    });

    if (existing && existing.response) {
      this.logger.log('Idempotency hit for token refresh', { idempotencyKey });
      return existing.response as {
        access_token: string;
        expires_in: number;
      };
    }

    try {
      const result = await this.identityAdapter.refreshToken(refreshToken);

      // Store idempotency
      await this.idempotencyService.storeIdempotency({
        idempotencyKey,
        operation: 'captain_auth_refresh',
        requestBody: { refresh_token: refreshToken },
        response: result,
        statusCode: 200,
      });

      return result;
    } catch (error) {
      this.logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async logout(captainId: string, idempotencyKey: string): Promise<{ success: boolean }> {
    this.logger.log('Captain logout', { captainId, idempotencyKey });

    // Check idempotency
    const existing = await this.idempotencyService.checkIdempotency({
      idempotencyKey,
      operation: 'captain_auth_logout',
      requestBody: { captain_id: captainId },
    });

    if (existing && existing.response) {
      this.logger.log('Idempotency hit for logout', { idempotencyKey });
      return existing.response as { success: boolean };
    }

    try {
      await this.identityAdapter.logout(captainId);

      const response = { success: true };

      // Store idempotency
      await this.idempotencyService.storeIdempotency({
        idempotencyKey,
        operation: 'captain_auth_logout',
        requestBody: { captain_id: captainId },
        response,
        statusCode: 200,
      });

      return response;
    } catch (error) {
      this.logger.error('Logout failed', {
        captainId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}

