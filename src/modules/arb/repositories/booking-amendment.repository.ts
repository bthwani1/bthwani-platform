import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { BookingAmendmentEntity, AmendmentStatus } from '../entities/booking-amendment.entity';

@Injectable()
export class BookingAmendmentRepository {
  constructor(
    @InjectRepository(BookingAmendmentEntity)
    private readonly repository: EntityRepository<BookingAmendmentEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(amendment: BookingAmendmentEntity): Promise<BookingAmendmentEntity> {
    this.em.persist(amendment);
    await this.em.flush();
    return amendment;
  }

  async findOne(id: string): Promise<BookingAmendmentEntity | null> {
    return this.repository.findOne({ id });
  }

  async findByIdempotencyKey(idempotencyKey: string): Promise<BookingAmendmentEntity | null> {
    return this.repository.findOne({ idempotency_key: idempotencyKey });
  }

  async findByBooking(
    bookingId: string,
    options?: {
      status?: AmendmentStatus;
      cursor?: string;
      limit?: number;
    },
  ): Promise<BookingAmendmentEntity[]> {
    const where: Record<string, unknown> = { booking_id: bookingId };
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

  async findPendingByBooking(bookingId: string): Promise<BookingAmendmentEntity[]> {
    return this.repository.find({
      booking_id: bookingId,
      status: AmendmentStatus.PENDING,
    });
  }

  async update(amendment: BookingAmendmentEntity): Promise<BookingAmendmentEntity> {
    await this.em.flush();
    return amendment;
  }
}
