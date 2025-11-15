import { Migration } from '@mikro-orm/migrations';

export class Migration20250201000000_CreateSndTables extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS snd_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        requester_id VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('instant', 'specialized')),
        category_id UUID,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        images JSONB,
        location JSONB,
        address VARCHAR(500),
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'pricing_review', 'routed', 'accepted', 'in_progress', 'completed', 'cancelled', 'escalated', 'disputed', 'closed')),
        routing_type VARCHAR(50) CHECK (routing_type IN ('captain', 'specialized_provider', 'manual_queue')),
        assigned_captain_id VARCHAR(255),
        assigned_provider_id VARCHAR(255),
        price_min_yer INTEGER,
        price_max_yer INTEGER,
        price_final_yer INTEGER,
        pricing_requires_review BOOLEAN DEFAULT FALSE,
        close_code VARCHAR(6),
        close_recipient_name VARCHAR(255),
        closed_at TIMESTAMP,
        ledger_transaction_id UUID,
        ledger_entry_type VARCHAR(255),
        priced_at TIMESTAMP,
        routed_at TIMESTAMP,
        accepted_at TIMESTAMP,
        in_progress_at TIMESTAMP,
        completed_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        escalated_at TIMESTAMP,
        idempotency_key UUID,
        cancellation_reason TEXT,
        escalation_reason TEXT,
        dispute_reason TEXT,
        resolution_time_minutes INTEGER,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_snd_requests_requester ON snd_requests(requester_id, status, created_at);
      CREATE INDEX IF NOT EXISTS idx_snd_requests_type_status ON snd_requests(type, status, created_at);
      CREATE INDEX IF NOT EXISTS idx_snd_requests_category ON snd_requests(category_id, status);
      CREATE INDEX IF NOT EXISTS idx_snd_requests_routing ON snd_requests(routing_type, status);
      CREATE INDEX IF NOT EXISTS idx_snd_requests_captain ON snd_requests(assigned_captain_id, status);
      CREATE INDEX IF NOT EXISTS idx_snd_requests_provider ON snd_requests(assigned_provider_id, status);
      CREATE INDEX IF NOT EXISTS idx_snd_requests_idempotency ON snd_requests(idempotency_key);
      CREATE INDEX IF NOT EXISTS idx_snd_requests_ledger ON snd_requests(ledger_transaction_id);

      CREATE TABLE IF NOT EXISTS snd_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(100) NOT NULL UNIQUE,
        name_ar VARCHAR(255) NOT NULL,
        name_en VARCHAR(255) NOT NULL,
        description_ar TEXT,
        description_en TEXT,
        type VARCHAR(50) NOT NULL DEFAULT 'both' CHECK (type IN ('instant_only', 'specialized_only', 'both')),
        icon_url VARCHAR(255),
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        pricing_requires_review BOOLEAN DEFAULT FALSE,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_snd_categories_code ON snd_categories(code);
      CREATE INDEX IF NOT EXISTS idx_snd_categories_type_active ON snd_categories(type, is_active);

      CREATE TABLE IF NOT EXISTS snd_pricing_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scope VARCHAR(50) NOT NULL CHECK (scope IN ('global', 'region', 'category', 'category_region')),
        scope_value VARCHAR(255),
        category_id UUID,
        min_price_yer INTEGER NOT NULL,
        max_price_yer INTEGER NOT NULL,
        requires_review BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        effective_from TIMESTAMP,
        effective_until TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_snd_pricing_profiles_scope ON snd_pricing_profiles(scope, scope_value);
      CREATE INDEX IF NOT EXISTS idx_snd_pricing_profiles_category ON snd_pricing_profiles(category_id, is_active);

      CREATE TABLE IF NOT EXISTS snd_chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id UUID NOT NULL,
        sender_id VARCHAR(255) NOT NULL,
        recipient_id VARCHAR(255) NOT NULL,
        direction VARCHAR(50) NOT NULL CHECK (direction IN ('requester_to_captain', 'captain_to_requester', 'requester_to_provider', 'provider_to_requester')),
        body_encrypted TEXT NOT NULL,
        phone_masked VARCHAR(255),
        links_masked JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        is_urgent BOOLEAN DEFAULT FALSE,
        idempotency_key UUID,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_snd_chat_messages_request ON snd_chat_messages(request_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_snd_chat_messages_participants ON snd_chat_messages(sender_id, recipient_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_snd_chat_messages_idempotency ON snd_chat_messages(idempotency_key);

      CREATE TABLE IF NOT EXISTS snd_proof_closes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id UUID NOT NULL UNIQUE,
        close_code VARCHAR(6) NOT NULL,
        recipient_name VARCHAR(255) NOT NULL,
        verified_by_id VARCHAR(255) NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        verified_at TIMESTAMP,
        idempotency_key UUID,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_snd_proof_closes_request ON snd_proof_closes(request_id);
      CREATE INDEX IF NOT EXISTS idx_snd_proof_closes_code ON snd_proof_closes(close_code);
      CREATE INDEX IF NOT EXISTS idx_snd_proof_closes_idempotency ON snd_proof_closes(idempotency_key);

      CREATE TABLE IF NOT EXISTS snd_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scope VARCHAR(50) NOT NULL CHECK (scope IN ('global', 'region', 'category', 'category_region')),
        scope_value VARCHAR(255),
        category_id UUID,
        key VARCHAR(255) NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        effective_from TIMESTAMP,
        effective_until TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_snd_configs_scope ON snd_configs(scope, scope_value, key);

      CREATE TABLE IF NOT EXISTS snd_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(100) NOT NULL,
        entity_id UUID NOT NULL,
        action VARCHAR(100) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        user_role VARCHAR(255),
        old_values JSONB,
        new_values JSONB,
        reason TEXT,
        ip_address VARCHAR(255),
        user_agent VARCHAR(255),
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_snd_audit_logs_entity ON snd_audit_logs(entity_type, entity_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_snd_audit_logs_user ON snd_audit_logs(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_snd_audit_logs_action ON snd_audit_logs(action, created_at);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      DROP TABLE IF EXISTS snd_audit_logs;
      DROP TABLE IF EXISTS snd_configs;
      DROP TABLE IF EXISTS snd_proof_closes;
      DROP TABLE IF EXISTS snd_chat_messages;
      DROP TABLE IF EXISTS snd_pricing_profiles;
      DROP TABLE IF EXISTS snd_categories;
      DROP TABLE IF EXISTS snd_requests;
    `);
  }
}

