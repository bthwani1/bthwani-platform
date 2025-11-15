import { Injectable } from '@nestjs/common';
import { SndAuditLogRepository } from '../repositories/snd-audit-log.repository';
import { SndAuditLogEntity } from '../entities/snd-audit-log.entity';
import { LoggerService } from '../../../core/services/logger.service';

export interface AuditLogEntry {
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  userRole?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class SndAuditLogger {
  constructor(
    private readonly auditLogRepository: SndAuditLogRepository,
    private readonly logger: LoggerService,
  ) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      const log = new SndAuditLogEntity();
      log.entity_type = entry.entityType;
      log.entity_id = entry.entityId;
      log.action = entry.action;
      log.user_id = entry.userId;
      if (entry.userRole !== undefined) {
        log.user_role = entry.userRole;
      }
      if (entry.oldValues !== undefined) {
        log.old_values = entry.oldValues;
      }
      if (entry.newValues !== undefined) {
        log.new_values = entry.newValues;
      }
      if (entry.reason !== undefined) {
        log.reason = entry.reason;
      }
      if (entry.ipAddress !== undefined) {
        log.ip_address = entry.ipAddress;
      }
      if (entry.userAgent !== undefined) {
        log.user_agent = entry.userAgent;
      }
      if (entry.metadata !== undefined) {
        log.metadata = entry.metadata;
      }

      await this.auditLogRepository.create(log);
    } catch (error) {
      this.logger.error(
        'Failed to create audit log',
        error instanceof Error ? error.stack : String(error),
        {
          entityType: entry.entityType,
          entityId: entry.entityId,
          action: entry.action,
        },
      );
    }
  }
}
