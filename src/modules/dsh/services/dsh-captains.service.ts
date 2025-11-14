import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { OrderRepository } from '../repositories/order.repository';
import { OrderEntity, OrderStatus } from '../entities/order.entity';
import { LoggerService } from '../../../core/services/logger.service';

@Injectable()
export class DshCaptainsService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly logger: LoggerService,
  ) {}

  async getProfile(captainId: string): Promise<{ id: string; name?: string; status?: string }> {
    // TODO: Fetch from captain entity/repository
    return {
      id: captainId,
      status: 'active',
    };
  }

  async listOrders(
    captainId: string,
    filters: { status?: string; cursor?: string; limit?: number },
  ): Promise<{ items: OrderEntity[]; nextCursor?: string }> {
    const limit = filters.limit || 20;
    const status = filters.status as OrderStatus | undefined;

    let orders: OrderEntity[];
    if (status) {
      orders = await this.orderRepository.findByStatus(status, limit + 1);
      orders = orders.filter((order) => order.captain_id === captainId);
    } else {
      orders = await this.orderRepository.findByStatus(OrderStatus.ASSIGNED, limit + 1);
      orders = orders.filter((order) => order.captain_id === captainId);
    }

    const hasMore = orders.length > limit;
    const items = hasMore ? orders.slice(0, limit) : orders;
    const nextCursor =
      hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

    return {
      items,
      ...(nextCursor && { nextCursor }),
    };
  }

  async getOrder(captainId: string, orderId: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.captain_id !== captainId) {
      throw new ForbiddenException('Order not assigned to this captain');
    }

    return order;
  }

  async acceptOrder(captainId: string, orderId: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.status !== OrderStatus.ASSIGNED) {
      throw new ForbiddenException('Order is not in assigned status');
    }

    order.captain_id = captainId;
    order.status = OrderStatus.PICKED_UP;
    await this.orderRepository.create(order);

    this.logger.log('Order accepted by captain', { captainId, orderId });
    return order;
  }

  async pickupOrder(captainId: string, orderId: string): Promise<OrderEntity> {
    const order = await this.getOrder(captainId, orderId);

    if (order.status !== OrderStatus.ASSIGNED && order.status !== OrderStatus.READY) {
      throw new ForbiddenException('Order cannot be picked up in current status');
    }

    order.status = OrderStatus.PICKED_UP;
    await this.orderRepository.create(order);

    this.logger.log('Order picked up', { captainId, orderId });
    return order;
  }

  async deliverOrder(
    captainId: string,
    orderId: string,
    deliveryProof: { signature?: string; photo?: string },
  ): Promise<OrderEntity> {
    const order = await this.getOrder(captainId, orderId);

    if (order.status !== OrderStatus.PICKED_UP && order.status !== OrderStatus.IN_TRANSIT) {
      throw new ForbiddenException('Order cannot be delivered in current status');
    }

    order.status = OrderStatus.DELIVERED;
    order.delivered_at = new Date();
    await this.orderRepository.create(order);

    this.logger.log('Order delivered', { captainId, orderId, deliveryProof });
    return order;
  }
}
