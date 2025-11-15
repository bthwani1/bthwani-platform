import { Migration } from '@mikro-orm/migrations';

export class Migration20250115000001_CreateEsfTables extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS esf_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        requester_id VARCHAR(255) NOT NULL,
        patient_name VARCHAR(255) NOT NULL,
        hospital_name VARCHAR(255) NOT NULL,
        city VARCHAR(255) NOT NULL,
        district VARCHAR(255),
        hospital_address VARCHAR(500),
        location JSONB,
        abo_type VARCHAR(10) NOT NULL CHECK (abo_type IN ('A', 'B', 'AB', 'O')),
        rh_factor VARCHAR(10) NOT NULL CHECK (rh_factor IN ('+', '-')),
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'confirmed', 'completed', 'cancelled', 'closed')),
        notes TEXT,
        idempotency_key UUID,
        matched_at TIMESTAMP,
        confirmed_at TIMESTAMP,
        completed_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        closed_at TIMESTAMP,
        match_time_minutes INTEGER,
        is_abuse BOOLEAN DEFAULT FALSE,
        abuse_reason VARCHAR(500),
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_esf_requests_requester ON esf_requests(requester_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_esf_requests_city_status ON esf_requests(city, status, created_at);
      CREATE INDEX IF NOT EXISTS idx_esf_requests_blood_type ON esf_requests(abo_type, rh_factor, status);
      CREATE INDEX IF NOT EXISTS idx_esf_requests_idempotency ON esf_requests(idempotency_key);

      CREATE TABLE IF NOT EXISTS esf_donor_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL UNIQUE,
        abo_type VARCHAR(10) CHECK (abo_type IN ('A', 'B', 'AB', 'O')),
        rh_factor VARCHAR(10) CHECK (rh_factor IN ('+', '-')),
        is_available BOOLEAN DEFAULT FALSE,
        city VARCHAR(255),
        district VARCHAR(255),
        location JSONB,
        last_donation_at TIMESTAMP,
        cooldown_days INTEGER,
        cooldown_until TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_esf_donor_profiles_available ON esf_donor_profiles(is_available, abo_type, rh_factor, city);
      CREATE INDEX IF NOT EXISTS idx_esf_donor_profiles_cooldown ON esf_donor_profiles(last_donation_at);

      CREATE TABLE IF NOT EXISTS esf_chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id UUID NOT NULL,
        sender_id VARCHAR(255) NOT NULL,
        recipient_id VARCHAR(255) NOT NULL,
        direction VARCHAR(50) NOT NULL CHECK (direction IN ('requester_to_donor', 'donor_to_requester')),
        body_encrypted TEXT NOT NULL,
        phone_masked VARCHAR(255),
        links_masked JSONB,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        is_urgent BOOLEAN DEFAULT FALSE,
        metadata JSONB,
        idempotency_key UUID,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_esf_chat_messages_request ON esf_chat_messages(request_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_esf_chat_messages_participants ON esf_chat_messages(sender_id, recipient_id, created_at);

      CREATE TABLE IF NOT EXISTS esf_matches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id UUID NOT NULL,
        donor_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
        distance_km INTEGER,
        notified_at TIMESTAMP,
        accepted_at TIMESTAMP,
        declined_at TIMESTAMP,
        expired_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_esf_matches_request ON esf_matches(request_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_esf_matches_donor ON esf_matches(donor_id, status);
      CREATE INDEX IF NOT EXISTS idx_esf_matches_request_donor ON esf_matches(request_id, donor_id);

      CREATE TABLE IF NOT EXISTS esf_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scope VARCHAR(100) NOT NULL,
        key VARCHAR(255) NOT NULL,
        value TEXT NOT NULL,
        description VARCHAR(500),
        updated_by VARCHAR(255),
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(scope, key)
      );

      CREATE INDEX IF NOT EXISTS idx_esf_config_scope_key ON esf_config(scope, key);

      CREATE TABLE IF NOT EXISTS esf_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('request', 'donor_profile', 'chat_message', 'match', 'config')),
        entity_id VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL CHECK (action IN ('create_request', 'update_request', 'cancel_request', 'close_request', 'update_availability', 'create_message', 'mark_abuse', 'apply_action', 'update_config')),
        user_id VARCHAR(255),
        user_email VARCHAR(255),
        old_values JSONB,
        new_values JSONB,
        reason VARCHAR(500),
        ip_address VARCHAR(255),
        user_agent VARCHAR(500),
        trace_id VARCHAR(255),
        request_metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_esf_audit_logs_entity ON esf_audit_logs(entity_type, entity_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_esf_audit_logs_user ON esf_audit_logs(user_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_esf_audit_logs_action ON esf_audit_logs(action, created_at);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      DROP TABLE IF EXISTS esf_audit_logs;
      DROP TABLE IF EXISTS esf_config;
      DROP TABLE IF EXISTS esf_matches;
      DROP TABLE IF EXISTS esf_chat_messages;
      DROP TABLE IF EXISTS esf_donor_profiles;
      DROP TABLE IF EXISTS esf_requests;
    `);
  }
}

