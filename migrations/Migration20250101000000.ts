import { Migration } from '@mikro-orm/migrations';

export class Migration20250101000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id VARCHAR(255) NOT NULL,
        delivery_address JSONB,
        slot_id VARCHAR(100),
        payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('wallet', 'cash', 'card')),
        payment_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'authorized', 'captured', 'failed', 'refunded')),
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'disputed')),
        items JSONB NOT NULL,
        pricing JSONB,
        notes VARCHAR(500),
        captain_id UUID,
        partner_id UUID,
        idempotency_key UUID UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        cancelled_at TIMESTAMP,
        delivered_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON orders(idempotency_key);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_orders_captain_id ON orders(captain_id);
      CREATE INDEX IF NOT EXISTS idx_orders_partner_id ON orders(partner_id);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      DROP TABLE IF EXISTS orders CASCADE;
    `);
  }
}
