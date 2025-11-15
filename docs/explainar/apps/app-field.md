# APP-FIELD - Field Mobile Application

## 1. Overview

The **APP-FIELD** is a mobile application for internal teams and contracted field agents to capture partner leads, conduct site surveys, collect KYC documents, capture consent/contract acknowledgments, and complete readiness checklists. The app focuses solely on partner acquisition and onboarding workflows, integrating with DSH (Delivery & Shopping) and ARB (Escrow & Bookings) services.

**Scope Lock**: Partner acquisition → verification → onboarding → go-live readiness only. No links to DSH/ARB/WLT/DASHboards operational flows.

## 2. Core Journeys

### 2.1 Partner Intake

1. Field agent starts intake via `field.partner.intake` screen.
2. Agent captures partner lead information.
3. Agent submits intake via `POST /api/dls/partners/intake` (Idempotency-Key required).
4. System creates provisional partner record.

### 2.2 Partner Identity Submission

1. Agent navigates to `field.partner.identity` screen.
2. Agent collects legal name, CRN, tax ID, owner info.
3. Agent submits identity via `POST /api/dls/partners/{partner_id}/identity` (Idempotency-Key required).
4. Sensitive fields masked in responses.

### 2.3 Document Upload & Verification

1. Agent navigates to `field.partner.documents` screen.
2. Agent uploads KYC/permit documents via `POST /api/dls/partners/{partner_id}/documents`.
3. Documents scanned with antivirus (AV scan).
4. Documents enter moderation queue (approved/rejected).
5. Immutable audit trail created.

### 2.4 Store Setup

1. Agent navigates to `field.partner.store` screen.
2. Agent creates store via `POST /api/dls/partners/{partner_id}/stores` (Idempotency-Key required).
3. Agent updates store via `PATCH /api/dls/stores/{store_id}` (profile, hours, contacts).
4. Agent sets zones via `field.partner.zones` screen (`PUT /api/dls/stores/{store_id}/zones`).
5. Agent sets delivery modes via `field.partner.delivery_modes` screen (`PUT /api/dls/stores/{store_id}/delivery-modes`).
6. Agent sets commission policy via `field.partner.pricing` screen (`PUT /api/dls/stores/{store_id}/commission`).

### 2.5 Bank Details & User Invitation

1. Agent navigates to `field.partner.bank` screen.
2. Agent sets bank details via `PUT /api/dls/partners/{partner_id}/bank` (Step-Up required).
3. Agent invites partner manager via `field.partner.users` screen (`POST /api/dls/partners/{partner_id}/users/invite`).

### 2.6 Review & Approval

1. Agent navigates to `field.partner.review` screen.
2. Agent submits for review via `POST /api/dls/partners/{partner_id}/submit-review` (Idempotency-Key required).
3. Agent views pending queue via `field.partner.queue` screen (`GET /api/dls/partners/pending`).
4. Agent approves partner via `field.partner.decision` screen (`POST /api/dls/partners/{partner_id}/approve` — Step-Up required).
5. Agent rejects partner via `field.partner.decision` screen (`POST /api/dls/partners/{partner_id}/reject` with reason).

## 3. Guards & Policies

- **Idempotency-Key** enforced on all state-changing calls (intake, identity, documents, store setup, review).
- **Step-Up** required for critical approvals (bank updates, partner approval).
- **Privacy**: Sensitive fields masked; no raw PII in logs; documents encrypted.
- **Audit**: All actions logged with immutable audit trail.
- **AV Scan**: All uploaded documents scanned for viruses.
- **KYC**: Full KYC workflow with document verification.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Screen ID                      | Service | Description             | Endpoint                                            |
| ------------------------------ | ------- | ----------------------- | --------------------------------------------------- |
| `field.partner.intake`         | DSH     | Start partner intake    | `POST /api/dls/partners/intake`                     |
| `field.partner.identity`       | DSH     | Submit partner identity | `POST /api/dls/partners/{partner_id}/identity`      |
| `field.partner.documents`      | DSH     | Upload KYC documents    | `POST /api/dls/partners/{partner_id}/documents`     |
| `field.partner.store`          | DSH     | Create/update store     | `POST /api/dls/partners/{partner_id}/stores`        |
| `field.partner.zones`          | DSH     | Set coverage zones      | `PUT /api/dls/stores/{store_id}/zones`              |
| `field.partner.delivery_modes` | DSH     | Set delivery modes      | `PUT /api/dls/stores/{store_id}/delivery-modes`     |
| `field.partner.pricing`        | DSH     | Set commission policy   | `PUT /api/dls/stores/{store_id}/commission`         |
| `field.partner.bank`           | DSH     | Set bank details        | `PUT /api/dls/partners/{partner_id}/bank`           |
| `field.partner.users`          | DSH     | Invite partner manager  | `POST /api/dls/partners/{partner_id}/users/invite`  |
| `field.partner.review`         | DSH     | Submit for review       | `POST /api/dls/partners/{partner_id}/submit-review` |
| `field.partner.queue`          | DSH     | Pending partners queue  | `GET /api/dls/partners/pending`                     |
| `field.partner.decision`       | DSH     | Approve/reject partner  | `POST /api/dls/partners/{partner_id}/approve`       |

_Full catalog available in `apps/field/SCREENS_CATALOG.csv`._

### 4.2 API Surface

