import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { KnzOrderRepository } from '../repositories/knz-order.repository';
import { ListingRepository } from '../repositories/listing.repository';
import { FeeProfileRepository } from '../repositories/fee-profile.repository';
import { KnzOrderEntity, KnzOrderStatus, EscrowStatus } from '../entities/knz-order.entity';
import { ListingEntity, ListingStatus } from '../entities/listing.entity';
import { CreateKnzOrderDto, FulfilmentMode } from '../dto/public/create-order.dto';
import { WalletBridgeService } from './wallet-bridge.service';
import { DlsBridgeService } from './dls-bridge.service';
import { FeesAdminService } from './fees-admin.service';
import { LoggerService } from '../../../core/services/logger.service';

@Injectable()
export class PublicOrderService {
  constructor(
    private readonly orderRepository: KnzOrderRepository,
    private readonly listingRepository: ListingRepository,
    private readonly feeProfileRepository: FeeProfileRepository,
    private readonly walletBridge: WalletBridgeService,
    private readonly dlsBridge: DlsBridgeService,
    private readonly feesService: FeesAdminService,
    private readonly logger: LoggerService,
  ) {}

  async createOrder(
    createDto: CreateKnzOrderDto,
    userId: string,
    idempotencyKey: string,
  ): Promise<KnzOrderEntity> {
    const existing = await this.orderRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      this.logger.log('Idempotent order creation request', {
        idempotencyKey,
        orderId: existing.id,
      });
      return existing;
    }

    const listing = await this.listingRepository.findOne(createDto.listing_id);
    if (!listing || listing.status !== ListingStatus.ACTIVE) {
      throw new NotFoundException(`Listing ${createDto.listing_id} not found or not available`);
    }

    if (listing.seller_id === userId) {
      throw new BadRequestException('Cannot order own listing');
    }

    if (listing.quantity !== null && listing.quantity < createDto.quantity) {
      throw new ConflictException('Insufficient quantity available');
    }

    if (!listing.price) {
      throw new ConflictException('Listing has no price set');
    }

    const unitPrice = Number.parseFloat(listing.price.amount);
    const subtotal = unitPrice * createDto.quantity;

    const feeProfile = await this.feesService.findByScope({
      scope: 'category' as any,
      category_id: listing.category_id || undefined,
      status: 'active' as any,
    });

    let feePercentage = 5.0;
    if (feeProfile.length > 0) {
      feePercentage = Number.parseFloat(feeProfile[0].fee_percentage);
    }

    const fee = Math.round((subtotal * feePercentage) / 100);
    const total = subtotal + fee;

    const order = new KnzOrderEntity();
    order.buyer_id = userId;
    order.seller_id = listing.seller_id;
    order.listing_id = createDto.listing_id;
    order.quantity = createDto.quantity;
    order.pricing = {
      unit_price: {
        amount: listing.price.amount,
        currency: listing.price.currency || 'YER',
      },
      subtotal: {
        amount: subtotal.toString(),
        currency: listing.price.currency || 'YER',
      },
      fee: {
        amount: fee.toString(),
        currency: listing.price.currency || 'YER',
      },
      total: {
        amount: total.toString(),
        currency: listing.price.currency || 'YER',
      },
      fee_profile_id: feeProfile[0]?.id,
    };
    order.status = KnzOrderStatus.PENDING;
    order.escrow_status = EscrowStatus.PENDING;
    order.fulfilment_mode = createDto.fulfilment_mode || FulfilmentMode.PICKUP;
    order.shipping_address = createDto.shipping_address;
    order.notes = createDto.notes;
    order.idempotency_key = idempotencyKey;

    if (listing.quantity !== null) {
      listing.quantity -= createDto.quantity;
      if (listing.quantity <= 0) {
        listing.status = ListingStatus.SOLD_OUT;
      }
      await this.listingRepository.update(listing);
    }

    const saved = await this.orderRepository.create(order);
    this.logger.log('KNZ order created', {
      orderId: saved.id,
      buyerId: userId,
      listingId: createDto.listing_id,
      total: total.toString(),
    });

