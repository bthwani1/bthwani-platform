import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { AuditLogEntity, AuditAction, AuditEntityType } from '../entities/audit-log.entity';
import { Request } from 'express';

export interface AuditLogContext {
  entityType: AuditEntityType;
  entityId?: string;
  action: AuditAction;
  userId: string;
  userEmail?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  reason?: string;
  request?: Request;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async log(context: AuditLogContext): Promise<AuditLogEntity> {
    const auditLog = new AuditLogEntity();
    auditLog.entity_type = context.entityType;
    auditLog.entity_id = context.entityId;
    auditLog.action = context.action;
    auditLog.user_id = context.userId;
    auditLog.user_email = context.userEmail;
    auditLog.old_values = context.oldValues;
    auditLog.new_values = context.newValues;
    auditLog.reason = context.reason;

    if (context.request) {
      auditLog.ip_address =
        context.request.ip || (context.request.headers['x-forwarded-for'] as string);
      auditLog.user_agent = context.request.headers['user-agent'];
      auditLog.trace_id = context.request.headers['x-request-id'] as string;
      auditLog.resource_path = context.request.path;
    }

    if (context.metadata) {
      auditLog.metadata = context.metadata;
    }

    return this.auditLogRepository.create(auditLog);
  }

  async findByEntity(
    entityType: AuditEntityType,
    entityId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<AuditLogEntity[]> {
    return this.auditLogRepository.findByEntity(entityType, entityId, options);
  }

  async findByUser(
    userId: string,
    options?: {
      action?: AuditAction;
      entityType?: AuditEntityType;
      cursor?: string;
      limit?: number;
    },
  ): Promise<AuditLogEntity[]> {
    return this.auditLogRepository.findByUser(userId, options);
  }
}
