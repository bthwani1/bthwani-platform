import { Migration } from '@mikro-orm/migrations';

/**
 * Migration to create runtime_config table for control panel managed configurations
 */
export class Migration20250215000000_CreateRuntimeConfigTable extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS runtime_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT,
        type VARCHAR(50),
        description TEXT,
        is_placeholder BOOLEAN NOT NULL DEFAULT false,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_sensitive BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(255)
      );

      CREATE INDEX IF NOT EXISTS idx_runtime_config_key ON runtime_config(key);
      CREATE INDEX IF NOT EXISTS idx_runtime_config_active ON runtime_config(is_active);
      CREATE INDEX IF NOT EXISTS idx_runtime_config_placeholder ON runtime_config(is_placeholder, is_active);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS runtime_config CASCADE;`);
  }
}

