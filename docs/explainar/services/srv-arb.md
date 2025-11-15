# SRV-ARB - Escrow & Bookings

## 1. Overview

The **ARB** service (عربون) handles deposits and bookings for service offers with escrow management. It provides offer management with deposit rules, booking system with escrow holds, escrow engine (hold/release/refund/forfeit), encrypted chat between customers and partners, admin configuration and metrics, and support dispute resolution.

## 2. Core Journeys

### 2.1 Offer Management (Partner)

1. Partner creates offer via `POST /api/arb/offers` with deposit rules and calendar configuration.
2. Partner updates offer via `PATCH /api/arb/offers/:offer_id` (Idempotency-Key required).
3. Offers are searchable via `GET /api/arb/offers` (public).

### 2.2 Booking Creation (Customer)

1. Customer searches offers via `GET /api/arb/offers`.
2. Customer creates booking via `POST /api/arb/bookings` with deposit hold (Idempotency-Key required).
3. Escrow hold automatically created via WLT integration.
4. Customer tracks booking via `GET /api/arb/bookings/:booking_id`.

### 2.3 Booking Management (Partner)

1. Partner views bookings via `GET /api/arb/partner/bookings`.
2. Partner updates booking status via `POST /api/arb/bookings/:booking_id/status` (Idempotency-Key required).
3. Partner manages calendar and availability.

### 2.4 Escrow Engine

1. Automatic escrow hold on booking creation.
2. Policy-based release/refund based on scope precedence (Subcategory > Category > Region > Global).
3. No-show penalty calculation: `min(VAR_ARB_NO_SHOW_KEEP_PCT% of escrow, VAR_ARB_NO_SHOW_CAP_YER)`.
4. Release days: `VAR_ARB_RELEASE_DAYS` (configurable per scope).

## 3. Guards & Policies

- **Idempotency-Key** enforced on all state-changing calls (offers, bookings, amendments).
- **Step-Up** required for critical approvals (admin config changes, dispute resolutions).
- **Privacy**: chat payloads encrypted (AES-256-GCM); phone numbers masked; no raw phones in logs.
- **Webhooks**: all inbound endpoints enforce HMAC signatures with ≤300s replay window.
- **Escrow**: automatic hold/release/refund based on policies; integration with WLT service.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Surface      | screen_id               | Description                  | Source                                   |
| ------------ | ----------------------- | ---------------------------- | ---------------------------------------- |
| APP-USER     | `app_user.arb.offers`   | Browse and search offers     | `apps/user/SCREENS_CATALOG.csv`          |
| APP-USER     | `app_user.arb.bookings` | Customer bookings management | `apps/user/SCREENS_CATALOG.csv`          |
| APP-PARTNER  | `partner.arb.offers`    | Partner offer management     | `apps/partner/SCREENS_CATALOG.csv`       |
| APP-PARTNER  | `partner.arb.bookings`  | Partner booking management   | `apps/partner/SCREENS_CATALOG.csv`       |
| DASH-ADMIN   | `admin.arb.config`      | ARB configuration and KPIs   | `dashboards/admin/SCREENS_CATALOG.csv`   |
| DASH-SUPPORT | `support.arb.disputes`  | Dispute resolution           | `dashboards/support/SCREENS_CATALOG.csv` |

_Full catalog available in the generated reference `docs/explainar/generated/arb.generated.md`._

### 4.2 API Surface

The service exposes routes for offers, bookings, chat, amendments, admin configuration, and support. Refer to the generated reference `docs/explainar/generated/arb.generated.md`, which updates automatically and includes a SHA checksum at the end.

## 5. Service Classification & Smart Engine

### 5.1 Service Classification

ARB is classified as a **Secondary Service** in the Smart Engine system:

- **Secondary Services**: Important services displayed in service tabs
- **Characteristics**:
  - Visible in service tabs
  - Medium priority in search results
  - Full feature set enabled by default
  - Used by multiple applications (APP-USER, APP-PARTNER, APP-FIELD)

### 5.2 Runtime Variables Integration

ARB integrates with the unified `RuntimeVariablesService` for:

