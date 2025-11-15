# DASH-SECURITY - Security Dashboard

## 1. Overview

The **DASH-SECURITY** is the security dashboard for monitoring security incidents, privacy controls, wallet security, and platform-wide security posture. It provides visibility into security events, privacy export tracking, wallet security controls, and compliance with security policies across WLT (Wallet & Ledger), ESF (Blood Donation), MRF (Lost & Found), and ARB (Escrow & Bookings) services.

## 2. Core Journeys

### 2.1 Security Incident Management

1. Security views incidents via `DASH_SECURITY_INCIDENTS` screen for security event tracking.
2. Security reviews incident details and severity.
3. Security tracks incident resolution and remediation.
4. Security monitors security trends and patterns.

### 2.2 Wallet Security Controls

1. Security views WLT controls via `DASH_SECURITY_WLT_CONTROLS` screen (`GET /api/wlt/security`).
2. Security monitors G-LEDGER-INVARIANTS guard compliance.
3. Security tracks wallet security events and anomalies.
4. Security reviews wallet access logs and audit trails.

### 2.3 Privacy Export Tracking

1. Security views privacy exports via `DASH_SECURITY_PRIVACY_EXPORTS` screen (linked to G-PRIVACY-EXPORT guard).
2. Security tracks all data exports and privacy masking compliance.
3. Security monitors export access patterns and anomalies.
4. Security reviews export audit logs and compliance reports.

## 3. Guards & Policies

- **G-PRIVACY-EXPORT**: All exports must have privacy masking enabled.
- **G-LEDGER-INVARIANTS**: Wallet=Ledger invariants must be maintained.
- **G-NO-SECRETS**: No secrets in code or logs.
- **RBAC**: Role-based access control (security role required for all screens).
- **Step-Up**: Required for sensitive security actions and unmasked data access.
- **Audit Logging**: All security actions logged with full context.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Screen ID                       | Service | Description                | Endpoint                   |
| ------------------------------- | ------- | -------------------------- | -------------------------- |
| `DASH_SECURITY_INCIDENTS`       | GLOBAL  | Security incident tracking | `[TBD]`                    |
| `DASH_SECURITY_WLT_CONTROLS`    | WLT     | Wallet security controls   | `/api/wlt/security`        |
| `DASH_SECURITY_PRIVACY_EXPORTS` | GLOBAL  | Privacy export tracking    | `[TBD]` (G-PRIVACY-EXPORT) |

_Full catalog available in `dashboards/security/SCREENS_CATALOG.csv`._

### 4.2 API Surface

The dashboard integrates with WLT, ESF, MRF, and ARB services for security monitoring. Refer to individual service documentation in `docs/explainar/services/` for complete API details.

## 5. Service Integration & Smart Engine

### 5.1 Service Integration

DASH-SECURITY integrates with the following services:

- **Primary Services**: WLT (wallet security), ESF (blood donation privacy), MRF (lost & found privacy), ARB (escrow security)
- **Service Classification**:
  - WLT: Primary Service (full security access)
  - ESF: Secondary Service (full security access)
  - MRF: Rare Service (full security access)
  - ARB: Secondary Service (full security access)

### 5.2 Smart Engine Integration

- **Incident Prioritization**: Critical incidents prioritized
- **Alert Prioritization**: High-severity alerts prioritized
- **Personalization**: Security preferences and filters personalized

## 6. Navigation & User Experience

### 6.1 Main Navigation

- **Incidents Tab**: Security incident management
- **Wallet Tab**: Wallet security controls
- **Privacy Tab**: Privacy export tracking
- **Compliance Tab**: Security compliance monitoring

### 6.2 Top App Bar

- **Title**: Context-aware title (Incidents, Wallet, Privacy, Compliance)
- **Actions**: Quick actions (filter, search, refresh, respond)
- **Notifications**: Security alert notifications

### 6.3 Home Screen Features

- **Active Incidents**: Critical incidents requiring attention
- **Wallet Status**: Wallet security status and compliance
- **Privacy Exports**: Recent privacy exports and compliance
- **Quick Actions**: Respond to incident, view wallet, check compliance

### 6.4 Design System

- **RTL Support**: Full RTL support for Arabic interface
- **Theme**: Light/dark theme support
- **Accessibility**: WCAG AA compliance
- **Localization**: Arabic and English support

## 7. Features & Capabilities

### 7.1 Security Incident Management

- **Incident Tracking**: Security event tracking and resolution
- **Incident Types**: Authentication failures, authorization violations, data breaches, system compromises
- **Severity Levels**: CRITICAL, HIGH, MEDIUM, LOW
- **Incident Workflow**: Detection, review, response, resolution

