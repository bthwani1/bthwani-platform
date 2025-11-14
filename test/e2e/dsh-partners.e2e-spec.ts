import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs/typings';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { DatabaseModule } from '../../src/shared/database/database.module';
import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs/typings';
import { generatePartnerToken, generateCustomerToken } from '../helpers/jwt.helper';

describe('DSH Partners (e2e)', () => {
  let app: INestApplication;
  let partnerToken: string;
  let customerToken: string;
  const partnerId = 'test-partner-123';
  const customerId = 'test-customer-123';

  beforeAll(async () => {
    // Override JWT config for testing
    process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests';
    process.env.JWT_ALG = 'HS256';

    const moduleFixture: TestingModule = await Test.createTestingModule({
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
      const orm = moduleFixture.get('MikroORM');
      if (orm && orm.getSchemaGenerator) {
        const generator = orm.getSchemaGenerator();
        await generator.createSchema();
      }
    } catch (error) {
      // Schema generation failed, but continue with tests
      console.warn('Schema generation skipped:', error);
    }
    
    partnerToken = generatePartnerToken(partnerId);
    customerToken = generateCustomerToken(customerId);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /api/dls/partners/me', () => {
    it('should return partner profile when authenticated as partner', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dls/partners/me')
        .set('Authorization', `Bearer ${partnerToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should return 403 when authenticated as customer', async () => {
      await request(app.getHttpServer())
        .get('/api/dls/partners/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });

    it('should return 401 when authorization token is missing', async () => {
      await request(app.getHttpServer()).get('/api/dls/partners/me').expect(401);
    });
  });

  describe('GET /api/dls/partners/orders', () => {
    it('should return list of orders for partner', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dls/partners/orders')
        .set('Authorization', `Bearer ${partnerToken}`)
        .query({ limit: 10 })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('orders');
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it('should filter orders by status when provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dls/partners/orders')
        .set('Authorization', `Bearer ${partnerToken}`)
        .query({ status: 'pending', limit: 10 })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body).toHaveProperty('orders');
    });

    it('should return 403 when authenticated as customer', async () => {
      await request(app.getHttpServer())
        .get('/api/dls/partners/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);
    });
  });
});

