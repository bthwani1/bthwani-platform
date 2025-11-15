# SRV-KWD - Jobs Platform (KoWADER)

## 1. Overview

The **KWD** service (KoWADER) is a free job board platform for Yemen, connecting job seekers with employers. It provides free job listings (no payments, no booking), full CRUD via APP-USER mobile app, read-only search via public web, admin approval workflow with moderation, support moderation for abuse/fraud reporting, skills catalog with synonyms, and configurable ranking (Sponsored > Freshness > Proximity > TextScore).

## 2. Core Journeys

### 2.1 Job Seeker Journey

1. Job seeker searches listings via `GET /api/kawader/search` (public, optional auth).
2. Job seeker views listing details via `GET /api/kawader/{id}` (public).
3. Job seeker reports suspicious listing via `POST /api/kawader/{id}/report` (Idempotency-Key required).

### 2.2 Employer Journey

1. Employer creates listing via `POST /api/kawader` (User JWT, Idempotency-Key required).
2. Listing enters `pending_review` status.
3. Admin reviews and approves/rejects.
4. Employer updates listing via `PATCH /api/kawader/{id}` (User JWT).
5. Employer closes listing via `DELETE /api/kawader/{id}` (User JWT).

### 2.3 Admin Journey

1. Admin views review queue via `GET /api/kawader/admin/listings`.
2. Admin approves/rejects listing via `POST /api/kawader/admin/listings/{id}/decision` (Step-Up required).
3. Admin manages skills catalog via `GET/PATCH /api/kawader/admin/catalog/skills` (Step-Up for updates).
4. Admin configures ranking weights via `GET/PATCH /api/kawader/admin/ranking/config` (Step-Up for updates).

### 2.4 Support Journey

1. Support views reports inbox via `GET /api/kawader/support/reports`.
2. Support views listing detail with full history via `GET /api/kawader/support/listings/{id}`.
3. Support applies moderation action via `POST /api/kawader/support/actions` (Step-Up required).

## 3. Guards & Policies

- **Idempotency-Key** enforced on all transactional POST operations (create, report, decision, action).
- **Step-Up** required for sensitive admin/support actions (approvals, catalog updates, ranking config, moderation).
- **Privacy**: Posts retention 180 days; logs/reports retention 365 days; no secrets in logs; no financial data.
- **RBAC**: Role-based access control (User, Admin, Support).
- **Audit Trail**: Immutable audit logs for all admin/support actions.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Surface      | screen_id              | Description               | Source                                   |
| ------------ | ---------------------- | ------------------------- | ---------------------------------------- |
| APP-USER     | `app_user.kwd.search`  | Search job listings       | `apps/user/SCREENS_CATALOG.csv`          |
| APP-USER     | `app_user.kwd.create`  | Create job listing        | `apps/user/SCREENS_CATALOG.csv`          |
| APP-USER     | `app_user.kwd.details` | View listing details      | `apps/user/SCREENS_CATALOG.csv`          |
| DASH-ADMIN   | `admin.kwd.review`     | Admin review queue        | `dashboards/admin/SCREENS_CATALOG.csv`   |
| DASH-ADMIN   | `admin.kwd.catalog`    | Skills catalog management | `dashboards/admin/SCREENS_CATALOG.csv`   |
| DASH-SUPPORT | `support.kwd.reports`  | Support reports inbox     | `dashboards/support/SCREENS_CATALOG.csv` |

_Full catalog available in the generated reference `docs/explainar/generated/kwd.generated.md`._

### 4.2 API Surface

The service exposes routes for public listings (search, CRUD, report), admin (review, catalog, ranking), and support (reports, moderation). Refer to the generated reference `docs/explainar/generated/kwd.generated.md`, which updates automatically and includes a SHA checksum at the end.

## 5. Service Classification & Smart Engine

### 5.1 Service Classification

KWD is classified as a **Secondary Service** in the Smart Engine system:

- **Secondary Services**: Important services displayed in service tabs
- **Characteristics**:
  - Visible in service tabs
  - Medium priority in search results
  - Full feature set enabled by default

### 5.2 Runtime Variables Integration

KWD integrates with the unified `RuntimeVariablesService` for:

- **Service Flags**: `VAR_SVC_KWD_ENABLED` (default: true)
- **Scoped Configuration**: Zone > City > Service > Global precedence
- **Caching Layer**: Performance optimization for frequent lookups
- **Type-Safe Access**: Methods for service flags and configuration

## 6. Integrations & Runtime Variables

- **Dependent services**: Search index (Elasticsearch/OpenSearch), Analytics platform.
- **Shared services**: `RuntimeVariablesService`.
- **Applications**: `APP-USER`, dashboards (`admin`, `support`).
- **Runtime examples**:
  - Ranking weights (sponsored, freshness, proximity, text_score).
  - Retention periods (posts: 180 days, logs: 365 days).
  - `VAR_SVC_KWD_ENABLED` — enable/disable KWD service globally.
  - `VAR_WEBAPP_FEATURE_KWD_MODE` — KWD mode for web-app (default: "search_details_only").
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 7. Ranking Algorithm

### Formula

`Sponsored > Freshness > Proximity > TextScore`

### Weights (Configurable via Admin)

- `sponsored`: 0.4 (default)
- `freshness`: 0.3 (exponential decay over 30 days)
- `proximity`: 0.2 (Haversine distance)
- `text_score`: 0.1 (boost_score / 100)

### Sorting

1. Sponsored listings first
2. Then by freshness (recent first)
3. Then by proximity (if user location provided)
4. Then by text relevance

## 8. Database Migrations & Seeders

### 7.1 Migrations

The KWD service includes database migrations for core entities:

#### Core Tables

- **ListingEntity** (`kwd_listings`): Job listings with status, location, skills, experience.
- **ReportEntity** (`kwd_reports`): Abuse/fraud reports for listings.
- **SkillCatalogEntity** (`kwd_skill_catalog`): Skills with synonyms for search/filter.
- **RankingConfigEntity** (`kwd_ranking_config`): Configurable ranking weights (single-row pattern).
- **ModerationLogEntity** (`kwd_moderation_logs`): Immutable moderation audit.
- **AuditLogEntity** (`kwd_audit_logs`): Immutable admin/support audit trail.

### 7.2 Seeders

Seeders for initial configuration and test data (dev environment only).

### 7.3 Migration Execution

**To run migrations:**

```bash
# Run all pending migrations
npm run migration:up

# Or via MikroORM CLI
npx mikro-orm migration:up
```

**Note**: See `docs/MIGRATION_DEPLOYMENT.md` for detailed deployment instructions.

## 8. KPIs & Monitoring

### Primary KPIs

1. **active_listings**: Count of published listings
2. **admin_approval_time**: Average time to approve/reject (hours)
3. **rejection_rate**: Rejected / (Approved + Rejected)
4. **reports_per_100_listings**: (Total Reports / Active Listings) × 100
5. **weekly_new_listings**: New listings created in last 7 days
6. **search_CTR**: Click-Through Rate on search results

## 9. References & Review

- Sources: `oas/services/kwd/openapi.yaml`, `apps/**/SCREENS_CATALOG.csv`, `dashboards/**/SCREENS_CATALOG.csv`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Database: KWD entities and migrations in `src/modules/kwd/entities/` and `migrations/`.
- Service Code: SRV-KWD-01 v1.0 (LOCKED)
- Last human review: 2025-01-15.

---

**Source SHA256**: `[To be generated]`
