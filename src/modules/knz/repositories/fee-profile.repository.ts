import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import {
  FeeProfileEntity,
  FeeProfileStatus,
  FeeProfileScope,
} from '../entities/fee-profile.entity';

@Injectable()
export class FeeProfileRepository {
  constructor(
    @InjectRepository(FeeProfileEntity)
    private readonly repository: EntityRepository<FeeProfileEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(feeProfile: FeeProfileEntity): Promise<FeeProfileEntity> {
    this.em.persist(feeProfile);
    await this.em.flush();
    return feeProfile;
  }

  async findOne(id: string): Promise<FeeProfileEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByCode(code: string): Promise<FeeProfileEntity | null> {
    return this.repository.findOne({ code });
  }

  async findByScope(options: {
    scope: FeeProfileScope;
    region_code?: string;
    category_id?: string;
    subcategory_id?: string;
    status?: FeeProfileStatus;
  }): Promise<FeeProfileEntity[]> {
    const where: Record<string, unknown> = {
      scope: options.scope,
    };
    if (options.status) {
      where.status = options.status;
    }
    if (options.region_code) {
      where.region_code = options.region_code;
    }
    if (options.category_id) {
      where.category_id = options.category_id;
    }
    if (options.subcategory_id) {
      where.subcategory_id = options.subcategory_id;
    }
    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
    });
  }

  async findAll(options?: {
    status?: FeeProfileStatus;
    scope?: FeeProfileScope;
    limit?: number;
    offset?: number;
  }): Promise<FeeProfileEntity[]> {
    const where: Record<string, unknown> = {};
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.scope) {
      where.scope = options.scope;
    }
    return this.repository.find(where, {
      limit: options?.limit,
      offset: options?.offset,
      orderBy: { created_at: 'DESC' },
    });
  }

  async update(feeProfile: FeeProfileEntity): Promise<FeeProfileEntity> {
    await this.em.flush();
    return feeProfile;
  }

  async delete(id: string): Promise<void> {
    const feeProfile = await this.repository.findOne({ id });
    if (feeProfile) {
      await this.em.removeAndFlush(feeProfile);
    }
  }
}
