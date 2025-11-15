import { Migration } from '@mikro-orm/migrations';

export class Migration20250201000008_CreateDshCategoriesTable extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS dsh_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(100) NOT NULL UNIQUE,
        name_ar VARCHAR(255) NOT NULL,
        name_en VARCHAR(255) NOT NULL,
        description_ar TEXT,
        description_en TEXT,
        icon_url VARCHAR(255),
        image_url VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_featured BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        tags JSONB,
        available_regions JSONB,
        available_cities JSONB,
        var_enabled VARCHAR(255),
        metadata JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR(255),
        updated_by VARCHAR(255)
      );

      CREATE INDEX IF NOT EXISTS idx_dsh_categories_code ON dsh_categories(code);
      CREATE INDEX IF NOT EXISTS idx_dsh_categories_status_sort ON dsh_categories(status, sort_order);
      CREATE INDEX IF NOT EXISTS idx_dsh_categories_featured ON dsh_categories(is_featured);
      CREATE INDEX IF NOT EXISTS idx_dsh_categories_tags ON dsh_categories USING GIN(tags);
      CREATE INDEX IF NOT EXISTS idx_dsh_categories_regions ON dsh_categories USING GIN(available_regions);
      CREATE INDEX IF NOT EXISTS idx_dsh_categories_cities ON dsh_categories USING GIN(available_cities);
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      DROP INDEX IF EXISTS idx_dsh_categories_cities;
      DROP INDEX IF EXISTS idx_dsh_categories_regions;
      DROP INDEX IF EXISTS idx_dsh_categories_tags;
      DROP INDEX IF EXISTS idx_dsh_categories_featured;
      DROP INDEX IF EXISTS idx_dsh_categories_status_sort;
      DROP INDEX IF EXISTS idx_dsh_categories_code;
      DROP TABLE IF EXISTS dsh_categories;
    `);
  }
}

