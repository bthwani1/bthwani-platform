# Migration Deployment Guide

## Overview

This guide explains how to deploy the new migrations for:
1. DSH Categories table
2. Thwani requests category code
3. Banners table

## Prerequisites

- Database connection configured in `.env`
- PostgreSQL database running
- Node.js and npm installed

## Migration Files

The following migrations need to be run:

1. `Migration20250201000008_CreateDshCategoriesTable.ts`
2. `Migration20250201000009_AddDshCategoryCodeToThwaniRequests.ts`
3. `Migration20250201000010_CreateBannersTable.ts`

## Option 1: Run Migrations via SQL (Recommended)

If MikroORM CLI has issues with entity discovery, you can run the migrations directly via SQL:

### Step 1: Connect to PostgreSQL

```bash
psql -h localhost -U postgres -d bthwani_dsh
```

### Step 2: Run Migration 1 (DSH Categories)

```sql
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
```

### Step 3: Run Migration 2 (Thwani Category Code)

```sql
-- Add dsh_category_code column to thwani_requests if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'thwani_requests') THEN
    ALTER TABLE thwani_requests
    ADD COLUMN IF NOT EXISTS dsh_category_code VARCHAR(100);
    
    -- Set default value for existing records
    UPDATE thwani_requests
    SET dsh_category_code = 'dsh_quick_task'
    WHERE dsh_category_code IS NULL;
    
    -- Create index
    CREATE INDEX IF NOT EXISTS idx_thwani_requests_dsh_category_code 
    ON thwani_requests(dsh_category_code);
  END IF;
END $$;
```

### Step 4: Run Migration 3 (Banners)

```sql
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
```

## Option 2: Run Seeder (DSH Categories)

After running migrations, seed the default DSH categories:

### Via Node.js Script

Create a file `scripts/seed-dsh-categories.js`:

```javascript
const { MikroORM } = require('@mikro-orm/core');
const { PostgreSqlDriver } = require('@mikro-orm/postgresql');
const { seedDshCategories } = require('../migrations/seeders/SeedDshCategories');

async function runSeeder() {
  const orm = await MikroORM.init({
    driver: PostgreSqlDriver,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    dbName: process.env.DB_NAME || 'bthwani_dsh',
    entities: ['dist/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
  });

  try {
    await seedDshCategories(orm.em);
    console.log('✅ DSH Categories seeded successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await orm.close();
  }
}

runSeeder();
```

Then run:
```bash
npm run build
node scripts/seed-dsh-categories.js
```

### Via SQL (Direct Insert)

```sql
INSERT INTO dsh_categories (code, name_ar, name_en, description_ar, description_en, sort_order, is_featured, tags, var_enabled, status, is_active)
VALUES
  ('dsh_restaurants', 'مطاعم', 'Restaurants', 'طلب من المطاعم والمقاهي', 'Order from restaurants and cafes', 1, true, '["TRENDING", "NEARBY"]'::jsonb, 'VAR_DSH_CAT_RESTAURANTS_ENABLED', 'active', true),
  ('dsh_supermarkets', 'سوبرماركت / بقالات', 'Supermarkets / Groceries', 'تسوق من السوبرماركت والبقالات', 'Shop from supermarkets and grocery stores', 2, true, '["TRENDING", "NEARBY"]'::jsonb, 'VAR_DSH_CAT_SUPERMARKETS_ENABLED', 'active', true),
  ('dsh_fruits_veggies', 'خضار وفواكه', 'Fruits & Vegetables', 'خضار وفواكه طازجة', 'Fresh fruits and vegetables', 3, false, '["SEASONAL"]'::jsonb, 'VAR_DSH_CAT_FRUITS_VEGGIES_ENABLED', 'active', true),
  ('dsh_fashion', 'أناقتي', 'Fashion', 'أزياء وموضة', 'Fashion and style', 4, false, '["NEW"]'::jsonb, 'VAR_DSH_CAT_FASHION_ENABLED', 'active', true),
  ('dsh_sweets_cafes', 'حلا', 'Sweets & Cafes', 'حلويات ومقاهي', 'Sweets and cafes', 5, false, '["SEASONAL"]'::jsonb, 'VAR_DSH_CAT_SWEETS_CAFES_ENABLED', 'active', true),
  ('dsh_global_stores', 'متاجر عالمية', 'Global Stores', 'متاجر ومواقع عالمية', 'Global stores and websites', 6, false, '["NEW"]'::jsonb, 'VAR_DSH_CAT_GLOBAL_STORES_ENABLED', 'active', true),
  ('dsh_quick_task', 'طلبات فورية / مهام سريعة', 'Instant Requests / Quick Tasks', 'طلب شيء معيّن بسرعة من أي مكان', 'Request something specific quickly from anywhere', 7, false, '["NEW"]'::jsonb, 'VAR_DSH_CAT_QUICK_TASK_ENABLED', 'active', true)
ON CONFLICT (code) DO NOTHING;
```

## Verification

After running migrations and seeder, verify:

```sql
-- Check DSH Categories
SELECT code, name_ar, name_en, status FROM dsh_categories;

-- Check Thwani requests column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'thwani_requests' AND column_name = 'dsh_category_code';

-- Check Banners table
SELECT COUNT(*) FROM banners;
```

## Troubleshooting

### Issue: Entity Discovery Errors

If you encounter entity discovery errors when running `npm run migration:pending`, you can:
1. Use Option 1 (Direct SQL) instead
2. Or fix entity conflicts in the codebase first

### Issue: Table Already Exists

If tables already exist, the migrations use `CREATE TABLE IF NOT EXISTS`, so they should be safe to run multiple times.

### Issue: Seeder Fails

If the seeder fails, check:
1. DSH Categories table exists
2. Database connection is working
3. Entity classes are properly exported

## Next Steps

After migrations are deployed:
1. Configure API keys for Voice/Image search (if needed)
2. Test search endpoints
3. Test banner endpoints
4. Configure runtime variables

---

**Status**: Ready for Deployment
**Date**: 2025-02-01

