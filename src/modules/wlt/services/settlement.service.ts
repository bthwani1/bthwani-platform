import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SettlementBatchRepository } from '../repositories/settlement-batch.repository';
import { JournalEntryRepository } from '../repositories/journal-entry.repository';
import { LedgerEngine } from './ledger-engine.service';
import { SettlementBatchEntity, BatchStatus } from '../entities/settlement-batch.entity';
import { EntryType, EntryCategory } from '../entities/journal-entry.entity';
import { LoggerService } from '../../../core/services/logger.service';
import { AuditLoggerService } from './audit-logger.service';

export interface CreateBatchRequest {
  partnerId?: string;
  periodStart: Date;
  periodEnd: Date;
  criteria?: {
    partner_ids?: string[];
    service_refs?: string[];
    date_from?: string;
    date_to?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface ApproveBatchRequest {
  batchId: string;
  approverId: string;
  isFirstApproval: boolean;
}

@Injectable()
export class SettlementService {
  constructor(
    private readonly settlementBatchRepository: SettlementBatchRepository,
    private readonly journalEntryRepository: JournalEntryRepository,
    private readonly ledgerEngine: LedgerEngine,
    private readonly logger: LoggerService,
    private readonly auditLogger: AuditLoggerService,
  ) {}

  async createBatch(request: CreateBatchRequest): Promise<SettlementBatchEntity> {
    const { partnerId, periodStart, periodEnd, criteria, metadata } = request;

    const batch = new SettlementBatchEntity();
    if (partnerId !== undefined) {
      batch.partner_id = partnerId;
    }
    batch.period_start = periodStart;
    batch.period_end = periodEnd;
    batch.status = BatchStatus.DRAFT;
    if (criteria !== undefined) {
      batch.criteria = criteria;
    }
    if (metadata !== undefined) {
      batch.metadata = metadata;
    }
    batch.currency = 'YER';
    batch.total_amount = 0;

    const created = await this.settlementBatchRepository.create(batch);

    this.logger.log('Settlement batch created', {
      batchId: created.id,
      partnerId,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
    });

    return created;
  }

  async approveBatch(request: ApproveBatchRequest): Promise<SettlementBatchEntity> {
    const { batchId, approverId, isFirstApproval } = request;

    const batch = await this.settlementBatchRepository.findOne(batchId);
    if (!batch) {
      throw new NotFoundException(`Batch not found: ${batchId}`);
    }

    if (isFirstApproval) {
      if (batch.status !== BatchStatus.DRAFT && batch.status !== BatchStatus.PENDING_APPROVAL) {
        throw new BadRequestException(
          `Batch is not in draft or pending approval state: ${batch.status}`,
        );
      }
      batch.first_approver_id = approverId;
      batch.first_approved_at = new Date();
      batch.status = BatchStatus.PENDING_APPROVAL;
    } else {
      if (batch.status !== BatchStatus.PENDING_APPROVAL) {
        throw new BadRequestException(`Batch is not pending approval: ${batch.status}`);
      }
      if (batch.first_approver_id === approverId) {
        throw new BadRequestException('Second approver must be different from first approver');
      }
      batch.second_approver_id = approverId;
      batch.second_approved_at = new Date();
      batch.status = BatchStatus.APPROVED;
    }

    await this.settlementBatchRepository.update(batch);

    await this.auditLogger.logSettlementApproval({
      batchId,
      approverId,
      isFirstApproval,
    });

    this.logger.log('Settlement batch approved', {
      batchId,
      approverId,
      isFirstApproval,
    });

    return batch;
  }

  async listBatches(options?: {
    status?: BatchStatus;
    partnerId?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{ items: SettlementBatchEntity[]; nextCursor?: string }> {
    const { status, partnerId, cursor, limit = 50 } = options || {};

    let batches: SettlementBatchEntity[];
    if (partnerId !== undefined) {
      const findOptions: {
        status?: BatchStatus;
        cursor?: string;
        limit: number;
      } = {
        limit: limit + 1,
      };
      if (status !== undefined) {
        findOptions.status = status;
      }
      if (cursor !== undefined) {
        findOptions.cursor = cursor;
      }
      batches = await this.settlementBatchRepository.findByPartner(partnerId, findOptions);
    } else if (status !== undefined) {
      const findOptions: {
        cursor?: string;
        limit: number;
      } = {
        limit: limit + 1,
      };
      if (cursor !== undefined) {
        findOptions.cursor = cursor;
      }
      batches = await this.settlementBatchRepository.findByStatus(status, findOptions);
    } else {
      batches = [];
    }

    const hasMore = batches.length > limit;
    const items = hasMore ? batches.slice(0, limit) : batches;

    const result: {
      items: SettlementBatchEntity[];
      nextCursor?: string;
    } = { items };
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1];
      if (lastItem !== undefined) {
        result.nextCursor = lastItem.created_at.toISOString();
      }
    }

    return result;
  }

  async getBatch(batchId: string): Promise<SettlementBatchEntity> {
    const batch = await this.settlementBatchRepository.findOne(batchId);
    if (!batch) {
      throw new NotFoundException(`Batch not found: ${batchId}`);
    }
    return batch;
  }
}
