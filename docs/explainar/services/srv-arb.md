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

## 5. Integrations & Runtime Variables

- **Dependent services**: `WLT` (escrow holds/releases), `IDENTITY` (masked contacts), `NOTIFICATIONS` (push notifications).
- **Applications**: `APP-USER`, `APP-PARTNER`, dashboards (`admin`, `support`).
- **Runtime examples**:
  - `VAR_ARB_RELEASE_DAYS` — default release days (configurable per scope).
  - `VAR_ARB_NO_SHOW_KEEP_PCT` — no-show penalty percentage (default: 20).
  - `VAR_ARB_NO_SHOW_CAP_YER` — no-show penalty cap in YER (default: 3000).
  - `VAR_ARB_QUIET_HOURS` — quiet hours format: "HH:MM-HH:MM" (default: "22:00-08:00").
  - `VAR_ARB_CHAT_RETENTION_DAYS` — chat message retention (default: 30).
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. Escrow Policies

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

## 7. Database Migrations & Seeders

### 7.1 Migrations

The ARB service includes database migrations for core entities:

#### Core Tables

- **OfferEntity** (`arb_offers`): Service offers with deposit rules, slots, and calendar configuration.
- **BookingEntity** (`arb_bookings`): Customer bookings with escrow status tracking.
- **BookingChatMessageEntity** (`arb_booking_chat_messages`): Encrypted chat messages with phone masking.
- **BookingAmendmentEntity** (`arb_booking_amendments`): Price/schedule change requests.
- **ArbConfigEntity** (`arb_configs`): Policy configuration by scope.
- **ArbAuditLogEntity** (`arb_audit_logs`): Immutable audit trail.

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

- Sources: `oas/services/arb/openapi.yaml`, `apps/**/SCREENS_CATALOG.csv`, `dashboards/**/SCREENS_CATALOG.csv`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Database: ARB entities and migrations in `src/modules/arb/entities/` and `migrations/`.
- Last human review: 2025-01-15.

---

**Source SHA256**: `[To be generated]`
