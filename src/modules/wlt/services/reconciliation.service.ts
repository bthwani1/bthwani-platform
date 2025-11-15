import { Injectable } from '@nestjs/common';
import { JournalEntryRepository } from '../repositories/journal-entry.repository';
import { LoggerService } from '../../../core/services/logger.service';
import { AuditLoggerService } from './audit-logger.service';

@Injectable()
export class ReconciliationService {
  constructor(
    private readonly journalEntryRepository: JournalEntryRepository,
    private readonly logger: LoggerService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  async importProviderStatement(
    provider: string,
    statement: Array<{
      transaction_ref: string;
      amount: number;
      currency: string;
      status: string;
    }>,
  ): Promise<{
    matched: number;
    mismatched: number;
    missing: number;
  }> {
    let matched = 0;
    let mismatched = 0;
    let missing = 0;

    for (const entry of statement) {
      const journalEntries = await this.journalEntryRepository.findByTransactionRef(
        entry.transaction_ref,
      );

      if (journalEntries.length === 0) {
        missing++;
        this.logger.warn('Provider statement entry not found in ledger', {
          provider,
          transaction_ref: entry.transaction_ref,
        });
      } else {
        const journalAmount = journalEntries.reduce(
          (sum, e) => sum + (e.entry_type === 'credit' ? Number(e.amount) : -Number(e.amount)),
          0,
        );

        if (Math.abs(journalAmount - entry.amount) > 0.01) {
          mismatched++;
          this.logger.warn('Provider statement amount mismatch', {
            provider,
            transaction_ref: entry.transaction_ref,
            provider_amount: entry.amount,
            ledger_amount: journalAmount,
          });
        } else {
          matched++;
        }
      }
    }

    await this.auditLogger.logReconciliation({
      provider,
      matched,
      mismatched,
      missing,
    });

    this.logger.log('Provider statement reconciliation completed', {
      provider,
      matched,
      mismatched,
      missing,
    });

    return { matched, mismatched, missing };
  }
}
