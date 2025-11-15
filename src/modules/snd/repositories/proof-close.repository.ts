import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { SndProofCloseEntity } from '../entities/proof-close.entity';

@Injectable()
export class SndProofCloseRepository {
  constructor(
    @InjectRepository(SndProofCloseEntity)
    private readonly repository: EntityRepository<SndProofCloseEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(proofClose: SndProofCloseEntity): Promise<SndProofCloseEntity> {
    this.em.persist(proofClose);
    await this.em.flush();
    return proofClose;
  }

  async findOne(id: string): Promise<SndProofCloseEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByRequestId(requestId: string): Promise<SndProofCloseEntity | null> {
    return this.repository.findOne({ request_id: requestId });
  }

  async findByCode(closeCode: string): Promise<SndProofCloseEntity | null> {
    return this.repository.findOne({ close_code: closeCode, is_verified: false });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<SndProofCloseEntity | null> {
    return this.repository.findOne({ idempotency_key: idempotencyKey });
  }

  async update(proofClose: SndProofCloseEntity): Promise<SndProofCloseEntity> {
    await this.em.flush();
    return proofClose;
  }
}
