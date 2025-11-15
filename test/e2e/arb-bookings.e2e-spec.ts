import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { AppModule } from '../../src/app.module';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroORM } from '@mikro-orm/core';
import { generatePartnerToken, generateCustomerToken } from '../helpers/jwt.helper';
import { TestDatabaseModule } from '../helpers/test-database.module';

describe('ARB Bookings (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let orm: MikroORM;
  let customerToken: string;
  let partnerToken: string;
  const customerId = 'test-customer-123';
  const partnerId = 'test-partner-123';
  let offerId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests';
    process.env.JWT_ALG = 'HS256';
    process.env.WLT_SERVICE_URL = 'http://mock-wlt:3000';
    process.env.IDENTITY_SERVICE_URL = 'http://mock-identity:3000';
    process.env.NOTIFICATIONS_SERVICE_URL = 'http://mock-notifications:3000';
    process.env.VAR_ARB_CHAT_ENCRYPTION_KEY =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

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

    customerToken = generateCustomerToken(customerId);
    partnerToken = generatePartnerToken(partnerId);

    const createOfferResponse = await request(app.getHttpServer())
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
        status: 'active',
      });

    if (createOfferResponse.status === 201) {
      offerId = createOfferResponse.body.id;
    } else {
      offerId = 'mock-offer-id';
    }
  });

  afterAll(async () => {
    if (orm) {
      await orm.close(true);
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /api/arb/bookings', () => {
    const idempotencyKey = uuidv4();
    const validBookingDto = {
      offer_id: 'mock-offer-id',
      customer_notes: 'ملاحظات تجريبية',
    };

    it('should require idempotency key', () => {
      return request(app.getHttpServer())
        .post('/api/arb/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(validBookingDto)
        .expect(400);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/arb/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .set('Idempotency-Key', uuidv4())
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/arb/bookings', () => {
    it('should list customer bookings', () => {
      return request(app.getHttpServer())
        .get('/api/arb/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/arb/bookings?limit=10&cursor=2025-01-01T00:00:00Z')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
        });
    });
  });

  describe('GET /api/arb/bookings/:booking_id', () => {
    it('should return 404 for non-existent booking', () => {
      return request(app.getHttpServer())
        .get('/api/arb/bookings/non-existent-id')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);
    });
  });

  describe('POST /api/arb/bookings/:booking_id/status', () => {
    it('should require idempotency key', () => {
      return request(app.getHttpServer())
        .post('/api/arb/bookings/test-booking-id/status')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'confirmed' })
        .expect(400);
    });
  });
});