    return saved;
  }

  async getOrder(orderId: string, userId: string): Promise<KnzOrderEntity> {
    const order = await this.orderRepository.findOne(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.buyer_id !== userId && order.seller_id !== userId) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return order;
  }

  async listOrders(
    userId: string,
    options?: {
      status?: KnzOrderStatus;
      cursor?: string;
      limit?: number;
      as_buyer?: boolean;
      as_seller?: boolean;
    },
  ): Promise<{
    items: KnzOrderEntity[];
    nextCursor?: string;
  }> {
    const limit = options?.limit || 20;
    let orders: KnzOrderEntity[];

    if (options?.as_seller) {
      orders = await this.orderRepository.findBySeller(userId, {
        status: options.status,
        cursor: options.cursor,
        limit: limit + 1,
      });
    } else {
      orders = await this.orderRepository.findByBuyer(userId, {
        status: options.status,
        cursor: options.cursor,
        limit: limit + 1,
      });
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

  async fundEscrow(
    orderId: string,
    userId: string,
    idempotencyKey: string,
  ): Promise<KnzOrderEntity> {
    const order = await this.orderRepository.findOne(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.buyer_id !== userId) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.status !== KnzOrderStatus.PENDING) {
      throw new ConflictException('Order cannot be funded in current status');
    }

    if (order.escrow_status !== EscrowStatus.PENDING) {
      throw new ConflictException('Escrow already processed');
    }

    const escrowResult = await this.walletBridge.createEscrowHold({
      order_id: orderId,
      user_id: userId,
      amount_yer: Number.parseInt(order.pricing.total.amount),
      currency: order.pricing.total.currency,
      channel: 'wallet',
      metadata: {
        knz_listing_id: order.listing_id,
        fulfilment_mode: order.fulfilment_mode || 'pickup',
      },
    });

    order.escrow_account_id = escrowResult.escrow_id;
    order.escrow_status = EscrowStatus.HELD;
    order.status = KnzOrderStatus.CONFIRMED;

    const updated = await this.orderRepository.update(order);
    this.logger.log('KNZ order escrow funded', {
      orderId: order.id,
      escrowId: escrowResult.escrow_id,
    });

    return updated;
  }

  async dispatchDls(
    orderId: string,
    userId: string,
    idempotencyKey: string,
  ): Promise<{
    dls_order_id: string;
    order: KnzOrderEntity;
  }> {
    const order = await this.orderRepository.findOne(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.buyer_id !== userId && order.seller_id !== userId) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.fulfilment_mode !== FulfilmentMode.DELIVERY_THROUGH_DLS) {
      throw new BadRequestException('Order is not eligible for DLS delivery');
    }

    if (order.escrow_status !== EscrowStatus.HELD) {
      throw new ConflictException('Escrow must be held before dispatching');
    }

    const dlsResult = await this.dlsBridge.createDeliveryJob({
      knz_order_id: orderId,
      shipping_address: order.shipping_address,
      delivery_notes: order.notes,
    });

    order.status = KnzOrderStatus.PROCESSING;

    const updated = await this.orderRepository.update(order);
    this.logger.log('KNZ order dispatched to DLS', {
      orderId: order.id,
      dlsOrderId: dlsResult.dls_order_id,
    });

    return {
      dls_order_id: dlsResult.dls_order_id,
      order: updated,
    };
  }

  async cancelOrder(orderId: string, userId: string): Promise<KnzOrderEntity> {
    const order = await this.orderRepository.findOne(orderId);
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.buyer_id !== userId) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    if (order.status === KnzOrderStatus.DELIVERED || order.status === KnzOrderStatus.CANCELLED) {
      throw new ConflictException('Order cannot be cancelled in current status');
    }

    if (order.escrow_status === EscrowStatus.HELD) {
      await this.walletBridge.forfeitEscrow({
        escrow_id: order.escrow_account_id!,
        forfeit_pct: 0,
        cap_yer: 0,
        reason_code: 'cancellation_after_window',
        metadata: {
          knz_order_id: orderId,
        },
      });
    }

    order.status = KnzOrderStatus.CANCELLED;
    order.cancelled_at = new Date();
    if (order.escrow_status === EscrowStatus.HELD) {
      order.escrow_status = EscrowStatus.REFUNDED;
    }

    const updated = await this.orderRepository.update(order);
    this.logger.log('KNZ order cancelled', {
      orderId: order.id,
      userId,
    });

    return updated;
  }
}
