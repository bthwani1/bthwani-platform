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

## 5. Service Classification & Smart Engine

### 5.1 Service Classification

KNZ is classified as a **Primary Service** in the Smart Engine system:

- **Primary Services**: Core, high-frequency services prominently displayed
- **Characteristics**:
  - Always visible on home screen
  - Featured in service cards
  - High priority in search results
  - Full feature set enabled by default

### 5.2 Runtime Variables Integration

KNZ integrates with the unified `RuntimeVariablesService` for:

- **Service Flags**: `VAR_SVC_KNZ_ENABLED` (default: true)
- **Scoped Configuration**: Zone > City > Service > Global precedence
- **Caching Layer**: Performance optimization for frequent lookups
- **Type-Safe Access**: Methods for service flags and configuration

## 6. Unified Search Integration

### 6.1 KNZ Search Adapter

The KNZ service integrates with the Unified Search system via `KnzSearchAdapter`:

- **Search Capabilities**:
  - Listings search (by title, description, category, location)
  - Category-based filtering
  - Location-based filtering
- **Typeahead/Suggestions**: Real-time search suggestions with relevance scoring
- **Relevance Algorithm**:
  - Exact match: +100 points
  - Starts with: +80 points
  - Contains: +50 points
  - View count: +0-20 points
  - Click count: +0-15 points
- **Location Filtering**: Region and city-based filtering
- **Cursor Pagination**: Efficient pagination for large result sets

### 6.2 Search Integration Points

- **Unified Search Service**: KNZ participates in platform-wide unified search
- **Search Adapters**: `KnzSearchAdapter` implements `BaseSearchAdapter` interface
- **Voice Search**: Ready for voice-to-text integration
- **Image Search**: Ready for image-to-tags integration

### 6.3 Runtime Variables

- `VAR_SEARCH_AUTOSUGGEST_ENABLED` - Enable/disable autosuggest (default: true)
- `VAR_SEARCH_AUTOSUGGEST_MIN_CHARS` - Minimum characters for autosuggest (default: 2)
- `VAR_SEARCH_VOICE_ENABLED_KNZ` - Enable voice search for KNZ (default: false)
- `VAR_SEARCH_IMAGE_ENABLED_KNZ` - Enable image search for KNZ (default: false)

## 7. Smart Engine Integration

### 7.1 Listing Ranking

KNZ listings are ranked using the Smart Engine:

- **Ranking Factors**:
  - User favorites (+100 points)
  - Recent views/bookings (+50 points)
  - Tags (TRENDING +30, NEW +20, SEASONAL +15, HIGH_VALUE +25)
  - Location (region/city popularity)
  - Featured status
  - View/click counts
- **Personalization**: Listing order personalized based on user behavior

### 7.2 Category Ranking

KNZ categories are ranked based on:

- Listing volume
- User engagement (views, clicks, orders)
- Search CTR
- Location popularity

## 8. Banner Service Integration

### 8.1 KNZ Banners

The KNZ service supports dynamic banners via the Banner Service:

- **Banner Types**: KNZ-specific banners for promotions and featured listings
- **Banner Features**:
  - Region/City scoping
  - Time-based scheduling (start_date, end_date)
  - Action types (open_listing, open_category)
  - Priority-based ordering
  - Tags for filtering
- **Runtime Control**: Controlled via `VAR_UI_BANNER_KNZ_ENABLED`
- **Refresh Interval**: Configurable via `VAR_UI_BANNER_REFRESH_INTERVAL` (default: 300 seconds)

## 9. Integrations & Runtime Variables

- **Dependent services**: `WLT` (optional marketplace charges/refunds), `SSOT` (governance decisions).
- **Shared services**: `UnifiedSearchService`, `SmartEngineService`, `BannerService`, `RuntimeVariablesService`.
- **Applications**: Dashboards (`admin`, `support`, `finance`, `marketing`).
- **Runtime examples**:
  - `VAR_SVC_KNZ_ENABLED` — enable/disable KNZ service globally.
  - `VAR_UI_BANNER_KNZ_ENABLED` — enable KNZ banners.
  - `VAR_WEBAPP_FEATURE_KNZ_MODE` — KNZ mode for web-app (default: "browse_only").
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 10. Features

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

