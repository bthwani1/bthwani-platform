import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AccountService } from './account.service';
import { LedgerEngine } from './ledger-engine.service';
import { HoldRepository } from '../repositories/hold.repository';
import { HoldEntity, HoldStatus } from '../entities/hold.entity';
import { EntryType, EntryCategory } from '../entities/journal-entry.entity';
import { LoggerService } from '../../../core/services/logger.service';
import { AuditLoggerService } from './audit-logger.service';

export interface CreateHoldRequest {
  accountId: string;
  amount: number;
  currency?: string;
  externalRef: string;
  serviceRef: string;
  releaseRules?: {
    release_days?: number;
    no_show_split?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface ReleaseHoldRequest {
  holdId: string;
  releaseToBalance?: boolean;
  targetAccountId?: string;
  amount?: number;
  userId?: string;
}

@Injectable()
export class HoldService {
  constructor(
    private readonly holdRepository: HoldRepository,
    private readonly accountService: AccountService,
    private readonly ledgerEngine: LedgerEngine,
    private readonly logger: LoggerService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  async createHold(request: CreateHoldRequest): Promise<HoldEntity> {
    const {
      accountId,
      amount,
      currency = 'YER',
      externalRef,
      serviceRef,
      releaseRules,
      metadata,
    } = request;

    if (amount <= 0) {
      throw new BadRequestException('Hold amount must be positive');
    }

    const account = await this.accountService.getAccount(accountId);

    if (account.status !== 'active') {
      throw new BadRequestException('Account must be active');
    }

    const existingHold = await this.holdRepository.findByExternalRef(externalRef, serviceRef);
    if (existingHold && existingHold.status === HoldStatus.ACTIVE) {
      throw new BadRequestException('Active hold already exists for this reference');
    }

    const hold = new HoldEntity();
    hold.account_id = accountId;
    hold.amount = amount;
    hold.currency = currency || 'YER';
    hold.external_ref = externalRef;
    hold.service_ref = serviceRef;
    hold.status = HoldStatus.ACTIVE;
    if (releaseRules !== undefined) {
      hold.release_rules = releaseRules;
    }
    if (metadata !== undefined) {
      hold.metadata = metadata;
    }

    const created = await this.holdRepository.create(hold);

    const txnRef = `hold_${created.id}`;

    const entry: {
      accountId: string;
      entryType: EntryType;
      category: EntryCategory;
      amount: number;
      currency?: string;
      serviceRef?: string;
      description?: string;
      metadata?: Record<string, unknown>;
    } = {
      accountId,
      entryType: EntryType.DEBIT,
      category: EntryCategory.HOLD,
      amount,
      description: `Hold for ${externalRef}`,
    };
    if (currency !== undefined) {
      entry.currency = currency;
    }
    if (serviceRef !== undefined) {
      entry.serviceRef = serviceRef;
    }
    const holdMetadata: Record<string, unknown> = { hold_id: created.id };
    if (metadata !== undefined) {
      Object.assign(holdMetadata, metadata);
    }
    entry.metadata = holdMetadata;

    await this.ledgerEngine.post({
      transactionRef: txnRef,
      entries: [entry],
    });

    await this.auditLogger.logHoldCreation({
      holdId: created.id,
      accountId,
      amount,
      externalRef,
      serviceRef,
    });

    this.logger.log('Hold created', {
      holdId: created.id,
      accountId,
      amount,
      externalRef,
    });

    return created;
  }

  async releaseHold(request: ReleaseHoldRequest): Promise<HoldEntity> {
    const { holdId, releaseToBalance, targetAccountId, amount, userId } = request;

    const hold = await this.holdRepository.findOne(holdId);
    if (!hold) {
      throw new NotFoundException(`Hold not found: ${holdId}`);
    }

    if (hold.status !== HoldStatus.ACTIVE) {
      throw new BadRequestException(`Hold is not active: ${hold.status}`);
    }

    const releaseAmount = amount || hold.amount;

    if (releaseAmount > hold.amount) {
      throw new BadRequestException('Release amount cannot exceed hold amount');
    }

    hold.status = HoldStatus.RELEASED;
    hold.released_at = new Date();
    await this.holdRepository.update(hold);

    const txnRef = `release_${holdId}`;

    const effectiveReleaseToBalance = releaseToBalance !== undefined ? releaseToBalance : true;
    const targetAccount = effectiveReleaseToBalance ? hold.account_id : targetAccountId || hold.account_id;

    const releaseEntry: {
      accountId: string;
      entryType: EntryType;
      category: EntryCategory;
      amount: number;
      currency: string;
      serviceRef: string;
      description?: string;
      metadata?: Record<string, unknown>;
    } = {
      accountId: targetAccount,
      entryType: EntryType.CREDIT,
      category: EntryCategory.RELEASE,
      amount: releaseAmount,
      currency: hold.currency,
      serviceRef: hold.service_ref,
    };
    releaseEntry.description = effectiveReleaseToBalance
      ? `Release hold ${holdId}`
      : `Release hold ${holdId} to target account`;
    const releaseMetadata: Record<string, unknown> = { hold_id: holdId };
    if (!effectiveReleaseToBalance) {
      releaseMetadata.source_account_id = hold.account_id;
    }
    releaseEntry.metadata = releaseMetadata;

    await this.ledgerEngine.post({
      transactionRef: txnRef,
      entries: [releaseEntry],
    });

    const auditParams: {
      holdId: string;
      accountId: string;
      amount: number;
      targetAccountId?: string;
      userId?: string;
    } = {
      holdId,
      accountId: hold.account_id,
      amount: releaseAmount,
    };
    if (targetAccountId !== undefined) {
      auditParams.targetAccountId = targetAccountId;
    }
    if (userId !== undefined) {
      auditParams.userId = userId;
    }
    await this.auditLogger.logHoldRelease(auditParams);

    this.logger.log('Hold released', {
      holdId,
      accountId: hold.account_id,
      amount: releaseAmount,
    });

    return hold;
  }

  async captureHold(holdId: string, userId?: string): Promise<HoldEntity> {
    const hold = await this.holdRepository.findOne(holdId);
    if (!hold) {
      throw new NotFoundException(`Hold not found: ${holdId}`);
    }

    if (hold.status !== HoldStatus.ACTIVE) {
      throw new BadRequestException(`Hold is not active: ${hold.status}`);
    }

    hold.status = HoldStatus.CAPTURED;
    hold.captured_at = new Date();
    await this.holdRepository.update(hold);

    const auditParams: {
      holdId: string;
      accountId: string;
      amount: number;
      userId?: string;
    } = {
      holdId,
      accountId: hold.account_id,
      amount: hold.amount,
    };
    if (userId !== undefined) {
      auditParams.userId = userId;
    }
    await this.auditLogger.logHoldCapture(auditParams);

    this.logger.log('Hold captured', {
      holdId,
      accountId: hold.account_id,
    });

    return hold;
  }
}
