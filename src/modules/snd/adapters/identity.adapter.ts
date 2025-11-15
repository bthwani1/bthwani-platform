import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { LoggerService } from '../../../core/services/logger.service';

export interface MaskedContact {
  user_id: string;
  phone_masked: string;
  name_masked?: string;
}

@Injectable()
export class SndIdentityAdapter {
  private readonly identityApiUrl: string;
  private readonly httpClient: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.identityApiUrl = this.configService.get<string>(
      'IDENTITY_API_URL',
      'http://localhost:3003',
    );
    this.httpClient = axios.create({
      baseURL: this.identityApiUrl,
      timeout: 30000,
    });
  }

  async getMaskedContact(userId: string): Promise<MaskedContact | null> {
    try {
      const response = await this.httpClient.get<MaskedContact>(
        `${this.identityApiUrl}/api/identity/users/${userId}/masked`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to get masked contact',
        error instanceof Error ? error.stack : String(error),
        { userId },
      );
      return null;
    }
  }

  maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return '***';
    return `${phone.substring(0, 2)}***${phone.substring(phone.length - 2)}`;
  }
}
