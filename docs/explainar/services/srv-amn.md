# SRV-AMN - Safe Taxi

## 1. Overview

The **AMN** service provides Safe Taxi functionality for passengers and captains. It handles trip management, quotes, offers, SOS handling, and payment processing.

## 2. Core Journeys

### 2.1 Passenger Journey

1. Passenger requests quote via `POST /api/amn/quotes` with pickup and dropoff locations.
2. Passenger creates trip via `POST /api/amn/trips` with quote acceptance.
3. Passenger tracks trip via `GET /api/amn/trips/:trip_id`.
4. Passenger completes trip and processes payment.

### 2.2 Captain Journey

1. Captain receives trip offers via `GET /api/amn/captain/offers`.
2. Captain accepts offer via `POST /api/amn/captain/offers/:offer_id/accept`.
3. Captain updates trip status (arrived, started, completed).
4. Captain processes payment and receives payout.

### 2.3 SOS Handling

1. Passenger or captain triggers SOS via `POST /api/amn/trips/:trip_id/sos`.
2. Emergency services notified.
3. Trip status updated and tracked.

## 3. Guards & Policies

- **Idempotency-Key** enforced on all state-changing calls (quotes, trips, offers).
- **Step-Up** required for critical approvals (payment processing, SOS handling).
- **Privacy**: trip data masked in logs; no raw location data in responses.
- **Webhooks**: all inbound endpoints enforce HMAC signatures with ≤300s replay window.
- **Payment**: integration with WLT service for charges and driver payouts.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Surface     | screen_id              | Description                   | Source                                 |
| ----------- | ---------------------- | ----------------------------- | -------------------------------------- |
| APP-USER    | `app_user.amn.quote`   | Request taxi quote            | `apps/user/SCREENS_CATALOG.csv`        |
| APP-USER    | `app_user.amn.trip`    | Trip tracking and management  | `apps/user/SCREENS_CATALOG.csv`        |
| APP-CAPTAIN | `captain.amn.offers`   | Captain trip offers           | `apps/captain/SCREENS_CATALOG.csv`     |
| APP-CAPTAIN | `captain.amn.trip`     | Captain trip execution        | `apps/captain/SCREENS_CATALOG.csv`     |
| DASH-FLEET  | `fleet.amn.monitoring` | Fleet monitoring and dispatch | `dashboards/fleet/SCREENS_CATALOG.csv` |

_Full catalog available in the generated reference `docs/explainar/generated/amn.generated.md`._

### 4.2 API Surface

The service exposes routes for quotes, trips, offers, captain operations, and SOS handling. Refer to the generated reference `docs/explainar/generated/amn.generated.md`, which updates automatically and includes a SHA checksum at the end.

## 5. Integrations & Runtime Variables

- **Dependent services**: `WLT` (ride charges and driver payouts), `NOTIFICATIONS` (trip updates, SOS alerts).
- **Applications**: `APP-USER`, `APP-CAPTAIN`, dashboards (`fleet`, `ops`).
- **Runtime examples**:
  - `VAR_AMN_BASE_FARE_YER` — base fare in YER.
  - `VAR_AMN_PER_KM_RATE_YER` — per kilometer rate.
  - `VAR_AMN_MIN_FARE_YER` — minimum fare.
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. Trip Management

### Quote Calculation

- Base fare + distance-based pricing.
- Time-based surcharges (peak hours, night).
- Configurable via runtime variables.

### Trip States

- `PENDING` — Quote accepted, waiting for captain.
- `ASSIGNED` — Captain assigned.
- `ARRIVED` — Captain arrived at pickup.
- `STARTED` — Trip in progress.
- `COMPLETED` — Trip completed.
- `CANCELLED` — Trip cancelled.
- `SOS` — Emergency situation.

## 7. Database Migrations & Seeders

### 7.1 Migrations

The AMN service includes database migrations for core entities:

#### Core Tables

- **TripEntity** (`amn_trips`): Trip records with status tracking.
- **QuoteEntity** (`amn_quotes`): Price quotes for trips.
- **OfferEntity** (`amn_offers`): Captain trip offers.
- **SosEventEntity** (`amn_sos_events`): SOS event records.
- **AuditLogEntity** (`amn_audit_logs`): Immutable audit trail.

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

- Sources: `oas/services/amn/openapi.yaml`, `apps/**/SCREENS_CATALOG.csv`, `dashboards/**/SCREENS_CATALOG.csv`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Database: AMN entities and migrations in `src/modules/amn/entities/` and `migrations/`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
