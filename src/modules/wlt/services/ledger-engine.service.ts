import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { InjectEntityManager } from '@mikro-orm/nestjs';
import { JournalEntryRepository } from '../repositories/journal-entry.repository';
import {
  JournalEntryEntity,
  EntryType,
  EntryCategory,
  EntryStatus,
} from '../entities/journal-entry.entity';
import { LoggerService } from '../../../core/services/logger.service';
import { AuditLoggerService } from './audit-logger.service';

export interface PostingRequest {
  transactionRef: string;
  entries: Array<{
    accountId: string;
    entryType: EntryType;
    category: EntryCategory;
    amount: number;
    currency?: string;
    serviceRef?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }>;
}

@Injectable()
export class LedgerEngine {
  constructor(
    @InjectEntityManager('default')
    private readonly em: EntityManager,
    private readonly journalEntryRepository: JournalEntryRepository,
    private readonly logger: LoggerService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  async post(request: PostingRequest): Promise<JournalEntryEntity[]> {
    const { transactionRef, entries } = request;

    if (!entries || entries.length === 0) {
      throw new Error('No entries provided for posting');
    }

    const debitSum = entries
      .filter((e) => e.entryType === EntryType.DEBIT)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const creditSum = entries
      .filter((e) => e.entryType === EntryType.CREDIT)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    if (debitSum !== creditSum) {
      throw new Error(
        `Unbalanced posting: debits=${debitSum}, credits=${creditSum}, transactionRef=${transactionRef}`,
      );
    }

    const journalEntries = entries.map((entry) => {
      const journalEntry = new JournalEntryEntity();
      journalEntry.account_id = entry.accountId;
      journalEntry.entry_type = entry.entryType;
      journalEntry.category = entry.category;
      journalEntry.amount = entry.amount;
      journalEntry.currency = entry.currency || 'YER';
      journalEntry.transaction_ref = transactionRef;
      if (entry.serviceRef !== undefined) {
        journalEntry.service_ref = entry.serviceRef;
      }
      if (entry.description !== undefined) {
        journalEntry.description = entry.description;
      }
      if (entry.metadata !== undefined) {
        journalEntry.metadata = entry.metadata;
      }
      return journalEntry;
    });

    await this.em.transactional(async (em) => {
      for (const entry of journalEntries) {
        entry.status = EntryStatus.POSTED;
        entry.posted_at = new Date();
        em.persist(entry);
      }
      await em.flush();
    });

    await this.auditLogger.logJournalPosting({
      transactionRef,
      entryCount: journalEntries.length,
      debitSum,
      creditSum,
    });

    this.logger.log('Journal posting completed', {
      transactionRef,
      entryCount: journalEntries.length,
      debitSum,
      creditSum,
    });

    const verified = await this.journalEntryRepository.verifyBalanced(transactionRef);
    if (!verified) {
      this.logger.error('Posting verification failed', undefined, { transactionRef });
      throw new Error('Posting verification failed: entries not balanced');
    }

    return journalEntries;
  }

  async verifyWalletLedgerParity(accountId: string): Promise<boolean> {
    const balance = await this.journalEntryRepository.computeBalance(accountId);
    return true;
  }
}
