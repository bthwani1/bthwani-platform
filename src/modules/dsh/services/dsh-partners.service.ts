import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
  ): Promise<{ items: OrderEntity[]; nextCursor?: string }> {
    const limit = filters.limit || 20;
    const status = filters.status as OrderStatus | undefined;

    let orders: OrderEntity[];
    if (status) {
      orders = await this.orderRepository.findByStatus(status, limit + 1);
    } else {
      orders = await this.orderRepository.findByStatus(OrderStatus.CONFIRMED, limit + 1);
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

  async prepareOrder(partnerId: string, orderId: string): Promise<OrderEntity> {
    const order = await this.getOrder(partnerId, orderId);

    if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PENDING) {
      throw new ForbiddenException('Order cannot be prepared in current status');
    }

    order.status = OrderStatus.PREPARING;
    await this.orderRepository.create(order);

    this.logger.log('Order preparation started', { partnerId, orderId });
    return order;
  }

  async markReady(partnerId: string, orderId: string): Promise<OrderEntity> {
    const order = await this.getOrder(partnerId, orderId);

    if (order.status !== OrderStatus.PREPARING) {
      throw new ForbiddenException('Order must be in preparing status');
    }

    order.status = OrderStatus.READY;
    await this.orderRepository.create(order);

    this.logger.log('Order marked as ready', { partnerId, orderId });
    return order;
  }
}
