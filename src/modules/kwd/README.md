# KWD Module — KoWADER Jobs Service

**Service Code:** `SRV-KWD-01`  
**Version:** `1.0.0`  
**Status:** Locked SSoT

---

## Overview

**KoWADER (KWD)** is a **free job board platform** for Yemen, connecting job seekers with employers. The service provides:

- **Free job listings** (no payments, no booking)
- **Full CRUD** via APP-USER mobile app
- **Read-only search** via public web
- **Admin approval workflow** with moderation
- **Support moderation** for abuse/fraud reporting
- **Skills catalog** with synonyms
- **Configurable ranking**: Sponsored > Freshness > Proximity > TextScore

---

## Architecture (C4 Model)

### Level 1: Context

**People:**
- **Job Seeker**: Searches and views jobs via app or web; reports suspicious listings
- **Employer/Recruiter**: Posts job opportunities via APP-USER
- **Admin/KWD Operator**: Reviews listings, manages catalogs, tunes ranking
- **Support/Moderation Agent**: Handles reports and abuse with immutable audit

**Systems:**
- **APP-USER Mobile**: Full CRUD + search/details
- **Public Web**: SEO-friendly search/details only (no CRUD)
- **KWD Service**: Core job board backend
- **Admin Dashboards**: Approvals, catalogs, ranking
- **Support/CRM Console**: Reports/moderation with audit
- **Search & Analytics Platform**: Indexing and KPIs

### Level 2: Containers

**Core Components:**
- **KWD Core API Service** (NestJS, TypeScript, OpenAPI 3.1)
- **KWD Database** (PostgreSQL)
- **KWD Search Index** (Elasticsearch/OpenSearch)
- **KWD Analytics & KPIs** (Time-series DB, ETL)

### Level 3: Components

**Services:**
- `ListingCommandService`: Create, update, delete listings
- `ListingQueryService`: Search, details, filters
- `RankingEngineService`: Ranking algorithm with runtime weights
- `ModerationService`: Approval/rejection workflow
- `ReportService`: Abuse/fraud reports
- `CatalogService`: Skills catalog management

**Adapters:**
- `SearchIndexAdapter`: Elasticsearch/OpenSearch indexing
- `AnalyticsAdapter`: KPIs and analytics events
- `AuditLoggerAdapter`: Immutable audit trail (365d retention)

**Controllers:**
- `KwdPublicController`: Public endpoints (search, CRUD, report)
- `KwdAdminController`: Admin endpoints (review, catalog, ranking)
- `KwdSupportController`: Support endpoints (reports, moderation)

---

## Data Model

### Entities

1. **ListingEntity** (`kwd_listings`)
   - Job listing with entity_type, location, skills, experience_years, attachments
   - Status: `pending_review`, `published`, `rejected`, `closed`, `hidden`
   - Sponsored flag and boost_score for ranking
   - Retention: 180 days

2. **ReportEntity** (`kwd_reports`)
   - Abuse/fraud reports for listings
   - Reason: `fraud`, `spam`, `offensive`, `misleading`, `duplicate`, `other`
   - Status: `pending`, `under_review`, `resolved`, `dismissed`
   - Retention: 365 days

3. **SkillCatalogEntity** (`kwd_skill_catalog`)
   - Skills with synonyms for search/filter
   - Admin-managed

4. **RankingConfigEntity** (`kwd_ranking_config`)
   - Configurable ranking weights (single-row pattern)
   - Weights: sponsored, freshness, proximity, text_score

5. **ModerationLogEntity** (`kwd_moderation_logs`)
   - Immutable moderation audit
   - Actions: `approve`, `reject`, `hide`, `soft_delete`, `warn`, `temp_block`

6. **AuditLogEntity** (`kwd_audit_logs`)
   - Immutable admin/support audit trail
   - Retention: 365 days

---

## API Endpoints (OpenAPI 3.1)

### Public Endpoints

