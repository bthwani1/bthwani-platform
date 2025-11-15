import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { BookingEntity, BookingStatus, EscrowStatus } from '../entities/booking.entity';

@Injectable()
export class BookingRepository {
  constructor(
    @InjectRepository(BookingEntity)
    private readonly repository: EntityRepository<BookingEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(booking: BookingEntity): Promise<BookingEntity> {
    this.em.persist(booking);
    await this.em.flush();
    return booking;
  }

  async findOne(id: string): Promise<BookingEntity | null> {
    return this.repository.findOne({ id }, { populate: ['offer'] });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<BookingEntity | null> {
    return this.repository.findOne({ idempotency_key: idempotencyKey });
  }

  async findByCustomer(
    customerId: string,
    options?: {
      status?: BookingStatus;
      cursor?: string;
      limit?: number;
    },
  ): Promise<BookingEntity[]> {
    const where: Record<string, unknown> = { customer_id: customerId };
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
      populate: ['offer'],
      ...(options?.limit !== undefined && { limit: options.limit }),
    });
  }

  async findByPartner(
    partnerId: string,
    options?: {
      status?: BookingStatus;
      cursor?: string;
      limit?: number;
    },
  ): Promise<BookingEntity[]> {
    const where: Record<string, unknown> = { partner_id: partnerId };
    if (options?.status) {
      where.status = options.status;
    }
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
      populate: ['offer'],
      ...(options?.limit !== undefined && { limit: options.limit }),
    });
  }

  async findByOffer(
    offerId: string,
    options?: {
      status?: BookingStatus;
      cursor?: string;
      limit?: number;
    },
  ): Promise<BookingEntity[]> {
    const where: Record<string, unknown> = { offer_id: offerId };
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

  async findByEscrowStatus(escrowStatus: EscrowStatus): Promise<BookingEntity[]> {
    return this.repository.find({ escrow_status: escrowStatus });
  }

  async findDisputed(options?: { cursor?: string; limit?: number }): Promise<BookingEntity[]> {
    const where: Record<string, unknown> = {
      $or: [{ is_escalated: true }, { status: BookingStatus.DISPUTED }],
    };
    if (options?.cursor) {
      where.created_at = { $lt: new Date(options.cursor) };
    }

    return this.repository.find(where, {
      orderBy: { created_at: 'DESC' },
      populate: ['offer'],
      ...(options?.limit !== undefined && { limit: options.limit }),
    });
  }

  async update(booking: BookingEntity): Promise<BookingEntity> {
    await this.em.flush();
    return booking;
  }

  async countByStatus(status: BookingStatus): Promise<number> {
    return this.repository.count({ status });
  }

  async countByEscrowStatus(escrowStatus: EscrowStatus): Promise<number> {
    return this.repository.count({ escrow_status: escrowStatus });
  }
}
