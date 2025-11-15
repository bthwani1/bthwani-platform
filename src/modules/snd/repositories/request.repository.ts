import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import {
  SndRequestEntity,
  SndRequestStatus,
  SndRequestType,
  SndRoutingType,
} from '../entities/request.entity';

@Injectable()
export class SndRequestRepository {
  constructor(
    @InjectRepository(SndRequestEntity)
    private readonly repository: EntityRepository<SndRequestEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(request: SndRequestEntity): Promise<SndRequestEntity> {
    this.em.persist(request);
    await this.em.flush();
    return request;
  }

  async findOne(id: string): Promise<SndRequestEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<SndRequestEntity | null> {
    return this.repository.findOne({ idempotency_key: idempotencyKey });
  }

  async findByRequester(
    requesterId: string,
    options?: {
      status?: SndRequestStatus;
      type?: SndRequestType;
      cursor?: string;
      limit?: number;
    },
  ): Promise<SndRequestEntity[]> {
    const where: Record<string, unknown> = { requester_id: requesterId };
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.type) {
      where.type = options.type;
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
      status?: SndRequestStatus;
      cursor?: string;
      limit?: number;
    },
  ): Promise<SndRequestEntity[]> {
    const where: Record<string, unknown> = {
      assigned_captain_id: captainId,
      type: SndRequestType.INSTANT,
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

  async findByProvider(
    providerId: string,
    options?: {
      status?: SndRequestStatus;
      cursor?: string;
      limit?: number;
    },
  ): Promise<SndRequestEntity[]> {
    const where: Record<string, unknown> = {
      assigned_provider_id: providerId,
      type: SndRequestType.SPECIALIZED,
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
    status: SndRequestStatus,
    options?: {
      type?: SndRequestType;
      routingType?: SndRoutingType;
      cursor?: string;
      limit?: number;
    },
  ): Promise<SndRequestEntity[]> {
    const where: Record<string, unknown> = { status };
    if (options?.type) {
      where.type = options.type;
    }
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
      status?: SndRequestStatus;
      cursor?: string;
      limit?: number;
    },
  ): Promise<SndRequestEntity[]> {
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

  async findPendingInstantRequests(options?: {
    categoryId?: string;
    cursor?: string;
    limit?: number;
  }): Promise<SndRequestEntity[]> {
    const where: Record<string, unknown> = {
      type: SndRequestType.INSTANT,
      status: {
        $in: [SndRequestStatus.PENDING, SndRequestStatus.PRICING_REVIEW, SndRequestStatus.ROUTED],
      },
    };
    if (options?.categoryId) {
      where.category_id = options.categoryId;
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

  async update(request: SndRequestEntity): Promise<SndRequestEntity> {
    await this.em.flush();
    return request;
  }

  async countByStatus(status: SndRequestStatus): Promise<number> {
    return this.repository.count({ status });
  }

  async countByType(type: SndRequestType): Promise<number> {
    return this.repository.count({ type });
  }
}
