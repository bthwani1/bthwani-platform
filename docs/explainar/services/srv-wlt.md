# SRV-WLT - Wallet & Ledger

## 1. Overview

The **WLT** service is the core financial service providing unified wallet and ledger operations for all BThwani platform financial transactions. It orchestrates double-entry ledger system with Wallet=Ledger invariants, internal wallet accounts, escrow/hold management, payment provider orchestration, settlement batching with dual-sign approvals, and COD policy enforcement.

## 2. Core Journeys

### 2.1 Account Management

1. User/Partner/Captain accounts are created automatically on first transaction.
2. Accounts can be queried via `GET /wallet/accounts/{account_id}/balance` and `GET /wallet/accounts/{account_id}/transactions`.
3. Internal transfers between accounts via `POST /wallet/transfers` with `Idempotency-Key`.

### 2.2 Payment Processing

1. Payment intents created via `POST /api/wlt/intents` for upstream orders (DSH, ARB, AMN) with `Idempotency-Key`.
2. Payment intent status polled via `GET /api/wlt/intents/{intent_id}` to check status and handle `requires_action`.
3. Payment confirmed via `POST /api/wlt/intents/{intent_id}/confirm` with PSP callback payload and `Idempotency-Key`.
4. Provider charges executed via `POST /pay/providers/{provider_code}/charge` with `Idempotency-Key`.
5. Provider webhooks received at `POST /pay/providers/{provider_code}/webhook` with HMAC verification (≤300s replay window).
6. Payment confirmations processed via `POST /pay/confirm` after provider callbacks.

### 2.3 Escrow & Holds

1. Escrow holds created via `POST /wallet/holds` for ARB bookings, DSH orders, AMN trips.
2. Holds released/captured via `POST /wallet/holds/{hold_id}/release` or automatic policy-based release.
3. All hold operations require `Idempotency-Key`.

### 2.4 Settlements

1. Settlement batches created via `POST /wallet/settlements` with `Idempotency-Key` and Step-Up authentication.
2. Batches require dual-sign approval via `POST /wallet/settlements/{batch_id}/approve` (Step-Up required).
3. Export generation for bank files via `POST /wallet/exports/statements` with privacy levels.
4. Partners can view settlements via `GET /wallet/partner/settlements` (read-only, masked).

### 2.5 Partner Finance Journey (APP-PARTNER)

1. Partner views finance overview via `GET /wallet/partner/finance/overview` showing:
   - Total sales (DSH, ARB)
   - Total commissions (DSH, ARB)
   - Net payable
   - Pending balance
   - Next settlement date
2. Partner views ledger transactions via `GET /wallet/partner/ledger` with Chart of Accounts (CoA) mapping.
3. Partner views settlement history via `GET /wallet/partner/settlements` (masked).
4. Partner exports finance report via `POST /wallet/partner/exports` with `Idempotency-Key`.

### 2.6 Subscription Management (APP-PARTNER)

1. Partner views subscription status via `GET /subscriptions/status`.
2. Partner views available plans via `GET /subscriptions/plans` (Free, Pro, Pro+).
3. Partner checks out subscription via `POST /subscriptions/checkout` with:
   - Payment via wallet balance or settlement deduction
   - `Idempotency-Key` required
   - Automatic ledger posting
   - Audit logging

## 3. Guards & Policies

