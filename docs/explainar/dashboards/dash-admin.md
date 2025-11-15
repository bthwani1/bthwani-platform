# DASH-ADMIN - Admin Dashboard

## 1. Overview

The **DASH-ADMIN** is the primary administrative dashboard for the BThwani platform. It provides a unified governance interface for reviewing decisions, managing service lifecycle status, and overseeing platform-wide operations. The dashboard integrates with all platform services and serves as the central control panel for administrative functions.

## 2. Core Journeys

### 2.1 Service Lifecycle Management

1. Admin views service matrix via `DASH_ADMIN_SERVICES` screen showing all services from `SSOT_INDEX.json`.
2. Admin reviews service status (READY, DRAFT) and version information.
3. Admin tracks service artifacts and build status.
4. Admin manages service-level decisions and approvals.

### 2.2 Decision Management

1. Admin views pending decisions via `DASH_ADMIN_DECISIONS` screen.
2. Admin links decisions to SSOT (Single Source of Truth) records.
3. Admin reviews decision context and required approvals.
4. Admin approves or rejects decisions with Step-Up authentication.

### 2.3 Platform Overview

1. Admin views platform-wide overview via `DASH_ADMIN_OVERVIEW` screen.
2. Admin monitors key indicators and metrics across all services.
3. Admin tracks platform health and operational status.
4. Admin accesses governance controls and settings.

## 3. Guards & Policies

- **Step-Up** required for all decision approvals and critical configuration changes.
- **RBAC**: Role-based access control (admin role required for all screens).
- **SSOT Integration**: All decisions must be linked to SSOT records.
- **Audit Logging**: All administrative actions logged with full context.
- **Privacy**: Sensitive data masked based on privacy policies.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Screen ID              | Service | Description                 | Endpoint |
| ---------------------- | ------- | --------------------------- | -------- |
| `DASH_ADMIN_OVERVIEW`  | GLOBAL  | Platform overview dashboard | `[TBD]`  |
| `DASH_ADMIN_DECISIONS` | GLOBAL  | Decision management         | `[TBD]`  |
| `DASH_ADMIN_SERVICES`  | GLOBAL  | Service lifecycle matrix    | `[TBD]`  |

_Full catalog available in `dashboards/admin/SCREENS_CATALOG.csv`._

### 4.2 API Surface

The dashboard integrates with all platform services for governance and oversight. Service-specific admin endpoints are available through individual service APIs. Refer to individual service documentation in `docs/explainar/services/` for complete API details.

## 5. Service Integration & Smart Engine

### 5.1 Service Integration

DASH-ADMIN integrates with all platform services:

- **Primary Services**: DSH, WLT, ARB, KNZ, AMN (full governance access)
- **Secondary Services**: KWD, SND, ESF, MRF (governance access)
- **Service Classification**: All services visible in service lifecycle matrix

### 5.2 Smart Engine Integration

- **Service Ranking**: Services ranked by status (READY > DRAFT)
- **Decision Prioritization**: Critical decisions prioritized
- **Personalization**: Admin preferences and filters personalized

## 6. Navigation & User Experience

### 6.1 Main Navigation

- **Overview Tab**: Platform-wide overview and KPIs
- **Services Tab**: Service lifecycle matrix and management
- **Decisions Tab**: Decision management and SSOT integration
- **Settings Tab**: Governance controls and configuration

### 6.2 Top App Bar

- **Title**: Context-aware title (Overview, Services, Decisions, Settings)
- **Actions**: Quick actions (refresh, export, filter)
- **Notifications**: Decision approval notifications

### 6.3 Home Screen Features

- **Platform Overview**: Key indicators across all services
- **Service Status**: Service health and availability
- **Pending Decisions**: Count of pending decisions requiring approval
- **Quick Actions**: Approve decision, view service, refresh status

### 6.4 Design System

- **RTL Support**: Full RTL support for Arabic interface
- **Theme**: Light/dark theme support
- **Accessibility**: WCAG AA compliance
- **Localization**: Arabic and English support

## 7. Features & Capabilities

### 7.1 Service Lifecycle Management

- **Service Matrix**: View all services from SSOT_INDEX.json
- **Status Tracking**: READY/DRAFT status per service
- **Artifact Management**: Build logs, test reports, guard reports
- **Version Control**: Service version tracking

