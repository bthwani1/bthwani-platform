# DASH-FINANCE - Finance Dashboard

## 1. Overview

The **DASH-FINANCE** is the financial dashboard for managing ledger operations, settlements, payouts, and financial reporting across WLT (Wallet & Ledger), DSH (Delivery & Shopping), and ARB (Escrow & Bookings). It provides access to sensitive financial data with strict security controls including Step-Up authentication and dual-sign approvals for critical operations. The dashboard is accessible from `fin.bthwani.com`.

## 2. Core Journeys

### 2.1 Ledger Management

1. Finance views ledger overview via `DASH_FINANCE_LEDGER_OVERVIEW` screen (`GET /api/wlt/ledger`).
2. Finance reviews ledger entries and account balances.
3. Finance tracks financial transactions and journal entries.
4. Finance exports ledger data with privacy masking.

### 2.2 Settlement Management

1. Finance views settlements via `DASH_FINANCE_SETTLEMENTS` screen (`GET /api/wlt/settlements`).
2. Finance creates settlement batches via `POST /api/wlt/settlements` (Step-Up required, Idempotency-Key required).
3. Finance approves settlement batches via `POST /api/wlt/settlements/{batch_id}/approve` (dual-sign + Step-Up required).
4. Finance tracks settlement status and partner payouts.

### 2.3 Payout Management

1. Finance views payouts via `DASH_FINANCE_PAYOUTS` screen (`GET /api/wlt/payouts`).
2. Finance creates payout runs via `POST /api/wlt/payouts` (dual-sign required).
3. Finance tracks payout status and bank reconciliation.
4. Finance exports payout reports for accounting.

## 3. Guards & Policies

- **Step-Up** required for all settlement approvals and payout operations.
- **Dual-Sign** required for all bank payouts (two distinct accounts must approve).
- **Privacy**: All exports must have `mask_sensitive: true` (G-PRIVACY-EXPORT guard).
- **RBAC**: Role-based access control (finance role required for all screens).
- **Idempotency-Key**: Required for all state-changing operations (settlements, payouts).
- **Audit Logging**: All financial operations logged with full context.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Screen ID                      | Service | Description           | Endpoint               |
| ------------------------------ | ------- | --------------------- | ---------------------- |
| `DASH_FINANCE_LEDGER_OVERVIEW` | WLT     | Ledger overview       | `/api/wlt/ledger`      |
| `DASH_FINANCE_SETTLEMENTS`     | WLT     | Settlement management | `/api/wlt/settlements` |
| `DASH_FINANCE_PAYOUTS`         | WLT     | Payout management     | `/api/wlt/payouts`     |

_Full catalog available in `dashboards/finance/SCREENS_CATALOG.csv`._

### 4.2 API Surface

The dashboard integrates with WLT, DSH, and ARB services for financial operations. Refer to individual service documentation in `docs/explainar/services/` for complete API details.

## 5. Service Integration & Smart Engine

### 5.1 Service Integration

DASH-FINANCE integrates with the following services:

- **Primary Services**: WLT (ledger, settlements, payouts), DSH (order commissions), ARB (escrow transactions)
- **Service Classification**:
  - WLT: Primary Service (full financial access)
  - DSH: Primary Service (commission tracking)
  - ARB: Secondary Service (escrow tracking)

### 5.2 Smart Engine Integration

- **Settlement Prioritization**: High-value settlements prioritized
- **Alert Prioritization**: Critical financial alerts prioritized
- **Personalization**: Finance preferences and filters personalized

## 6. Navigation & User Experience

### 6.1 Main Navigation

- **Ledger Tab**: Ledger overview and transactions
- **Settlements Tab**: Settlement batch management
- **Payouts Tab**: Payout management and tracking
- **Reports Tab**: Financial reports and exports

### 6.2 Top App Bar

- **Title**: Context-aware title (Ledger, Settlements, Payouts, Reports)
- **Actions**: Quick actions (export, filter, refresh, approve)
- **Notifications**: Settlement approval notifications

### 6.3 Home Screen Features

- **Ledger Overview**: Key financial indicators
- **Pending Settlements**: Settlements awaiting approval
- **Payout Status**: Payout processing status
- **Quick Actions**: Approve settlement, create payout, export report

