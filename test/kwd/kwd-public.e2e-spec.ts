import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { KwdModule } from '../../src/modules/kwd/kwd.module';

/**
 * KWD Public API E2E Tests
 * Tests public endpoints: search, get, create, update, delete, report
 */
describe('KWD Public API (e2e)', () => {
  let app: INestApplication;
  let createdListingId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [KwdModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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
    await app.close();
  });

  describe('POST /api/kawader (Create Listing)', () => {
    it('should create a new listing with valid data', () => {
      const createDto = {
        entity_type: 'company',
        title: 'Senior Software Engineer',
        description:
          'We are looking for an experienced software engineer to join our team. Must have 5+ years of experience in backend development.',
        location: {
          region: 'Sanaa',
          city: 'Sanaa',
          geo: {
            lat: 15.3694,
            lon: 44.191,
          },
        },
        skills: ['Node.js', 'TypeScript', 'NestJS', 'PostgreSQL'],
        experience_years: 5,
      };

      return request(app.getHttpServer())
        .post('/api/kawader')
        .set('x-user-id', 'test-user-123')
        .set('Idempotency-Key', 'test-create-001')
        .send(createDto)
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.title).toBe(createDto.title);
          expect(response.body.status).toBe('pending_review');
          createdListingId = response.body.id;
        });
    });

    it('should reject listing with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/kawader')
        .set('x-user-id', 'test-user-123')
        .set('Idempotency-Key', 'test-create-002')
        .send({
          entity_type: 'company',
          title: 'Test',
        })
        .expect(400);
    });
  });

  describe('GET /api/kawader/search (Search Listings)', () => {
    it('should return paginated search results', () => {
      return request(app.getHttpServer())
        .get('/api/kawader/search')
        .query({ keyword: 'engineer', limit: 20 })
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('data');
          expect(response.body).toHaveProperty('pagination');
          expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    it('should filter by region', () => {
      return request(app.getHttpServer())
        .get('/api/kawader/search')
        .query({ region: 'Sanaa', limit: 10 })
        .expect(200);
    });

    it('should filter by skills', () => {
      return request(app.getHttpServer())
        .get('/api/kawader/search')
        .query({ skills: ['TypeScript', 'Node.js'], limit: 10 })
        .expect(200);
    });
  });

  describe('GET /api/kawader/:id (Get Listing)', () => {
    it('should return listing details', () => {
      if (!createdListingId) {
        return Promise.resolve();
      }

      return request(app.getHttpServer())
        .get(`/api/kawader/${createdListingId}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('id', createdListingId);
          expect(response.body).toHaveProperty('title');
          expect(response.body).toHaveProperty('status');
        });
    });

    it('should return 404 for non-existent listing', () => {
      return request(app.getHttpServer())
        .get('/api/kawader/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('PATCH /api/kawader/:id (Update Listing)', () => {
    it('should update listing by owner', () => {
      if (!createdListingId) {
        return Promise.resolve();
      }

      return request(app.getHttpServer())
        .patch(`/api/kawader/${createdListingId}`)
        .set('x-user-id', 'test-user-123')
        .send({
          title: 'Senior Software Engineer (Updated)',
        })
        .expect(200)
        .then((response) => {
          expect(response.body.title).toBe('Senior Software Engineer (Updated)');
        });
    });

    it('should reject update by non-owner', () => {
      if (!createdListingId) {
        return Promise.resolve();
      }

      return request(app.getHttpServer())
        .patch(`/api/kawader/${createdListingId}`)
        .set('x-user-id', 'other-user-456')
        .send({
          title: 'Hacked',
        })
        .expect(403);
    });
  });

  describe('POST /api/kawader/:id/report (Report Listing)', () => {
    it('should submit a report with valid reason', () => {
      if (!createdListingId) {
        return Promise.resolve();
      }

      return request(app.getHttpServer())
        .post(`/api/kawader/${createdListingId}/report`)
        .set('x-user-id', 'reporter-789')
        .set('Idempotency-Key', 'test-report-001')
        .send({
          reason: 'spam',
          description: 'This listing appears to be spam',
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('id');
          expect(response.body.reason).toBe('spam');
          expect(response.body.status).toBe('pending');
        });
    });

    it('should reject duplicate report from same user', () => {
      if (!createdListingId) {
        return Promise.resolve();
      }

      return request(app.getHttpServer())
        .post(`/api/kawader/${createdListingId}/report`)
        .set('x-user-id', 'reporter-789')
        .set('Idempotency-Key', 'test-report-002')
        .send({
          reason: 'spam',
        })
        .expect(409);
    });
  });

  describe('DELETE /api/kawader/:id (Delete Listing)', () => {
    it('should delete listing by owner', () => {
      if (!createdListingId) {
        return Promise.resolve();
      }

      return request(app.getHttpServer())
        .delete(`/api/kawader/${createdListingId}`)
        .set('x-user-id', 'test-user-123')
        .expect(204);
    });
  });
});
