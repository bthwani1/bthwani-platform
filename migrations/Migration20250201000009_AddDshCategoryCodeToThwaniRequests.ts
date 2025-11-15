import { Migration } from '@mikro-orm/migrations';

export class Migration20250201000009_AddDshCategoryCodeToThwaniRequests extends Migration {
  async up(): Promise<void> {
    this.addSql(`
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
    `);
  }

  async down(): Promise<void> {
    this.addSql(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'thwani_requests') THEN
          DROP INDEX IF EXISTS idx_thwani_requests_dsh_category_code;
          ALTER TABLE thwani_requests
          DROP COLUMN IF EXISTS dsh_category_code;
        END IF;
      END $$;
    `);
  }
}

