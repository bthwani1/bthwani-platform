import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../../core/services/logger.service';

interface AuditLogEntry {
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  newValues?: Record<string, unknown>;
  oldValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Field Audit Logger
 *
 * Logs all field operations for audit and compliance.
 */
@Injectable()
export class FieldAuditLogger {
  constructor(private readonly logger: LoggerService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    this.logger.log('Field audit event', {
      event_type: 'field.audit',
      entity_type: entry.entityType,
      entity_id: entry.entityId,
      action: entry.action,
      user_id: entry.userId,
      new_values: entry.newValues,
      old_values: entry.oldValues,
      metadata: entry.metadata,
      timestamp: new Date().toISOString(),
    });
  }
}

