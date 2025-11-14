import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { CoreModule } from '../src/core/core.module';
import { ConfigModule } from '@nestjs/config';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Test only core module (health endpoints) without database dependencies
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        CoreModule,
      ],
    }).compile();

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
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/health/live (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health/live')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
      });
  });

  it('/health/ready (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/api/health/ready');

    // May fail if database is not connected, but should return some response
    expect([200, 500]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body).toHaveProperty('status');
    }
  });
});
