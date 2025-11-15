import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { ThwaniRequestEntity, ThwaniRequestStatus, ThwaniRoutingType } from '../entities/thwani-request.entity';

@Injectable()
export class ThwaniRequestRepository {
  constructor(
    @InjectRepository(ThwaniRequestEntity)
    private readonly repository: EntityRepository<ThwaniRequestEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(request: ThwaniRequestEntity): Promise<ThwaniRequestEntity> {
    this.em.persist(request);
    await this.em.flush();
    return request;
  }

  async findOne(id: string): Promise<ThwaniRequestEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<ThwaniRequestEntity | null> {
    return this.repository.findOne({ idempotency_key: idempotencyKey });
  }

  async findByRequester(
    requesterId: string,
    options?: {
      status?: ThwaniRequestStatus;
      cursor?: string;
      limit?: number;
    },
  ): Promise<ThwaniRequestEntity[]> {
    const where: Record<string, unknown> = { requester_id: requesterId };
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    const findOptions: { limit: number; orderBy: { created_at: 'DESC' } } = {
      limit: options?.limit ?? 20,
      orderBy: { created_at: 'DESC' },
    };
    return this.repository.find(where, findOptions);
  }

  async findByCaptain(
    captainId: string,
    options?: {
      status?: ThwaniRequestStatus;
      cursor?: string;
      limit?: number;
    },
  ): Promise<ThwaniRequestEntity[]> {
    const where: Record<string, unknown> = {
      assigned_captain_id: captainId,
    };
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    const findOptions: { limit: number; orderBy: { created_at: 'DESC' } } = {
      limit: options?.limit ?? 20,
      orderBy: { created_at: 'DESC' },
    };
    return this.repository.find(where, findOptions);
  }

  async findByStatus(
    status: ThwaniRequestStatus,
    options?: {
      routingType?: ThwaniRoutingType;
      cursor?: string;
      limit?: number;
    },
  ): Promise<ThwaniRequestEntity[]> {
    const where: Record<string, unknown> = { status };
    if (options?.routingType) {
      where.routing_type = options.routingType;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    const findOptions: { limit: number; orderBy: { created_at: 'DESC' } } = {
      limit: options?.limit ?? 20,
      orderBy: { created_at: 'DESC' },
    };
    return this.repository.find(where, findOptions);
  }

  async findByCategory(
    categoryId: string,
    options?: {
      status?: ThwaniRequestStatus;
      cursor?: string;
      limit?: number;
    },
  ): Promise<ThwaniRequestEntity[]> {
    const where: Record<string, unknown> = { category_id: categoryId };
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    const findOptions: { limit: number; orderBy: { created_at: 'DESC' } } = {
      limit: options?.limit ?? 20,
      orderBy: { created_at: 'DESC' },
    };
    return this.repository.find(where, findOptions);
  }

  async findPendingRequests(options?: {
    categoryId?: string;
    region?: string;
    cursor?: string;
    limit?: number;
  }): Promise<ThwaniRequestEntity[]> {
    const where: Record<string, unknown> = {
      status: {
        $in: [ThwaniRequestStatus.PENDING, ThwaniRequestStatus.PRICING_REVIEW, ThwaniRequestStatus.ROUTED],
      },
    };
    if (options?.categoryId) {
      where.category_id = options.categoryId;
    }
    if (options?.region) {
      where.region = options.region;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    const findOptions: { limit: number; orderBy: { created_at: 'ASC' } } = {
      limit: options?.limit ?? 20,
      orderBy: { created_at: 'ASC' },
    };
    return this.repository.find(where, findOptions);
  }

  async update(request: ThwaniRequestEntity): Promise<ThwaniRequestEntity> {
    await this.em.flush();
    return request;
  }

  async countByStatus(status: ThwaniRequestStatus): Promise<number> {
    return this.repository.count({ status });
  }
}

