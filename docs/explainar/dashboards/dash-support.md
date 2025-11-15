# DASH-SUPPORT - Support Dashboard

## 1. Overview

The **DASH-SUPPORT** is the support dashboard for managing customer support tickets, incidents, escalations, and user assistance across DSH (Delivery & Shopping), AMN (Safe Taxi), ARB (Escrow & Bookings), ESF (Blood Donation), and MRF (Lost & Found). It provides high-privacy interfaces with PII masking and role-based access controls for support staff.

## 2. Core Journeys

### 2.1 Ticket Management

1. Support views tickets via `DASH_SUPPORT_TICKETS` screen (`GET /api/support/tickets`).
2. Support reviews ticket details with privacy masking applied.
3. Support assigns tickets to support agents.
4. Support updates ticket status and resolution.
5. Support communicates with users via encrypted channels.

### 2.2 DSH Fleet Incidents

1. Support views fleet incidents via `DASH_SUPPORT_DSH_INCIDENTS` screen (`GET /api/fleet/incidents`).
2. Support reviews incident details with masked PII.
3. Support tracks incident resolution and follow-up actions.
4. Support escalates critical incidents to operations.

### 2.3 ARB Escalations

1. Support views ARB escalations via `DASH_SUPPORT_ARB_ESCALATIONS` screen (`GET /api/arb/escalations`).
2. Support reviews booking disputes and chat escalations.
3. Support mediates between customers and partners.
4. Support resolves escalations with appropriate actions.

## 3. Guards & Policies

- **Privacy**: All PII masked in support interfaces (G-PRIVACY-EXPORT guard).
- **RBAC**: Role-based access control (support role required for all screens).
- **Step-Up**: Required for sensitive actions (account modifications, refund approvals).
- **Audit Logging**: All support actions logged with full context.
- **Encryption**: All chat messages encrypted (AES-GCM) with phone masking.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Screen ID                      | Service | Description                | Endpoint               |
| ------------------------------ | ------- | -------------------------- | ---------------------- |
| `DASH_SUPPORT_TICKETS`         | GLOBAL  | Support tickets management | `/api/support/tickets` |
| `DASH_SUPPORT_DSH_INCIDENTS`   | DSH     | Fleet incidents            | `/api/fleet/incidents` |
| `DASH_SUPPORT_ARB_ESCALATIONS` | ARB     | ARB escalations            | `/api/arb/escalations` |

_Full catalog available in `dashboards/support/SCREENS_CATALOG.csv`._

### 4.2 API Surface

The dashboard integrates with DSH, AMN, ARB, ESF, and MRF services for support operations. Refer to individual service documentation in `docs/explainar/services/` for complete API details.

## 5. Service Integration & Smart Engine

### 5.1 Service Integration

DASH-SUPPORT integrates with the following services:

- **Primary Services**: DSH (order support), AMN (ride support), ARB (booking escalations)
- **Secondary Services**: ESF (blood donation support), MRF (lost & found support)
- **Service Classification**:
  - DSH: Primary Service (full support access)
  - AMN: Primary Service (full support access)
  - ARB: Secondary Service (full support access)
  - ESF: Secondary Service (full support access)
  - MRF: Rare Service (full support access)

### 5.2 Smart Engine Integration

- **Ticket Prioritization**: High-priority tickets prioritized
- **Alert Prioritization**: Critical support alerts prioritized
- **Personalization**: Support preferences and filters personalized

## 6. Navigation & User Experience

### 6.1 Main Navigation

- **Tickets Tab**: Support tickets management
- **DSH Tab**: DSH order support and incidents
- **ARB Tab**: ARB booking escalations
- **ESF Tab**: ESF blood donation support
- **MRF Tab**: MRF lost & found support

### 6.2 Top App Bar

- **Title**: Context-aware title (Tickets, DSH Incidents, ARB Escalations, etc.)
- **Actions**: Quick actions (filter, search, assign, resolve)
- **Notifications**: New ticket and escalation notifications

