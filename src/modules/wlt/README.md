# WLT Module (Wallet & Ledger)

Unified Wallet & Ledger service for all BThwani platform financial operations.

## Overview

WLT (Wallet & Ledger) is the core financial service providing:
- Double-entry ledger system with Wallet=Ledger invariants
- Internal wallet accounts (user/partner/captain/service/channel)
- Hold/Escrow management for ARB/DSH/AMN
- Payment provider orchestration (kuraimi_epay, cards)
- Settlement batching with dual-sign approvals
- COD policy enforcement
- Runtime configuration (VARs) with scoped precedence
- Privacy-preserving exports with OPA guards
- Immutable audit trail

## Architecture

### Entities

- **AccountEntity**: Wallet accounts with types, statuses, limits
- **JournalEntryEntity**: Double-entry ledger entries (debit/credit)
- **HoldEntity**: Escrow holds linked to external refs
- **SettlementBatchEntity**: Settlement batches with dual-sign tracking
- **IdempotencyEntity**: Idempotency keys (TTL 24h)
- **RuntimeConfigEntity**: Runtime VARs with scopes (Zone>City>Service>Global)
- **AuditLogEntity**: Immutable audit trail

### Services

- **AccountService**: Account management (create/update/status)
- **LedgerEngine**: Double-entry rules, Wallet=Ledger invariants
- **TransferService**: Internal transfers between accounts
- **HoldService**: Create/release/capture escrow holds
- **BalanceService**: Balance computation, cursor-paginated statements
- **SettlementService**: Batch creation, dual-sign, export generation
- **ProvidersService**: Payment provider orchestration (kuraimi_epay, cards)
- **ReconciliationService**: Provider statement import, mismatch detection
- **CodPolicyService**: COD limits, exposure windows, guard violations
- **ConfigService**: Runtime VARs with preview/publish/rollback
- **ExportService**: Finance/HR exports with privacy levels
- **AuditLoggerService**: Immutable append-only audit logs
- **MetricsAdapterService**: Exposure, settlement delays, provider failures
- **IdempotencyService**: Deduplicate mutating operations (TTL 24h)
- **OpaGuardService**: Export privacy, Step-Up enforcement

### Controllers

- **WltAccountsController**: `/wallet/accounts/*` (balance, transactions)
- **WltPaymentsController**: `/pay/*` (provider charges, webhooks)
- **WltSettlementsController**: `/wallet/settlements/*` (batches, approvals)
- **WltConfigController**: `/wallet/admin/config` (runtime VARs)
- **WltSupportController**: `/wallet/support/*` (masked diagnostics)

## API Endpoints

### Account Operations
- `GET /wallet/accounts/{account_id}/balance` - Get account balance
- `GET /wallet/accounts/{account_id}/transactions` - List transactions (cursor)

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
- `GET /wallet/settlements` - List batches (cursor)
- `POST /wallet/settlements` - Create batch (Idempotency-Key + Step-Up)
- `POST /wallet/settlements/{batch_id}/approve` - Approve batch (dual-sign + Step-Up)

### Config
- `GET /wallet/admin/config` - Get runtime config (scoped VARs)
- `PATCH /wallet/admin/config` - Update config (Idempotency-Key + Step-Up)

### Exports
- `POST /wallet/exports/statements` - Generate statement export (privacy level, Step-Up)

### Support
- `GET /wallet/support/accounts/{account_id}/snapshot` - Masked snapshot

## Finance Invariants

1. **Wallet=Ledger**: Internal ledger is source of truth
2. **Dual-Sign Payouts**: All bank payouts require dual-sign (two distinct accounts)
3. **Idempotency**: Idempotency-Key required on all POST/PATCH/DELETE (TTL 24h)
4. **Webhook HMAC**: All webhooks HMAC-signed; replay window ≤300s
5. **COD Controls**: Guardrails via VAR_COD_COVERAGE_RATIO, VAR_RIDER_COD_CAP, VAR_COD_FLOAT_MIN

## Security & Privacy

- **RBAC/ABAC**: Roles {user, partner, captain, support, admin, finance, hr} with ABAC
- **No Secrets**: No PAN or provider secrets in logs/exports
- **Privacy Export**: Default masked; unmasked requires higher roles + Step-Up + policy
- **Trace Parity**: Each financial event links 1:1 with service event

## Scope Policies

### Services Using WLT
- **DSH**: Full integration (charges, COD, settlements)
- **ARB**: Holds/escrow with release/no-show policies
- **AMN**: Ride charges and driver payouts
- **KNZ**: Optional marketplace charges/refunds
- **SND**: Immediate services only; specialized services no in-app collection
- **MRF/ESF**: No payments; WLT disabled by policy

### Provider Config
- `VAR_WLT_PROVIDER_PRIMARY="kuraimi_epay"` (runtime-switchable)
- Additional providers via VAR_* with scopes

## Runtime Variables (VARs)

- `VAR_WLT_PROVIDER_PRIMARY` (default: "kuraimi_epay")
- `VAR_AML_SCREENING_ENABLED` (default: false)
- `VAR_COD_COVERAGE_RATIO` (default: PLACEHOLDER)
- `VAR_RIDER_COD_CAP` (default: PLACEHOLDER)
- `VAR_COD_FLOAT_MIN` (default: PLACEHOLDER)
- `VAR_PAYROLL_CYCLE` (default: PLACEHOLDER)
- `VAR_PAYROLL_EXPORT_PRIVACY_LEVEL` (default: "masked")
- `VAR_IDEMPOTENCY_TTL_HOURS` (default: 24, non-editable)
- `VAR_WEBHOOK_REPLAY_WINDOW_SEC` (default: 300, non-editable)
- `VAR_KEY_ROTATION_DAYS` (default: 30)

## Environment Variables

- `WLT_API_URL` - WLT service endpoint (internal)
- `DB_URL` - PostgreSQL connection string
- `VAR_WLT_PROVIDER_PRIMARY` - Primary payment provider
- Provider-specific secrets (vault)

## Dependencies

- MikroORM (PostgreSQL)
- NestJS Core/Common/Config
- CoreModule (guards, filters, interceptors)
- SharedModule

