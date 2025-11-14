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
import { generateCaptainToken, generateCustomerToken } from '../helpers/jwt.helper';

describe('DSH Captains (e2e)', () => {
  let app: INestApplication;
  let captainToken: string;
  let customerToken: string;
  const captainId = 'test-captain-123';
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
    
    captainToken = generateCaptainToken(captainId);
    customerToken = generateCustomerToken(customerId);
  });

  afterAll(async () => {
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

