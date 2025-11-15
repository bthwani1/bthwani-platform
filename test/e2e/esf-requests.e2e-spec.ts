import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Module } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs/typings';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { generateTestToken } from '../helpers/jwt.helper';
import { MikroORM } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';

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

describe('ESF Requests (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let orm: MikroORM;
  let userToken: string;
  const userId = 'test-user-123';

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests';
    process.env.JWT_ALG = 'HS256';
    process.env.VAR_ESF_MAX_RADIUS_KM = '50';
    process.env.VAR_ESF_MATCH_BATCH_SIZE = '10';
    process.env.VAR_ESF_DONOR_COOLDOWN_DAYS = '90';
    process.env.VAR_ESF_SLA_MATCH_MINUTES = '30';
    process.env.VAR_CHAT_RETENTION_DAYS = '30';
    process.env.VAR_MSG_FIELD_ENCRYPTION_KEY =
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

    userToken = generateTestToken({
      sub: userId,
      roles: ['user_requester', 'user_donor'],
    });
  });

  afterAll(async () => {
    if (orm) {
      await orm.close(true);
    }
    if (app) {
      await app.close();
    }
  });

  describe('POST /api/esf/requests', () => {
    const idempotencyKey = uuidv4();
    const validRequestDto = {
      patient_name: 'Test Patient',
      hospital_name: 'Test Hospital',
      city: 'Sanaa',
      abo_type: 'O',
      rh_factor: '+',
    };

    it('should create request successfully', () => {
      return request(app.getHttpServer())
        .post('/api/esf/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(validRequestDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.patient_name).toBe(validRequestDto.patient_name);
          expect(res.body.hospital_name).toBe(validRequestDto.hospital_name);
          expect(res.body.city).toBe(validRequestDto.city);
          expect(res.body.abo_type).toBe(validRequestDto.abo_type);
          expect(res.body.rh_factor).toBe(validRequestDto.rh_factor);
          expect(res.body.status).toBe('pending');
        });
    });

    it('should require idempotency key', () => {
      return request(app.getHttpServer())
        .post('/api/esf/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validRequestDto)
        .expect(400);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/esf/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', uuidv4())
        .send({})
        .expect(400);
    });

    it('should return same request when idempotency key is reused', async () => {
      const reuseKey = uuidv4();
      const firstResponse = await request(app.getHttpServer())
        .post('/api/esf/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', reuseKey)
        .send(validRequestDto)
        .expect(201);

      const requestId = firstResponse.body.id;

      const secondResponse = await request(app.getHttpServer())
        .post('/api/esf/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', reuseKey)
        .send(validRequestDto)
        .expect(201);

      expect(secondResponse.body.id).toBe(requestId);
    });
  });

  describe('GET /api/esf/requests/:request_id', () => {
    let requestId: string;

    beforeAll(async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/esf/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', uuidv4())
        .send({
          patient_name: 'Test Patient',
          hospital_name: 'Test Hospital',
          city: 'Sanaa',
          abo_type: 'O',
          rh_factor: '+',
        })
        .expect(201);

      requestId = createResponse.body.id;
    });

    it('should get request details', () => {
      return request(app.getHttpServer())
        .get(`/api/esf/requests/${requestId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', requestId);
          expect(res.body).toHaveProperty('patient_name');
          expect(res.body).toHaveProperty('hospital_name');
        });
    });

    it('should return 404 for non-existent request', () => {
      return request(app.getHttpServer())
        .get('/api/esf/requests/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });

  describe('GET /api/esf/requests', () => {
    it('should list user requests', () => {
      return request(app.getHttpServer())
        .get('/api/esf/requests')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/esf/requests?limit=10')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body.items.length).toBeLessThanOrEqual(10);
        });
    });
  });

  describe('PATCH /api/esf/me/availability', () => {
    const idempotencyKey = uuidv4();
    const updateDto = {
      is_available: true,
      abo_type: 'O',
      rh_factor: '+',
      city: 'Sanaa',
    };

    it('should update availability successfully', () => {
      return request(app.getHttpServer())
        .patch('/api/esf/me/availability')
        .set('Authorization', `Bearer ${userToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('is_available', true);
          expect(res.body).toHaveProperty('abo_type', 'O');
          expect(res.body).toHaveProperty('rh_factor', '+');
        });
    });

    it('should require idempotency key', () => {
      return request(app.getHttpServer())
        .patch('/api/esf/me/availability')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateDto)
        .expect(400);
    });
  });

  describe('GET /api/esf/me/profile', () => {
    it('should get donor profile', () => {
      return request(app.getHttpServer())
        .get('/api/esf/me/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user_id');
        });
    });
  });
});
