import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderNoteRepository } from '../repositories/order-note.repository';
import { OrderRepository } from '../repositories/order.repository';
import { OrderNoteEntity } from '../entities/order-note.entity';
import { LoggerService } from '../../../core/services/logger.service';

export interface CreateNoteRequest {
  note: string;
  note_type?: 'internal' | 'customer' | 'system';
}

@Injectable()
export class DshOrderNotesService {
  constructor(
    private readonly noteRepository: OrderNoteRepository,
    private readonly orderRepository: OrderRepository,
    private readonly logger: LoggerService,
  ) {}

  async getNotes(
    orderId: string,
    userId: string,
    cursor?: string,
    limit: number = 50,
  ): Promise<{ items: OrderNoteEntity[]; nextCursor?: string }> {
    const order = await this.orderRepository.findOne(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Verify user is part of the order (partner or customer)
    if (order.partner_id !== userId && order.customer_id !== userId) {
      throw new NotFoundException('Order not found');
    }

    const notes = await this.noteRepository.findByOrder(orderId, cursor, limit + 1);

    const hasMore = notes.length > limit;
    const items = hasMore ? notes.slice(0, limit) : notes;
    const nextCursor =
      hasMore && items.length > 0
        ? items[items.length - 1]?.created_at.toISOString()
        : undefined;

    return { items, nextCursor };
  }

  async createNote(
    orderId: string,
    userId: string,
    request: CreateNoteRequest,
  ): Promise<OrderNoteEntity> {
    const order = await this.orderRepository.findOne(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // Verify user is part of the order
    if (order.partner_id !== userId && order.customer_id !== userId) {
      throw new NotFoundException('Order not found');
    }

    const note = new OrderNoteEntity();
    note.order_id = orderId;
    note.created_by = userId;
    note.note = request.note;
    note.note_type = request.note_type || 'internal';

    const created = await this.noteRepository.create(note);

    this.logger.log('Order note created', {
      orderId,
      userId,
      noteId: created.id,
    });

    return created;
  }
}