| Method | Path                       | Operation ID              | Description                    | Auth     |
|--------|----------------------------|---------------------------|--------------------------------|----------|
| GET    | `/api/kawader/search`      | `kwd_listings_search`     | Search job listings            | Optional |
| GET    | `/api/kawader/{id}`        | `kwd_listing_get`         | Get listing details            | Optional |
| POST   | `/api/kawader`             | `kwd_listing_create`      | Create listing                 | User JWT |
| PATCH  | `/api/kawader/{id}`        | `kwd_listing_update`      | Update listing                 | User JWT |
| DELETE | `/api/kawader/{id}`        | `kwd_listing_delete`      | Delete/close listing           | User JWT |
| POST   | `/api/kawader/{id}/report` | `kwd_listing_report`      | Report listing                 | User JWT |

### Admin Endpoints

| Method | Path                                     | Operation ID                | Description                | Auth              |
|--------|------------------------------------------|-----------------------------|----------------------------|-------------------|
| GET    | `/api/kawader/admin/listings`            | `kwd_admin_listings_review` | Admin review queue         | Admin JWT         |
| POST   | `/api/kawader/admin/listings/{id}/decision` | `kwd_admin_listing_decision` | Approve/reject listing     | Admin JWT + Step-Up |
| GET    | `/api/kawader/admin/catalog/skills`      | `kwd_admin_catalog`         | Get skills catalog         | Admin JWT         |
| PATCH  | `/api/kawader/admin/catalog/skills`      | `kwd_admin_catalog_update`  | Update skills catalog      | Admin JWT + Step-Up |
| GET    | `/api/kawader/admin/ranking/config`      | `kwd_admin_ranking_config`  | Get ranking weights        | Admin JWT         |
| PATCH  | `/api/kawader/admin/ranking/config`      | `kwd_admin_ranking_update`  | Update ranking weights     | Admin JWT + Step-Up |

### Support Endpoints

| Method | Path                              | Operation ID                | Description                       | Auth              |
|--------|-----------------------------------|-----------------------------|-----------------------------------|-------------------|
| GET    | `/api/kawader/support/reports`    | `kwd_support_reports_inbox` | Support reports inbox             | Support JWT       |
| GET    | `/api/kawader/support/listings/{id}` | `kwd_support_listing_detail` | Listing detail with full history  | Support JWT       |
| POST   | `/api/kawader/support/actions`    | `kwd_support_action_apply`  | Apply moderation action           | Support JWT + Step-Up |

---

## Security & Compliance

### Authentication & Authorization
- **JWT Bearer Authentication** with RBAC (User, Admin, Support)
- **Step-Up Authentication** for sensitive admin/support actions
- **Idempotency-Key** required on transactional POST operations

### Privacy & Retention
- **Posts**: 180 days
- **Logs/Reports**: 365 days
- **No secrets in logs**; no financial data
- **Minimal PII** in listings; platform policies govern contact details

### Audit Trail
- **Immutable audit logs** for all admin/support actions
- **Distributed tracing** (OpenTelemetry) on all KWD flows
- **No PII/secrets** logged

---

## Ranking Algorithm

**Formula:** `Sponsored > Freshness > Proximity > TextScore`

**Weights (configurable via admin):**
- `sponsored`: 0.4 (default)
- `freshness`: 0.3 (exponential decay over 30 days)
- `proximity`: 0.2 (Haversine distance)
- `text_score`: 0.1 (boost_score / 100)

**Sorting:**
1. Sponsored listings first
2. Then by freshness (recent first)
3. Then by proximity (if user location provided)
4. Then by text relevance

---

## KPIs & Monitoring

### Primary KPIs
1. **active_listings**: Count of published listings
2. **admin_approval_time**: Average time to approve/reject (hours)
3. **rejection_rate**: Rejected / (Approved + Rejected)
4. **reports_per_100_listings**: (Total Reports / Active Listings) × 100
5. **weekly_new_listings**: New listings created in last 7 days
6. **search_CTR**: Click-Through Rate on search results

