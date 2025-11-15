# SRV-KNZ - Marketplace

## 1. Overview

The **KNZ** service handles marketplace listings, categories, orders, chat, fees, and moderation. It provides categories admin, fees admin, reporting query, export service, abuse moderation, and SSOT bridge functionality.

## 2. Core Journeys

### 2.1 Categories Management (Admin)

1. Admin creates category via `POST /knz/admin/categories` (Step-Up required).
2. Admin updates category via `PUT /knz/admin/categories/:category_id` (Step-Up required).
3. Admin enables/disables categories via `POST /knz/admin/categories/:category_id/enable|disable` (Step-Up required).

### 2.2 Fees Management (Admin)

1. Admin creates fee profile via `POST /knz/admin/fees` (Step-Up required).
2. Admin updates fee profile via `PUT /knz/admin/fees/:id` (Step-Up required).
3. Fee profiles scoped by: global, region, category, or subcategory.

### 2.3 Reporting & Analytics

1. Admin/ops queries listings via `GET /knz/reporting/listings`.
2. Admin/ops queries orders via `GET /knz/reporting/orders`.
3. Admin/ops queries abuse reports via `GET /knz/reporting/abuse-reports`.
4. Metrics available via `GET /knz/reporting/metrics`.

### 2.4 Abuse Moderation

1. Support/admin views abuse reports via `GET /knz/admin/abuse/reports`.
2. Support/admin moderates listings via `POST /knz/admin/abuse/listings/:id/moderate`.
3. Support/admin resolves reports via `PUT /knz/admin/abuse/reports/:id/resolve`.

## 3. Guards & Policies

- **Idempotency-Key** enforced on all state-changing calls (categories, fees, moderation).
- **Step-Up** required for critical approvals (category/fee changes, SSOT approvals).
- **Privacy**: Export service enforces masking (G-PRIVACY-EXPORT guard); all exports must have `mask_sensitive: true`.
- **RBAC**: Role-based access control (admin, ops, support, finance, marketing, ssot_governor, security).
- **Audit Logging**: All admin actions logged to `knz_audit_logs` with full context.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Surface      | screen_id                | Description             | Source                                   |
| ------------ | ------------------------ | ----------------------- | ---------------------------------------- |
| DASH-ADMIN   | `admin.knz.categories`   | Categories management   | `dashboards/admin/SCREENS_CATALOG.csv`   |
| DASH-ADMIN   | `admin.knz.fees`         | Fees configuration      | `dashboards/admin/SCREENS_CATALOG.csv`   |
| DASH-ADMIN   | `admin.knz.reporting`    | Reporting and analytics | `dashboards/admin/SCREENS_CATALOG.csv`   |
| DASH-SUPPORT | `support.knz.moderation` | Abuse moderation        | `dashboards/support/SCREENS_CATALOG.csv` |

_Full catalog available in the generated reference `docs/explainar/generated/knz.generated.md`._

### 4.2 API Surface

The service exposes routes for categories admin, fees admin, reporting query, export, abuse moderation, and SSOT bridge. Refer to the generated reference `docs/explainar/generated/knz.generated.md`, which updates automatically and includes a SHA checksum at the end.

## 5. Integrations & Runtime Variables

- **Dependent services**: `WLT` (optional marketplace charges/refunds), `SSOT` (governance decisions).
- **Applications**: Dashboards (`admin`, `support`, `finance`, `marketing`).
- **Runtime variables**: To be documented as the service is developed.

## 6. Features

### Categories Admin

- Create, update, enable/disable categories and subcategories.
- Manage sensitive category flags.
- Full audit logging.

### Fees Admin

- Configure fee profiles with global, region, category, or subcategory scope.
- Fee overrides with conditional logic.
- Step-Up authentication required for financial changes.

### Reporting Query

- List listings, orders, and abuse reports with filtering.
- Get metrics and KPIs (active listings, reports per 100, search CTR).
- Row-level masking for PII based on RBAC.

### Export Service

- Export listings, orders, abuse reports, and metrics.
- Enforced masking for sensitive data (G-PRIVACY-EXPORT guard).
- Support for CSV, Excel, and JSON formats.

### Abuse Moderation

- Moderate listings (warn, hide, soft block, hard block, escalate).
- Resolve abuse reports.
- Full audit trail.

## 7. Database Migrations & Seeders

### 7.1 Migrations

The KNZ service includes database migrations for core entities:

#### Core Tables

- **CategoryEntity** (`knz_categories`): Marketplace categories.
- **FeeProfileEntity** (`knz_fee_profiles`): Fee profiles with scopes.
- **ListingEntity** (`knz_listings`): Marketplace listings.
- **KnzOrderEntity** (`knz_orders`): Marketplace orders.
- **AbuseReportEntity** (`knz_abuse_reports`): Abuse reports.
- **AuditLogEntity** (`knz_audit_logs`): Immutable audit trail.

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

## 8. References & Review

- Sources: `oas/services/knz/openapi.yaml`, `apps/**/SCREENS_CATALOG.csv`, `dashboards/**/SCREENS_CATALOG.csv`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Database: KNZ entities and migrations in `src/modules/knz/entities/` and `migrations/`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
