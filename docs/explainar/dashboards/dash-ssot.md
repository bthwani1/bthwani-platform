# DASH-SSOT - SSOT Control Dashboard

## 1. Overview

The **DASH-SSOT** is the Single Source of Truth (SSOT) control dashboard for managing governance decisions, tracking SSOT index status, monitoring guard compliance, and overseeing platform-wide governance. It provides a centralized interface for SSOT governors to review decisions, track guard statuses, and ensure compliance with platform governance policies.

## 2. Core Journeys

### 2.1 SSOT Overview

1. SSOT views overview via `DASH_SSOT_OVERVIEW` screen (`GET /api/ssot/index`).
2. SSOT reviews service status from `SSOT_INDEX.json`.
3. SSOT tracks service lifecycle and version information.
4. SSOT monitors service artifacts and compliance status.

### 2.2 Decision Management

1. SSOT views pending decisions via `DASH_SSOT_DECISIONS` screen (`GET /api/ssot/decisions`).
2. SSOT reviews decision context and required approvals.
3. SSOT approves or rejects decisions with Step-Up authentication.
4. SSOT tracks decision history and impact.

### 2.3 Guard Monitoring

1. SSOT views guard status via `DASH_SSOT_GUARDS` screen (`GET /api/ssot/guards/report`).
2. SSOT monitors guard compliance across services.
3. SSOT tracks guard violations and remediation.
4. SSOT reviews guard reports and audit logs.

## 3. Guards & Policies

- **Step-Up**: Required for all decision approvals and guard policy changes.
- **RBAC**: Role-based access control (ssot_governor role required for all screens).
- **SSOT Compliance**: All decisions must comply with SSOT governance policies.
- **Audit Logging**: All SSOT actions logged with full context.
- **Guard Enforcement**: Guard status monitored and enforced across all services.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Screen ID             | Service | Description                  | Endpoint                  |
| --------------------- | ------- | ---------------------------- | ------------------------- |
| `DASH_SSOT_OVERVIEW`  | GLOBAL  | SSOT index overview          | `/api/ssot/index`         |
| `DASH_SSOT_DECISIONS` | GLOBAL  | Pending decisions management | `/api/ssot/decisions`     |
| `DASH_SSOT_GUARDS`    | GLOBAL  | Guard status monitoring      | `/api/ssot/guards/report` |

_Full catalog available in `dashboards/ssot/SCREENS_CATALOG.csv`._

### 4.2 API Surface

The dashboard integrates with SSOT service and all platform services for governance oversight. Refer to individual service documentation in `docs/explainar/services/` for complete API details.

## 5. Service Integration & Smart Engine

### 5.1 Service Integration

DASH-SSOT integrates with all platform services:

- **Primary Services**: All services (SSOT governance)
- **Service Classification**: All services visible in SSOT index

### 5.2 Smart Engine Integration

- **Decision Prioritization**: Critical decisions prioritized
- **Guard Prioritization**: Failed guards prioritized
- **Personalization**: SSOT preferences and filters personalized

## 6. Navigation & User Experience

### 6.1 Main Navigation

- **Overview Tab**: SSOT index overview
- **Decisions Tab**: Decision management
- **Guards Tab**: Guard status monitoring
- **Compliance Tab**: Compliance monitoring and reporting

### 6.2 Top App Bar

- **Title**: Context-aware title (Overview, Decisions, Guards, Compliance)
- **Actions**: Quick actions (approve decision, refresh status, export report)
- **Notifications**: Decision approval notifications

### 6.3 Home Screen Features

- **SSOT Overview**: Service status and compliance
- **Pending Decisions**: Decisions requiring approval
- **Guard Status**: Guard compliance summary
- **Quick Actions**: Approve decision, view service, check compliance

### 6.4 Design System

- **RTL Support**: Full RTL support for Arabic interface
- **Theme**: Light/dark theme support
- **Accessibility**: WCAG AA compliance
- **Localization**: Arabic and English support

## 7. Features & Capabilities

### 7.1 SSOT Index Management

- **Service Status**: READY/DRAFT status tracking
- **Service Artifacts**: Build logs, test reports, guard reports
- **Version Management**: Service version tracking
- **Compliance Tracking**: Compliance status per service

### 7.2 Decision Management

