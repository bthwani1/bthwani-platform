import { Migration } from '@mikro-orm/migrations';

export class Migration20250201000004_CreateWltSettlementBatchesTable extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE wlt_settlement_batches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        total_amount BIGINT NOT NULL DEFAULT 0,
        currency VARCHAR(3) NOT NULL DEFAULT 'YER',
        period_start TIMESTAMP NOT NULL,
        period_end TIMESTAMP NOT NULL,
        first_approver_id UUID,
        first_approved_at TIMESTAMP,
        second_approver_id UUID,
        second_approved_at TIMESTAMP,
        export_file_url VARCHAR(512),
        exported_at TIMESTAMP,
        criteria JSONB,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_wlt_settlement_batches_status_created ON wlt_settlement_batches(status, created_at);
      CREATE INDEX idx_wlt_settlement_batches_partner_status ON wlt_settlement_batches(partner_id, status);
      CREATE INDEX idx_wlt_settlement_batches_period ON wlt_settlement_batches(period_start, period_end);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS wlt_settlement_batches CASCADE;`);
  }
}

