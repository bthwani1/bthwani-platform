# APP-CAPTAIN - Captain Mobile Application

## Overview

APP-CAPTAIN is the driver-facing mobile application for BThwani platform, enabling captains to:
- Deliver DSH (Delivery & Shopping) orders
- Provide AMN (Amani Safe Taxi) rides (female captains only)
- View earnings and request payouts via WLT (Wallet & Ledger)

## Architecture

See `docs/app-captain-architecture.json` for complete C4 architecture documentation including:
- Level 1 Context (People & Systems)
- Level 2 Containers (Mobile Client & BFF)
- Components & Code Structure
- Core Flows & Screen Navigation
- API Endpoints & Traceability

## Screen Catalog

All screens are documented in `SCREENS_CATALOG.csv` with:
- Screen IDs (stable identifiers)
- Arabic & English titles
- Service codes (DSH, AMN, WLT, GLOBAL)
- Main components
- System links
- Navigation flows

## Key Files

- `SCREENS_CATALOG.csv` - Complete screen inventory
- `TRACEABILITY.json` - Screen-to-endpoint mapping
- `ERROR_CATALOG.json` - Error codes with Arabic/English descriptions
- `docs/app-captain-architecture.json` - Full C4 architecture model

## Service Dependencies

### Primary Services
- **DSH** (Delivery & Shopping) - Delivery jobs, PoD, location tracking
- **AMN** (Amani Safe Taxi) - Safe rides, SOS, fare negotiation
- **WLT** (Wallet & Ledger) - Earnings, balances, payout requests

### Supporting Services
- **Identity** - Authentication, profile, documents, eligibility
- **Routing & Dispatch** - Availability, allocation, ETAs
- **Notifications** - Push notifications, alerts

## Governance & Guards

APP-CAPTAIN enforces the following global guards:
- `G-LEDGER-INVARIANTS` - Wallet operations via ledger only
- `G-IDEMPOTENCY` - All POST operations require idempotency keys
- `G-WEBHOOK-HMAC<=300s` - Webhook signature validation
- `G-STEPUP-GUARD` - Step-up authentication for sensitive operations
- `G-PRIVACY-EXPORT` - PII masking, PoD face/number masking
- `G-TRACE=1.0` - Full traceability requirements
- `G-PARITY>=0.90` - Service parity thresholds
- `G-AUDIT-IMMUTABLE` - Immutable audit logs
- `G-NO-SECRETS` - No secrets in code/logs
- `G-BAR-A11Y` - Accessibility requirements
- `G-BAR-RBAC/ABAC` - Role-based access control
- `G-BAR-PERF<=150ms` - Performance targets

## Runtime Variables

Key runtime variables (see `runtime/RUNTIME_VARS_CATALOG.csv`):
- `VAR_POD_RETENTION_DAYS` (default: 180) - PoD image retention
- `VAR_AMN_NEGOTIATION_ENABLED` (default: true) - Enable fare negotiation
- `VAR_WLT_PROVIDER_PRIMARY` (default: kuraimi_epay) - Wallet provider
- `VAR_NOTIF_DEDUP_WINDOW_MIN` (default: 10) - Notification deduplication

## Core Flows

1. **Captain Onboarding** - Registration, document upload, eligibility review
2. **Daily Start & Availability** - Online/offline toggle, service selection
3. **DSH Delivery Job** - Offer → Accept → Navigate → PoD → Complete
4. **AMN Ride Job** - Offer → Accept → Navigate → Fare → Complete (with SOS)
5. **Earnings & Payouts** - View earnings → Request payout → Track status
6. **Safety & Support** - SOS triggers, help center access

## Service Links Policy

- **NO** direct links to Kawader (KWD) or Ma3ruf (MRF) per SSoT
- **NO** specialized SND services visible to captains
- All upstream sources appear as DSH/AMN only (origin abstraction)

## Error Handling

All errors follow RFC7807 Problem+JSON format with:
- `error_code` (e.g., `CAP-OTP-INVALID`)
- HTTP status code
- Arabic & English descriptions
- Recovery actions

See `ERROR_CATALOG.json` for complete error catalog.

## Navigation Structure

### Bottom Tab Bar
- Home (الرئيسية)
- Jobs (المهام)
- Map (الخريطة)
- Earnings (الأرباح)
- More (المزيد)

### Top App Bar
- Service filter chips (All/DSH/AMN)
- Online/Offline status
- Notifications icon
- SOS shortcut (AMN only)

## Design System

- **Theme**: GOV-02 tokens, high contrast for outdoor use
- **RTL**: Enabled by default
- **Locales**: Arabic (ar) + English (en)
- **Typography**: Legible fonts, numeric emphasis on ETA/fares
- **Motion**: Light transitions, progress feedback

## Privacy & Retention

- **PoD Images**: 180 days retention (configurable via `VAR_POD_RETENTION_DAYS`)
- **Trip Logs**: Per-service configuration
- **Earnings Summaries**: Per FIN policy
- **Phone Masking**: Enabled for all contacts
- **PoD Masking**: Faces and numbers auto-masked

## Observability

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

## Related Documentation

- `docs/ARCHITECTURE.md` - Platform architecture overview
- `registry/SSOT_INDEX.json` - Service registry
- `runtime/RUNTIME_VARS_CATALOG.csv` - Runtime configuration
- `docs/Guidancefiles/` - Governance & playbooks

