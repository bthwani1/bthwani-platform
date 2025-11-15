# APP-CAPTAIN - Captain Mobile Application

## 1. Overview

The **APP-CAPTAIN** is the driver-facing mobile application for the BThwani platform. It enables captains to deliver DSH (Delivery & Shopping) orders, provide AMN (Amani Safe Taxi) rides (female captains only), view earnings and request payouts via WLT (Wallet & Ledger), and manage their availability and service eligibility.

## 2. Core Journeys

### 2.1 Captain Onboarding

1. Captain installs app and lands on auth screen (`screen.captain_auth_landing`).
2. Captain logs in via phone + OTP (`screen.captain_login`, `screen.captain_otp_verify`).
3. Captain creates account via `screen.captain_signup` with service interest toggles (DSH, AMN).
4. Captain uploads documents via `screen.captain_documents_upload` (ID, license, vehicle; AMN extras: selfie, family/mahram if applicable).
5. Captain views onboarding status via `screen.captain_onboarding_status` (DSH/AMN chips: Pending/Approved/Rejected).
6. Post approval: captain can go Online per allowed service.

### 2.2 Daily Start & Availability

1. Captain opens home screen (`screen.home_status`) with Online/Offline toggle.
2. Captain selects active services (DSH/AMN toggles).
3. Captain sends availability & location to dispatch service.
4. Captain receives offers via push notifications and in-app (`screen.jobs_offers_list`).

### 2.3 DSH Delivery Job

1. Captain receives delivery offer via `screen.job_offer_dsh` (store/area, ETA, estimated earning, accept timer).
2. Captain accepts offer via `POST /api/dls/captain/orders/{order_id}/accept` (Idempotency-Key required).
3. Captain views job details via `screen.job_detail_dsh` (status header, store→customer segments, masked contact).
4. Captain navigates via `screen.job_navigation` (in-app map, ETA & distance).
5. Captain records arrival events (`arrived-store`, `arrived-customer`).
6. Captain picks up items and confirms via `POST /api/dls/captain/orders/{order_id}/picked-up`.
7. Captain delivers and enters PoD code via `screen.job_pod_code` (`POST /api/dls/captain/orders/{order_id}/delivered`).
8. Captain captures PoD photo via `screen.job_pod_photo` (camera with masking).
9. Captain completes order and earns payment.

### 2.4 AMN Ride Job

1. Captain receives ride offer via `screen.job_offer_amn` (pickup area, destination, fare estimate, negotiation note if enabled).
2. Captain accepts offer via `POST /api/amn/captain/offers/:offer_id/accept` (Idempotency-Key required).
3. Captain views ride details via `screen.job_detail_amn` (arrived/start/end, masked contact, fare estimate, waiting counter, SOS).
4. Captain navigates via `screen.job_navigation`.
5. Captain triggers SOS if needed via `screen.job_sos_panel` (send alert, call local emergency, silent alert).
6. Captain views fare summary via `screen.job_fare_summary` (base/distance/time/night/waiting, negotiation delta, final fare, captain net earning).
7. Captain completes ride and receives payout.

### 2.5 Earnings & Payouts

1. Captain views earnings home via `screen.earnings_home` (period filters, totals, available balance, payout CTA).
2. Captain views earnings breakdown via `screen.earnings_breakdown` (tabs: DSH/AMN/All, list by trip/job).
3. Captain requests payout via `screen.payout_request` (available balance, amount input with min/max constraints, channel: bank/cash office, processing info).
4. Captain tracks payout history via `screen.payout_history` (list: date/amount/channel/status, filters).

## 3. Guards & Policies

- **Idempotency-Key** enforced on all state-changing calls (accept, status updates, PoD, close codes).
- **Step-Up** required for sensitive operations (payout requests, profile updates).
- **Privacy**: PoD images masked (faces and numbers); phone numbers masked in chat; no raw PII in logs.
- **Webhooks**: All inbound endpoints enforce HMAC signatures with ≤300s replay window.
- **Ledger**: All earnings and payouts flow through WLT service with proper ledger entries.
- **Service Eligibility**: AMN requires female captain eligibility; DSH available to all approved captains.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Screen ID                    | Service | Description                    | Endpoint                                      |
| ---------------------------- | ------- | ------------------------------ | --------------------------------------------- |
| `screen.captain_auth_landing` | GLOBAL  | Welcome screen                 | Identity service                              |
| `screen.captain_login`       | GLOBAL  | Phone login                    | `POST /auth/login`                            |
| `screen.captain_otp_verify`   | GLOBAL  | OTP verification               | `POST /auth/otp/verify`                        |
| `screen.home_status`         | GLOBAL  | Captain status & availability  | Routing/Dispatch service                      |
| `screen.jobs_offers_list`     | GLOBAL  | Current offers (DSH/AMN)       | `GET /api/dls/captain/orders`, `GET /api/amn/captain/offers` |
| `screen.job_offer_dsh`        | DSH     | Delivery offer                 | `GET /api/dls/captain/orders`                 |
| `screen.job_detail_dsh`       | DSH     | Delivery details               | `GET /api/dls/captain/orders/{order_id}`      |
| `screen.job_offer_amn`        | AMN     | Ride offer                     | `GET /api/amn/captain/offers`                 |
| `screen.job_detail_amn`       | AMN     | Ride details                   | `GET /api/amn/trips/{trip_id}`                |
| `screen.job_navigation`       | GLOBAL  | In-app navigation              | Routing/Dispatch service                      |
| `screen.job_pod_code`         | DSH     | PoD code entry                 | `POST /api/dls/captain/orders/{order_id}/delivered` |
| `screen.job_pod_photo`        | DSH     | PoD photo capture              | `POST /api/dls/captain/orders/{order_id}/delivered` |
| `screen.job_sos_panel`        | AMN     | Emergency SOS                  | `POST /api/amn/trips/{trip_id}/sos`          |
| `screen.earnings_home`        | WLT     | Earnings overview              | `GET /wallet/accounts/{account_id}/balance`    |
| `screen.payout_request`       | WLT     | Payout request                 | `POST /wallet/payouts`                        |
| `screen.payout_history`       | WLT     | Payout history                 | `GET /wallet/payouts`                         |