- **Service Flags**: `VAR_SVC_ARB_ENABLED` (default: true)
- **Scoped Configuration**: Zone > City > Service > Global precedence
- **Caching Layer**: Performance optimization for frequent lookups
- **Type-Safe Access**: Methods for service flags and configuration

## 6. Unified Search Integration

### 6.1 ARB Search Adapter

The ARB service integrates with the Unified Search system via `ArbSearchAdapter`:

- **Search Capabilities**:
  - Offers search (by title, description, category, location)
  - Booking search (by customer/partner)
  - Category-based filtering
- **Typeahead/Suggestions**: Real-time search suggestions with relevance scoring
- **Relevance Algorithm**:
  - Exact match: +100 points
  - Starts with: +80 points
  - Contains: +50 points
  - Category match: +30 points
  - Location proximity: +0-20 points
- **Location Filtering**: Region and city-based filtering
- **Cursor Pagination**: Efficient pagination for large result sets

### 6.2 Search Integration Points

- **Unified Search Service**: ARB participates in platform-wide unified search
- **Search Adapters**: `ArbSearchAdapter` implements `BaseSearchAdapter` interface
- **Voice Search**: Ready for voice-to-text integration
- **Image Search**: Ready for image-to-tags integration

### 6.3 Runtime Variables

- `VAR_SEARCH_AUTOSUGGEST_ENABLED` - Enable/disable autosuggest (default: true)
- `VAR_SEARCH_AUTOSUGGEST_MIN_CHARS` - Minimum characters for autosuggest (default: 2)
- `VAR_SEARCH_VOICE_ENABLED_ARB` - Enable voice search for ARB (default: false)
- `VAR_SEARCH_IMAGE_ENABLED_ARB` - Enable image search for ARB (default: false)

## 7. Smart Engine Integration

### 7.1 Offer Ranking

ARB offers are ranked using the Smart Engine:

- **Ranking Factors**:
  - User favorites (+100 points)
  - Recent bookings (+50 points)
  - Tags (TRENDING +30, NEW +20, SEASONAL +15, HIGH_VALUE +25)
  - Location (region/city popularity)
  - Featured status
- **Personalization**: Offer order personalized based on user behavior

### 7.2 Category Ranking

ARB categories are ranked based on:

- Booking volume
- User engagement (views, bookings)
- Partner ratings
- Location popularity

## 8. Banner Service Integration

### 8.1 ARB Banners

The ARB service supports dynamic banners via the Banner Service:

- **Banner Types**: ARB-specific banners for promotions and featured offers
- **Banner Features**:
  - Region/City scoping
  - Time-based scheduling (start_date, end_date)
  - Action types (open_offer, open_category)
  - Priority-based ordering
  - Tags for filtering
- **Runtime Control**: Controlled via `VAR_UI_BANNER_ARB_ENABLED`
- **Refresh Interval**: Configurable via `VAR_UI_BANNER_REFRESH_INTERVAL` (default: 300 seconds)

### 8.2 Admin Endpoints

- `POST /api/admin/banners` - Create banner
- `GET /api/admin/banners` - List banners (with filters)
- `GET /api/admin/banners/:id` - Get banner by ID
- `PUT /api/admin/banners/:id` - Update banner
- `DELETE /api/admin/banners/:id` - Delete banner

**Filtering**: By type (arb), status, is_active, region, city

## 9. Integrations & Runtime Variables

