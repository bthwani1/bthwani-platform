import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { AuditLogEntity } from '../entities/audit-log.entity';
import { LoggerService } from '../../../core/services/logger.service';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';

@Injectable()
export class AuditLoggerService {
  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly logger: LoggerService,
  ) {}

  async logAccountCreation(params: {
    accountId: string;
    accountType: string;
    ownerId?: string;
    userId?: string;
    traceId?: string;
  }): Promise<void> {
    const log = new AuditLogEntity();
    log.entity_type = 'account';
    log.entity_id = params.accountId;
    log.action = 'create';
    if (params.userId !== undefined) {
      if (params.userId !== undefined) {
      log.user_id = params.userId;
    }
    }
    log.user_role = 'system';
    log.after_state = {
      account_type: params.accountType,
      owner_id: params.ownerId,
    };
    log.trace_id = params.traceId || randomUUID();
    log.hash = this.computeHash(log);

    await this.auditLogRepository.create(log);
  }

  async logAccountStatusChange(params: {
    accountId: string;
    previousStatus: string;
    newStatus: string;
    userId?: string;
    traceId?: string;
  }): Promise<void> {
    const log = new AuditLogEntity();
    log.entity_type = 'account';
    log.entity_id = params.accountId;
    log.action = 'status_change';
    if (params.userId !== undefined) {
      log.user_id = params.userId;
    }
    log.before_state = { status: params.previousStatus };
    log.after_state = { status: params.newStatus };
    log.trace_id = params.traceId || randomUUID();
    log.hash = this.computeHash(log);

    await this.auditLogRepository.create(log);
  }

  async logTransfer(params: {
    transactionRef: string;
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    currency: string;
    serviceRef?: string;
    userId?: string;
    traceId?: string;
  }): Promise<void> {
    const log = new AuditLogEntity();
    log.entity_type = 'transfer';
    log.entity_id = params.transactionRef;
    log.action = 'transfer';
    if (params.userId !== undefined) {
      log.user_id = params.userId;
    }
    log.after_state = {
      from_account_id: params.fromAccountId,
      to_account_id: params.toAccountId,
      amount: params.amount,
      currency: params.currency,
      service_ref: params.serviceRef,
    };
    log.trace_id = params.traceId || randomUUID();
    log.hash = this.computeHash(log);

    await this.auditLogRepository.create(log);
  }

  async logHoldCreation(params: {
    holdId: string;
    accountId: string;
    amount: number;
    externalRef: string;
    serviceRef: string;
    userId?: string;
    traceId?: string;
  }): Promise<void> {
    const log = new AuditLogEntity();
    log.entity_type = 'hold';
    log.entity_id = params.holdId;
    log.action = 'create';
    if (params.userId !== undefined) {
      log.user_id = params.userId;
    }
    log.after_state = {
      account_id: params.accountId,
      amount: params.amount,
      external_ref: params.externalRef,
      service_ref: params.serviceRef,
    };
    log.trace_id = params.traceId || randomUUID();
    log.hash = this.computeHash(log);

    await this.auditLogRepository.create(log);
  }

  async logHoldRelease(params: {
    holdId: string;
    accountId: string;
    amount: number;
    targetAccountId?: string;
    userId?: string;
    traceId?: string;
  }): Promise<void> {
    const log = new AuditLogEntity();
    log.entity_type = 'hold';
    log.entity_id = params.holdId;
    log.action = 'release';
    if (params.userId !== undefined) {
      log.user_id = params.userId;
    }
    log.after_state = {
      account_id: params.accountId,
      amount: params.amount,
      target_account_id: params.targetAccountId,
    };
    log.trace_id = params.traceId || randomUUID();
    log.hash = this.computeHash(log);

    await this.auditLogRepository.create(log);
  }

  async logHoldCapture(params: {
    holdId: string;
    accountId: string;
    amount: number;
    userId?: string;
    traceId?: string;
  }): Promise<void> {
    const log = new AuditLogEntity();
    log.entity_type = 'hold';
    log.entity_id = params.holdId;
    log.action = 'capture';
    if (params.userId !== undefined) {
      log.user_id = params.userId;
    }
    log.after_state = {
      account_id: params.accountId,
      amount: params.amount,
    };
    log.trace_id = params.traceId || randomUUID();
    log.hash = this.computeHash(log);

    await this.auditLogRepository.create(log);
  }

  async logJournalPosting(params: {
    transactionRef: string;
    entryCount: number;
    debitSum: number;
    creditSum: number;
    userId?: string;
    traceId?: string;
  }): Promise<void> {
    const log = new AuditLogEntity();
    log.entity_type = 'journal';
    log.entity_id = params.transactionRef;
    log.action = 'post';
    if (params.userId !== undefined) {
      log.user_id = params.userId;
    }
    log.after_state = {
      entry_count: params.entryCount,
      debit_sum: params.debitSum,
      credit_sum: params.creditSum,
    };
    log.trace_id = params.traceId || randomUUID();
    log.hash = this.computeHash(log);

    await this.auditLogRepository.create(log);
  }

  async logProviderCharge(params: {
    transactionRef: string;
    accountId: string;
    amount: number;
    provider: string;
    serviceRef?: string;
    userId?: string;
    traceId?: string;
  }): Promise<void> {
    const log = new AuditLogEntity();
    log.entity_type = 'provider_charge';
    log.entity_id = params.transactionRef;
    log.action = 'charge';
    if (params.userId !== undefined) {
      log.user_id = params.userId;
    }
    log.after_state = {
      account_id: params.accountId,
      amount: params.amount,
      provider: params.provider,
      service_ref: params.serviceRef,
    };
    log.trace_id = params.traceId || randomUUID();
    log.hash = this.computeHash(log);

    await this.auditLogRepository.create(log);
  }

  async logProviderRefund(params: {
    transactionRef: string;
    accountId: string;
    amount: number;
    provider: string;
    userId?: string;
    traceId?: string;
  }): Promise<void> {
    const log = new AuditLogEntity();
    log.entity_type = 'provider_refund';
    log.entity_id = params.transactionRef;
    log.action = 'refund';
    if (params.userId !== undefined) {
      log.user_id = params.userId;
    }
    log.after_state = {
      account_id: params.accountId,
      amount: params.amount,
      provider: params.provider,
    };
    log.trace_id = params.traceId || randomUUID();
    log.hash = this.computeHash(log);

    await this.auditLogRepository.create(log);
  }

  async logSettlementApproval(params: {
    batchId: string;
    approverId: string;
    isFirstApproval: boolean;
    userId?: string;
    traceId?: string;
  }): Promise<void> {
    const log = new AuditLogEntity();
    log.entity_type = 'settlement';
    log.entity_id = params.batchId;
    log.action = params.isFirstApproval ? 'approve_first' : 'approve_second';
    log.user_id = params.approverId;
    log.after_state = {
      batch_id: params.batchId,
      approver_id: params.approverId,
      is_first_approval: params.isFirstApproval,
    };
    log.trace_id = params.traceId || randomUUID();
    log.hash = this.computeHash(log);

    await this.auditLogRepository.create(log);
  }

  async logConfigUpdate(params: {
    configId: string;
    key: string;
    scope: string;
    previousValue?: string;
    newValue: string;
    userId?: string;
    isPreview?: boolean;
    traceId?: string;
  }): Promise<void> {
    const log = new AuditLogEntity();
    log.entity_type = 'config';
    log.entity_id = params.configId;
    log.action = params.isPreview ? 'preview' : 'update';
    if (params.userId !== undefined) {
      log.user_id = params.userId;
    }
    log.before_state = { value: params.previousValue };
    log.after_state = {
      key: params.key,
      scope: params.scope,
      value: params.newValue,
    };
    log.trace_id = params.traceId || randomUUID();
    log.hash = this.computeHash(log);

    await this.auditLogRepository.create(log);
  }

  async logConfigPublish(params: {
    configId: string;
    key: string;
    userId?: string;
    traceId?: string;
  }): Promise<void> {
    const log = new AuditLogEntity();
    log.entity_type = 'config';
    log.entity_id = params.configId;
    log.action = 'publish';
    if (params.userId !== undefined) {
      log.user_id = params.userId;
    }
    log.after_state = { key: params.key };
    log.trace_id = params.traceId || randomUUID();
    log.hash = this.computeHash(log);

    await this.auditLogRepository.create(log);
  }

  async logConfigRollback(params: {
    configId: string;
    key: string;
    userId?: string;
    traceId?: string;
  }): Promise<void> {
    const log = new AuditLogEntity();
    log.entity_type = 'config';
    log.entity_id = params.configId;
    log.action = 'rollback';
    if (params.userId !== undefined) {
      log.user_id = params.userId;
    }
    log.after_state = { key: params.key };
    log.trace_id = params.traceId || randomUUID();
    log.hash = this.computeHash(log);

    await this.auditLogRepository.create(log);
  }

  async logExport(params: {
    exportId: string;
    accountIds: string[];
    privacyLevel: string;
    userId?: string;
    traceId?: string;
  }): Promise<void> {
    const log = new AuditLogEntity();
    log.entity_type = 'export';
    log.entity_id = params.exportId;
    log.action = 'export';
    if (params.userId !== undefined) {
      log.user_id = params.userId;
    }
    log.after_state = {
      account_ids: params.accountIds,
      privacy_level: params.privacyLevel,
    };
    log.trace_id = params.traceId || randomUUID();
    log.hash = this.computeHash(log);

    await this.auditLogRepository.create(log);
  }

  async logReconciliation(params: {
    provider: string;
    matched: number;
    mismatched: number;
    missing: number;
    userId?: string;
    traceId?: string;
  }): Promise<void> {
    const log = new AuditLogEntity();
    log.entity_type = 'reconciliation';
    log.entity_id = params.provider;
    log.action = 'reconcile';
    if (params.userId !== undefined) {
      log.user_id = params.userId;
    }
    log.after_state = {
      provider: params.provider,
      matched: params.matched,
      mismatched: params.mismatched,
      missing: params.missing,
    };
    log.trace_id = params.traceId || randomUUID();
    log.hash = this.computeHash(log);

    await this.auditLogRepository.create(log);
  }

  async logSubscriptionCheckout(params: {
    partnerId: string;
    planCode: string;
    billingCycle: string;
    paymentMethod: string;
    idempotencyKey: string;
    userId?: string;
    traceId?: string;
  }): Promise<void> {
    const log = new AuditLogEntity();
    log.entity_type = 'subscription';
    log.entity_id = params.idempotencyKey;
    log.action = 'checkout';
    log.user_id = params.userId !== undefined ? params.userId : params.partnerId;
    log.after_state = {
      partner_id: params.partnerId,
      plan_code: params.planCode,
      billing_cycle: params.billingCycle,
      payment_method: params.paymentMethod,
    };
    log.trace_id = params.traceId || randomUUID();
    log.hash = this.computeHash(log);

    await this.auditLogRepository.create(log);
  }

  private computeHash(log: AuditLogEntity): string {
    const data = JSON.stringify({
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      action: log.action,
      before_state: log.before_state,
      after_state: log.after_state,
      created_at: log.created_at.toISOString(),
    });
    return createHash('sha256').update(data).digest('hex');
  }
}
