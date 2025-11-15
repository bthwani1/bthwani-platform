import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs/typings';
import { SqliteDriver } from '@mikro-orm/sqlite';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      driver: SqliteDriver,
      autoLoadEntities: true,
      allowGlobalContext: true,
      dbName: ':memory:',
      entities: ['dist/**/*.entity.js'],
      entitiesTs: ['src/**/*.entity.ts'],
      migrations: {
        disableForeignKeys: true,
      },
    } satisfies MikroOrmModuleSyncOptions),
  ],
  exports: [MikroOrmModule],
})
export class TestDatabaseModule {}
