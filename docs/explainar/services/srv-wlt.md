# SRV-WLT - Wallet & Ledger

## 1. Overview

The **WLT** service is the core financial service providing unified wallet and ledger operations for all BThwani platform financial transactions. It orchestrates double-entry ledger system with Wallet=Ledger invariants, internal wallet accounts, escrow/hold management, payment provider orchestration, settlement batching with dual-sign approvals, and COD policy enforcement.

## 2. Core Journeys

### 2.1 Account Management

1. User/Partner/Captain accounts are created automatically on first transaction.
2. Accounts can be queried via `GET /wallet/accounts/{account_id}/balance` and `GET /wallet/accounts/{account_id}/transactions`.
3. Internal transfers between accounts via `POST /wallet/transfers` with `Idempotency-Key`.

### 2.2 Payment Processing

1. Payment intents created via `POST /pay/intents` for upstream orders (DSH, ARB, AMN).
2. Provider charges executed via `POST /pay/providers/{provider_code}/charge` with `Idempotency-Key`.
3. Provider webhooks received at `POST /pay/providers/{provider_code}/webhook` with HMAC verification (≤300s replay window).
4. Payment confirmations processed via `POST /pay/confirm` after provider callbacks.

### 2.3 Escrow & Holds

1. Escrow holds created via `POST /wallet/holds` for ARB bookings, DSH orders, AMN trips.
2. Holds released/captured via `POST /wallet/holds/{hold_id}/release` or automatic policy-based release.
3. All hold operations require `Idempotency-Key`.

### 2.4 Settlements

1. Settlement batches created via `POST /wallet/settlements` with `Idempotency-Key` and Step-Up authentication.
2. Batches require dual-sign approval via `POST /wallet/settlements/{batch_id}/approve` (Step-Up required).
3. Export generation for bank files via `POST /wallet/exports/statements` with privacy levels.

## 3. Guards & Policies

- **Idempotency-Key** enforced on all state-changing calls (transfers, holds, charges, settlements).
- **Step-Up** required for critical approvals (settlements, config updates, unmasked exports).
- **Privacy**: No PAN or provider secrets in logs/exports; default masked exports; unmasked requires higher roles + Step-Up.
- **Webhooks**: all inbound endpoints enforce HMAC signatures with ≤300s replay window.
- **Ledger**: Wallet=Ledger invariants enforced; double-entry rules applied to all transactions.
- **Dual-Sign Payouts**: All bank payouts require dual-sign (two distinct accounts).

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Surface      | screen_id                 | Description                      | Source                                   |
| ------------ | ------------------------- | -------------------------------- | ---------------------------------------- |
| APP-USER     | `app_user.wallet.balance` | Wallet balance and transactions  | `apps/user/SCREENS_CATALOG.csv`          |
| APP-PARTNER  | `partner.settlements`     | Partner settlement history       | `apps/partner/SCREENS_CATALOG.csv`       |
| DASH-FINANCE | `finance.settlements`     | Settlement batches and approvals | `dashboards/finance/SCREENS_CATALOG.csv` |
| DASH-ADMIN   | `admin.wallet.config`     | Runtime VARs and configuration   | `dashboards/admin/SCREENS_CATALOG.csv`   |

_Full catalog available in the generated reference `docs/explainar/generated/wlt.generated.md`._

### 4.2 API Surface

The service exposes routes for accounts, payments, transfers, holds, settlements, and configuration. Refer to the generated reference `docs/explainar/generated/wlt.generated.md`, which updates automatically and includes a SHA checksum at the end.

## 5. Integrations & Runtime Variables

- **Dependent services**: All services (DSH, ARB, AMN, KNZ, SND) integrate with WLT for financial operations.
- **Applications**: `APP-USER`, `APP-PARTNER`, `APP-CAPTAIN`, dashboards (`finance`, `admin`, `support`).
- **Runtime examples**:
  - `VAR_WLT_PROVIDER_PRIMARY` — primary payment provider (default: "kuraimi_epay").
  - `VAR_COD_COVERAGE_RATIO` — COD coverage ratio for captains.
  - `VAR_RIDER_COD_CAP` — maximum COD cap per rider.
  - `VAR_COD_FLOAT_MIN` — minimum COD float requirement.
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. Finance Invariants

1. **Wallet=Ledger**: Internal ledger is source of truth; all wallet balances must match ledger totals.
2. **Dual-Sign Payouts**: All bank payouts require dual-sign (two distinct accounts).
3. **Idempotency**: Idempotency-Key required on all POST/PATCH/DELETE (TTL 24h).
4. **Webhook HMAC**: All webhooks HMAC-signed; replay window ≤300s.
5. **COD Controls**: Guardrails via `VAR_COD_COVERAGE_RATIO`, `VAR_RIDER_COD_CAP`, `VAR_COD_FLOAT_MIN`.

## 7. Scope Policies

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

## 8. Database Migrations & Seeders

### 8.1 Migrations

The WLT service includes database migrations for core financial entities:

#### Core Tables

- **AccountEntity** (`wlt_accounts`): Wallet accounts with types, statuses, limits.
- **JournalEntryEntity** (`wlt_journal_entries`): Double-entry ledger entries (debit/credit).
- **HoldEntity** (`wlt_holds`): Escrow holds linked to external refs.
- **SettlementBatchEntity** (`wlt_settlement_batches`): Settlement batches with dual-sign tracking.
- **IdempotencyEntity** (`wlt_idempotency`): Idempotency keys (TTL 24h).
- **RuntimeConfigEntity** (`wlt_runtime_config`): Runtime VARs with scopes (Zone>City>Service>Global).
- **AuditLogEntity** (`wlt_audit_logs`): Immutable audit trail.

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

- Sources: `oas/services/wlt/openapi.yaml`, `apps/**/SCREENS_CATALOG.csv`, `dashboards/**/SCREENS_CATALOG.csv`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Database: WLT entities and migrations in `src/modules/wlt/entities/` and `migrations/`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