- **Idempotency-Key** enforced on all state-changing calls (transfers, holds, charges, settlements).
- **Step-Up** required for critical approvals (settlements, config updates, unmasked exports).
- **Privacy**: No PAN or provider secrets in logs/exports; default masked exports; unmasked requires higher roles + Step-Up.
- **Webhooks**: all inbound endpoints enforce HMAC signatures with ≤300s replay window.
- **Ledger**: Wallet=Ledger invariants enforced; double-entry rules applied to all transactions.
- **Dual-Sign Payouts**: All bank payouts require dual-sign (two distinct accounts).

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Surface      | screen_id                        | Description                      | Source                                   |
| ------------ | -------------------------------- | -------------------------------- | ---------------------------------------- |
| APP-USER     | `app_user.wlt.payment_intent`    | Create payment intent            | `apps/user/SCREENS_CATALOG.csv`          |
| APP-USER     | `app_user.wlt.payment_status`    | Poll payment status              | `apps/user/SCREENS_CATALOG.csv`          |
| APP-USER     | `app_user.wlt.payment_confirm`   | Confirm payment                  | `apps/user/SCREENS_CATALOG.csv`          |
| APP-USER     | `app_user.wlt.wallet`            | Wallet balance and transactions  | `apps/user/SCREENS_CATALOG.csv`          |
| APP-PARTNER  | `partner.finance.overview`       | Partner finance overview         | `apps/partner/SCREENS_CATALOG.csv`       |
| APP-PARTNER  | `partner.ledger`                 | Partner ledger transactions      | `apps/partner/SCREENS_CATALOG.csv`       |
| APP-PARTNER  | `partner.settlements`            | Partner settlement history       | `apps/partner/SCREENS_CATALOG.csv`       |
| APP-PARTNER  | `partner.subscriptions.status`   | Subscription status              | `apps/partner/SCREENS_CATALOG.csv`       |
| APP-PARTNER  | `partner.subscriptions.checkout` | Subscription checkout            | `apps/partner/SCREENS_CATALOG.csv`       |
| DASH-FINANCE | `finance.settlements`            | Settlement batches and approvals | `dashboards/finance/SCREENS_CATALOG.csv` |
| DASH-ADMIN   | `admin.wallet.config`            | Runtime VARs and configuration   | `dashboards/admin/SCREENS_CATALOG.csv`   |

_Full catalog available in the generated reference `docs/explainar/generated/wlt.generated.md`._

### 4.2 API Surface

The service exposes routes for accounts, payments, transfers, holds, settlements, and configuration. Refer to the generated reference `docs/explainar/generated/wlt.generated.md`, which updates automatically and includes a SHA checksum at the end.

## 5. Service Classification & Smart Engine

### 5.1 Service Classification

WLT is classified as a **Primary Service** in the Smart Engine system:

- **Primary Services**: Core, high-frequency services prominently displayed
- **Characteristics**:
  - Always visible on home screen
  - Featured in service cards
  - High priority in search results
  - Full feature set enabled by default
  - Critical infrastructure service (all services depend on WLT)

### 5.2 Runtime Variables Integration

WLT integrates with the unified `RuntimeVariablesService` for:

- **Service Flags**: `VAR_SVC_WLT_ENABLED` (default: true)
- **Scoped Configuration**: Zone > City > Service > Global precedence
- **Caching Layer**: Performance optimization for frequent lookups
- **Type-Safe Access**: Methods for service flags and configuration

## 6. Integrations & Runtime Variables

- **Dependent services**: All services (DSH, ARB, AMN, KNZ, SND) integrate with WLT for financial operations.
- **Shared services**: `RuntimeVariablesService` for unified runtime configuration.
- **Applications**: `APP-USER`, `APP-PARTNER`, `APP-CAPTAIN`, dashboards (`finance`, `admin`, `support`).
- **Runtime examples**:
  - `VAR_WLT_PROVIDER_PRIMARY` — primary payment provider (default: "kuraimi_epay").
  - `VAR_COD_COVERAGE_RATIO` — COD coverage ratio for captains.
  - `VAR_RIDER_COD_CAP` — maximum COD cap per rider.
  - `VAR_COD_FLOAT_MIN` — minimum COD float requirement.
  - `VAR_AML_SCREENING_ENABLED` — AML screening (default: false).
  - `VAR_PAYROLL_CYCLE` — payroll cycle configuration.
  - `VAR_PAYROLL_EXPORT_PRIVACY_LEVEL` — export privacy level (default: "masked").
  - `VAR_IDEMPOTENCY_TTL_HOURS` — idempotency TTL (default: 24, non-editable).
  - `VAR_WEBHOOK_REPLAY_WINDOW_SEC` — webhook replay window (default: 300, non-editable).
  - `VAR_KEY_ROTATION_DAYS` — key rotation period (default: 30).
  - `VAR_SVC_WLT_ENABLED` — enable/disable WLT service globally.
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 7. Payment Intent Flow

### 7.1 Payment Intent Creation

1. **Request**: `POST /api/wlt/intents` with:
   - `order_id` (DSH/ARB/AMN order reference)
   - `amount_yer` (amount in YER minor units)
   - `currency` (default: "YER")
   - `payment_method` (provider selection)
   - `Idempotency-Key` (required)

2. **Response**: PaymentIntent with:
   - `intent_id` (unique identifier)
   - `status` (`pending`, `processing`, `requires_action`, `succeeded`, `failed`)
   - `client_secret` (for frontend integration)
   - `next_action` (if requires_action)

