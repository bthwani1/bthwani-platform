import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Options } from '@mikro-orm/core';

@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): Options<PostgreSqlDriver> => ({
        driver: PostgreSqlDriver,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        user: configService.get<string>('DB_USER', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        dbName: configService.get<string>('DB_NAME', 'bthwani_dsh'),
        entities: ['dist/**/*.entity.js'],
        entitiesTs: ['src/**/*.entity.ts'],
        migrations: {
          path: './migrations',
          pathTs: './migrations',
          glob: '!(*.d).{js,ts}',
        },
        debug: configService.get<string>('NODE_ENV') === 'development',
        timezone: 'Asia/Aden',
        pool: {
          min: configService.get<number>('DB_POOL_MIN', 2),
          max: configService.get<number>('DB_POOL_MAX', 10),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [],
})
export class DatabaseModule {}
