import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { IdempotencyEntity } from '../entities/idempotency.entity';

@Injectable()
export class IdempotencyRepository {
  constructor(
    @InjectRepository(IdempotencyEntity)
    private readonly repository: EntityRepository<IdempotencyEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(idempotency: IdempotencyEntity): Promise<IdempotencyEntity> {
    this.em.persist(idempotency);
    await this.em.flush();
    return idempotency;
  }

  async findByKey(key: string): Promise<IdempotencyEntity | null> {
    return this.repository.findOne({ idempotency_key: key });
  }

  async deleteExpired(): Promise<number> {
    const now = new Date();
    const expired = await this.repository.find({ expires_at: { $lt: now } });
    expired.forEach((e) => this.em.remove(e));
    await this.em.flush();
    return expired.length;
  }
}
