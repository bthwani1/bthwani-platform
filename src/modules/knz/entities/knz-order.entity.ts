import { Entity, PrimaryKey, Property, Enum } from '@mikro-orm/core';
import { randomUUID } from 'crypto';

export enum KnzOrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
  REFUNDED = 'refunded',
}

export enum EscrowStatus {
  PENDING = 'pending',
  HELD = 'held',
  RELEASED = 'released',
  REFUNDED = 'refunded',
  DISPUTED = 'disputed',
}

@Entity({ tableName: 'knz_orders' })
export class KnzOrderEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @Property({ type: 'varchar', length: 255 })
  buyer_id!: string;

  @Property({ type: 'varchar', length: 255 })
  seller_id!: string;

  @Property({ type: 'uuid' })
  listing_id!: string;

  @Property({ type: 'integer' })
  quantity!: number;

  @Property({ type: 'jsonb' })
  pricing!: {
    unit_price: { amount: string; currency: string };
    subtotal: { amount: string; currency: string };
    fee: { amount: string; currency: string };
    total: { amount: string; currency: string };
    fee_profile_id?: string;
  };

  @Enum(() => KnzOrderStatus)
  status: KnzOrderStatus = KnzOrderStatus.PENDING;

  @Enum(() => EscrowStatus)
  escrow_status: EscrowStatus = EscrowStatus.PENDING;

  @Property({ type: 'uuid', nullable: true })
  escrow_account_id?: string;

  @Property({ type: 'varchar', length: 50, nullable: true })
  fulfilment_mode?: string;

  @Property({ type: 'jsonb', nullable: true })
  shipping_address?: {
    city?: string;
    district?: string;
    street?: string;
    building?: string;
    unit?: string;
    notes?: string;
    location?: { lat: number; lon: number };
  };

  @Property({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  @Property({ type: 'varchar', length: 255, nullable: true })
  idempotency_key?: string;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();

  @Property({ type: 'timestamp', onUpdate: () => new Date() })
  updated_at: Date = new Date();

  @Property({ type: 'timestamp', nullable: true })
  cancelled_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  delivered_at?: Date;

  @Property({ type: 'timestamp', nullable: true })
  escrow_released_at?: Date;
}
