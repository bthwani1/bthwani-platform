import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';
import { ConfigService } from '@nestjs/config';

export interface IdentityProfile {
  user_id: string;
  phone?: string;
  email?: string;
  name_ar?: string;
  name_en?: string;
}

export interface MaskedContact {
  masked_phone?: string;
  masked_email?: string;
  display_name?: string;
}

@Injectable()
export class ArbIdentityAdapter {
  constructor(
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {}

  async getProfile(userId: string): Promise<IdentityProfile | null> {
    const identityUrl = this.configService.get<string>('IDENTITY_SERVICE_URL');
    if (!identityUrl) {
      this.logger.warn('Identity service URL not configured', { userId });
      return null;
    }

    try {
      const response = await fetch(`${identityUrl}/api/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Name': 'arb',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        this.logger.error(
          `Failed to fetch identity profile: ${response.status} ${response.statusText} (userId: ${userId})`,
        );
        return null;
      }

      const data = await response.json();
      return {
        user_id: data.user_id || userId,
        phone: data.phone,
        email: data.email,
        name_ar: data.name_ar,
        name_en: data.name_en,
      };
    } catch (error) {
      this.logger.error(`Error fetching identity profile: ${error} (userId: ${userId})`);
      return null;
    }
  }

  async getMaskedContact(userId: string): Promise<MaskedContact | null> {
    const profile = await this.getProfile(userId);
    if (!profile) {
      return null;
    }

    const result: MaskedContact = {
      display_name: profile.name_ar || profile.name_en || 'User',
    };
    if (profile.phone) {
      result.masked_phone = this.maskPhone(profile.phone);
    }
    if (profile.email) {
      result.masked_email = this.maskEmail(profile.email);
    }
    return result;
  }

  private maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return '***';
    return `${phone.substring(0, 2)}***${phone.substring(phone.length - 2)}`;
  }

  private maskEmail(email: string): string {
    if (!email) return '***';
    const [local, domain] = email.split('@');
    if (!local || !domain) return '***';
    const maskedLocal =
      local.length > 2 ? `${local.substring(0, 2)}***${local.substring(local.length - 1)}` : '***';
    return `${maskedLocal}@${domain}`;
  }
}
