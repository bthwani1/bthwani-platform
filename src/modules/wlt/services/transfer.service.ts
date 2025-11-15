import { Injectable, BadRequestException } from '@nestjs/common';
import { AccountRepository } from '../repositories/account.repository';
import { AccountService } from './account.service';
import { LedgerEngine } from './ledger-engine.service';
import { AccountEntity, AccountType } from '../entities/account.entity';
import { EntryType, EntryCategory } from '../entities/journal-entry.entity';
import { LoggerService } from '../../../core/services/logger.service';
import { AuditLoggerService } from './audit-logger.service';

export interface InternalTransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency?: string;
  serviceRef?: string;
  transactionRef?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class TransferService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly accountService: AccountService,
    private readonly ledgerEngine: LedgerEngine,
    private readonly logger: LoggerService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  async transfer(request: InternalTransferRequest): Promise<void> {
    const {
      fromAccountId,
      toAccountId,
      amount,
      currency = 'YER',
      serviceRef,
      transactionRef,
      description,
      metadata,
    } = request;

    if (amount <= 0) {
      throw new BadRequestException('Transfer amount must be positive');
    }

    const fromAccount = await this.accountService.getAccount(fromAccountId);
    const toAccount = await this.accountService.getAccount(toAccountId);

    if (fromAccount.status !== 'active' || toAccount.status !== 'active') {
      throw new BadRequestException('Both accounts must be active');
    }

    const txnRef =
      transactionRef || `transfer_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const debitEntry: {
      accountId: string;
      entryType: EntryType;
      category: EntryCategory;
      amount: number;
      currency?: string;
      serviceRef?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    } = {
      accountId: fromAccountId,
      entryType: EntryType.DEBIT,
      category: EntryCategory.TRANSFER,
      amount,
      description: description || `Transfer to ${toAccountId}`,
    };
    if (currency !== undefined) {
      debitEntry.currency = currency;
    }
    if (serviceRef !== undefined) {
      debitEntry.serviceRef = serviceRef;
    }
    if (metadata !== undefined) {
      debitEntry.metadata = metadata;
    }

    const creditEntry: {
      accountId: string;
      entryType: EntryType;
      category: EntryCategory;
      amount: number;
      currency?: string;
      serviceRef?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    } = {
      accountId: toAccountId,
      entryType: EntryType.CREDIT,
      category: EntryCategory.TRANSFER,
      amount,
      description: description || `Transfer from ${fromAccountId}`,
    };
    if (currency !== undefined) {
      creditEntry.currency = currency;
    }
    if (serviceRef !== undefined) {
      creditEntry.serviceRef = serviceRef;
    }
    if (metadata !== undefined) {
      creditEntry.metadata = metadata;
    }

    await this.ledgerEngine.post({
      transactionRef: txnRef,
      entries: [debitEntry, creditEntry],
    });

    const auditParams: {
      transactionRef: string;
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      currency: string;
      serviceRef?: string;
    } = {
      transactionRef: txnRef,
      fromAccountId,
      toAccountId,
      amount,
      currency: currency || 'YER',
    };
    if (serviceRef !== undefined) {
      auditParams.serviceRef = serviceRef;
    }
    await this.auditLogger.logTransfer(auditParams);

    this.logger.log('Internal transfer completed', {
      transactionRef: txnRef,
      fromAccountId,
      toAccountId,
      amount,
      currency,
    });
  }
}
