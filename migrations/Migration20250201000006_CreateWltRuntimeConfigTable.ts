import { Migration } from '@mikro-orm/migrations';

export class Migration20250201000006_CreateWltRuntimeConfigTable extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE wlt_runtime_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(128) NOT NULL,
        scope VARCHAR(20) NOT NULL,
        scope_value VARCHAR(255),
        value TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        published_by UUID,
        published_at TIMESTAMP,
        rolled_back_by UUID,
        rolled_back_at TIMESTAMP,
        previous_value TEXT,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_wlt_runtime_config_key_scope_value ON wlt_runtime_config(key, scope, scope_value);
      CREATE INDEX idx_wlt_runtime_config_status_updated ON wlt_runtime_config(status, updated_at);
      CREATE INDEX idx_wlt_runtime_config_key_status_scope ON wlt_runtime_config(key, status, scope);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS wlt_runtime_config CASCADE;`);
  }
}

