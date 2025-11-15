# SRV-ESF - Blood Donation (اسعِفني)

## 1. Overview

The **ESF** service (اسعِفني) connects blood donation requesters with compatible donors in real-time. It handles ABO/Rh compatibility matching, donor availability management, secure encrypted chat between requesters and donors, real-time notifications, admin monitoring and configuration, and support moderation tools.

## 2. Core Journeys

### 2.1 Request Creation (Requester)

1. Requester creates blood donation request via `POST /esf/requests` with blood type and urgency.
2. Matching engine finds compatible donors based on ABO/Rh compatibility.
3. Requester receives matches via `GET /esf/matches/inbox`.
4. Requester communicates with donors via encrypted chat.

### 2.2 Donor Journey

1. Donor sets availability via `PATCH /esf/me/availability`.
2. Donor receives match notifications for compatible requests.
3. Donor responds to matches and communicates via encrypted chat.
4. Cooldown period enforced (default 90 days) after donation.

### 2.3 Matching Engine

1. Strict ABO/Rh compatibility matching.
2. City-based and radius-based matching (default max 50km).
3. Batch size control (default 10 matches per request).
4. SLA target tracking (default 30 minutes).

## 3. Guards & Policies

- **Idempotency-Key** enforced on all state-changing calls (requests, availability updates).
- **Step-Up** required for critical approvals (admin config changes, support actions).
- **Privacy**: chat payloads encrypted (AES-256-GCM); phone numbers masked; no raw phones in logs.
- **Webhooks**: all inbound endpoints enforce HMAC signatures with ≤300s replay window.
- **Matching**: ABO/Rh compatibility strictly enforced; cooldown periods applied.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Surface      | screen_id                | Description                   | Source                                   |
| ------------ | ------------------------ | ----------------------------- | ---------------------------------------- |
| APP-USER     | `app_user.esf.request`   | Create blood donation request | `apps/user/SCREENS_CATALOG.csv`          |
| APP-USER     | `app_user.esf.matches`   | View donor matches            | `apps/user/SCREENS_CATALOG.csv`          |
| APP-USER     | `app_user.esf.chat`      | Chat with donors/requesters   | `apps/user/SCREENS_CATALOG.csv`          |
| DASH-ADMIN   | `admin.esf.monitoring`   | Admin monitoring and config   | `dashboards/admin/SCREENS_CATALOG.csv`   |
| DASH-SUPPORT | `support.esf.moderation` | Support moderation tools      | `dashboards/support/SCREENS_CATALOG.csv` |

_Full catalog available in the generated reference `docs/explainar/generated/esf.generated.md`._

### 4.2 API Surface

The service exposes routes for requests, matches, donor profiles, chat, admin configuration, and support. Refer to the generated reference `docs/explainar/generated/esf.generated.md`, which updates automatically and includes a SHA checksum at the end.

## 5. Integrations & Runtime Variables

- **Dependent services**: `IDENTITY` (blood type, masked contacts), `NOTIFICATIONS` (push notifications with quiet hours).
- **Applications**: `APP-USER`, dashboards (`admin`, `support`).
- **Runtime examples**:
  - `VAR_ESF_MAX_RADIUS_KM` — maximum matching radius in km (default: 50).
  - `VAR_ESF_MATCH_BATCH_SIZE` — number of matches per request (default: 10).
  - `VAR_ESF_DONOR_COOLDOWN_DAYS` — cooldown period after donation (default: 90).
  - `VAR_ESF_SLA_MATCH_MINUTES` — SLA target for matching (default: 30).
  - `VAR_ESF_QUIET_HOURS` — quiet hours format: "HH:MM-HH:MM" (default: "22:00-08:00").
  - `VAR_CHAT_RETENTION_DAYS` — chat message retention (default: 30).
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. Matching Engine

### ABO/Rh Compatibility

Strict compatibility rules enforced:

- O- can donate to all
- O+ can donate to O+, A+, B+, AB+
- A- can donate to A-, A+, AB-, AB+
- A+ can donate to A+, AB+
- B- can donate to B-, B+, AB-, AB+
- B+ can donate to B+, AB+
- AB- can donate to AB-, AB+
- AB+ can donate to AB+ only

### Matching Algorithm

1. Filter by ABO/Rh compatibility.
2. Filter by city/radius (max `VAR_ESF_MAX_RADIUS_KM`).
3. Filter by cooldown period (last donation + `VAR_ESF_DONOR_COOLDOWN_DAYS`).
4. Sort by proximity and availability.
5. Return top `VAR_ESF_MATCH_BATCH_SIZE` matches.

## 7. Database Migrations & Seeders

### 7.1 Migrations

The ESF service includes database migrations for core entities:

#### Core Tables

- **EsfRequestEntity** (`esf_requests`): Blood donation requests.
- **EsfDonorProfileEntity** (`esf_donor_profiles`): Donor profiles and availability.
- **EsfChatMessageEntity** (`esf_chat_messages`): Encrypted chat messages.
- **EsfMatchEntity** (`esf_matches`): Matches between requests and donors.
- **EsfConfigEntity** (`esf_config`): Runtime configuration.
- **EsfAuditLogEntity** (`esf_audit_logs`): Audit trail.

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

- Sources: `oas/services/esf/openapi.yaml`, `apps/**/SCREENS_CATALOG.csv`, `dashboards/**/SCREENS_CATALOG.csv`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Database: ESF entities and migrations in `src/modules/esf/entities/` and `migrations/`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
