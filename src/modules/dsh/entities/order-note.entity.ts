import { Entity, PrimaryKey, Property, Index, ManyToOne } from '@mikro-orm/core';
import { randomUUID } from 'crypto';
import { OrderEntity } from './order.entity';

@Entity({ tableName: 'dsh_order_notes' })
@Index({ properties: ['order_id', 'created_at'] })
@Index({ properties: ['created_by', 'created_at'] })
export class OrderNoteEntity {
  @PrimaryKey({ type: 'uuid' })
  id: string = randomUUID();

  @ManyToOne(() => OrderEntity)
  order!: OrderEntity;

  @Property({ type: 'uuid' })
  order_id!: string;

  @Property({ type: 'varchar', length: 255 })
  created_by!: string;

  @Property({ type: 'text' })
  note!: string;

  @Property({ type: 'varchar', length: 50, nullable: true })
  note_type?: string; // 'internal', 'customer', 'system'

  @Property({ type: 'timestamp', default: 'now()' })
  created_at: Date = new Date();
}

