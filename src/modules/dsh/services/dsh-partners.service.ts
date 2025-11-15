import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { OrderRepository } from '../repositories/order.repository';
import { OrderEntity, OrderStatus } from '../entities/order.entity';
import { LoggerService } from '../../../core/services/logger.service';

@Injectable()
export class DshPartnersService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly logger: LoggerService,
  ) {}

  async getProfile(partnerId: string): Promise<{ id: string; name?: string; status?: string }> {
    // TODO: Fetch from partner entity/repository
    return {
      id: partnerId,
      status: 'active',
    };
  }

  async listOrders(
    partnerId: string,
    filters: { status?: string; cursor?: string; limit?: number },
  ): Promise<{ items: OrderEntity[]; nextCursor?: string; prevCursor?: string }> {
    const limit = Math.min(filters.limit || 20, 100);
    const status = filters.status as OrderStatus | undefined;

    let orders: OrderEntity[];
    if (status) {
      orders = await this.orderRepository.findByStatus(status, limit + 1);
    } else {
      orders = await this.orderRepository.findByStatus(OrderStatus.PENDING, limit + 1);
    }

    orders = orders.filter((order) => order.partner_id === partnerId);

    const hasMore = orders.length > limit;
    const items = hasMore ? orders.slice(0, limit) : orders;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }

  async getOrder(partnerId: string, orderId: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.partner_id !== partnerId) {
      throw new ForbiddenException('Order not assigned to this partner');
    }

    return order;
  }

  async acceptOrder(
    partnerId: string,
    orderId: string,
    idempotencyKey: string,
  ): Promise<OrderEntity> {
    const order = await this.getOrder(partnerId, orderId);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Order cannot be accepted in current status: ${order.status}`,
      );
    }

    // Check idempotency
    const existingOrder = await this.orderRepository.findByIdempotencyKey(idempotencyKey);
    if (existingOrder && existingOrder.id === orderId) {
      this.logger.log('Order accept operation is idempotent', {
        partnerId,
        orderId,
        idempotencyKey,
      });
      return existingOrder;
    }

    order.status = OrderStatus.CONFIRMED;
    order.idempotency_key = idempotencyKey;
    await this.orderRepository.create(order);

    this.logger.log('Order accepted', { partnerId, orderId, idempotencyKey });
    return order;
  }

  async rejectOrder(
    partnerId: string,
    orderId: string,
    idempotencyKey: string,
    reason: string,
  ): Promise<OrderEntity> {
    const order = await this.getOrder(partnerId, orderId);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Order cannot be rejected in current status: ${order.status}`,
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('Rejection reason is required');
    }

    // Check idempotency
    const existingOrder = await this.orderRepository.findByIdempotencyKey(idempotencyKey);
    if (existingOrder && existingOrder.id === orderId) {
      this.logger.log('Order reject operation is idempotent', {
        partnerId,
        orderId,
        idempotencyKey,
      });
      return existingOrder;
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelled_at = new Date();
    order.notes = `Rejected by partner: ${reason}`;
    order.idempotency_key = idempotencyKey;
    await this.orderRepository.create(order);

    this.logger.log('Order rejected', { partnerId, orderId, reason, idempotencyKey });
    return order;
  }

  async prepareOrder(
    partnerId: string,
    orderId: string,
    idempotencyKey: string,
  ): Promise<OrderEntity> {
    const order = await this.getOrder(partnerId, orderId);

    if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Order cannot be prepared in current status: ${order.status}`,
      );
    }

    // Check idempotency
    const existingOrder = await this.orderRepository.findByIdempotencyKey(idempotencyKey);
    if (existingOrder && existingOrder.id === orderId) {
      this.logger.log('Order prepare operation is idempotent', {
        partnerId,
        orderId,
        idempotencyKey,
      });
      return existingOrder;
    }

    order.status = OrderStatus.PREPARING;
    order.idempotency_key = idempotencyKey;
    await this.orderRepository.create(order);

    this.logger.log('Order preparation started', { partnerId, orderId, idempotencyKey });
    return order;
  }

  async markReady(
    partnerId: string,
    orderId: string,
    idempotencyKey: string,
  ): Promise<OrderEntity> {
    const order = await this.getOrder(partnerId, orderId);

    if (order.status !== OrderStatus.PREPARING) {
      throw new BadRequestException(
        `Order must be in preparing status, current status: ${order.status}`,
      );
    }

    // Check idempotency
    const existingOrder = await this.orderRepository.findByIdempotencyKey(idempotencyKey);
    if (existingOrder && existingOrder.id === orderId) {
      this.logger.log('Order mark ready operation is idempotent', {
        partnerId,
        orderId,
        idempotencyKey,
      });
      return existingOrder;
    }

    order.status = OrderStatus.READY;
    order.idempotency_key = idempotencyKey;
    await this.orderRepository.create(order);

    this.logger.log('Order marked as ready', { partnerId, orderId, idempotencyKey });
    return order;
  }

  async handoffOrder(
    partnerId: string,
    orderId: string,
    idempotencyKey: string,
  ): Promise<OrderEntity> {
    const order = await this.getOrder(partnerId, orderId);

    if (order.status !== OrderStatus.READY) {
      throw new BadRequestException(
        `Order must be in ready status, current status: ${order.status}`,
      );
    }

    // Check idempotency
    const existingOrder = await this.orderRepository.findByIdempotencyKey(idempotencyKey);
    if (existingOrder && existingOrder.id === orderId) {
      this.logger.log('Order handoff operation is idempotent', {
        partnerId,
        orderId,
        idempotencyKey,
      });
      return existingOrder;
    }

    order.status = OrderStatus.ASSIGNED;
    order.idempotency_key = idempotencyKey;
    await this.orderRepository.create(order);

    this.logger.log('Order handed off to platform', { partnerId, orderId, idempotencyKey });
    return order;
  }
}
