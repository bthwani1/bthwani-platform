import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  ASSIGNED = 'assigned',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export enum PaymentMethod {
  WALLET = 'wallet',
  CASH = 'cash',
  CARD = 'card',
}

export enum PaymentStatus {
  PENDING = 'pending',
  AUTHORIZED = 'authorized',
  CAPTURED = 'captured',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

@Entity({ tableName: 'orders' })
export class OrderEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 255 })
  customer_id!: string;

  @Property({ type: 'jsonb', nullable: true })
  delivery_address?: {
    city?: string;
    district?: string;
    street?: string;
    building?: string;
    unit?: string;
    notes?: string;
    location?: { lat: number; lon: number };
  };

  @Property({ type: 'varchar', length: 100, nullable: true })
  slot_id?: string;

  @Enum(() => PaymentMethod)
  payment_method!: PaymentMethod;

  @Enum(() => PaymentStatus)
  payment_status: PaymentStatus = PaymentStatus.PENDING;

  @Enum(() => OrderStatus)
  status: OrderStatus = OrderStatus.PENDING;

  @Property({ type: 'jsonb' })
  items!: Array<{
    sku: string;
    name?: string;
    quantity: number;
    unit_price?: { amount: string; currency: string };
    addons?: string[];
    notes?: string;
  }>;

  @Property({ type: 'jsonb', nullable: true })
  pricing?: {
    subtotal: { amount: string; currency: string };
    delivery_fee?: { amount: string; currency: string };
    tax?: { amount: string; currency: string };
    total: { amount: string; currency: string };
  };

  @Property({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  @Property({ type: 'uuid', nullable: true })
  captain_id?: string;

  @Property({ type: 'uuid', nullable: true })
  partner_id?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  idempotency_key?: string;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();

  @Property({ type: 'timestamp', nullable: true })
  cancelled_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  delivered_at?: Date;
}
