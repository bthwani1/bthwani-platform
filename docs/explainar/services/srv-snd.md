# SRV-SND - On-demand Services (سند)

## 1. Overview

The **SND** service (سند) provides a unified service for two types of help requests: **Instant Help (مساعدة فورية)** with pricing, captain routing, and in-app completion with proof-of-close codes; and **Specialized Services (خدمات متخصصة)** with chat-only tracking and external payment processing.

## 2. Core Journeys

### 2.1 Instant Help Request (User)

1. User creates instant request via `POST /api/snd/requests` with category and description.
2. Pricing engine calculates price range (category > region > global).
3. Routing engine assigns to captain or specialized provider.
4. User communicates via encrypted chat.
5. Captain generates 6-digit close code.
6. User verifies close code and request status updates to `CLOSED`.

### 2.2 Specialized Service Request (User)

1. User creates specialized request via `POST /api/snd/requests` with type `specialized`.
2. Request routed to specialized provider (no pricing, no captain routing).
3. User communicates via encrypted chat.
4. External payment processing (no WLT integration).

### 2.3 Captain Journey

1. Captain receives instant requests via `GET /api/snd/captain/requests`.
2. Captain accepts request via `POST /api/snd/captain/requests/:request_id/accept`.
3. Captain updates status and communicates via chat.
4. Captain generates close code via `POST /api/snd/captain/requests/:request_id/close-code`.
5. Request closes and ledger entry created via WLT.

## 3. Guards & Policies

- **Idempotency-Key** enforced on all state-changing calls (requests, status updates, close codes).
- **Step-Up** required for critical approvals (admin config changes, support actions).
- **Privacy**: chat payloads encrypted (AES-256-GCM); phone numbers masked; no raw phones in logs.
- **Webhooks**: all inbound endpoints enforce HMAC signatures with ≤300s replay window.
- **Wallet**: ledger entries only for instant requests (no bank payouts); specialized services no in-app collection.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Surface      | screen_id               | Description                | Source                                   |
| ------------ | ----------------------- | -------------------------- | ---------------------------------------- |
| APP-USER     | `app_user.snd.request`  | Create help request        | `apps/user/SCREENS_CATALOG.csv`          |
| APP-USER     | `app_user.snd.tracking` | Track request status       | `apps/user/SCREENS_CATALOG.csv`          |
| APP-CAPTAIN  | `captain.snd.requests`  | Captain request management | `apps/captain/SCREENS_CATALOG.csv`       |
| DASH-ADMIN   | `admin.snd.config`      | SND configuration and KPIs | `dashboards/admin/SCREENS_CATALOG.csv`   |
| DASH-SUPPORT | `support.snd.cases`     | Support case management    | `dashboards/support/SCREENS_CATALOG.csv` |

_Full catalog available in the generated reference `docs/explainar/generated/snd.generated.md`._

### 4.2 API Surface

The service exposes routes for requests, captain operations, admin configuration, and support. Refer to the generated reference `docs/explainar/generated/snd.generated.md`, which updates automatically and includes a SHA checksum at the end.

## 5. Integrations & Runtime Variables

- **Dependent services**: `WLT` (ledger entries for instant requests only), `NOTIFICATIONS` (push notifications), `IDENTITY` (masked contacts).
- **Applications**: `APP-USER`, `APP-CAPTAIN`, dashboards (`admin`, `support`).
- **Runtime examples**:
  - `VAR_SND_CHAT_ENCRYPTION_KEY` — chat encryption key (hex).
  - `VAR_SND_CHAT_RETENTION_DAYS` — chat message retention (default: 30).
  - `VAR_SND_PRICING_*` — pricing configuration variables.
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. Pricing Engine (Instant Only)

### Pricing Calculation

- Price ranges (min/max in YER minor units).
- Category-specific profiles.
- Region-specific overrides.
- Scope precedence: Category > Region > Global.
- Review flags for unclear requests.

### Routing

- **Captain**: Auto-routing to available captains for instant requests.
- **Specialized Provider**: Assignment to specialized service providers.
- **Manual Queue**: Admin-controlled assignment.

## 7. Proof-of-Close (Instant Only)

### Workflow

1. Captain generates 6-digit code via `POST /api/snd/captain/requests/:request_id/close-code`.
2. User verifies code with recipient name via `POST /api/snd/requests/:request_id/close`.
3. Automatic ledger entry creation via WLT adapter.
4. Request status updates to `CLOSED`.

## 8. Database Migrations & Seeders

### 8.1 Migrations

The SND service includes database migrations for core entities:

#### Core Tables

- **SndRequestEntity** (`snd_requests`): Main request entity supporting both instant and specialized types.
- **SndCategoryEntity** (`snd_categories`): Request categories (instant-only, specialized-only, or both).
- **SndPricingProfileEntity** (`snd_pricing_profiles`): Pricing ranges and caps for instant requests.
- **SndChatMessageEntity** (`snd_chat_messages`): Encrypted chat messages with phone masking.
- **SndProofCloseEntity** (`snd_proof_closes`): 6-digit close codes for instant request completion.
- **SndConfigEntity** (`snd_configs`): Service configuration by scope.
- **SndAuditLogEntity** (`snd_audit_logs`): Immutable audit trail.

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

## 9. References & Review

- Sources: `oas/services/snd/openapi.yaml`, `apps/**/SCREENS_CATALOG.csv`, `dashboards/**/SCREENS_CATALOG.csv`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Database: SND entities and migrations in `src/modules/snd/entities/` and `migrations/`.
- Last human review: 2025-01-15.

---

**Source SHA256**: `[To be generated]`
