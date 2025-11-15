import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { HoldEntity, HoldStatus } from '../entities/hold.entity';

@Injectable()
export class HoldRepository {
  constructor(
    @InjectRepository(HoldEntity)
    private readonly repository: EntityRepository<HoldEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(hold: HoldEntity): Promise<HoldEntity> {
    this.em.persist(hold);
    await this.em.flush();
    return hold;
  }

  async findOne(id: string): Promise<HoldEntity | null> {
    return this.repository.findOne({ id }, { populate: ['account'] });
  }

  async findByExternalRef(externalRef: string, serviceRef: string): Promise<HoldEntity | null> {
    return this.repository.findOne({
      external_ref: externalRef,
      service_ref: serviceRef,
    });
  }

  async findByAccount(
    accountId: string,
    options?: {
      status?: HoldStatus;
      cursor?: string;
      limit?: number;
    },
  ): Promise<HoldEntity[]> {
    const where: Record<string, unknown> = { account_id: accountId };
    if (options?.status) {
      where.status = options.status;
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

  async update(hold: HoldEntity): Promise<HoldEntity> {
    await this.em.flush();
    return hold;
  }
}
