import { Injectable } from '@nestjs/common';
import { MetricsService } from '../../../core/services/metrics.service';
import { LoggerService } from '../../../core/services/logger.service';

/**
 * Field Metrics Collector
 *
 * Collects KPIs and SLA metrics for field operations.
 */
@Injectable()
export class FieldMetricsCollector {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly logger: LoggerService,
  ) {}

  recordTaskStatusChange(taskId: string, status: string): void {
    this.metricsService.recordCounter('field.tasks.status_change', 1, {
      status,
    });
  }

  recordTaskOverdue(taskId: string): void {
    this.metricsService.recordCounter('field.tasks.overdue', 1);
  }

  recordSyncEvent(success: boolean, error?: string): void {
    if (success) {
      this.metricsService.recordCounter('field.sync.success', 1);
    } else {
      this.metricsService.recordCounter('field.sync.error', 1, {
        error: error || 'unknown',
      });
    }
  }

  recordOfflineDuration(durationMs: number): void {
    this.metricsService.recordHistogram('field.offline.duration_ms', durationMs);
  }

  recordFormSubmit(formType: string, success: boolean): void {
    if (success) {
      this.metricsService.recordCounter('field.forms.submit', 1, {
        form_type: formType,
      });
    } else {
      this.metricsService.recordCounter('field.forms.submit_error', 1, {
        form_type: formType,
      });
    }
  }

  recordVisitDuration(taskId: string, durationMs: number): void {
    this.metricsService.recordHistogram('field.visits.duration_ms', durationMs, {
      task_id: taskId,
    });
  }
}

