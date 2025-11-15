import { Migration } from '@mikro-orm/migrations';

export class Migration20250201000001_CreateWltAccountsTable extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE wlt_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_type VARCHAR(50) NOT NULL,
        owner_id VARCHAR(255),
        service_ref VARCHAR(64),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        limits JSONB,
        attributes JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_wlt_accounts_type_status ON wlt_accounts(account_type, status);
      CREATE INDEX idx_wlt_accounts_owner_type ON wlt_accounts(owner_id, account_type);
      CREATE INDEX idx_wlt_accounts_created_at ON wlt_accounts(created_at);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS wlt_accounts CASCADE;`);
  }
}