- **Dependent services**: `WLT` (escrow holds/releases), `IDENTITY` (masked contacts), `NOTIFICATIONS` (push notifications).
- **Shared services**: `UnifiedSearchService`, `SmartEngineService`, `BannerService`, `RuntimeVariablesService`.
- **Applications**: `APP-USER`, `APP-PARTNER`, `APP-FIELD`, dashboards (`admin`, `support`).
- **Runtime examples**:
  - `VAR_ARB_RELEASE_DAYS` — default release days (configurable per scope).
  - `VAR_ARB_NO_SHOW_KEEP_PCT` — no-show penalty percentage (default: 20).
  - `VAR_ARB_NO_SHOW_CAP_YER` — no-show penalty cap in YER (default: 3000).
  - `VAR_ARB_QUIET_HOURS` — quiet hours format: "HH:MM-HH:MM" (default: "22:00-08:00").
  - `VAR_ARB_CHAT_RETENTION_DAYS` — chat message retention (default: 30).
  - `VAR_ARB_CHAT_ENCRYPTION_KEY` — AES-GCM encryption key (hex format).
  - `VAR_SVC_ARB_ENABLED` — enable/disable ARB service globally.
  - `VAR_UI_BANNER_ARB_ENABLED` — enable ARB banners.
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 10. Escrow Policies

### Release Days

Configurable per scope (Subcategory > Category > Region > Global):

- Default: `VAR_ARB_RELEASE_DAYS`
- Applied after booking completion/attendance

### No-Show Policy

- Penalty: `min(VAR_ARB_NO_SHOW_KEEP_PCT% of escrow, VAR_ARB_NO_SHOW_CAP_YER)`
- Minimum: 20% of escrow
- Cap: 3000 YER (default)
- Remaining amount refunded to customer

### Deposit Policies

- `FULL_REFUND` — Full refund on cancellation
- `PARTIAL_REFUND` — Partial refund based on policy
- `NO_REFUND` — No refund (rare, for special cases)

## 11. Database Migrations & Seeders

### 11.1 Migrations

The ARB service includes database migrations for core entities:

#### Migration: `arb_offers` Table

- **File**: `migrations/Migration20250201000010_CreateArbOffersTable.ts`
- **Purpose**: Creates service offers table
- **Key Fields**:
  - `offer_id` (unique): Offer identifier
  - `partner_id`: Partner identifier
  - `title_ar` / `title_en`: Localized titles
  - `description_ar` / `description_en`: Localized descriptions
  - `category_id`: Category reference
  - `subcategory_id`: Subcategory reference
  - `deposit_amount_yer`: Deposit amount in YER minor units
  - `deposit_policy`: Deposit policy (FULL_REFUND, PARTIAL_REFUND, NO_REFUND)
  - `calendar_config`: JSONB for calendar configuration
  - `slots`: JSONB for available slots
  - `status`: Offer status (active, inactive, archived)
  - `metadata`: JSONB for additional metadata

#### Migration: `arb_bookings` Table

- **File**: `migrations/Migration20250201000011_CreateArbBookingsTable.ts`
- **Purpose**: Creates customer bookings table
- **Key Fields**:
  - `booking_id` (unique): Booking identifier
  - `offer_id`: Offer reference
  - `customer_id`: Customer identifier
  - `partner_id`: Partner identifier
  - `deposit_amount_yer`: Deposit amount
  - `escrow_hold_id`: WLT hold reference
  - `status`: Booking status (pending, confirmed, completed, cancelled, no_show)
  - `scheduled_date`: Scheduled booking date
  - `completed_date`: Completion date
  - `metadata`: JSONB for additional metadata

#### Migration: `arb_booking_chat_messages` Table

- **File**: `migrations/Migration20250201000012_CreateArbBookingChatMessagesTable.ts`
- **Purpose**: Creates encrypted chat messages table
- **Key Fields**:
  - `message_id` (unique): Message identifier
  - `booking_id`: Booking reference
  - `sender_id`: Sender identifier
  - `sender_role`: Sender role (customer, partner, support)
  - `encrypted_content`: AES-256-GCM encrypted content
  - `masked_phone`: Masked phone number (if applicable)
  - `created_at`: Timestamp

#### Migration: `arb_booking_amendments` Table

- **File**: `migrations/Migration20250201000013_CreateArbBookingAmendmentsTable.ts`
- **Purpose**: Creates price/schedule change requests table
- **Key Fields**:
  - `amendment_id` (unique): Amendment identifier
  - `booking_id`: Booking reference
  - `requested_by`: Requester identifier
  - `amendment_type`: Type (price_change, schedule_change)
  - `old_value` / `new_value`: Change values
  - `status`: Status (pending, accepted, rejected)
  - `metadata`: JSONB for additional metadata