- **Decision Queue**: Pending decisions requiring approval
- **Decision Types**: Service approval, guard policy, architecture, compliance
- **Approval Workflow**: Step-Up authentication for approvals
- **Decision History**: Full decision audit trail

### 7.3 Guard Monitoring

- **Guard Types**: G-IDEMPOTENCY, G-NO-SECRETS, G-PRIVACY-EXPORT, G-TRACE, G-PARITY, G-ALERT-BIND
- **Guard Status**: PASS, FAIL, WARNING, PENDING
- **Guard Reports**: Service-level compliance and violations
- **Guard Remediation**: Violation tracking and remediation

### 7.4 Compliance Monitoring

- **Compliance Checks**: Artifact completeness, guard compliance, decision approval
- **Compliance Reporting**: Compliance status dashboard and reports
- **Compliance Alerts**: Violation alerts and remediation tracking
- **Compliance Audit**: Full compliance audit logs

## 8. Integrations & Runtime Variables

- **Primary services**: All platform services (SSOT governance), `SSOT` (decision management, guard monitoring).
- **Shared services**: `RuntimeVariablesService`.
- **Supporting services**: `IDENTITY` (authentication, Step-Up, RBAC).
- **Runtime examples**:
  - `VAR_SSOT_DECISION_APPROVAL_WINDOW_HOURS` — Decision approval window (default: 24 hours).
  - `VAR_SSOT_GUARD_REFRESH_INTERVAL_SEC` — Guard status refresh interval (default: 60 seconds).
  - `VAR_SSOT_COMPLIANCE_CHECK_INTERVAL_HOURS` — Compliance check interval (default: 24 hours).
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. SSOT Index Management

### Service Status Tracking

The dashboard displays service status from `registry/SSOT_INDEX.json`:

- **READY**: Service is production-ready with all artifacts complete.
- **DRAFT**: Service is in development or pending approval.

### Service Artifacts

Each service displays associated artifacts:

- Build logs and test reports.
- Guard reports and audit summaries.
- Schema and migration reports.
- Contract test summaries.
- Parity and traceability reports.

### Version Management

- Service version tracking.
- Version state (READY, DRAFT).
- Version matrix and compatibility.

## 7. Decision Workflow

### Decision Types

- **Service Approval**: Approval for service promotion (DRAFT → READY).
- **Guard Policy**: Changes to guard policies and thresholds.
- **Architecture**: Platform architecture and design decisions.
- **Compliance**: Compliance and governance decisions.

### Decision States

- **PENDING**: Decision awaiting review.
- **APPROVED**: Decision approved with Step-Up authentication.
- **REJECTED**: Decision rejected with reason.

### Decision Approval

1. SSOT governor reviews decision context.
2. SSOT governor evaluates compliance with governance policies.
3. SSOT governor approves or rejects with Step-Up authentication.
4. Decision recorded in SSOT index and audit logs.

## 8. Guard Monitoring

### Guard Types

- **G-IDEMPOTENCY**: Idempotency-Key enforcement.
- **G-NO-SECRETS**: No secrets in code/logs.
- **G-PRIVACY-EXPORT**: Privacy masking for exports.
- **G-TRACE**: Traceability requirements.
- **G-PARITY**: Parity between OAS and implementation.
- **G-ALERT-BIND**: Alert binding and notification.

### Guard Status

- **PASS**: Guard compliance verified.
- **FAIL**: Guard violation detected.
- **WARNING**: Guard compliance at risk.
- **PENDING**: Guard status check in progress.

### Guard Reports

- Service-level guard compliance.
- Guard violation details and remediation.
- Guard audit logs and history.
- Guard policy changes and approvals.

## 9. Compliance Monitoring

### Compliance Checks

- Service artifact completeness.
- Guard compliance status.
- Decision approval status.
- Version and lifecycle compliance.

### Compliance Reporting

- Compliance status dashboard.
- Compliance violation alerts.
- Compliance remediation tracking.
- Compliance audit logs.

## 10. References & Review

- Sources: `dashboards/ssot/SCREENS_CATALOG.csv`, `registry/SSOT_INDEX.json`, `docs/Guidancefiles/DASHBOARDS_OVERVIEW.mdc`, runtime catalog VARs.
- Screen catalog: `dashboards/ssot/SCREENS_CATALOG.csv`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
