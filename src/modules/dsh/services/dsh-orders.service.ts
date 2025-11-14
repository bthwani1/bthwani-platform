import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateOrderDto } from '../dto/create-order.dto';
import { ListOrdersDto } from '../dto/list-orders.dto';
import { OrderRepository } from '../repositories/order.repository';
import { OrderEntity, OrderStatus, PaymentMethod, PaymentStatus } from '../entities/order.entity';
import { WltService } from '../../../shared/services/wlt.service';
import { PricingService } from '../../../shared/services/pricing.service';
import { CatalogService } from '../../../shared/services/catalog.service';
import { LoggerService } from '../../../core/services/logger.service';

@Injectable()
export class DshOrdersService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly wltService: WltService,
    private readonly pricingService: PricingService,
    private readonly catalogService: CatalogService,
    private readonly logger: LoggerService,
  ) {}

  async createOrder(
    createOrderDto: CreateOrderDto,
    idempotencyKey: string,
    customerId: string,
  ): Promise<OrderEntity> {
    // Check idempotency
    const existingOrder = await this.orderRepository.findByIdempotencyKey(idempotencyKey);
    if (existingOrder) {
      this.logger.log('Idempotent order creation request', {
        idempotencyKey,
        orderId: existingOrder.id,
      });
      return existingOrder;
    }

    // Validate products exist in catalog
    const skus = createOrderDto.items.map((item) => item.sku);
    const validation = await this.catalogService.validateProducts(skus);
    if (validation.invalid.length > 0) {
      throw new ConflictException(
        `Invalid or unavailable products: ${validation.invalid.join(', ')}`,
      );
    }

    // Calculate pricing using pricing service
    const pricingRequest: {
      items: Array<{ sku: string; quantity: number }>;
      deliveryAddress?: { location?: { lat: number; lon: number } };
    } = {
      items: createOrderDto.items.map((item) => ({ sku: item.sku, quantity: item.quantity })),
    };
    if (createOrderDto.delivery_address?.location) {
      pricingRequest.deliveryAddress = {
        location: createOrderDto.delivery_address.location,
      };
    }
    const pricing = await this.pricingService.calculatePricing(pricingRequest);

    // Create order entity
    const order = new OrderEntity();
    order.customer_id = customerId;
    order.items = createOrderDto.items.map((item) => {
      const mappedItem: {
        sku: string;
        name?: string;
        quantity: number;
        unit_price?: { amount: string; currency: string };
        addons?: string[];
        notes?: string;
      } = {
        sku: item.sku,
        quantity: item.quantity,
      };
      if (item.name) {
        mappedItem.name = item.name;
      }
      if (item.unit_price) {
        mappedItem.unit_price = {
          amount: item.unit_price.amount,
          currency: item.unit_price.currency || 'YER',
        };
      }
      if (item.addons) {
        mappedItem.addons = item.addons;
      }
      if (item.notes) {
        mappedItem.notes = item.notes;
      }
      return mappedItem;
    });
    if (createOrderDto.delivery_address) {
      order.delivery_address = createOrderDto.delivery_address;
    }
    if (createOrderDto.slot_id) {
      order.slot_id = createOrderDto.slot_id;
    }
    order.payment_method = (createOrderDto.payment_method as PaymentMethod) || PaymentMethod.WALLET;
    order.payment_status = PaymentStatus.PENDING;
    order.status = OrderStatus.PENDING;
    order.pricing = {
      subtotal: pricing.subtotal,
      delivery_fee: pricing.deliveryFee,
      total: pricing.total,
    };
    if (createOrderDto.notes) {
      order.notes = createOrderDto.notes;
    }
    order.idempotency_key = idempotencyKey;

    // Authorize payment if using wallet
    if (order.payment_method === PaymentMethod.WALLET) {
      try {
        const paymentResponse = await this.wltService.authorizePayment({
          amount: pricing.total.amount,
          currency: pricing.total.currency,
          orderId: order.id,
          customerId,
          idempotencyKey,
        });

        if (paymentResponse.status === 'authorized') {
          order.payment_status = PaymentStatus.AUTHORIZED;
        } else {
          throw new ConflictException('Payment authorization failed');
        }
      } catch (error) {
        this.logger.error(
          'Payment authorization failed',
          error instanceof Error ? error.stack : String(error),
          {
            orderId: order.id,
            customerId,
          },
        );
        throw new ConflictException('Payment authorization failed');
      }
    }

    // Save order
    const savedOrder = await this.orderRepository.create(order);
    this.logger.log('Order created', {
      orderId: savedOrder.id,
      customerId,
      total: pricing.total.amount,
    });

    return savedOrder;
  }

  async getOrder(orderId: string, customerId?: string): Promise<OrderEntity> {
    const order = await this.orderRepository.findOne(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    // RBAC check: customer can only see their own orders
    if (customerId && order.customer_id !== customerId) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  async listOrders(
    query: ListOrdersDto,
    customerId?: string,
  ): Promise<{
    items: OrderEntity[];
    nextCursor?: string;
    prevCursor?: string;
  }> {
    const limit = query.limit || 20;

    if (customerId) {
      const orders = await this.orderRepository.findByCustomerId(
        customerId,
        query.cursor,
        limit + 1,
      );

      const hasMore = orders.length > limit;
      const items = hasMore ? orders.slice(0, limit) : orders;
      const nextCursor =
        hasMore && items.length > 0 ? items[items.length - 1]?.created_at.toISOString() : undefined;

      return {
        items,
        ...(nextCursor && { nextCursor }),
      };
    }

    // TODO: Admin/partner listing with filters
    throw new Error('Admin/partner listing not implemented');
  }
}
