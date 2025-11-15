import { Injectable } from '@nestjs/common';
import { MetricsService } from '../../../core/services/metrics.service';
import { JournalEntryRepository } from '../repositories/journal-entry.repository';
import { SettlementBatchRepository } from '../repositories/settlement-batch.repository';
import { BatchStatus } from '../entities/settlement-batch.entity';
import { LoggerService } from '../../../core/services/logger.service';

@Injectable()
export class MetricsAdapterService {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly journalEntryRepository: JournalEntryRepository,
    private readonly settlementBatchRepository: SettlementBatchRepository,
    private readonly logger: LoggerService,
  ) {}

  recordBalanceByType(accountType: string, balance: number): void {
    this.metricsService.recordGauge('wlt_total_balance_by_type', balance, {
      account_type: accountType,
    });
  }

  recordUnsettledBalance(amount: number): void {
    this.metricsService.recordGauge('wlt_unsettled_balance', amount);
  }

  recordProviderFailure(provider: string): void {
    this.metricsService.recordCounter('wlt_provider_failure', 1, { provider });
  }

  recordCodExposure(captainId: string, exposure: number, cap: number): void {
    this.metricsService.recordGauge('wlt_cod_exposure_vs_caps', exposure, {
      captain_id: captainId,
      cap: cap.toString(),
    });
  }

  recordSettlementDelay(batchId: string, delayDays: number): void {
    this.metricsService.recordHistogram('wlt_settlement_delay', delayDays, {
      batch_id: batchId,
    });
  }

  recordExportUnmasked(exportId: string): void {
    this.metricsService.recordCounter('wlt_export_unmasked_rate', 1);
  }

  async collectMetrics(): Promise<void> {
    this.logger.debug('Collecting WLT metrics');
  }
}