_Full catalog available in `apps/captain/SCREENS_CATALOG.csv`._

### 4.2 API Surface

The application integrates with DSH, AMN, and WLT services. Refer to individual service documentation in `docs/explainar/services/` for complete API details.

## 5. Integrations & Runtime Variables

- **Primary services**: `DSH` (delivery jobs, PoD, location tracking), `AMN` (safe rides, SOS, fare negotiation), `WLT` (earnings, balances, payout requests).
- **Supporting services**: `IDENTITY` (authentication, profile, documents, eligibility), `ROUTING_DISPATCH` (availability, allocation, ETAs), `NOTIFICATIONS` (push notifications, alerts).
- **Runtime examples**:
  - `VAR_POD_RETENTION_DAYS` — PoD image retention (default: 180 days).
  - `VAR_AMN_NEGOTIATION_ENABLED` — Enable fare negotiation (default: true).
  - `VAR_WLT_PROVIDER_PRIMARY` — Wallet provider (default: kuraimi_epay).
  - `VAR_NOTIF_DEDUP_WINDOW_MIN` — Notification deduplication (default: 10 minutes).
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. Navigation Structure

### Bottom Tab Bar

- **Home (الرئيسية)**: Status, availability, today summary.
- **Jobs (المهام)**: Current offers and active jobs.
- **Map (الخريطة)**: Navigation and location tracking.
- **Earnings (الأرباح)**: Earnings overview and payout requests.
- **More (المزيد)**: Profile, vehicle, documents, support, settings.

### Top App Bar

- Service filter chips (All/DSH/AMN).
- Online/Offline status toggle.
- Notifications icon.
- SOS shortcut (AMN only).

## 7. Service Links Policy

- **NO** direct links to Kawader (KWD) or Ma3ruf (MRF) per SSoT.
- **NO** specialized SND services visible to captains.
- All upstream sources appear as DSH/AMN only (origin abstraction).

## 8. Error Handling

All errors follow RFC7807 Problem+JSON format with:
- `error_code` (e.g., `CAP-OTP-INVALID`).
- HTTP status code.
- Arabic & English descriptions.
- Recovery actions.

See `apps/captain/ERROR_CATALOG.json` for complete error catalog.

## 9. Design System

- **Theme**: GOV-02 tokens, high contrast for outdoor use.
- **RTL**: Enabled by default.
- **Locales**: Arabic (ar) + English (en).
- **Typography**: Legible fonts, numeric emphasis on ETA/fares.
- **Motion**: Light transitions, progress feedback.

## 10. Privacy & Retention

- **PoD Images**: 180 days retention (configurable via `VAR_POD_RETENTION_DAYS`).
- **Trip Logs**: Per-service configuration.
- **Earnings Summaries**: Per FIN policy.
- **Phone Masking**: Enabled for all contacts.
- **PoD Masking**: Faces and numbers auto-masked.

## 11. Observability

### Events

- `captain.status_change`
- `captain.job_offer_seen`
- `captain.job_accept` / `captain.job_reject`
- `captain.job_status_update`
- `captain.pod_submitted`
- `captain.sos_triggered`
- `captain.earnings_view`
- `captain.payout_request_created`

### SLOs

- UI LCP p75 ≤ 2000ms
- UI INP p75 ≤ 150ms
- Job accept latency p75 ≤ 5000ms

## 12. References & Review

- Sources: `apps/captain/SCREENS_CATALOG.csv`, `apps/captain/TRACEABILITY.json`, `apps/captain/ERROR_CATALOG.json`, `docs/app-captain-architecture.json`, `oas/services/*/openapi.yaml`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Screen catalog: `apps/captain/SCREENS_CATALOG.csv`.
- Architecture: `docs/app-captain-architecture.json` (C4 model).
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`

