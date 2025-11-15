# WLT Implementation Status

## Overview
This document tracks the implementation status of the WLT (Wallet & Ledger) service according to the C4 model specifications.

## ✅ Completed Components

### Entities (7/7)
- ✅ `AccountEntity` - Wallet accounts with types, statuses, limits
- ✅ `JournalEntryEntity` - Double-entry ledger entries
- ✅ `HoldEntity` - Escrow holds linked to external refs
- ✅ `SettlementBatchEntity` - Settlement batches with dual-sign tracking
- ✅ `IdempotencyEntity` - Idempotency keys (TTL 24h)
- ✅ `RuntimeConfigEntity` - Runtime VARs with scopes
- ✅ `AuditLogEntity` - Immutable audit trail

### Repositories (7/7)
- ✅ `AccountRepository` - Account CRUD operations
- ✅ `JournalEntryRepository` - Journal entry operations & balance computation
- ✅ `HoldRepository` - Hold CRUD operations
- ✅ `SettlementBatchRepository` - Settlement batch operations
- ✅ `IdempotencyRepository` - Idempotency key management
- ✅ `RuntimeConfigRepository` - Runtime config with scope precedence
- ✅ `AuditLogRepository` - Audit log operations

### Services (15/15)
- ✅ `LedgerEngine` - Double-entry rules, Wallet=Ledger invariants
- ✅ `AccountService` - Account management (create/update/status)
- ✅ `TransferService` - Internal transfers between accounts
- ✅ `HoldService` - Create/release/capture escrow holds
- ✅ `BalanceService` - Balance computation, cursor-paginated statements
- ✅ `SettlementService` - Batch creation, dual-sign, export generation
- ✅ `ProvidersService` - Payment provider orchestration (kuraimi_epay, cards)
- ✅ `ReconciliationService` - Provider statement import, mismatch detection
- ✅ `CodPolicyService` - COD limits, exposure windows, guard violations
- ✅ `ConfigService` - Runtime VARs with preview/publish/rollback
- ✅ `ExportService` - Finance/HR exports with privacy levels
- ✅ `AuditLoggerService` - Immutable append-only audit logs
- ✅ `MetricsAdapterService` - Exposure, settlement delays, provider failures
- ✅ `IdempotencyService` - Deduplicate mutating operations (TTL 24h)
- ✅ `OpaGuardService` - Export privacy, Step-Up enforcement

### Module Structure
- ✅ `WltModule` - Complete module with all providers
- ✅ `AppModule` - WLT module integrated

## ✅ Completed Components (Additional)

### Controllers (7/7)
- ✅ `WltAccountsController` - `/wallet/accounts/*` (balance, transactions)
- ✅ `WltPaymentsController` - `/pay/*` (provider charges, webhooks)
- ✅ `WltSettlementsController` - `/wallet/settlements/*` (batches, approvals)
- ✅ `WltConfigController` - `/wallet/admin/config` (runtime VARs)
- ✅ `WltSupportController` - `/wallet/support/*` (masked diagnostics)
- ✅ `WltCodController` - `/wallet/cod/captains/*` (COD limits)
- ✅ `WltExportsController` - `/wallet/exports/*` (statement exports)

### DTOs (7/7)
- ✅ `GetBalanceDto` - Get balance request
- ✅ `ListTransactionsDto` - List transactions with filters
- ✅ `InternalTransferDto` - Internal transfer request
- ✅ `CreateHoldDto` - Create hold/escrow request
- ✅ `ReleaseHoldDto` - Release hold request
- ✅ `ProviderChargeDto` - Provider charge request
- ✅ `ProviderWebhookDto` - Provider webhook payload

### Migrations (7/7)
- ✅ Migration for `wlt_accounts` table
- ✅ Migration for `wlt_journal_entries` table
- ✅ Migration for `wlt_holds` table
- ✅ Migration for `wlt_settlement_batches` table
- ✅ Migration for `wlt_idempotency` table
- ✅ Migration for `wlt_runtime_config` table
- ✅ Migration for `wlt_audit_logs` table

## ⚠️ Pending Components

### OpenAPI Spec
- ⏳ Update `oas/services/wlt/openapi.yaml` with all endpoints per C4 model

### Tests
- ⏳ Unit tests for services
- ⏳ Integration tests for repositories
- ⏳ E2E tests for controllers

## Implementation Notes

### Key Features Implemented
1. **Double-Entry Ledger**: `LedgerEngine` enforces balanced postings (debits = credits)
2. **Wallet=Ledger Invariant**: Balance computed from journal entries
3. **Idempotency**: `IdempotencyService` handles deduplication with 24h TTL
4. **Audit Trail**: Immutable append-only audit logs with SHA256 hashes
5. **Runtime Config**: Scoped VARs with Zone>City>Service>Global precedence
6. **Privacy Controls**: OPA guard for unmasked exports
7. **Dual-Sign Settlements**: Settlement batches require two approvers
8. **Provider Orchestration**: Runtime-switchable payment providers
9. **HMAC Webhooks**: Webhook signature verification with ≤300s replay window
10. **COD Policies**: Configurable COD limits and exposure tracking

### Architecture Compliance
- ✅ Follows NestJS modular architecture
- ✅ Uses MikroORM for persistence
- ✅ Implements repository pattern
- ✅ Uses dependency injection
- ✅ Follows single responsibility principle
- ✅ Implements domain services (LedgerEngine, CodPolicyService)
- ✅ Implements application services (AccountService, TransferService, etc.)
- ✅ Infrastructure adapters (AuditLogger, MetricsAdapter, OpaGuard)

### Security & Privacy
- ✅ No PAN or secrets in logs/exports
- ✅ Masked exports by default
- ✅ OPA guard for sensitive operations
- ✅ Step-Up enforcement for sensitive actions
- ✅ RBAC/ABAC support via OpaGuardService
- ✅ HMAC webhook verification

### Finance Invariants
- ✅ Wallet=Ledger: Balance computed from journal
- ✅ Dual-sign payouts: SettlementService enforces dual approval
- ✅ Idempotency: Required on all POST/PATCH/DELETE
- ✅ Webhook HMAC: ProvidersService verifies signatures
- ✅ COD Controls: CodPolicyService enforces guardrails

## Next Steps

1. **Create Controllers** - Implement all 5 controllers with endpoints per C4 model
2. **Create DTOs** - Request/response DTOs with validation
3. **Update OpenAPI** - Complete OpenAPI spec with all endpoints
4. **Create Migrations** - Database migrations for all entities
5. **Write Tests** - Unit, integration, and E2E tests
6. **Integration** - Connect with existing services (DSH, ARB, AMN, etc.)

## Dependencies
- NestJS Core/Common/Config
- MikroORM (PostgreSQL)
- CoreModule (guards, filters, interceptors)
- SharedModule

## Environment Variables
- `VAR_WLT_PROVIDER_PRIMARY` - Primary payment provider (default: "kuraimi_epay")
- `VAR_IDEMPOTENCY_TTL_HOURS` - Idempotency TTL (default: 24)
- `VAR_WEBHOOK_REPLAY_WINDOW_SEC` - Webhook replay window (default: 300)
- `VAR_COD_COVERAGE_RATIO` - COD coverage ratio
- `VAR_RIDER_COD_CAP` - Rider COD cap
- `VAR_COD_FLOAT_MIN` - Minimum COD float
- `VAR_PAYROLL_EXPORT_PRIVACY_LEVEL` - Payroll export privacy (default: "masked")
- Provider-specific secrets (vault)