### 7.2 Wallet Security Controls

- **G-LEDGER-INVARIANTS**: Wallet=Ledger invariant monitoring
- **Balance Integrity**: Balance discrepancy detection
- **Transaction Monitoring**: Transaction anomaly detection
- **Access Logs**: Wallet access log monitoring

### 7.3 Privacy Export Tracking

- **G-PRIVACY-EXPORT**: Privacy masking compliance monitoring
- **Export Logs**: Export request and access logs
- **Masking Compliance**: Privacy masking verification
- **Unauthorized Exports**: Unauthorized export attempt tracking

### 7.4 Security Compliance

- **Compliance Monitoring**: Guard compliance, privacy policy, security policy
- **Compliance Reporting**: Compliance dashboard and reports
- **Compliance Alerts**: Violation alerts and remediation
- **Security Analytics**: Incident volume, threat detection, risk assessment

## 8. Integrations & Runtime Variables

- **Primary services**: `WLT` (wallet security, ledger invariants), `ESF` (blood donation privacy), `MRF` (lost & found privacy), `ARB` (escrow security).
- **Shared services**: `RuntimeVariablesService`.
- **Supporting services**: `IDENTITY` (authentication, Step-Up, RBAC), security monitoring tools.
- **Runtime examples**:
  - `VAR_SECURITY_INCIDENT_ALERT_THRESHOLD` — Incident alert threshold (default: HIGH severity).
  - `VAR_SECURITY_EXPORT_AUDIT_RETENTION_DAYS` — Export audit retention (default: 365 days).
  - `VAR_SECURITY_WLT_INVARIANT_CHECK_INTERVAL_SEC` — Wallet invariant check interval (default: 60 seconds).
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. Security Incident Management

### Incident Types

- **Authentication Failures**: Failed login attempts, brute force attacks.
- **Authorization Violations**: Unauthorized access attempts, privilege escalation.
- **Data Breaches**: Unauthorized data access, PII exposure.
- **System Compromises**: Malware, intrusion attempts, system vulnerabilities.

### Incident Severity

- **CRITICAL**: Immediate threat requiring immediate response.
- **HIGH**: Significant security risk requiring urgent attention.
- **MEDIUM**: Moderate security risk requiring timely response.
- **LOW**: Minor security issue for tracking and monitoring.

### Incident Workflow

1. Incident detected and logged.
2. Security reviews incident details.
3. Security assesses severity and impact.
4. Security responds and remediates.
5. Incident resolved and documented.

## 7. Wallet Security Controls

### G-LEDGER-INVARIANTS Guard

The dashboard monitors compliance with wallet security invariants:

- **Wallet=Ledger**: Internal ledger is single source of truth.
- **Balance Integrity**: All wallet balances must match ledger balances.
- **Transaction Integrity**: All transactions must have corresponding ledger entries.
- **Dual-Sign Compliance**: All payouts require dual-sign approval.

### Security Monitoring

- Wallet access logs.
- Transaction anomaly detection.
- Balance discrepancy alerts.
- Unauthorized access attempts.

## 8. Privacy Export Tracking

### G-PRIVACY-EXPORT Guard

The dashboard tracks compliance with privacy export policies:

- **Export Masking**: All exports must have `mask_sensitive: true`.
- **PII Protection**: Phone numbers, emails, account numbers masked.
- **Access Control**: Step-Up required for unmasked exports.
- **Audit Logging**: All export actions logged with full context.

### Export Tracking

- Export request logs.
- Export access patterns.
- Privacy masking compliance.
- Unauthorized export attempts.

## 9. Security Compliance

### Compliance Monitoring

- Guard compliance status.
- Privacy policy compliance.
- Security policy adherence.
- Audit log completeness.

### Compliance Reporting

- Security compliance dashboard.
- Compliance violation alerts.
- Compliance remediation tracking.
- Compliance audit reports.

## 10. Security Analytics

### Security Metrics

- Incident volume and trends.
- Security event patterns.
- Threat detection rate.
- Response time metrics.

### Risk Assessment

- Security risk scoring.
- Vulnerability assessment.
- Threat intelligence integration.
- Risk mitigation tracking.

## 11. References & Review

- Sources: `dashboards/security/SCREENS_CATALOG.csv`, `oas/services/wlt/openapi.yaml`, `oas/services/esf/openapi.yaml`, `oas/services/mrf/openapi.yaml`, `oas/services/arb/openapi.yaml`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Screen catalog: `dashboards/security/SCREENS_CATALOG.csv`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
