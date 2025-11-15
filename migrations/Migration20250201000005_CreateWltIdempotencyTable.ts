import { Migration } from '@mikro-orm/migrations';

export class Migration20250201000005_CreateWltIdempotencyTable extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE wlt_idempotency (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        idempotency_key VARCHAR(255) NOT NULL UNIQUE,
        operation VARCHAR(64) NOT NULL,
        request_hash VARCHAR(255),
        response JSONB,
        status_code INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL
      );

      CREATE UNIQUE INDEX idx_wlt_idempotency_key ON wlt_idempotency(idempotency_key);
      CREATE INDEX idx_wlt_idempotency_expires ON wlt_idempotency(expires_at);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS wlt_idempotency CASCADE;`);
  }
}