### 6.4 Design System

- **RTL Support**: Full RTL support for Arabic interface
- **Theme**: Light/dark theme support
- **Accessibility**: WCAG AA compliance
- **Localization**: Arabic and English support

## 7. Features & Capabilities

### 7.1 Ledger Management

- **Ledger Overview**: Account balances and transaction summary
- **Journal Entries**: Double-entry ledger entries
- **Account Tracking**: Account-level transaction tracking
- **Export**: Masked ledger exports for accounting

### 7.2 Settlement Management

- **Settlement Batches**: Create and manage settlement batches
- **Dual-Sign Approval**: Dual-sign approval workflow
- **Settlement Tracking**: Settlement status and processing
- **Export**: Settlement export for bank reconciliation

### 7.3 Payout Management

- **Payout Creation**: Create payout runs with dual-sign
- **Payout Tracking**: Payout status and bank reconciliation
- **Payout History**: Full payout history with filters
- **Export**: Payout export for accounting

## 8. Integrations & Runtime Variables

- **Primary services**: `WLT` (ledger, settlements, payouts), `DSH` (order commissions), `ARB` (escrow transactions).
- **Shared services**: `RuntimeVariablesService`.
- **Supporting services**: `IDENTITY` (authentication, Step-Up, dual-sign), `NOTIFICATIONS` (settlement notifications).
- **Runtime examples**:
  - `VAR_WLT_SETTLEMENT_BATCH_SIZE_MAX` — Maximum settlement batch size (default: 1000 entries).
  - `VAR_WLT_SETTLEMENT_APPROVAL_WINDOW_HOURS` — Settlement approval window (default: 24 hours).
  - `VAR_WLT_PAYOUT_DUAL_SIGN_REQUIRED` — Dual-sign requirement flag (default: true).
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. Settlement Workflow

### Settlement Batch Creation

1. Finance creates settlement batch via `POST /api/wlt/settlements` with:
   - Partner account IDs.
   - Settlement period (start/end dates).
   - Idempotency-Key header.
   - Step-Up authentication.

2. System generates settlement entries:
   - Calculates net payable (sales - commissions - fees).
   - Creates ledger entries for each partner.
   - Tracks settlement status (PENDING, APPROVED, PROCESSED).

### Settlement Approval

1. First approver reviews batch and approves via `POST /api/wlt/settlements/{batch_id}/approve`.
2. Second approver (dual-sign) reviews and approves (Step-Up required).
3. System processes settlement:
   - Creates payout entries.
   - Updates ledger balances.
   - Sends notifications to partners.

## 7. Payout Workflow

### Dual-Sign Requirement

All bank payouts require:

- Two distinct finance accounts.
- Both accounts must approve with Step-Up authentication.
- Approval window: 24 hours (configurable via `VAR_WLT_SETTLEMENT_APPROVAL_WINDOW_HOURS`).

### Payout Processing

1. Finance creates payout run via `POST /api/wlt/payouts`.
2. System generates bank file (CSV/Excel format).
3. Finance reviews and approves payout (dual-sign).
4. System processes payout:
   - Updates ledger balances.
   - Creates bank reconciliation entries.
   - Sends confirmation notifications.

## 8. Financial Invariants

### Wallet=Ledger

- Internal ledger is the single source of truth.
- All wallet balances must match ledger balances.
- All transactions must have corresponding ledger entries.

### CoA Mapping

- All ledger entries mapped to Chart of Accounts (CoA).
- Categories: COMMISSION, FEE, REVENUE, SETTLEMENT, PAYOUT, etc.

## 9. Privacy & Export Controls

### Export Masking

All exports must:

- Have `mask_sensitive: true` flag.
- Mask PII (phone numbers, account numbers).
- Comply with G-PRIVACY-EXPORT guard.
- Require Step-Up authentication for unmasked exports.

## 10. References & Review

- Sources: `dashboards/finance/SCREENS_CATALOG.csv`, `oas/services/wlt/openapi.yaml`, `oas/services/dsh/openapi.yaml`, `oas/services/arb/openapi.yaml`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Screen catalog: `dashboards/finance/SCREENS_CATALOG.csv`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
