# DASH-OPS - Operations Dashboard

## 1. Overview

The **DASH-OPS** is the operations dashboard for monitoring and managing live orders, rides, and operational workflows across DSH (Delivery & Shopping), AMN (Safe Taxi), and SND (On-demand Services). It provides real-time visibility into order status, webhook monitoring, partner notifications, SLA breaches, disputes, and dispatch operations.

## 2. Core Journeys

### 2.1 DSH Order Monitoring

1. Ops views live orders via `DASH_OPS_DSH_LIVE_ORDERS` screen (`GET /api/dls/orders`).
2. Ops monitors order status and assignment via `DASH_OPS_DSH_ORDER_DETAILS` screen.
3. Ops reassigns orders via `DASH_OPS_DSH_DISPATCH_ASSIGN` (`POST /api/ops/dls/orders/{order_id}/dispatch/assign`).
4. Ops tracks SLA breaches via `DASH_OPS_DSH_SLA_BREACHES` screen.
5. Ops manages disputes via `DASH_OPS_DSH_DISPUTES` screen.

### 2.2 Webhook & Inbound Monitoring

1. Ops monitors webhook messages via `DASH_OPS_DSH_WEBHOOK_INBOUND` screen (`GET /api/dls/inbound/messages`).
2. Ops verifies HMAC signatures and replay window (≤300s) compliance.
3. Ops monitors partner status updates via `DASH_OPS_DSH_WEBHOOK_STATUS` screen.
4. Ops reviews inbound pipeline via `DASH_OPS_DSH_INBOUND_PIPELINE` screen.

### 2.3 Partner Management

1. Ops views onboarding queue via `DASH_OPS_DSH_ONBOARDING_QUEUE` screen (`GET /api/ops/dls/partners/onboarding`).
2. Ops manages partner notifications via `DASH_OPS_DSH_PARTNER_NOTIF` and `DASH_OPS_DSH_PARTNER_NOTIF_OPS` screens.
3. Ops overrides slots via `DASH_OPS_DSH_SLOT_OVERRIDE` screen (`PATCH /api/ops/dls/slots/{slot_id}`).

### 2.4 Audit & Compliance

1. Ops views audit logs via `DASH_OPS_DSH_AUDIT_LOGS` screen (`GET /api/ops/dls/audit/logs`).
2. Ops searches and filters audit logs for compliance and troubleshooting.

### 2.5 AMN & SND Operations

1. Ops monitors AMN rides via `DASH_OPS_AMN_RIDES` screen (`GET /api/amn/rides`).
2. Ops tracks SND requests via `DASH_OPS_SND_REQUESTS` screen (`GET /api/snd/requests`).

## 3. Guards & Policies

- **HMAC Verification**: All inbound webhooks must have valid HMAC signatures with ≤300s replay window.
- **RBAC**: Role-based access control (ops role required for all screens).
- **Privacy**: PII masked in audit logs and dispute screens.
- **Audit Logging**: All operational actions logged with full context.
- **Idempotency-Key**: Required for all state-changing operations (assignments, notifications, slot overrides).

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Screen ID                        | Service | Description                     | Endpoint                                           |
| -------------------------------- | ------- | ------------------------------- | -------------------------------------------------- |
| `DASH_OPS_DSH_LIVE_ORDERS`       | DSH     | Live orders monitoring          | `/api/dls/orders`                                  |
| `DASH_OPS_DSH_WEBHOOK_INBOUND`   | DSH     | Webhook message monitoring      | `/api/dls/inbound/messages`                        |
| `DASH_OPS_DSH_WEBHOOK_STATUS`    | DSH     | Partner status updates          | `/api/dls/partner/inbound/status`                  |
| `DASH_OPS_DSH_PARTNER_NOTIF`     | DSH     | Partner notification management | `/api/dls/partners/{partner_id}/notifications`     |
| `DASH_OPS_DSH_AUDIT_LOGS`        | DSH     | Audit log viewer                | `/api/ops/dls/audit/logs`                          |
| `DASH_OPS_DSH_DISPUTES`          | DSH     | Disputes management             | `/api/ops/dls/disputes`                            |
| `DASH_OPS_DSH_INBOUND_PIPELINE`  | DSH     | Inbound message pipeline        | `/api/ops/dls/inbound/messages`                    |
| `DASH_OPS_DSH_ORDER_DETAILS`     | DSH     | Order details view              | `/api/ops/dls/orders/{order_id}`                   |
| `DASH_OPS_DSH_DISPATCH_ASSIGN`   | DSH     | Order reassignment              | `/api/ops/dls/orders/{order_id}/dispatch/assign`   |
| `DASH_OPS_DSH_ONBOARDING_QUEUE`  | DSH     | Partner onboarding queue        | `/api/ops/dls/partners/onboarding`                 |
| `DASH_OPS_DSH_PARTNER_NOTIF_OPS` | DSH     | Operational notifications       | `/api/ops/dls/partners/{partner_id}/notifications` |
| `DASH_OPS_DSH_SLA_BREACHES`      | DSH     | SLA breach monitoring           | `/api/ops/dls/sla/breaches`                        |
| `DASH_OPS_DSH_SLOT_OVERRIDE`     | DSH     | Slot override management        | `/api/ops/dls/slots/{slot_id}`                     |
| `DASH_OPS_AMN_RIDES`             | AMN     | AMN rides monitoring            | `/api/amn/rides`                                   |
| `DASH_OPS_SND_REQUESTS`          | SND     | SND requests monitoring         | `/api/snd/requests`                                |

