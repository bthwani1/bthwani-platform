import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from '../../src/app.module';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import {
  generateTestToken,
  generatePartnerToken,
  generateCustomerToken,
} from '../helpers/jwt.helper';
import { TestDatabaseModule } from '../helpers/test-database.module';

describe('ARB Offers (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let orm: MikroORM;
  let partnerToken: string;
  let customerToken: string;
  const partnerId = 'test-partner-123';
  const customerId = 'test-customer-123';

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests';
    process.env.JWT_ALG = 'HS256';
    process.env.VAR_ARB_CHAT_ENCRYPTION_KEY =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    process.env.VAR_ARB_QUIET_HOURS = '22:00-08:00';

    moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        AppModule,
      ],
    })
      .overrideModule(MikroOrmModule)
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

    try {
      orm = moduleFixture.get(MikroORM);
      const migrator = orm.getMigrator();
      await migrator.up();
    } catch (error) {
      console.warn('Schema generation skipped:', error);
    }

    partnerToken = generatePartnerToken(partnerId);
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

  describe('GET /api/arb/offers', () => {
    it('should list offers successfully', () => {
      return request(app.getHttpServer())
        .get('/api/arb/offers?limit=10')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/arb/offers?limit=5&cursor=2025-01-01T00:00:00Z')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body.items.length).toBeLessThanOrEqual(5);
        });
    });
  });

  describe('POST /api/arb/offers', () => {
    const idempotencyKey = uuidv4();
    const validOfferDto = {
      title_ar: 'عرض تجريبي',
      title_en: 'Test Offer',
      description_ar: 'وصف تجريبي',
      description_en: 'Test Description',
      price: { amount: '50000', currency: 'YER' },
      deposit_amount: { amount: '10000', currency: 'YER' },
      category_id: 'cat-123',
      region_code: 'SANA',
      status: 'draft',
    };

    it('should create offer successfully', () => {
      return request(app.getHttpServer())
        .post('/api/arb/offers')
        .set('Authorization', `Bearer ${partnerToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(validOfferDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title_ar).toBe(validOfferDto.title_ar);
          expect(res.body.price.amount).toBe(validOfferDto.price.amount);
        });
    });

    it('should require idempotency key', () => {
      return request(app.getHttpServer())
        .post('/api/arb/offers')
        .set('Authorization', `Bearer ${partnerToken}`)
        .send(validOfferDto)
        .expect(400);
    });

    it('should return same offer when idempotency key is reused', async () => {
      const reuseKey = uuidv4();
      const firstResponse = await request(app.getHttpServer())
        .post('/api/arb/offers')
        .set('Authorization', `Bearer ${partnerToken}`)
        .set('Idempotency-Key', reuseKey)
        .send(validOfferDto)
        .expect(201);

      const offerId = firstResponse.body.id;

      const secondResponse = await request(app.getHttpServer())
        .post('/api/arb/offers')
        .set('Authorization', `Bearer ${partnerToken}`)
        .set('Idempotency-Key', reuseKey)
        .send(validOfferDto)
        .expect(201);

      expect(secondResponse.body.id).toBe(offerId);
    });
  });

  describe('GET /api/arb/offers/:offer_id', () => {
    let offerId: string;

    beforeAll(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/arb/offers')
        .set('Authorization', `Bearer ${partnerToken}`)
        .set('Idempotency-Key', uuidv4())
        .send({
          title_ar: 'عرض تجريبي',
          title_en: 'Test Offer',
          price: { amount: '50000', currency: 'YER' },
          deposit_amount: { amount: '10000', currency: 'YER' },
          category_id: 'cat-123',
          region_code: 'SANA',
        })
        .expect(201);

      offerId = createResponse.body.id;
    });

    it('should get offer details', () => {
      return request(app.getHttpServer())
        .get(`/api/arb/offers/${offerId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', offerId);
          expect(res.body).toHaveProperty('title_ar');
        });
    });

    it('should return 404 for non-existent offer', () => {
      return request(app.getHttpServer()).get('/api/arb/offers/non-existent-id').expect(404);
    });
  });
});
