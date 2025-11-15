import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { EsfMatchEntity, EsfMatchStatus } from '../entities/esf-match.entity';

@Injectable()
export class EsfMatchRepository {
  constructor(
    @InjectRepository(EsfMatchEntity)
    private readonly repository: EntityRepository<EsfMatchEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(match: EsfMatchEntity): Promise<EsfMatchEntity> {
    this.em.persist(match);
    await this.em.flush();
    return match;
  }

  async findOne(id: string): Promise<EsfMatchEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByRequest(requestId: string): Promise<EsfMatchEntity[]> {
    return this.repository.find({ request_id: requestId }, { orderBy: { created_at: 'DESC' } });
  }

  async findByDonor(
    donorId: string,
    options?: { cursor?: string; limit?: number; status?: EsfMatchStatus },
  ): Promise<EsfMatchEntity[]> {
    const where: Record<string, unknown> = { donor_id: donorId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
      ...(options?.limit !== undefined && { limit: options.limit + 1 }),
    });
  }

  async findByRequestAndDonor(requestId: string, donorId: string): Promise<EsfMatchEntity | null> {
    return this.repository.findOne({ request_id: requestId, donor_id: donorId });
  }

  async findPendingByDonor(donorId: string): Promise<EsfMatchEntity[]> {
    return this.repository.find(
      {
        donor_id: donorId,
        status: EsfMatchStatus.PENDING,
      },
      { orderBy: { created_at: 'DESC' } },
    );
  }
}
