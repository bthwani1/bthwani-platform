import { Injectable } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditAction, AuditEntityType } from '../entities/audit-log.entity';

export interface SsotDecision {
  id: string;
  type: 'DEC-KNZ' | 'VAR_KNZ' | 'GUARD';
  code: string;
  title: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  version?: string;
}

export interface SsotParity {
  artifact_type: 'openapi' | 'routes' | 'catalog';
  artifact_id: string;
  parity_score: number;
  gaps?: Array<{
    field: string;
    expected: string;
    actual: string;
  }>;
}

export interface GuardStatus {
  guard_code: string;
  guard_name: string;
  status: 'pass' | 'fail' | 'warning';
  last_check: Date;
  details?: Record<string, unknown>;
}

@Injectable()
export class SsotBridgeService {
  constructor(private readonly auditLogService: AuditLogService) {}

  async getDecisions(filters?: {
    type?: string;
    status?: string;
    limit?: number;
  }): Promise<SsotDecision[]> {
    return [
      {
        id: 'dec-knz-2025-001',
        type: 'DEC-KNZ',
        code: 'DEC-KNZ-2025-001',
        title: 'KNZ Category Sensitive Flag Policy',
        description: 'Policy for handling sensitive categories',
        status: 'approved',
        version: '1.0',
      },
    ];
  }

  async getParity(artifactType: string, artifactId: string): Promise<SsotParity> {
    return {
      artifact_type: artifactType as 'openapi' | 'routes' | 'catalog',
      artifact_id: artifactId,
      parity_score: 0.95,
      gaps: [],
    };
  }

  async getGuardStatuses(): Promise<GuardStatus[]> {
    return [
      {
        guard_code: 'G-IDEMPOTENCY',
        guard_name: 'Idempotency Guard',
        status: 'pass',
        last_check: new Date(),
      },
      {
        guard_code: 'G-NO-SECRETS',
        guard_name: 'No Secrets Guard',
        status: 'pass',
        last_check: new Date(),
      },
      {
        guard_code: 'G-PRIVACY-EXPORT',
        guard_name: 'Privacy Export Guard',
        status: 'pass',
        last_check: new Date(),
      },
      {
        guard_code: 'G-TRACE',
        guard_name: 'Trace Guard',
        status: 'pass',
        last_check: new Date(),
      },
      {
        guard_code: 'G-PARITY',
        guard_name: 'Parity Guard',
        status: 'pass',
        last_check: new Date(),
        details: { min_parity: 0.9, current_parity: 0.95 },
      },
    ];
  }

  async approveDecision(
    decisionId: string,
    userId: string,
    userEmail: string,
    reason?: string,
  ): Promise<SsotDecision> {
    await this.auditLogService.log({
      entityType: AuditEntityType.SSOT_DECISION,
      entityId: decisionId,
      action: AuditAction.APPROVE,
      userId,
      userEmail,
      reason,
    });

    return {
      id: decisionId,
      type: 'DEC-KNZ',
      code: decisionId,
      title: 'Approved Decision',
      status: 'approved',
    };
  }
}
