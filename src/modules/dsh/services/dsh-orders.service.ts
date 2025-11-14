import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateOrderDto } from '../dto/create-order.dto';
import { ListOrdersDto } from '../dto/list-orders.dto';
import { OrderRepository } from '../repositories/order.repository';
import { OrderEntity, OrderStatus, PaymentMethod, PaymentStatus } from '../entities/order.entity';
import { WltService } from '../../../shared/services/wlt.service';
import { PricingService } from '../../../shared/services/pricing.service';
import { CatalogService } from '../../../shared/services/catalog.service';
import { LoggerService } from '../../../core/services/logger.service';
import { DshIncentivesService } from './dsh-incentives.service';
import { IncentivesCalculationContext } from '../types/incentives.types';

type OrderPricing = NonNullable<OrderEntity['pricing']>;
type PricingAdjustmentRecord =
  NonNullable<OrderPricing['adjustments']> extends Array<infer R> ? R : never;

@Injectable()
export class DshOrdersService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly wltService: WltService,
    private readonly pricingService: PricingService,
    private readonly catalogService: CatalogService,
    private readonly incentivesService: DshIncentivesService,
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
    const baseSubtotal = this.toMinorUnits(pricing.subtotal.amount);
    const baseDeliveryFee = this.toMinorUnits(pricing.deliveryFee.amount);

    const incentivesContext: IncentivesCalculationContext = {
      baseSubtotalYer: baseSubtotal,
      baseDeliveryFeeYer: baseDeliveryFee,
      ...(createOrderDto.delivery_address?.city && { city: createOrderDto.delivery_address.city }),
      ...(createOrderDto.primary_category && { primaryCategory: createOrderDto.primary_category }),
      ...(createOrderDto.subscription_plan_id && {
        subscriptionPlanId: createOrderDto.subscription_plan_id,
      }),
      ...(createOrderDto.coupon_code && { couponCode: createOrderDto.coupon_code }),
      ...(typeof createOrderDto.redeem_points === 'number' && {
        pointsToRedeem: createOrderDto.redeem_points,
      }),
      ...(createOrderDto.user_type && { userType: createOrderDto.user_type }),
    };

    const incentivesResult = this.incentivesService.applyIncentives(incentivesContext);
    const currency = pricing.total.currency || 'YER';
    const totalAmountAfterIncentives = incentivesResult.totalYer.toString();

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
    const pricingPayload: OrderPricing = {
      subtotal: {
        amount: incentivesResult.subtotalYer.toString(),
        currency,
      },
      delivery_fee: {
        amount: incentivesResult.deliveryFeeYer.toString(),
        currency,
      },
      total: {
        amount: totalAmountAfterIncentives,
        currency,
      },
      adjustments: incentivesResult.adjustments.map((adjustment) => {
        const record: PricingAdjustmentRecord = {
          id: adjustment.id,
          label: adjustment.label,
          source: adjustment.source,
          target: adjustment.target,
          mode: adjustment.mode,
          amount: {
            amount: adjustment.amountYer.toString(),
            currency,
          },
        };
        if (adjustment.metadata) {
          record.metadata = adjustment.metadata;
        }
        return record;
      }),
    };
    if (pricing.tax) {
      pricingPayload.tax = pricing.tax;
    }
    if (pricing.breakdown) {
      pricingPayload.breakdown = pricing.breakdown;
    }
    if (incentivesResult.guardrailViolations?.length) {
      pricingPayload.guardrail_violations = incentivesResult.guardrailViolations;
    }
    if (createOrderDto.subscription_plan_id) {
      pricingPayload.subscription_plan_id = createOrderDto.subscription_plan_id;
    }
    const couponCodeToPersist = incentivesResult.appliedCouponCode ?? createOrderDto.coupon_code;
    if (couponCodeToPersist) {
      pricingPayload.coupon_code = couponCodeToPersist;
    }
    if (incentivesResult.pointsRedeemed && incentivesResult.pointsRedeemed > 0) {
      pricingPayload.points_redeemed = incentivesResult.pointsRedeemed;
    }
    order.pricing = pricingPayload;
    if (createOrderDto.notes) {
      order.notes = createOrderDto.notes;
    }
    order.idempotency_key = idempotencyKey;

    // Authorize payment if using wallet
    if (order.payment_method === PaymentMethod.WALLET) {
      try {
        const paymentResponse = await this.wltService.authorizePayment({
          amount: totalAmountAfterIncentives,
          currency,
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
      total: totalAmountAfterIncentives,
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

  private toMinorUnits(amount: string): number {
    const parsed = Number(amount);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
}
