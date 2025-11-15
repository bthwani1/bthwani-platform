import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface PartnerLoginRequest {
  phone: string;
  otp: string;
}

export interface PartnerLoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  partner: {
    id: string;
    name?: string;
    store_name?: string;
    status: string;
    roles: string[];
  };
}

export interface PartnerRefreshRequest {
  refresh_token: string;
}

@Injectable()
export class PartnerAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async login(request: PartnerLoginRequest): Promise<PartnerLoginResponse> {
    const { phone, otp } = request;

    // TODO: Verify OTP with Identity service
    // For now, accept any OTP in dev mode
    if (!otp || otp.length < 4) {
      throw new BadRequestException('Invalid OTP');
    }

    // TODO: Fetch partner from Identity/Partner repository
    const partnerId = `partner_${phone}`;
    const partner = {
      id: partnerId,
      name: 'Partner Name',
      store_name: 'Store Name',
      status: 'approved',
      roles: ['partner', 'owner'], // TODO: Fetch from partner entity
    };

    const payload = {
      sub: partnerId,
      phone,
      roles: partner.roles,
      type: 'partner',
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });

    const refreshToken = this.jwtService.sign(
      { sub: partnerId, type: 'refresh' },
      {
        expiresIn: '7d',
      },
    );

    this.logger.log('Partner login successful', { partnerId, phone });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 86400, // 24 hours
      partner,
    };
  }

  async refresh(request: PartnerRefreshRequest): Promise<PartnerLoginResponse> {
    const { refresh_token } = request;

    try {
      const payload = this.jwtService.verify(refresh_token);
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // TODO: Fetch partner from Identity/Partner repository
      const partnerId = payload.sub;
      const partner = {
        id: partnerId,
        name: 'Partner Name',
        store_name: 'Store Name',
        status: 'approved',
        roles: ['partner', 'owner'], // TODO: Fetch from partner entity
      };

      const newPayload = {
        sub: partnerId,
        roles: partner.roles,
        type: 'partner',
      };

      const accessToken = this.jwtService.sign(newPayload, {
        expiresIn: '24h',
      });

      const newRefreshToken = this.jwtService.sign(
        { sub: partnerId, type: 'refresh' },
        {
          expiresIn: '7d',
        },
      );

      this.logger.log('Partner token refreshed', { partnerId });

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        expires_in: 86400,
        partner,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(partnerId: string): Promise<{
    id: string;
    name?: string;
    store_name?: string;
    status: string;
    services: string[];
    branches?: Array<{ id: string; name: string; address?: string }>;
  }> {
    // TODO: Fetch from partner entity/repository
    return {
      id: partnerId,
      name: 'Partner Name',
      store_name: 'Store Name',
      status: 'approved',
      services: ['DSH', 'ARB'],
      branches: [
        { id: 'branch_1', name: 'Main Branch', address: 'Address 1' },
        { id: 'branch_2', name: 'Branch 2', address: 'Address 2' },
      ],
    };
  }
}

