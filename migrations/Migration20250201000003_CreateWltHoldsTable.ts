import { Migration } from '@mikro-orm/migrations';

export class Migration20250201000003_CreateWltHoldsTable extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE wlt_holds (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        amount BIGINT NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'YER',
        external_ref VARCHAR(255) NOT NULL,
        service_ref VARCHAR(64) NOT NULL,
        release_rules JSONB,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        released_at TIMESTAMP,
        captured_at TIMESTAMP,
        forfeited_at TIMESTAMP,
        CONSTRAINT fk_wlt_holds_account FOREIGN KEY (account_id) REFERENCES wlt_accounts(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_wlt_holds_account_status ON wlt_holds(account_id, status);
      CREATE INDEX idx_wlt_holds_external_service ON wlt_holds(external_ref, service_ref);
      CREATE INDEX idx_wlt_holds_created_at ON wlt_holds(created_at);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS wlt_holds CASCADE;`);
  }
}

