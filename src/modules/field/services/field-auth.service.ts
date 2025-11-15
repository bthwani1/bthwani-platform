import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FieldIdentityAdapter } from '../adapters/field-identity.adapter';
import { FieldTaskEngineAdapter } from '../adapters/field-task-engine.adapter';
import { LoginDto } from '../dto/auth/login.dto';
import { VerifyOtpDto } from '../dto/auth/verify-otp.dto';
import { LoggerService } from '../../../core/services/logger.service';
import { FieldAuditLogger } from './field-audit-logger.service';

/**
 * Field Auth Service
 *
 * Handles authentication and profile management for field agents.
 */
@Injectable()
export class FieldAuthService {
  constructor(
    private readonly identityAdapter: FieldIdentityAdapter,
    private readonly taskEngineAdapter: FieldTaskEngineAdapter,
    private readonly auditLogger: FieldAuditLogger,
    private readonly logger: LoggerService,
  ) {}

  async requestOtp(loginDto: LoginDto): Promise<unknown> {
    this.logger.log('Field agent OTP request', {
      identifier: loginDto.identifier,
    });

    const result = await this.identityAdapter.requestOtp(loginDto.identifier);

    return {
      message: 'OTP sent',
      ...result,
      expires_in: result.expires_in || 300,
    };
  }

  async verifyOtp(
    verifyDto: VerifyOtpDto,
    idempotencyKey?: string,
  ): Promise<unknown> {
    this.logger.log('Field agent OTP verification', {
      identifier: verifyDto.identifier,
    });

    const authResult = await this.identityAdapter.verifyOtp(
      verifyDto.identifier,
      verifyDto.otp,
    );

    if (!authResult.authenticated) {
      throw new UnauthorizedException({
        type: 'https://errors.bthwani.com/field/invalid_otp',
        title: 'Invalid OTP',
        status: 401,
        code: 'FIELD-401-INVALID-OTP',
        detail: 'OTP verification failed',
      });
    }

    const profile = await this.identityAdapter.getAgentProfile(
      authResult.agent_id,
    );

    const zones = await this.taskEngineAdapter.getAssignedZones(
      authResult.agent_id,
    );

    await this.auditLogger.log({
      entityType: 'agent',
      entityId: authResult.agent_id,
      action: 'login',
      userId: authResult.agent_id,
      metadata: {
        identifier: verifyDto.identifier,
        zones: zones.map((z) => z.id),
      },
    });

    return {
      access_token: authResult.access_token,
      refresh_token: authResult.refresh_token,
      agent: {
        id: profile.id,
        name: profile.name,
        phone: profile.phone,
        role: profile.role,
        zones: zones,
      },
    };
  }

  async getProfile(agentId: string): Promise<unknown> {
    const profile = await this.identityAdapter.getAgentProfile(agentId);
    const zones = await this.taskEngineAdapter.getAssignedZones(agentId);

    return {
      ...profile,
      zones: zones,
    };
  }

  async getAssignedZones(agentId: string): Promise<unknown> {
    return this.taskEngineAdapter.getAssignedZones(agentId);
  }

  async completeTutorial(
    agentId: string,
    idempotencyKey?: string,
  ): Promise<unknown> {
    this.logger.log('Tutorial completion', { agentId });

    await this.identityAdapter.markTutorialComplete(agentId, idempotencyKey);

    await this.auditLogger.log({
      entityType: 'agent',
      entityId: agentId,
      action: 'complete_tutorial',
      userId: agentId,
    });

    return {
      message: 'Tutorial completed',
      completed_at: new Date().toISOString(),
    };
  }
}