### 6.3 Home Screen Features

- **Ticket Queue**: Pending tickets requiring attention
- **SLA Breaches**: Tickets approaching SLA threshold
- **Escalations**: Active escalations
- **Quick Actions**: Assign ticket, view details, resolve issue

### 6.4 Design System

- **RTL Support**: Full RTL support for Arabic interface
- **Theme**: Light/dark theme support
- **Accessibility**: WCAG AA compliance
- **Localization**: Arabic and English support

## 7. Features & Capabilities

### 7.1 Ticket Management

- **Ticket Queue**: View and manage support tickets
- **Ticket Details**: Full ticket details with privacy masking
- **Ticket Assignment**: Assign tickets to support agents
- **Ticket Resolution**: Update status and resolution
- **Communication**: Encrypted communication with users

### 7.2 DSH Fleet Incidents

- **Incident Tracking**: Fleet incident tracking and resolution
- **Privacy Masking**: PII masking in incident details
- **Escalation**: Escalate critical incidents to operations
- **Follow-up**: Track follow-up actions

### 7.3 ARB Escalations

- **Escalation Queue**: Booking dispute and chat escalations
- **Mediation**: Mediate between customers and partners
- **Resolution**: Resolve escalations with appropriate actions
- **Audit Trail**: Full escalation audit trail

## 8. Integrations & Runtime Variables

- **Primary services**: `DSH` (order support, fleet incidents), `AMN` (ride support), `ARB` (booking escalations), `ESF` (blood donation support), `MRF` (lost & found support).
- **Shared services**: `RuntimeVariablesService`.
- **Supporting services**: `IDENTITY` (authentication, RBAC), `NOTIFICATIONS` (ticket notifications).
- **Runtime examples**:
  - `VAR_SUPPORT_TICKET_SLA_HOURS` — Support ticket SLA (default: 24 hours).
  - `VAR_SUPPORT_PII_MASKING_ENABLED` — PII masking flag (default: true).
  - `VAR_SUPPORT_ESCALATION_THRESHOLD_HOURS` — Escalation threshold (default: 48 hours).
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. Privacy & PII Masking

### Masking Rules

All support interfaces apply PII masking:

- Phone numbers: `XX***XX` format.
- Email addresses: `u***@d***.com` format.
- Account numbers: Last 4 digits only.
- Names: First letter + `***` + last letter.

### Access Levels

- **Support Agent**: Masked PII only.
- **Support Manager**: Partial unmasking with Step-Up.
- **Admin**: Full access with Step-Up and audit logging.

## 7. Ticket Workflow

### Ticket States

- **OPEN**: New ticket awaiting assignment.
- **ASSIGNED**: Ticket assigned to support agent.
- **IN_PROGRESS**: Agent actively working on ticket.
- **RESOLVED**: Ticket resolved, awaiting user confirmation.
- **CLOSED**: Ticket closed by user or auto-closed after SLA.

### Escalation Rules

- T+24h: First escalation reminder.
- T+48h: Escalation to support manager.
- T+72h: Escalation to operations team.

## 8. Service-Specific Support

### DSH Support

- Order issues and disputes.
- Delivery problems and PoD verification.
- Partner communication issues.
- Fleet incident management.

### ARB Support

- Booking disputes and amendments.
- Escrow release issues.
- Chat escalations.
- Refund requests.

### ESF Support

- Blood donation matching issues.
- Donor coordination problems.
- Emergency escalation handling.

### MRF Support

- Lost & found report management.
- Item recovery coordination.
- User communication.

## 9. References & Review

- Sources: `dashboards/support/SCREENS_CATALOG.csv`, `oas/services/dsh/openapi.yaml`, `oas/services/amn/openapi.yaml`, `oas/services/arb/openapi.yaml`, `oas/services/esf/openapi.yaml`, `oas/services/mrf/openapi.yaml`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Screen catalog: `dashboards/support/SCREENS_CATALOG.csv`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
