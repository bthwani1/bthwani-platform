import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountRepository } from '../repositories/account.repository';
import { JournalEntryRepository } from '../repositories/journal-entry.repository';
import { AccountService } from './account.service';
import { AccountEntity } from '../entities/account.entity';
import { JournalEntryEntity, EntryStatus, EntryCategory } from '../entities/journal-entry.entity';
import { LoggerService } from '../../../core/services/logger.service';

export interface BalanceResponse {
  accountId: string;
  balance: number;
  currency: string;
  availableBalance?: number;
  holdsBalance?: number;
}

export interface TransactionListItem {
  id: string;
  transactionRef: string;
  entryType: string;
  category: string;
  amount: number;
  currency: string;
  serviceRef?: string;
  description?: string;
  createdAt: Date;
  postedAt?: Date;
}

export interface ListTransactionsOptions {
  cursor?: string;
  limit?: number;
  category?: EntryCategory;
  dateFrom?: Date;
  dateTo?: Date;
  serviceRef?: string;
}

@Injectable()
export class BalanceService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly journalEntryRepository: JournalEntryRepository,
    private readonly accountService: AccountService,
    private readonly logger: LoggerService,
  ) {}

  async getBalance(accountId: string): Promise<BalanceResponse> {
    const account = await this.accountService.getAccount(accountId);

    const balance = await this.journalEntryRepository.computeBalance(accountId);

    return {
      accountId,
      balance,
      currency: (account.attributes?.currency as string) || 'YER',
      availableBalance: balance,
      holdsBalance: 0,
    };
  }

  async listTransactions(
    accountId: string,
    options: ListTransactionsOptions = {},
  ): Promise<{ items: TransactionListItem[]; nextCursor?: string }> {
    const { cursor, limit = 50, category, serviceRef, dateFrom, dateTo } = options;

    const account = await this.accountService.getAccount(accountId);

    const findOptions: {
      cursor?: string;
      limit: number;
      status: EntryStatus;
      category?: EntryCategory;
    } = {
      limit: limit + 1,
      status: EntryStatus.POSTED,
    };
    if (cursor !== undefined) {
      findOptions.cursor = cursor;
    }
    if (category !== undefined) {
      findOptions.category = category;
    }
    const entries = await this.journalEntryRepository.findByAccount(accountId, findOptions);

    const filteredEntries = serviceRef
      ? entries.filter((e) => e.service_ref === serviceRef)
      : entries;

    const hasMore = filteredEntries.length > limit;
    const items = (hasMore ? filteredEntries.slice(0, limit) : filteredEntries).map((entry) => {
      const item: TransactionListItem = {
        id: entry.id,
        transactionRef: entry.transaction_ref || '',
        entryType: entry.entry_type,
        category: entry.category,
        amount: Number(entry.amount),
        currency: entry.currency,
        createdAt: entry.created_at,
      };
      if (entry.service_ref !== undefined) {
        item.serviceRef = entry.service_ref;
      }
      if (entry.description !== undefined) {
        item.description = entry.description;
      }
      if (entry.posted_at !== undefined) {
        item.postedAt = entry.posted_at;
      }
      return item;
    });

    const result: {
      items: TransactionListItem[];
      nextCursor?: string;
    } = { items };
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      if (lastItem !== undefined) {
        result.nextCursor = lastItem.createdAt.toISOString();
      }
    }

    return result;
  }

  async getStatement(
    accountId: string,
    dateFrom: Date,
    dateTo: Date,
    privacyLevel: 'masked' | 'unmasked' = 'masked',
  ): Promise<TransactionListItem[]> {
    const findOptions: {
      limit: number;
      status: EntryStatus;
      cursor?: string;
      category?: EntryCategory;
    } = {
      limit: 1000,
      status: EntryStatus.POSTED,
    };
    const entries = await this.journalEntryRepository.findByAccount(accountId, findOptions);

    const filtered = entries.filter((e) => {
      const entryDate = e.created_at;
      return entryDate >= dateFrom && entryDate <= dateTo;
    });

    return filtered.map((entry) => {
      const item: TransactionListItem = {
        id: privacyLevel === 'masked' ? this.maskId(entry.id) : entry.id,
        transactionRef:
          privacyLevel === 'masked'
            ? this.maskId(entry.transaction_ref || '')
            : entry.transaction_ref || '',
        entryType: entry.entry_type,
        category: entry.category,
        amount: Number(entry.amount),
        currency: entry.currency,
        createdAt: entry.created_at,
      };
      if (entry.service_ref !== undefined) {
        item.serviceRef = entry.service_ref;
      }
      if (entry.description !== undefined) {
        item.description = entry.description;
      }
      if (entry.posted_at !== undefined) {
        item.postedAt = entry.posted_at;
      }
      return item;
    });
  }

  private maskId(id: string): string {
    if (!id || id.length < 8) {
      return '****';
    }
    return `${id.substring(0, 4)}****${id.substring(id.length - 4)}`;
  }
}