### 7.2 Decision Management

- **Decision Queue**: Pending decisions requiring approval
- **SSOT Integration**: Link decisions to SSOT records
- **Approval Workflow**: Step-Up authentication for approvals
- **Decision History**: Full decision audit trail

### 7.3 Platform Governance

- **Runtime Variables**: Manage platform-wide runtime variables
- **Service Configuration**: Service-level configuration management
- **Guard Status**: Monitor guard compliance across services
- **Audit Logging**: Full audit trail for all actions

### 7.4 Banner Management

- **Banner Creation**: Create banners for DSH/KNZ/ARB
- **Banner Management**: Update, delete, schedule banners
- **Banner Analytics**: Banner performance tracking

## 8. Integrations & Runtime Variables

- **Primary services**: All platform services (DSH, WLT, ARB, KNZ, SND, KWD, AMN, ESF, MRF).
- **Shared services**: `RuntimeVariablesService`, `SmartEngineService`, `BannerService`.
- **Supporting services**: `SSOT` (governance decisions), `IDENTITY` (authentication, RBAC).
- **Runtime examples**:
  - `VAR_ADMIN_DECISION_APPROVAL_WINDOW_MIN` — Decision approval window (default: 24 hours).
  - `VAR_ADMIN_SERVICE_STATUS_REFRESH_INTERVAL_SEC` — Service status refresh interval (default: 60 seconds).
  - `VAR_SVC_*_ENABLED` — Service enable/disable flags for all services.
  - `VAR_UI_BANNER_*_ENABLED` — Banner enable flags (DSH, KNZ, ARB).
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 9. Service Lifecycle Management

### Service Status Matrix

The dashboard displays service status from `registry/SSOT_INDEX.json`:

- **READY**: Service is production-ready with all artifacts complete.
- **DRAFT**: Service is in development or pending approval.

### Service Artifacts

Each service displays associated artifacts:

- Build logs and test reports.
- Guard reports and audit summaries.
- Schema and migration reports.
- Contract test summaries.

## 10. Decision Workflow

### Decision States

- **PENDING**: Decision awaiting review.
- **APPROVED**: Decision approved with Step-Up authentication.
- **REJECTED**: Decision rejected with reason.

### SSOT Integration

All decisions must be linked to SSOT records for traceability and governance compliance.

## 11. API Endpoints Summary

### Service Management

- `GET /api/admin/services` - List all services from SSOT_INDEX.json
- `GET /api/admin/services/{service_code}` - Get service details
- `PATCH /api/admin/services/{service_code}/status` - Update service status (Step-Up required)

### Decision Management

- `GET /api/admin/decisions` - List pending decisions
- `GET /api/admin/decisions/{decision_id}` - Get decision details
- `POST /api/admin/decisions/{decision_id}/approve` - Approve decision (Step-Up required)
- `POST /api/admin/decisions/{decision_id}/reject` - Reject decision (Step-Up required)

### Banner Management

- `POST /api/admin/banners` - Create banner (Step-Up required)
- `GET /api/admin/banners` - List banners
- `GET /api/admin/banners/{id}` - Get banner details
- `PUT /api/admin/banners/{id}` - Update banner (Step-Up required)
- `DELETE /api/admin/banners/{id}` - Delete banner (Step-Up required)

### Runtime Variables

- `GET /api/admin/runtime-vars` - List runtime variables
- `GET /api/admin/runtime-vars/{key}` - Get runtime variable
- `PATCH /api/admin/runtime-vars/{key}` - Update runtime variable (Step-Up required)

### SSOT Integration

- `GET /api/admin/ssot/index` - Get SSOT index
- `GET /api/admin/ssot/services/{service_code}` - Get service SSOT record
- `GET /api/admin/ssot/guards/report` - Get guard status report

## 12. References & Review

- Sources: `dashboards/admin/SCREENS_CATALOG.csv`, `registry/SSOT_INDEX.json`, `docs/Guidancefiles/DASHBOARDS_OVERVIEW.mdc`, runtime catalog VARs.
- Screen catalog: `dashboards/admin/SCREENS_CATALOG.csv`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
