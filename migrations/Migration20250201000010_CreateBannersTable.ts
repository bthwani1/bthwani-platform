import { Migration } from '@mikro-orm/migrations';

export class Migration20250201000010_CreateBannersTable extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS banners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL CHECK (type IN ('dsh', 'knz', 'arb')),
        title_ar VARCHAR(255) NOT NULL,
        title_en VARCHAR(255) NOT NULL,
        description_ar TEXT,
        description_en TEXT,
        image_url VARCHAR(500) NOT NULL,
        action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('open_category', 'open_store', 'open_listing', 'open_offer', 'open_flow')),
        action_target VARCHAR(500) NOT NULL,
        priority INTEGER NOT NULL DEFAULT 0,
        tags JSONB,
        available_regions JSONB,
        available_cities JSONB,
        start_date TIMESTAMP,
        end_date TIMESTAMP,
        status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR(255),
        updated_by VARCHAR(255)
      );

      CREATE INDEX IF NOT EXISTS idx_banners_type_status_priority ON banners(type, status, priority);
      CREATE INDEX IF NOT EXISTS idx_banners_dates ON banners(start_date, end_date);
      CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active);
      CREATE INDEX IF NOT EXISTS idx_banners_tags ON banners USING GIN(tags);
      CREATE INDEX IF NOT EXISTS idx_banners_regions ON banners USING GIN(available_regions);
      CREATE INDEX IF NOT EXISTS idx_banners_cities ON banners USING GIN(available_cities);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      DROP INDEX IF EXISTS idx_banners_cities;
      DROP INDEX IF EXISTS idx_banners_regions;
      DROP INDEX IF EXISTS idx_banners_tags;
      DROP INDEX IF EXISTS idx_banners_active;
      DROP INDEX IF EXISTS idx_banners_dates;
      DROP INDEX IF EXISTS idx_banners_type_status_priority;
      DROP TABLE IF EXISTS banners;
    `);
  }
}

