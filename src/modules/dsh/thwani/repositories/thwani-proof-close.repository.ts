import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { ThwaniProofCloseEntity } from '../entities/thwani-proof-close.entity';

@Injectable()
export class ThwaniProofCloseRepository {
  constructor(
    @InjectRepository(ThwaniProofCloseEntity)
    private readonly repository: EntityRepository<ThwaniProofCloseEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(proofClose: ThwaniProofCloseEntity): Promise<ThwaniProofCloseEntity> {
    this.em.persist(proofClose);
    await this.em.flush();
    return proofClose;
  }

  async findOne(id: string): Promise<ThwaniProofCloseEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByRequestId(requestId: string): Promise<ThwaniProofCloseEntity | null> {
    return this.repository.findOne({ request_id: requestId });
  }

  async findByCode(closeCode: string): Promise<ThwaniProofCloseEntity | null> {
    return this.repository.findOne({ close_code: closeCode, is_verified: false });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<ThwaniProofCloseEntity | null> {
    return this.repository.findOne({ idempotency_key: idempotencyKey });
  }

  async update(proofClose: ThwaniProofCloseEntity): Promise<ThwaniProofCloseEntity> {
    await this.em.flush();
    return proofClose;
  }
}