### 7.2 Payment Status Polling

1. **Request**: `GET /api/wlt/intents/{intent_id}`
2. **Response**: Current PaymentIntent status
3. **Handling**:
   - If `status = requires_action`: Show action UI (3DS, OTP, etc.)
   - If `status = succeeded`: Proceed to order confirmation
   - If `status = failed`: Show error and allow retry

### 7.3 Payment Confirmation

1. **Request**: `POST /api/wlt/intents/{intent_id}/confirm` with:
   - PSP callback payload
   - `Idempotency-Key` (required)

2. **Response**: Confirmed PaymentIntent with final status

## 8. Finance Invariants

1. **Wallet=Ledger**: Internal ledger is source of truth; all wallet balances must match ledger totals.
2. **Dual-Sign Payouts**: All bank payouts require dual-sign (two distinct accounts).
3. **Idempotency**: Idempotency-Key required on all POST/PATCH/DELETE (TTL 24h).
4. **Webhook HMAC**: All webhooks HMAC-signed; replay window ≤300s.
5. **COD Controls**: Guardrails via `VAR_COD_COVERAGE_RATIO`, `VAR_RIDER_COD_CAP`, `VAR_COD_FLOAT_MIN`.

## 9. Scope Policies

### Services Using WLT

- **DSH**: Full integration (charges, COD, settlements).
- **ARB**: Holds/escrow with release/no-show policies.
- **AMN**: Ride charges and driver payouts.
- **KNZ**: Optional marketplace charges/refunds.
- **SND**: Immediate services only; specialized services no in-app collection.
- **MRF/ESF**: No payments; WLT disabled by policy.

### Provider Configuration

- `VAR_WLT_PROVIDER_PRIMARY="kuraimi_epay"` (runtime-switchable).
- Additional providers via VAR\_\* with scopes.

## 10. Database Migrations & Seeders

### 10.1 Migrations

The WLT service includes database migrations for core financial entities:

#### Migration: `wlt_accounts` Table

- **File**: `migrations/Migration20250201000001_CreateWltAccountsTable.ts`
- **Purpose**: Creates wallet accounts table
- **Key Fields**:
  - `account_id` (unique): Account identifier
  - `owner_id`: Owner identifier (user/partner/captain)
  - `account_type`: Account type (USER, PARTNER, CAPTAIN, PLATFORM, SERVICE, CHANNEL)
  - `status`: Account status (active, suspended, closed)
  - `balance_yer`: Current balance in YER minor units
  - `limits`: JSONB for account limits
  - `attributes`: JSONB for additional attributes

#### Migration: `wlt_journal_entries` Table

- **File**: `migrations/Migration20250201000002_CreateWltJournalEntriesTable.ts`
- **Purpose**: Creates double-entry ledger entries table
- **Key Fields**:
  - `entry_id` (unique): Journal entry identifier
  - `account_id`: Account reference
  - `debit_yer` / `credit_yer`: Debit/credit amounts
  - `category`: Entry category (PAYMENT, SETTLEMENT, HOLD, TRANSFER, etc.)
  - `status`: Entry status (POSTED, REVERSED)
  - `transaction_ref`: External transaction reference
  - `metadata`: JSONB for additional metadata

#### Migration: `wlt_holds` Table

- **File**: `migrations/Migration20250201000003_CreateWltHoldsTable.ts`
- **Purpose**: Creates escrow holds table
- **Key Fields**:
  - `hold_id` (unique): Hold identifier
  - `account_id`: Account reference
  - `amount_yer`: Hold amount
  - `status`: Hold status (PENDING, RELEASED, CAPTURED)
  - `external_ref`: External reference (order/booking/ride ID)
  - `release_policy`: Release policy configuration

#### Migration: `wlt_settlement_batches` Table

- **File**: `migrations/Migration20250201000004_CreateWltSettlementBatchesTable.ts`
- **Purpose**: Creates settlement batches table
- **Key Fields**:
  - `batch_id` (unique): Batch identifier
  - `status`: Batch status (draft, pending_approval, approved, exported, reconciled)
  - `criteria`: JSONB for batch criteria
  - `approver_1_id` / `approver_2_id`: Dual-sign approvers
  - `export_file_url`: Export file URL (signed)
  - `metadata`: JSONB for additional metadata

#### Migration: `wlt_idempotency` Table

