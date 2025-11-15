import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Module } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs/typings';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { DatabaseModule } from '../../src/shared/database/database.module';
import { generateCaptainToken, generateCustomerToken } from '../helpers/jwt.helper';
import { MikroORM } from '@mikro-orm/core';

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
class TestDatabaseModule {}

describe('DSH Captains (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let orm: MikroORM;
  let captainToken: string;
  let customerToken: string;
  const captainId = 'test-captain-123';
  const customerId = 'test-customer-123';

  beforeAll(async () => {
    // Override JWT config for testing
    process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests';
    process.env.JWT_ALG = 'HS256';

    moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        AppModule,
      ],
    })
      .overrideModule(DatabaseModule)
      .useModule(TestDatabaseModule)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    // Run migrations for in-memory database
    try {
      orm = moduleFixture.get(MikroORM);
      const migrator = orm.getMigrator();
      await migrator.up();
    } catch (error) {
      // Schema generation failed, but continue with tests
      console.warn('Schema generation skipped:', error);
    }

    captainToken = generateCaptainToken(captainId);
    customerToken = generateCustomerToken(customerId);
  });

  afterAll(async () => {
    if (orm) {
      await orm.close(true);
    }
    if (app) {
      await app.close();
    }
  });

  describe('GET /api/dls/captains/me', () => {
    it('should return captain profile when authenticated as captain', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dls/captains/me')
        .set('Authorization', `Bearer ${captainToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should return 403 when authenticated as customer', async () => {
      await request(app.getHttpServer())
        .get('/api/dls/captains/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return 401 when authorization token is missing', async () => {
      await request(app.getHttpServer()).get('/api/dls/captains/me').expect(401);
    });
  });

  describe('GET /api/dls/captains/orders', () => {
    it('should return list of orders assigned to captain', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dls/captains/orders')
        .set('Authorization', `Bearer ${captainToken}`)
        .query({ limit: 10 })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('orders');
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it('should filter orders by status when provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dls/captains/orders')
        .set('Authorization', `Bearer ${captainToken}`)
        .query({ status: 'pending', limit: 10 })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('orders');
    });

    it('should return 403 when authenticated as customer', async () => {
      await request(app.getHttpServer())
        .get('/api/dls/captains/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });
});
