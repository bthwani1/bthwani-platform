import { Migration } from '@mikro-orm/migrations';

export class Migration20250201000002_CreateWltJournalEntriesTable extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE wlt_journal_entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID NOT NULL,
        entry_type VARCHAR(20) NOT NULL,
        category VARCHAR(50) NOT NULL,
        amount BIGINT NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'YER',
        transaction_ref VARCHAR(255),
        service_ref VARCHAR(64),
        batch_id UUID,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        metadata JSONB,
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        posted_at TIMESTAMP,
        reversed_at TIMESTAMP,
        CONSTRAINT fk_wlt_journal_entries_account FOREIGN KEY (account_id) REFERENCES wlt_accounts(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_wlt_journal_entries_account_created ON wlt_journal_entries(account_id, created_at);
      CREATE INDEX idx_wlt_journal_entries_transaction_type ON wlt_journal_entries(transaction_ref, entry_type);
      CREATE INDEX idx_wlt_journal_entries_service_category ON wlt_journal_entries(service_ref, category);
      CREATE INDEX idx_wlt_journal_entries_batch ON wlt_journal_entries(batch_id);
      CREATE INDEX idx_wlt_journal_entries_created_at ON wlt_journal_entries(created_at);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS wlt_journal_entries CASCADE;`);
  }
}

