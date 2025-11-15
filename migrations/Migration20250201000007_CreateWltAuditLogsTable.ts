import { Migration } from '@mikro-orm/migrations';

export class Migration20250201000007_CreateWltAuditLogsTable extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE wlt_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(64) NOT NULL,
        entity_id UUID NOT NULL,
        action VARCHAR(100) NOT NULL,
        user_id UUID,
        user_role VARCHAR(50),
        before_state JSONB,
        after_state JSONB,
        metadata JSONB,
        trace_id VARCHAR(100),
        ip_address VARCHAR(45),
        hash VARCHAR(64),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_wlt_audit_logs_entity ON wlt_audit_logs(entity_type, entity_id);
      CREATE INDEX idx_wlt_audit_logs_user_created ON wlt_audit_logs(user_id, created_at);
      CREATE INDEX idx_wlt_audit_logs_action ON wlt_audit_logs(action);
      CREATE INDEX idx_wlt_audit_logs_trace ON wlt_audit_logs(trace_id);
      CREATE INDEX idx_wlt_audit_logs_created_at ON wlt_audit_logs(created_at);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS wlt_audit_logs CASCADE;`);
  }
}

