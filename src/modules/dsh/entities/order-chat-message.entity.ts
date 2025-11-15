import { Entity, PrimaryKey, Property, Index, ManyToOne } from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { OrderEntity } from './order.entity';

@Entity({ tableName: 'dsh_order_chat_messages' })
@Index({ properties: ['order_id', 'created_at'] })
@Index({ properties: ['sender_id', 'created_at'] })
export class OrderChatMessageEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne(() => OrderEntity)
  order!: OrderEntity;

  @Property({ type: 'uuid' })
  order_id!: string;

  @Property({ type: 'varchar', length: 255 })
  sender_id!: string;

  @Property({ type: 'varchar', length: 255 })
  recipient_id!: string;

  @Property({ type: 'text' })
  body!: string;

  @Property({ type: 'boolean', default: false })
  phone_masked: boolean = false;

  @Property({ type: 'boolean', default: false })
  links_masked: boolean = false;

  @Property({ type: 'boolean', default: false })
  is_read: boolean = false;

  @Property({ type: 'timestamp', nullable: true })
  read_at?: Date;

  @Property({ type: 'uuid', nullable: true })
  idempotency_key?: string;

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();
}

