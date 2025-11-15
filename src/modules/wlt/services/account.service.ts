import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountRepository } from '../repositories/account.repository';
import { AccountEntity, AccountType, AccountStatus } from '../entities/account.entity';
import { LoggerService } from '../../../core/services/logger.service';
import { AuditLoggerService } from './audit-logger.service';

export interface CreateAccountRequest {
  accountType: AccountType;
  ownerId?: string;
  serviceRef?: string;
  limits?: {
    max_balance?: number;
    max_transfer?: number;
    daily_limit?: number;
  };
  attributes?: Record<string, unknown>;
}

@Injectable()
export class AccountService {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly logger: LoggerService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  async createAccount(request: CreateAccountRequest): Promise<AccountEntity> {
    const account = new AccountEntity();
    account.account_type = request.accountType;
    if (request.ownerId !== undefined) {
      account.owner_id = request.ownerId;
    }
    if (request.serviceRef !== undefined) {
      account.service_ref = request.serviceRef;
    }
    account.status = AccountStatus.ACTIVE;
    if (request.limits !== undefined) {
      account.limits = request.limits;
    }
    if (request.attributes !== undefined) {
      account.attributes = request.attributes;
    }

    const created = await this.accountRepository.create(account);

    await this.auditLogger.logAccountCreation({
      accountId: created.id,
      accountType: request.accountType,
      ...(request.ownerId !== undefined && { ownerId: request.ownerId }),
    });

    this.logger.log('Account created', {
      accountId: created.id,
      accountType: request.accountType,
      ownerId: request.ownerId,
    });

    return created;
  }

  async getAccount(accountId: string): Promise<AccountEntity> {
    const account = await this.accountRepository.findOne(accountId);
    if (!account) {
      throw new NotFoundException(`Account not found: ${accountId}`);
    }
    return account;
  }

  async getAccountByOwnerAndType(
    ownerId: string,
    accountType: AccountType,
  ): Promise<AccountEntity | null> {
    return this.accountRepository.findByOwnerAndType(ownerId, accountType);
  }

  async updateAccountStatus(
    accountId: string,
    status: AccountStatus,
    userId?: string,
  ): Promise<AccountEntity> {
    const account = await this.getAccount(accountId);
    const previousStatus = account.status;
    account.status = status;

    await this.accountRepository.update(account);

    await this.auditLogger.logAccountStatusChange({
      accountId,
      previousStatus,
      newStatus: status,
      ...(userId !== undefined && { userId }),
    });

    this.logger.log('Account status updated', {
      accountId,
      previousStatus,
      newStatus: status,
    });

    return account;
  }
}
