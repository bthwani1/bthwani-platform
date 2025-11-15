import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';
import { ConfigService } from '@nestjs/config';
import { BloodType, RhFactor } from '../entities/esf-request.entity';

interface IdentityProfile {
  user_id: string;
  abo_type?: BloodType;
  rh_factor?: RhFactor;
  phone?: string;
}

@Injectable()
export class EsfIdentityAdapter {
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
          'X-Service-Name': 'esf',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        this.logger.error('Failed to fetch identity profile', {
          userId,
          status: response.status,
          statusText: response.statusText,
        });
        return null;
      }

      const data = await response.json();
      return {
        user_id: data.user_id || userId,
        abo_type: data.abo_type as BloodType | undefined,
        rh_factor: data.rh_factor as RhFactor | undefined,
      };
    } catch (error) {
      this.logger.error('Error fetching identity profile', { error, userId });
      return null;
    }
  }
}