## 11. Database Migrations & Seeders

### 11.1 Migrations

The KNZ service includes database migrations for core entities:

#### Migration: `knz_categories` Table

- **File**: `migrations/Migration20250201000016_CreateKnzCategoriesTable.ts`
- **Purpose**: Creates marketplace categories table
- **Key Fields**:
  - `category_id` (unique): Category identifier
  - `parent_category_id`: Parent category reference (for subcategories)
  - `name_ar` / `name_en`: Localized names
  - `description_ar` / `description_en`: Localized descriptions
  - `is_sensitive`: Sensitive category flag
  - `status`: Category status (active, inactive, archived)
  - `sort_order`: Display ordering
  - `metadata`: JSONB for additional metadata

#### Migration: `knz_fee_profiles` Table

- **File**: `migrations/Migration20250201000017_CreateKnzFeeProfilesTable.ts`
- **Purpose**: Creates fee profiles table
- **Key Fields**:
  - `fee_profile_id` (unique): Fee profile identifier
  - `scope`: Scope (global, region, category, subcategory)
  - `scope_value`: Scope value
  - `fee_percentage`: Fee percentage
  - `fee_fixed_yer`: Fixed fee in YER minor units
  - `status`: Profile status (active, inactive)
  - `metadata`: JSONB for additional metadata

#### Migration: `knz_listings` Table

- **File**: `migrations/Migration20250201000018_CreateKnzListingsTable.ts`
- **Purpose**: Creates marketplace listings table
- **Key Fields**:
  - `listing_id` (unique): Listing identifier
  - `seller_id`: Seller identifier
  - `category_id`: Category reference
  - `title_ar` / `title_en`: Localized titles
  - `description_ar` / `description_en`: Localized descriptions
  - `price_yer`: Price in YER minor units
  - `status`: Listing status (active, inactive, hidden, blocked)
  - `view_count` / `click_count`: Engagement metrics
  - `metadata`: JSONB for additional metadata

#### Migration: `knz_orders` Table

- **File**: `migrations/Migration20250201000019_CreateKnzOrdersTable.ts`
- **Purpose**: Creates marketplace orders table
- **Key Fields**:
  - `order_id` (unique): Order identifier
  - `listing_id`: Listing reference
  - `buyer_id`: Buyer identifier
  - `seller_id`: Seller identifier
  - `amount_yer`: Order amount
  - `fee_yer`: Platform fee
  - `status`: Order status (pending, confirmed, completed, cancelled)
  - `metadata`: JSONB for additional metadata

#### Migration: `knz_abuse_reports` Table

- **File**: `migrations/Migration20250201000020_CreateKnzAbuseReportsTable.ts`
- **Purpose**: Creates abuse reports table
- **Key Fields**:
  - `report_id` (unique): Report identifier
  - `listing_id`: Listing reference
  - `reporter_id`: Reporter identifier
  - `report_type`: Report type (fraud, spam, inappropriate, etc.)
  - `status`: Report status (pending, resolved, dismissed)
  - `metadata`: JSONB for additional metadata

#### Migration: `knz_audit_logs` Table

- **File**: `migrations/Migration20250201000021_CreateKnzAuditLogsTable.ts`
- **Purpose**: Creates immutable audit trail table
- **Key Fields**:
  - `log_id` (unique): Log identifier
  - `event_type`: Event type
  - `entity_type` / `entity_id`: Entity references
  - `user_id`: User who triggered the event
  - `payload_hash`: SHA256 hash of payload
  - `metadata`: JSONB for additional metadata
  - `created_at`: Timestamp (immutable)

### 11.2 Seeders

