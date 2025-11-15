import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import {
  EsfRequestEntity,
  EsfRequestStatus,
  BloodType,
  RhFactor,
} from '../entities/esf-request.entity';

@Injectable()
export class EsfRequestRepository {
  constructor(
    @InjectRepository(EsfRequestEntity)
    private readonly repository: EntityRepository<EsfRequestEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(request: EsfRequestEntity): Promise<EsfRequestEntity> {
    this.em.persist(request);
    await this.em.flush();
    return request;
  }

  async findOne(id: string): Promise<EsfRequestEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<EsfRequestEntity | null> {
    return this.repository.findOne({ idempotency_key: idempotencyKey });
  }

  async findByRequester(
    requesterId: string,
    options?: { cursor?: string; limit?: number; status?: EsfRequestStatus },
  ): Promise<EsfRequestEntity[]> {
    const where: Record<string, unknown> = { requester_id: requesterId };

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

  async findByCityAndStatus(
    city: string,
    status: EsfRequestStatus,
    options?: { cursor?: string; limit?: number },
  ): Promise<EsfRequestEntity[]> {
    const where: Record<string, unknown> = { city, status };

    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
      ...(options?.limit !== undefined && { limit: options.limit + 1 }),
    });
  }

  async findByBloodType(
    aboType: BloodType,
    rhFactor: RhFactor,
    status: EsfRequestStatus,
    options?: { cursor?: string; limit?: number },
  ): Promise<EsfRequestEntity[]> {
    const where: Record<string, unknown> = {
      abo_type: aboType,
      rh_factor: rhFactor,
      status,
    };

    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
      ...(options?.limit !== undefined && { limit: options.limit + 1 }),
    });
  }

  async search(
    filters: {
      city?: string;
      status?: EsfRequestStatus;
      aboType?: BloodType;
      rhFactor?: RhFactor;
      from?: Date;
      to?: Date;
      slaBreach?: boolean;
    },
    options?: { cursor?: string; limit?: number },
  ): Promise<EsfRequestEntity[]> {
    const where: Record<string, unknown> = {};

    if (filters.city) {
      where.city = filters.city;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.aboType) {
      where.abo_type = filters.aboType;
    }

    if (filters.rhFactor) {
      where.rh_factor = filters.rhFactor;
    }

    if (filters.from) {
      where.created_at = { ...(where.created_at as Record<string, unknown>), $gte: filters.from };
    }

    if (filters.to) {
      where.created_at = { ...(where.created_at as Record<string, unknown>), $lte: filters.to };
    }

    if (filters.slaBreach) {
      const slaMinutes = parseInt(process.env.VAR_ESF_SLA_MATCH_MINUTES || '30', 10);
      const threshold = new Date(Date.now() - slaMinutes * 60 * 1000);
      where.status = EsfRequestStatus.PENDING;
      where.created_at = { $lt: threshold };
    }

    if (options?.cursor) {
      where.created_at = {
        ...(where.created_at as Record<string, unknown>),
        $lt: new Date(options.cursor),
      };
    }

    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
      ...(options?.limit !== undefined && { limit: options.limit + 1 }),
    });
  }
}
