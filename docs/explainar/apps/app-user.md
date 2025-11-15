# APP-USER - User Mobile Application

## 1. Overview

The **APP-USER** is the primary customer-facing mobile application for the BThwani platform. It provides access to all platform services including DSH (Delivery & Shopping), KNZ (Marketplace), AMN (Safe Taxi), KWD (Jobs Platform), SND (On-demand Services), MRF (Lost & Found), ESF (Blood Donation), ARB (Escrow & Bookings), and WLT (Wallet & Ledger) for payments.

## 2. Core Journeys

### 2.1 DSH (Delivery & Shopping) Journey

1. User browses categories and products via home screen.
2. User requests quote via `POST /api/dls/quotes` for Dark-Store slots.
3. User creates order via `POST /api/dls/orders` with `Idempotency-Key` and payment selection.
4. User tracks order via `GET /api/dls/orders/{order_id}` and tracking endpoints.
5. User communicates via encrypted chat (`/api/dls/orders/{order_id}/chat/messages`).
6. User verifies delivery via PoD (`/api/dls/orders/{order_id}/pod/verify`) or pickup close (`/api/dls/orders/{order_id}/pickup/close`).
7. User provides feedback via `POST /api/dls/orders/{order_id}/feedback`.
8. User views receipt via `GET /api/dls/orders/{order_id}/receipt`.

### 2.2 AMN (Safe Taxi) Journey

1. User requests quote via `POST /api/amn/quotes` with pickup and dropoff locations.
2. User creates trip via `POST /api/amn/trips` with quote acceptance.
3. User tracks trip via `GET /api/amn/trips/:trip_id`.
4. User completes trip and processes payment via WLT integration.

### 2.3 ARB (Escrow & Bookings) Journey

1. User browses offers via `GET /api/arb/offers`.
2. User creates booking via `POST /api/arb/bookings` with deposit hold.
3. User manages booking and communicates via encrypted chat.
4. User tracks escrow status and receives refunds based on policies.

### 2.4 Other Services

- **KWD**: Search and view job listings, create listings, report abuse.
- **SND**: Create instant help or specialized service requests.
- **MRF**: File lost and found reports.
- **ESF**: Create blood donation requests and match with donors.
- **KNZ**: Browse marketplace listings (read-only on web, full CRUD on mobile).

## 3. Guards & Policies

- **Idempotency-Key** enforced on all state-changing calls (orders, bookings, trips, requests).
- **Step-Up** required for sensitive operations (payment confirmations, bank updates).
- **Privacy**: All chat payloads encrypted (AES-GCM); phone numbers masked; no raw PII in logs.
- **Webhooks**: All inbound endpoints enforce HMAC signatures with ≤300s replay window.
- **Payment**: All payments flow through WLT service with proper ledger entries.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Screen ID                      | Service | Description                      | Endpoint                                    |
| ------------------------------ | ------- | -------------------------------- | ------------------------------------------- |
| `APP_USER_HOME`                | GLOBAL  | Main home screen                 | `[TBD]`                                     |
| `APP_USER_DSH_CHECKOUT`        | DSH     | Checkout flow                    | `/api/dls/orders`                           |
| `APP_USER_DSH_ORDERS`           | DSH     | Orders list                      | `/api/dls/orders`                            |
| `APP_USER_DSH_ORDER_DETAILS`   | DSH     | Order details and tracking       | `/api/dls/orders/{order_id}`                 |
| `APP_USER_DSH_ORDER_TRACKING`  | DSH     | Real-time tracking               | `/api/dls/orders/{order_id}/tracking`        |
| `APP_USER_DSH_ORDER_CHAT`      | DSH     | Encrypted chat                   | `/api/dls/orders/{order_id}/chat/messages`   |
| `APP_USER_WLT_PAYMENT_INTENT`  | WLT     | Payment intent creation          | `/api/wlt/intents`                          |
| `APP_USER_WLT_PAYMENT_STATUS`  | WLT     | Payment status polling           | `/api/wlt/intents/{intent_id}`               |
| `APP_USER_AMN_RIDES`           | AMN     | Safe taxi rides                  | `/api/amn/rides`                            |
| `APP_USER_ARB_BOOKINGS`        | ARB     | Escrow bookings                  | `/api/arb/bookings`                          |
| `APP_USER_WLT_WALLET`          | WLT     | Wallet and payments              | `[TBD]`                                     |

_Full catalog available in `apps/user/SCREENS_CATALOG.csv`._

### 4.2 API Surface

The application integrates with all platform services. Refer to individual service documentation in `docs/explainar/services/` for complete API details.

## 5. Integrations & Runtime Variables

- **Primary services**: `DSH`, `KNZ`, `AMN`, `KWD`, `SND`, `MRF`, `ESF`, `ARB`, `WLT`.
- **Supporting services**: `IDENTITY` (authentication, profile), `NOTIFICATIONS` (push notifications).
- **Runtime examples**:
  - `VAR_WEBAPP_FEATURE_DSH_MODE` — DSH mode (default: "full").
  - `VAR_WEBAPP_FEATURE_KNZ_MODE` — KNZ mode (default: "browse_only").
  - `VAR_WEBAPP_FEATURE_AMN_MODE` — AMN mode (default: "info_only").
  - `VAR_WEBAPP_FEATURE_KWD_MODE` — KWD mode (default: "search_details_only").
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. Service Modes (Web App)

The web app (`app.bthwani.com`) mirrors APP-USER functionality with configurable service modes:

- **DSH**: `full` — Full checkout + tracking flows.
- **KNZ**: `browse_only` — Catalog browse/details only.
- **AMN**: `info_only` — Shows marketplace info screens.
- **KWD**: `search_details_only` — Search + detail views, no CRUD.
- **MRF**: `full` — Full incident filing and chat.
- **ESF**: `full` — Full enablement (request + matching).
- **SND**: `full` — Specialist assistance.
- **ARB**: `full` — Booking + 6-digit lock workflows.
- **WLT**: `embedded_only` — Only within DSH checkout flows.

## 7. Navigation & User Experience

### Main Navigation

- **Home**: Service discovery and quick access.
- **Orders/Bookings**: Active and historical transactions.
- **Wallet**: Balance, transactions, payment methods.
- **Profile**: User settings, preferences, support.

### Service-Specific Flows

Each service has dedicated flows accessible from the home screen or service-specific entry points.

## 8. References & Review

- Sources: `apps/user/SCREENS_CATALOG.csv`, `oas/services/*/openapi.yaml`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Screen catalog: `apps/user/SCREENS_CATALOG.csv`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`

