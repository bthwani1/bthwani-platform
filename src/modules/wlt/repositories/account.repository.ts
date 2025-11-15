import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { AccountEntity, AccountType, AccountStatus } from '../entities/account.entity';

@Injectable()
export class AccountRepository {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly repository: EntityRepository<AccountEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(account: AccountEntity): Promise<AccountEntity> {
    this.em.persist(account);
    await this.em.flush();
    return account;
  }

  async findOne(id: string): Promise<AccountEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByOwnerAndType(
    ownerId: string,
    accountType: AccountType,
  ): Promise<AccountEntity | null> {
    return this.repository.findOne({ owner_id: ownerId, account_type: accountType });
  }

  async findByType(
    accountType: AccountType,
    options?: {
      status?: AccountStatus;
      cursor?: string;
      limit?: number;
    },
  ): Promise<AccountEntity[]> {
    const where: Record<string, unknown> = { account_type: accountType };
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.cursor) {
      where.created_at = { $gt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      limit: options?.limit || 50,
      orderBy: { created_at: 'ASC' },
    });
  }

  async update(account: AccountEntity): Promise<AccountEntity> {
    await this.em.flush();
    return account;
  }
}