#### Migration: `arb_configs` Table

- **File**: `migrations/Migration20250201000014_CreateArbConfigsTable.ts`
- **Purpose**: Creates policy configuration table
- **Key Fields**:
  - `config_id` (unique): Configuration identifier
  - `scope`: Scope (global, region, category, subcategory)
  - `scope_value`: Scope value
  - `release_days`: Release days configuration
  - `no_show_keep_pct`: No-show penalty percentage
  - `no_show_cap_yer`: No-show penalty cap
  - `metadata`: JSONB for additional metadata

#### Migration: `arb_audit_logs` Table

- **File**: `migrations/Migration20250201000015_CreateArbAuditLogsTable.ts`
- **Purpose**: Creates immutable audit trail table
- **Key Fields**:
  - `log_id` (unique): Log identifier
  - `event_type`: Event type
  - `booking_id` / `offer_id`: Entity references
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

### Offers

- `GET /api/arb/offers` - Search offers (public, cursor pagination)
- `GET /api/arb/offers/:offer_id` - Get offer details (public)
- `POST /api/arb/offers` - Create offer (partner, Idempotency-Key required)
- `PATCH /api/arb/offers/:offer_id` - Update offer (partner, Idempotency-Key required)

### Bookings

- `POST /api/arb/bookings` - Create booking + deposit hold (customer, Idempotency-Key required)
- `GET /api/arb/bookings/:booking_id` - Get booking detail (role-aware)
- `GET /api/arb/bookings` - List customer bookings (customer, cursor pagination)
- `GET /api/arb/partner/bookings` - List partner bookings (partner, cursor pagination)
- `POST /api/arb/bookings/:booking_id/status` - Update status (partner/customer, Idempotency-Key required)

### Chat

- `GET /api/arb/bookings/:booking_id/chat/messages` - List chat messages (participants/support/admin)
- `POST /api/arb/bookings/:booking_id/chat/messages` - Send chat message (participants, Idempotency-Key required)
- `POST /api/arb/bookings/:booking_id/chat/escalate` - Escalate to support (participants, Idempotency-Key required)
- `GET /api/arb/bookings/:booking_id/chat/audit` - Compliance chat access (support/admin, Step-Up required)

### Amendments

- `POST /api/arb/bookings/:booking_id/amendments` - Create amendment (participants, Idempotency-Key required)
- `POST /api/arb/bookings/:booking_id/amendments/:amendment_id/accept` - Accept amendment (counterparty, Idempotency-Key required)
- `POST /api/arb/bookings/:booking_id/amendments/:amendment_id/reject` - Reject amendment (counterparty, Idempotency-Key required)

### Admin

- `GET /api/arb/admin/config` - Get ARB configs (admin)
- `PATCH /api/arb/admin/config` - Update ARB configs (admin/finance, Step-Up + Idempotency-Key required)
- `GET /api/arb/admin/kpis` - KPIs & aggregates (admin/finance)

### Support

- `GET /api/arb/support/disputes` - List disputes (support, cursor pagination)
- `GET /api/arb/support/bookings/:booking_id` - Support booking view (support)
- `POST /api/arb/support/resolutions` - Apply dispute resolution (support/finance, Step-Up + Idempotency-Key required)

## 13. Metrics & KPIs

The ARB service tracks the following metrics:

- `arb_booking_volume` - Total bookings
- `arb_active_escrow_balance` - Active escrow balance
- `arb_no_show_rate` - No-show rate percentage
- `arb_dispute_rate` - Dispute rate percentage
- `arb_avg_release_time_days` - Average release time
- `arb_conversion_rate_offer_to_booking` - Conversion rate

## 14. References & Review

- Sources: `oas/services/arb/openapi.yaml`, `apps/**/SCREENS_CATALOG.csv`, `dashboards/**/SCREENS_CATALOG.csv`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Database: ARB entities and migrations in `src/modules/arb/entities/` and `migrations/`.
- Last human review: 2025-01-15.

---

**Source SHA256**: `[To be generated]`