- **File**: `migrations/Migration20250201000005_CreateWltIdempotencyTable.ts`
- **Purpose**: Creates idempotency keys table
- **Key Fields**:
  - `idempotency_key` (unique): Idempotency key
  - `request_hash`: Request hash for verification
  - `response`: Cached response
  - `expires_at`: Expiration timestamp (TTL 24h)

#### Migration: `wlt_runtime_config` Table

- **File**: `migrations/Migration20250201000006_CreateWltRuntimeConfigTable.ts`
- **Purpose**: Creates runtime configuration table
- **Key Fields**:
  - `config_id` (unique): Configuration identifier
  - `key`: Runtime variable key
  - `value`: Runtime variable value
  - `scope`: Scope (global, region, city, service)
  - `scope_value`: Scope value
  - `status`: Status (draft, published, rolled_back)

#### Migration: `wlt_audit_logs` Table

- **File**: `migrations/Migration20250201000007_CreateWltAuditLogsTable.ts`
- **Purpose**: Creates immutable audit trail table
- **Key Fields**:
  - `log_id` (unique): Log identifier
  - `event_type`: Event type
  - `account_id`: Account reference
  - `user_id`: User who triggered the event
  - `payload_hash`: SHA256 hash of payload
  - `metadata`: JSONB for additional metadata
  - `created_at`: Timestamp (immutable)

### 10.2 Seeders

Seeders for initial configuration and test data (dev environment only).

### 10.3 Migration Execution

**To run migrations:**

```bash
# Run all pending migrations
npm run migration:up

# Or via MikroORM CLI
npx mikro-orm migration:up
```

**Note**: See `docs/MIGRATION_DEPLOYMENT.md` for detailed deployment instructions.

## 11. API Endpoints Summary

### Account Operations

- `GET /wallet/accounts/{account_id}/balance` - Get account balance
- `GET /wallet/accounts/{account_id}/transactions` - List transactions (cursor pagination)

### Payment Intents

- `POST /api/wlt/intents` - Create payment intent (Idempotency-Key required)
- `GET /api/wlt/intents/{intent_id}` - Get payment intent status
- `POST /api/wlt/intents/{intent_id}/confirm` - Confirm payment (Idempotency-Key required)

### Transfers & Holds

- `POST /wallet/transfers` - Internal transfer (Idempotency-Key required)
- `POST /wallet/holds` - Create hold/escrow (Idempotency-Key required)
- `POST /wallet/holds/{hold_id}/release` - Release hold (Idempotency-Key required)

### Payments

- `POST /pay/providers/{provider_code}/charge` - Charge via provider (Idempotency-Key required)
- `POST /pay/providers/{provider_code}/webhook` - Provider webhook (HMAC-signed, ≤300s replay)

### COD

- `GET /wallet/cod/captains/{captain_id}/limits` - Get COD limits/exposure

### Settlements

- `GET /wallet/settlements` - List batches (cursor pagination)
- `POST /wallet/settlements` - Create batch (Idempotency-Key + Step-Up)
- `POST /wallet/settlements/{batch_id}/approve` - Approve batch (dual-sign + Step-Up)

### Partner Finance

- `GET /wallet/partner/finance/overview` - Get finance overview
- `GET /wallet/partner/ledger` - Get ledger transactions (read-only, masked)
- `GET /wallet/partner/settlements` - List settlements (read-only, masked)
- `GET /wallet/partner/settlements/{settlement_id}` - Get settlement details
- `POST /wallet/partner/exports` - Export finance report (Idempotency-Key required)

### Subscriptions

- `GET /subscriptions/status` - Get subscription status
- `GET /subscriptions/plans` - Get subscription plans
- `POST /subscriptions/checkout` - Checkout subscription (Idempotency-Key required)

### Config

- `GET /wallet/admin/config` - Get runtime config (scoped VARs)
- `PATCH /wallet/admin/config` - Update config (Idempotency-Key + Step-Up)
- `POST /wallet/admin/config/publish` - Publish draft config
- `POST /wallet/admin/config/rollback` - Rollback published config

### Exports

- `POST /wallet/exports/statements` - Generate statement export (privacy level, Step-Up)

### Support

- `GET /wallet/support/accounts/{account_id}/snapshot` - Masked snapshot

## 12. References & Review

- Sources: `oas/services/wlt/openapi.yaml`, `apps/**/SCREENS_CATALOG.csv`, `dashboards/**/SCREENS_CATALOG.csv`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Database: WLT entities and migrations in `src/modules/wlt/entities/` and `migrations/`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
