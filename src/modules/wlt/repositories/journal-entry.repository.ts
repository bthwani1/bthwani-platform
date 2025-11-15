import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import {
  JournalEntryEntity,
  EntryStatus,
  EntryType,
  EntryCategory,
} from '../entities/journal-entry.entity';

@Injectable()
export class JournalEntryRepository {
  constructor(
    @InjectRepository(JournalEntryEntity)
    private readonly repository: EntityRepository<JournalEntryEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(entry: JournalEntryEntity): Promise<JournalEntryEntity> {
    this.em.persist(entry);
    await this.em.flush();
    return entry;
  }

  async createMany(entries: JournalEntryEntity[]): Promise<JournalEntryEntity[]> {
    entries.forEach((entry) => this.em.persist(entry));
    await this.em.flush();
    return entries;
  }

  async findOne(id: string): Promise<JournalEntryEntity | null> {
    return this.repository.findOne({ id }, { populate: ['account'] });
  }

  async findByAccount(
    accountId: string,
    options?: {
      cursor?: string;
      limit?: number;
      status?: EntryStatus;
      category?: EntryCategory;
    },
  ): Promise<JournalEntryEntity[]> {
    const where: Record<string, unknown> = { account_id: accountId };
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.category) {
      where.category = options.category;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      limit: options?.limit || 50,
      orderBy: { created_at: 'DESC' },
      populate: ['account'],
    });
  }

  async findByTransactionRef(transactionRef: string): Promise<JournalEntryEntity[]> {
    return this.repository.find({ transaction_ref: transactionRef }, { populate: ['account'] });
  }

  async findByBatch(batchId: string): Promise<JournalEntryEntity[]> {
    return this.repository.find({ batch_id: batchId }, { populate: ['account'] });
  }

  async computeBalance(accountId: string): Promise<number> {
    const [debits, credits] = await Promise.all([
      this.repository.find({
        account_id: accountId,
        entry_type: EntryType.DEBIT,
        status: EntryStatus.POSTED,
      }),
      this.repository.find({
        account_id: accountId,
        entry_type: EntryType.CREDIT,
        status: EntryStatus.POSTED,
      }),
    ]);

    const debitSum = debits.reduce((sum, entry) => sum + Number(entry.amount), 0);
    const creditSum = credits.reduce((sum, entry) => sum + Number(entry.amount), 0);

    return creditSum - debitSum;
  }

  async verifyBalanced(transactionRef: string): Promise<boolean> {
    const entries = await this.findByTransactionRef(transactionRef);
    const debitSum = entries
      .filter((e) => e.entry_type === EntryType.DEBIT)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    const creditSum = entries
      .filter((e) => e.entry_type === EntryType.CREDIT)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    return debitSum === creditSum;
  }
}