The application integrates with DSH and ARB services for partner onboarding. Refer to individual service documentation in `docs/explainar/services/` for complete API details.

## 5. Service Classification & Smart Engine

### 5.1 Service Integration

APP-FIELD integrates with the following services:

- **Primary Services**: DSH (partner intake, store setup), ARB (partner onboarding)
- **Service Classification**:
  - DSH: Primary Service (full integration for partner onboarding)
  - ARB: Secondary Service (full integration for escrow/bookings onboarding)

### 5.2 Smart Engine Integration

- **Task Prioritization**: Tasks ranked by SLA, priority, and location
- **Route Optimization**: Optimized routes for field agents
- **Personalization**: Agent preferences and zones personalized

## 6. Navigation & User Experience

### 6.1 Bottom Tab Bar Navigation

- **Tasks Tab**: Partner intake tasks with filters
- **Partners Tab**: Partner list and management
- **Documents Tab**: Document upload and verification
- **Profile Tab**: Agent profile, settings, zones

### 6.2 Top App Bar

- **Title**: Context-aware title (Tasks, Partners, Documents, Profile)
- **Actions**: Quick actions (filter, search, refresh)
- **Notifications**: Notification badge with unread count

### 6.3 Home Screen Features

- **Task Summary**: Quick stats (pending, in-progress, completed)
- **Partner Queue**: Pending partners for review
- **Quick Actions**: Start intake, upload documents, approve partner
- **Notifications**: Recent task alerts and reminders

### 6.4 Design System

- **RTL Support**: Full RTL support for Arabic interface
- **Theme**: Light/dark theme support
- **Accessibility**: WCAG AA compliance
- **Localization**: Arabic and English support

## 7. Features & Capabilities

### 7.1 Partner Intake

- **Lead Capture**: Partner lead information collection
- **Intake Submission**: Provisional partner record creation
- **Identity Submission**: Legal name, CRN, tax ID collection

### 7.2 Document Management

- **Document Upload**: KYC/permit document upload
- **AV Scanning**: Antivirus scanning for all documents
- **Document Verification**: Moderation queue with approval/rejection
- **Audit Trail**: Immutable audit trail for all actions

### 7.3 Store Setup

- **Store Creation**: Store profile creation
- **Store Updates**: Profile, hours, contacts updates
- **Zone Management**: Coverage zone configuration
- **Delivery Modes**: Delivery mode configuration
- **Commission Policy**: Commission policy setup

### 7.4 Bank & User Management

- **Bank Details**: Bank account configuration (Step-Up required)
- **User Invitation**: Partner manager invitation
- **Access Control**: RBAC/ABAC for partner users

### 7.5 Review & Approval

- **Review Submission**: Submit partner for review
- **Pending Queue**: View pending partners queue
- **Approval/Rejection**: Approve/reject partners (Step-Up required)
- **Decision Tracking**: Full decision history

## 8. Integrations & Runtime Variables

- **Primary services**: `DSH` (partner intake, store setup, zones, policies), `ARB` (partner onboarding for escrow/bookings).
- **Shared services**: `RuntimeVariablesService`, `SmartEngineService`.
- **Supporting services**: `IDENTITY` (agent authentication, profile, zones), `TASK_ENGINE` (task management, route optimization), `MEDIA_STORE` (document storage), `NOTIFICATIONS` (task alerts).
- **Runtime examples**:
  - `VAR_FIELD_TASK_SLA_HOURS` — Task SLA in hours.
  - `VAR_FIELD_DOCUMENT_MAX_SIZE_MB` — Maximum document size.
  - `VAR_FIELD_AV_SCAN_ENABLED` — Enable antivirus scanning (default: true).
  - `VAR_SVC_DSH_ENABLED` — Enable/disable DSH service.
  - `VAR_SVC_ARB_ENABLED` — Enable/disable ARB service.
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. Task Management

### Task Types

- **Partner Intake**: Initial lead capture.
- **Site Survey**: Physical location verification.
- **KYC Collection**: Document gathering and verification.
- **Store Setup**: Store configuration and zone mapping.
- **Readiness Check**: Final go-live verification.

### Task Workflow

1. Tasks assigned to agents based on zones.
2. Agents view tasks via `GET /field/tasks` with filters.
3. Agents update task status via `PATCH /field/tasks/:task_id/status`.
4. Tasks tracked with SLA monitoring.

## 7. Partner Onboarding Flow

### Stages

1. **Intake**: Lead capture and initial data collection.
2. **Identity**: Legal information and business registration.
3. **Documents**: KYC documents upload and verification.
4. **Store Setup**: Store creation, zones, delivery modes, commission.
5. **Bank Setup**: Payment account configuration (Step-Up required).
6. **User Invitation**: Partner manager account creation.
7. **Review**: Package submission for ops review.
8. **Approval**: Final approval/rejection (Step-Up required for approval).

### Approval Workflow

- Partner package submitted for review.
- Ops team reviews via dashboards.
- Approval requires Step-Up authentication.
- Rejection includes reason and follow-up ticket.

## 8. References & Review

- Sources: `apps/field/SCREENS_CATALOG.csv`, `oas/services/dsh/openapi.yaml`, `oas/services/arb/openapi.yaml`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Screen catalog: `apps/field/SCREENS_CATALOG.csv`.
- Module documentation: `src/modules/field/README.md`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