_Full catalog available in `dashboards/ops/SCREENS_CATALOG.csv`._

### 4.2 API Surface

The dashboard integrates with DSH, AMN, and SND services for operational monitoring and management. Refer to individual service documentation in `docs/explainar/services/` for complete API details.

## 5. Service Integration & Smart Engine

### 5.1 Service Integration

DASH-OPS integrates with the following services:

- **Primary Services**: DSH (order management), AMN (ride monitoring), SND (request monitoring)
- **Service Classification**:
  - DSH: Primary Service (full operational access)
  - AMN: Primary Service (full operational access)
  - SND: Secondary Service (full operational access)

### 5.2 Smart Engine Integration

- **Order Ranking**: Orders ranked by priority (SLA breaches, pending, active)
- **Alert Prioritization**: Critical alerts prioritized
- **Personalization**: Ops preferences and filters personalized

## 6. Navigation & User Experience

### 6.1 Main Navigation

- **DSH Tab**: DSH order monitoring and management
- **AMN Tab**: AMN ride monitoring
- **SND Tab**: SND request monitoring
- **Webhooks Tab**: Webhook and inbound message monitoring
- **Audit Tab**: Audit logs and compliance

### 6.2 Top App Bar

- **Title**: Context-aware title (DSH Orders, AMN Rides, Webhooks, etc.)
- **Actions**: Quick actions (filter, search, refresh, assign)
- **Notifications**: SLA breach alerts and escalation notifications

### 6.3 Home Screen Features

- **Live Orders**: Real-time order status monitoring
- **SLA Breaches**: Active SLA breaches requiring attention
- **Webhook Status**: Webhook health and compliance
- **Quick Actions**: Reassign order, send notification, view audit

### 6.4 Design System

- **RTL Support**: Full RTL support for Arabic interface
- **Theme**: Light/dark theme support
- **Accessibility**: WCAG AA compliance
- **Localization**: Arabic and English support

## 7. Features & Capabilities

### 7.1 DSH Order Monitoring

- **Live Orders**: Real-time order status tracking
- **Order Details**: Full order details with timeline
- **Dispatch Management**: Order reassignment and dispatch
- **SLA Monitoring**: SLA breach detection and alerts
- **Dispute Management**: Dispute tracking and resolution

### 7.2 Webhook & Inbound Monitoring

- **Webhook Messages**: Inbound webhook message monitoring
- **HMAC Verification**: HMAC signature verification status
- **Replay Window**: Replay window compliance (≤300s)
- **Partner Status**: Partner status update monitoring
- **Inbound Pipeline**: Inbound message pipeline tracking

### 7.3 Partner Management

- **Onboarding Queue**: Partner onboarding queue management
- **Notification Management**: Partner notification dispatch
- **Slot Override**: Slot override and management
- **Audit Logs**: Full audit trail for partner actions

### 7.4 AMN & SND Operations

- **AMN Rides**: Ride monitoring and status tracking
- **SND Requests**: Request monitoring and assignment
- **Operational Alerts**: Real-time operational alerts

## 8. Integrations & Runtime Variables

- **Primary services**: `DSH` (order management, webhooks, dispatch), `AMN` (ride monitoring), `SND` (request monitoring).
- **Shared services**: `RuntimeVariablesService`, `SmartEngineService`.
- **Supporting services**: `NOTIFICATIONS` (partner reminders, escalations), `IDENTITY` (authentication, RBAC).
- **Runtime examples**:
  - `VAR_DLS_PARTNER_ACCEPT_SLA_MIN` — Partner accept SLA (default: 4 minutes).
  - `VAR_NOTIF_DEDUP_WINDOW_MIN` — Notification deduplication window (default: 10 minutes).
  - `VAR_NOTIF_PARTNER_RATE_PER_15MIN` — Per-store rate ceiling.
  - `VAR_OPS_WEBHOOK_REPLAY_WINDOW_SEC` — Webhook replay window (default: 300 seconds).
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. SLA Monitoring

### SLA Breach Detection

The dashboard monitors SLA breaches for:

- Partner accept time (default: 4 minutes).
- Order preparation time.
- Delivery time windows.
- Response time for escalations.

### Escalation Workflow

- T+4m: Automated partner reminder (WhatsApp → SMS → Push).
- T+6m: Escalation to Ops dashboard.
- T+10m: Manual intervention required.

## 7. Webhook Security

### HMAC Verification

All inbound webhooks must:

- Include valid HMAC signature in header.
- Have timestamp within replay window (≤300s).
- Pass signature verification before processing.

### Replay Protection

Webhook messages are deduplicated based on:

- Message ID.
- Timestamp.
- Request fingerprint.

## 8. References & Review

- Sources: `dashboards/ops/SCREENS_CATALOG.csv`, `oas/services/dsh/openapi.yaml`, `oas/services/amn/openapi.yaml`, `oas/services/snd/openapi.yaml`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Screen catalog: `dashboards/ops/SCREENS_CATALOG.csv`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
