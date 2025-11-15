import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { OfferEntity, OfferStatus } from '../entities/offer.entity';

@Injectable()
export class OfferRepository {
  constructor(
    @InjectRepository(OfferEntity)
    private readonly repository: EntityRepository<OfferEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(offer: OfferEntity): Promise<OfferEntity> {
    this.em.persist(offer);
    await this.em.flush();
    return offer;
  }

  async findOne(id: string): Promise<OfferEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<OfferEntity | null> {
    return this.repository.findOne({ idempotency_key: idempotencyKey });
  }

  async search(options?: {
    partner_id?: string;
    category_id?: string;
    subcategory_id?: string;
    region_code?: string;
    status?: OfferStatus;
    q?: string;
    cursor?: string;
    limit?: number;
  }): Promise<OfferEntity[]> {
    const where: Record<string, unknown> = {};
    if (options?.partner_id) {
      where.partner_id = options.partner_id;
    }
    if (options?.category_id) {
      where.category_id = options.category_id;
    }
    if (options?.subcategory_id) {
      where.subcategory_id = options.subcategory_id;
    }
    if (options?.region_code) {
      where.region_code = options.region_code;
    }
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
      ...(options?.limit !== undefined && { limit: options.limit }),
    });
  }

  async findByPartner(
    partnerId: string,
    options?: {
      status?: OfferStatus;
      cursor?: string;
      limit?: number;
    },
  ): Promise<OfferEntity[]> {
    const where: Record<string, unknown> = { partner_id: partnerId };
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
      ...(options?.limit !== undefined && { limit: options.limit }),
    });
  }

  async update(offer: OfferEntity): Promise<OfferEntity> {
    await this.em.flush();
    return offer;
  }

  async countByStatus(status: OfferStatus): Promise<number> {
    return this.repository.count({ status });
  }
}