### Health Endpoints
- `/health/live`: Liveness probe
- `/health/ready`: Readiness probe (DB, cache, queue checks)

---

## Development

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- (Optional) Elasticsearch/OpenSearch for search index

### Install Dependencies
```bash
npm install
```

### Run Migrations
```bash
npm run mikro-orm migration:up
```

### Seed Data (Dev)
```bash
npm run seed:kwd:dev
```

### Run Tests
```bash
# Unit tests
npm run test:kwd

# E2E tests
npm run test:kwd:e2e
```

### Run Service
```bash
npm run start:dev
```

---

## Environment Variables

**Required:**
```env
NODE_ENV=development|stage|production
SERVICE_NAME=kwd
HTTP_PORT=3000

DB_URL=postgresql://user:pass@localhost:5432/bthwani
DB_POOL_MIN=2
DB_POOL_MAX=10

JWT_ISSUER=bthwani.com
JWT_PUBLIC_KEY=...
JWT_ALG=RS256

# Optional: Search Index
ELASTICSEARCH_URL=http://localhost:9200
```

**Retention:**
```env
KWD_POSTS_RETENTION_DAYS=180
KWD_LOGS_RETENTION_DAYS=365
```

---

## Cross-Cutting Concerns

### Idempotency
- **Idempotency-Key** header required on:
  - `POST /api/kawader`
  - `POST /api/kawader/{id}/report`
  - `POST /api/kawader/admin/listings/{id}/decision`
  - `POST /api/kawader/support/actions`

### Rate Limiting
- Nest Throttler with sensible defaults
- Returns `429 Too Many Requests` on limit exceeded

### Pagination
- **Cursor-based** pagination
- Query params: `cursor`, `limit` (default 20, max 100)
- Response includes: `next_cursor`, `prev_cursor`, `has_next`, `has_prev`

### Error Handling
- **RFC7807-style** error responses
- Fields: `type`, `title`, `status`, `code`, `detail`, `trace_id`, `timestamp`

---

## Boundaries & Risks

### Trust Boundaries
1. **Public Web Trust Boundary**: Anonymous reads allowed for published listings; no CRUD on public web
2. **Internal Admin/Support Network**: Private access only; Step-Up for impactful actions
3. **Privacy Boundary**: No secrets in logs; retention caps

### Risks
1. **R1**: Fraudulent/abusive listings → Mitigation: Moderation workflow, reports inbox, fast takedown
2. **R2**: SEO spam/poisoning → Mitigation: Strict validation, robots/canonicals, abuse detection
3. **R3**: PII leakage via logs → Mitigation: No secrets; audit fields whitelisting; retention caps
4. **R4**: Ranking manipulation → Mitigation: Audited weight changes; monitoring CTR anomalies

---

## Decisions (ADRs)

### DEC-KWD-SSOT-LOCK
**Title:** SRV-KWD-01 locked as global SSoT  
**Status:** Accepted  
**Rationale:** Align with approved package; guards PASS  
**Date:** 2025-11-10

### DEC-KWD-IDEMPOTENCY
**Title:** Idempotency policy  
**Status:** Accepted  
**Rationale:** Required on transactional POST; recommended on PATCH/DELETE when used transactionally  
**Date:** 2025-11-10

### DEC-KWD-ENDPOINTS
**Title:** Canonical namespace  
**Status:** Accepted  
**Rationale:** Use `/api/kawader/*` across all surfaces; allow legacy web alias for SEO only  
**Date:** 2025-11-10

---

## Support & Contact

**Team:** BThwani Engineering  
**Support Email:** support@bthwani.com  
**Documentation:** [Internal Wiki](https://wiki.bthwani.com/kwd)  
**Service Status:** [status.bthwani.com](https://status.bthwani.com)

---

## License

Proprietary — © 2025 BThwani Platform

