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

## 5. Service Classification & Smart Engine

### 5.1 Service Classification

AMN is classified as a **Primary Service** in the Smart Engine system:

- **Primary Services**: Core, high-frequency services prominently displayed
- **Characteristics**:
  - Always visible on home screen
  - Featured in service cards
  - High priority in search results
  - Full feature set enabled by default

### 5.2 Runtime Variables Integration

AMN integrates with the unified `RuntimeVariablesService` for:

- **Service Flags**: `VAR_SVC_AMN_ENABLED` (default: true)
- **Scoped Configuration**: Zone > City > Service > Global precedence
- **Caching Layer**: Performance optimization for frequent lookups
- **Type-Safe Access**: Methods for service flags and configuration

## 6. Integrations & Runtime Variables

- **Dependent services**: `WLT` (ride charges and driver payouts), `NOTIFICATIONS` (trip updates, SOS alerts).
- **Shared services**: `RuntimeVariablesService`.
- **Applications**: `APP-USER`, `APP-CAPTAIN`, dashboards (`fleet`, `ops`).
- **Runtime examples**:
  - `VAR_AMN_BASE_FARE_YER` — base fare in YER.
  - `VAR_AMN_PER_KM_RATE_YER` — per kilometer rate.
  - `VAR_AMN_MIN_FARE_YER` — minimum fare.
  - `VAR_SVC_AMN_ENABLED` — enable/disable AMN service globally.
  - `VAR_WEBAPP_FEATURE_AMN_MODE` — AMN mode for web-app (default: "info_only").
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 7. Trip Management

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

## 8. Database Migrations & Seeders

### 8.1 Migrations

The AMN service includes database migrations for core entities:

#### Migration: `amn_trips` Table

- **File**: `migrations/Migration20250201000022_CreateAmnTripsTable.ts`
- **Purpose**: Creates trip records table
- **Key Fields**:
  - `trip_id` (unique): Trip identifier
  - `passenger_id`: Passenger identifier
  - `captain_id`: Captain identifier
  - `quote_id`: Quote reference
  - `pickup_location`: Pickup location (lat/lng)
  - `dropoff_location`: Dropoff location (lat/lng)
  - `status`: Trip status (PENDING, ASSIGNED, ARRIVED, STARTED, COMPLETED, CANCELLED, SOS)
  - `fare_yer`: Final fare in YER minor units
  - `metadata`: JSONB for additional metadata

#### Migration: `amn_quotes` Table

- **File**: `migrations/Migration20250201000023_CreateAmnQuotesTable.ts`
- **Purpose**: Creates price quotes table
- **Key Fields**:
  - `quote_id` (unique): Quote identifier
  - `pickup_location`: Pickup location
  - `dropoff_location`: Dropoff location
  - `estimated_distance_km`: Estimated distance
  - `estimated_fare_yer`: Estimated fare
  - `expires_at`: Quote expiration timestamp
  - `metadata`: JSONB for additional metadata

#### Migration: `amn_offers` Table

- **File**: `migrations/Migration20250201000024_CreateAmnOffersTable.ts`
- **Purpose**: Creates captain trip offers table
- **Key Fields**:
  - `offer_id` (unique): Offer identifier
  - `trip_id`: Trip reference
  - `captain_id`: Captain identifier
  - `status`: Offer status (pending, accepted, rejected)
  - `metadata`: JSONB for additional metadata

#### Migration: `amn_sos_events` Table

- **File**: `migrations/Migration20250201000025_CreateAmnSosEventsTable.ts`
- **Purpose**: Creates SOS event records table
- **Key Fields**:
  - `sos_id` (unique): SOS event identifier
  - `trip_id`: Trip reference
  - `triggered_by`: User who triggered SOS
  - `location`: SOS location (lat/lng)
  - `status`: SOS status (active, resolved)
  - `metadata`: JSONB for additional metadata

#### Migration: `amn_audit_logs` Table

- **File**: `migrations/Migration20250201000026_CreateAmnAuditLogsTable.ts`
- **Purpose**: Creates immutable audit trail table
- **Key Fields**:
  - `log_id` (unique): Log identifier
  - `event_type`: Event type
  - `trip_id`: Trip reference
  - `user_id`: User who triggered the event
  - `payload_hash`: SHA256 hash of payload
  - `metadata`: JSONB for additional metadata
  - `created_at`: Timestamp (immutable)

### 8.2 Seeders

Seeders for initial configuration and test data (dev environment only).

### 8.3 Migration Execution

**To run migrations:**

```bash
# Run all pending migrations
npm run migration:up

# Or via MikroORM CLI
npx mikro-orm migration:up
```

**Note**: See `docs/MIGRATION_DEPLOYMENT.md` for detailed deployment instructions.

## 9. API Endpoints Summary

### Quotes

- `POST /api/amn/quotes` - Request quote (Idempotency-Key required)
- `GET /api/amn/quotes/:quote_id` - Get quote details

### Trips

- `POST /api/amn/trips` - Create trip (Idempotency-Key required)
- `GET /api/amn/trips/:trip_id` - Get trip details
- `GET /api/amn/trips` - List trips (cursor pagination)
- `POST /api/amn/trips/:trip_id/status` - Update trip status (Idempotency-Key required)

### Captain Operations

- `GET /api/amn/captain/offers` - List trip offers (cursor pagination)
- `POST /api/amn/captain/offers/:offer_id/accept` - Accept offer (Idempotency-Key required)
- `POST /api/amn/captain/trips/:trip_id/status` - Update trip status (Idempotency-Key required)

### SOS

- `POST /api/amn/trips/:trip_id/sos` - Trigger SOS (Idempotency-Key required)
- `GET /api/amn/sos/:sos_id` - Get SOS event details

## 10. References & Review

- Sources: `oas/services/amn/openapi.yaml`, `apps/**/SCREENS_CATALOG.csv`, `dashboards/**/SCREENS_CATALOG.csv`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Database: AMN entities and migrations in `src/modules/amn/entities/` and `migrations/`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
