import { Injectable } from '@nestjs/common';
import { ArbAuditLogRepository } from '../repositories/arb-audit-log.repository';
import {
  ArbAuditLogEntity,
  ArbAuditEntityType,
  ArbAuditAction,
} from '../entities/arb-audit-log.entity';
import { Request } from 'express';

interface AuditLogInput {
  entityType: ArbAuditEntityType | string;
  entityId: string;
  action: ArbAuditAction | string;
  userId?: string;
  userEmail?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  reason?: string;
  request?: Request;
}

@Injectable()
export class ArbAuditLogger {
  constructor(private readonly auditLogRepository: ArbAuditLogRepository) {}

  async log(input: AuditLogInput): Promise<ArbAuditLogEntity> {
    const auditLog = new ArbAuditLogEntity();
    auditLog.entity_type = input.entityType as ArbAuditEntityType;
    auditLog.entity_id = input.entityId;
    auditLog.action = input.action as ArbAuditAction;
    if (input.userId) {
      auditLog.user_id = input.userId;
    }
    if (input.userEmail) {
      auditLog.user_email = input.userEmail;
    }
    const oldValues = this.sanitizeValues(input.oldValues);
    if (oldValues) {
      auditLog.old_values = oldValues;
    }
    const newValues = this.sanitizeValues(input.newValues);
    if (newValues) {
      auditLog.new_values = newValues;
    }
    if (input.reason) {
      auditLog.reason = input.reason;
    }

    if (input.request) {
      auditLog.ip_address =
        input.request.ip || (input.request.headers['x-forwarded-for'] as string) || '';
      const userAgent = input.request.headers['user-agent'];
      if (userAgent) {
        auditLog.user_agent = userAgent;
      }
      const traceId = input.request.headers['x-request-id'] as string | undefined;
      if (traceId) {
        auditLog.trace_id = traceId;
      }
      auditLog.request_metadata = {
        method: input.request.method,
        path: input.request.path,
        query: input.request.query,
      };
    }

    return this.auditLogRepository.create(auditLog);
  }

  private sanitizeValues(values?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!values) return undefined;

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(values)) {
      if (typeof value === 'string' && this.looksLikePhone(value)) {
        sanitized[key] = this.maskPhone(value);
      } else if (typeof value === 'string' && this.looksLikeSecret(key)) {
        sanitized[key] = '***';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private looksLikePhone(value: string): boolean {
    return /^\+?[0-9]{10,}$/.test(value);
  }

  private looksLikeSecret(key: string): boolean {
    const secretKeys = ['password', 'secret', 'token', 'key', 'api_key', 'access_token'];
    return secretKeys.some((sk) => key.toLowerCase().includes(sk));
  }

  private maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return '***';
    return `${phone.substring(0, 2)}***${phone.substring(phone.length - 2)}`;
  }
}
