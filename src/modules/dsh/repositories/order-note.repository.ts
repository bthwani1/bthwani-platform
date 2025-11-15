import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectEntityManager } from '@mikro-orm/nestjs';
import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { OrderNoteEntity } from '../entities/order-note.entity';

@Injectable()
export class OrderNoteRepository {
  constructor(
    @InjectRepository(OrderNoteEntity)
    private readonly repository: EntityRepository<OrderNoteEntity>,
    @InjectEntityManager('default')
    private readonly em: EntityManager,
  ) {}

  async create(note: OrderNoteEntity): Promise<OrderNoteEntity> {
    this.em.persist(note);
    await this.em.flush();
    return note;
  }

  async findByOrder(
    orderId: string,
    cursor?: string,
    limit: number = 50,
  ): Promise<OrderNoteEntity[]> {
    const where: Record<string, unknown> = { order_id: orderId };
    if (cursor) {
      where.created_at = { $lt: new Date(cursor) };
    }

    return this.repository.find(where, {
      limit,
      orderBy: { created_at: 'DESC' },
    });
  }
}

