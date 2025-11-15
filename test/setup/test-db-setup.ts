/**
 * Test Database Setup Utility
 *
 * This utility helps set up a test database for E2E tests.
 * It can work with:
 * 1. Real PostgreSQL database (if DB_HOST is set)
 * 2. In-memory SQLite database (fallback)
 * 3. Mock database (for unit tests)
 */

import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { SqliteDriver } from '@mikro-orm/sqlite';

export interface TestDbConfig {
  useInMemory?: boolean;
  dbName?: string;
  dropSchema?: boolean;
}

export async function setupTestDatabase(config: TestDbConfig = {}): Promise<MikroORM> {
  const useInMemory = config.useInMemory ?? !process.env.DB_HOST;
  const dbName = config.dbName || 'bthwani_dsh_test';

  if (useInMemory) {
    // Use in-memory SQLite for tests
    const orm = await MikroORM.init<SqliteDriver>({
      driver: SqliteDriver,
      dbName: ':memory:',
      entities: ['dist/**/*.entity.js'],
      entitiesTs: ['src/**/*.entity.ts'],
      allowGlobalContext: true,
    });

    // Run migrations
    const migrator = orm.getMigrator();
    await migrator.up();

    return orm;
  } else {
    // Use real PostgreSQL
    const orm = await MikroORM.init<PostgreSqlDriver>({
      driver: PostgreSqlDriver,
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      dbName,
      entities: ['dist/**/*.entity.js'],
      entitiesTs: ['src/**/*.entity.ts'],
      allowGlobalContext: true,
    });

    if (config.dropSchema) {
      const migrator = orm.getMigrator();
      await migrator.down({ to: 0 });
    }

    // Run migrations
    const migrator = orm.getMigrator();
    await migrator.up();

    return orm;
  }
}

export async function teardownTestDatabase(orm: MikroORM): Promise<void> {
  if (orm) {
    await orm.close(true);
  }
}