Seeders for initial configuration and test data (dev environment only).

### 11.3 Migration Execution

**To run migrations:**

```bash
# Run all pending migrations
npm run migration:up

# Or via MikroORM CLI
npx mikro-orm migration:up
```

**Note**: See `docs/MIGRATION_DEPLOYMENT.md` for detailed deployment instructions.

## 12. API Endpoints Summary

### Categories Admin

- `POST /knz/admin/categories` - Create category (admin, Step-Up + Idempotency-Key)
- `PUT /knz/admin/categories/:category_id` - Update category (admin, Step-Up + Idempotency-Key)
- `GET /knz/admin/categories/:category_id` - Get category (admin, ops, support)
- `GET /knz/admin/categories` - List categories (admin, ops, support)
- `POST /knz/admin/categories/:category_id/enable` - Enable category (admin, Step-Up + Idempotency-Key)
- `POST /knz/admin/categories/:category_id/disable` - Disable category (admin, Step-Up + Idempotency-Key)

### Fees Admin

- `POST /knz/admin/fees` - Create fee profile (admin, Step-Up + Idempotency-Key)
- `PUT /knz/admin/fees/:id` - Update fee profile (admin, Step-Up + Idempotency-Key)
- `GET /knz/admin/fees/:id` - Get fee profile (admin, finance)
- `GET /knz/admin/fees` - List fee profiles (admin, finance, ops)
- `GET /knz/admin/fees/scope/:scope` - Find by scope (admin, finance)

### Reporting Query

- `GET /knz/reporting/listings` - List listings (admin, ops, support, cursor pagination)
- `GET /knz/reporting/listings/:id` - Get listing (admin, ops, support)
- `GET /knz/reporting/orders` - List orders (admin, ops, support, finance, cursor pagination)
- `GET /knz/reporting/orders/:id` - Get order (admin, ops, support, finance)
- `GET /knz/reporting/abuse-reports` - List abuse reports (admin, ops, support, cursor pagination)
- `GET /knz/reporting/abuse-reports/:id` - Get abuse report (admin, ops, support)
- `GET /knz/reporting/metrics` - Get metrics (admin, ops, finance, marketing)

### Export

- `POST /knz/export` - Export data (admin, finance, ops, Idempotency-Key required, masked only)

### Abuse Moderation

- `GET /knz/admin/abuse/reports` - List abuse reports (admin, ops, support, cursor pagination)
- `GET /knz/admin/abuse/reports/:id` - Get abuse report (admin, ops, support)
- `POST /knz/admin/abuse/listings/:id/moderate` - Moderate listing (admin, ops, support, Idempotency-Key required)
- `PUT /knz/admin/abuse/reports/:id/resolve` - Resolve report (admin, ops, support, Idempotency-Key required)

### SSOT Bridge

- `GET /knz/admin/ssot/decisions` - Get decisions (admin, ssot_governor)
- `GET /knz/admin/ssot/parity/:artifact_type/:artifact_id` - Get parity (admin, ssot_governor)
- `GET /knz/admin/ssot/guards` - Get guard statuses (admin, ssot_governor, security)
- `POST /knz/admin/ssot/decisions/:id/approve` - Approve decision (ssot_governor, Step-Up + Idempotency-Key)

## 13. Metrics & KPIs

The KNZ service tracks the following metrics:

- `active_listings` - Count of active listings
- `reports_per_100_listings` - (Total Reports / Active Listings) × 100
- `search_CTR` - Click-Through Rate on search results
- `listing_view_count` - Total listing views
- `listing_click_count` - Total listing clicks
- `order_conversion_rate` - Orders / Views ratio

## 14. References & Review

- Sources: `oas/services/knz/openapi.yaml`, `apps/**/SCREENS_CATALOG.csv`, `dashboards/**/SCREENS_CATALOG.csv`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Database: KNZ entities and migrations in `src/modules/knz/entities/` and `migrations/`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
