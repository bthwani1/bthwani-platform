import { Injectable, Logger } from '@nestjs/common';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { AuditLogEntity } from '../entities/audit-log.entity';

/**
 * KWD Audit Logger Adapter
 * Provides immutable audit logging for admin/support actions.
 * No secrets in logs; 365-day retention.
 */
@Injectable()
export class AuditLoggerAdapter {
  private readonly logger = new Logger(AuditLoggerAdapter.name);

  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  /**
   * Log audit entry
   */
  async log(params: {
    entity_type: string;
    entity_id: string;
    action: string;
    user_id: string;
    user_role: string;
    before_state?: Record<string, unknown>;
    after_state?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    trace_id?: string;
    ip_address?: string;
  }): Promise<AuditLogEntity> {
    this.logger.log(
      `Audit: ${params.action} on ${params.entity_type}:${params.entity_id} by ${params.user_id}`,
    );
    const auditLog = new AuditLogEntity();
    auditLog.entity_type = params.entity_type;
    auditLog.entity_id = params.entity_id;
    auditLog.action = params.action;
    auditLog.user_id = params.user_id;
    auditLog.user_role = params.user_role;
    if (params.before_state) {
      auditLog.before_state = this.sanitize(params.before_state);
    }
    if (params.after_state) {
      auditLog.after_state = this.sanitize(params.after_state);
    }
    if (params.metadata) {
      auditLog.metadata = this.sanitize(params.metadata);
    }
    if (params.trace_id) {
      auditLog.trace_id = params.trace_id;
    }
    if (params.ip_address) {
      auditLog.ip_address = params.ip_address;
    }
    return this.auditLogRepository.create(auditLog);
  }

  /**
   * Get audit trail for entity
   */
  async getAuditTrail(entity_type: string, entity_id: string): Promise<AuditLogEntity[]> {
    return this.auditLogRepository.findByEntity(entity_type, entity_id);
  }

  /**
   * Get audit logs by user
   */
  async getByUser(user_id: string, limit: number = 100): Promise<AuditLogEntity[]> {
    return this.auditLogRepository.findByUser(user_id, limit);
  }

  /**
   * Get recent audit logs
   */
  async getRecent(limit: number = 100): Promise<AuditLogEntity[]> {
    return this.auditLogRepository.findRecent(limit);
  }

  /**
   * Sanitize data (remove secrets, PII)
   */
  private sanitize(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...data };
    const sensitiveKeys = [
      'password',
      'token',
      'secret',
      'api_key',
      'access_token',
      'refresh_token',
      'ssn',
      'card_number',
    ];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return sanitized;
  }

  /**
   * Cleanup old logs (365-day retention)
   */
  async cleanupOldLogs(daysOld: number = 365): Promise<number> {
    this.logger.log(`Cleaning up audit logs older than ${daysOld} days`);
    const oldLogs = await this.auditLogRepository.findForRetention(daysOld);
    // TODO: Implement actual deletion or archival
    this.logger.log(`Found ${oldLogs.length} old logs for cleanup`);
    return oldLogs.length;
  }
}
