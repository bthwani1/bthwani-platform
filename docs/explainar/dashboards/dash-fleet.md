# DASH-FLEET - Fleet Dashboard

## 1. Overview

The **DASH-FLEET** is the fleet management dashboard for monitoring and managing captains, deliveries, and fleet operations across AMN (Safe Taxi) and DSH (Delivery & Shopping). It provides real-time visibility into captain status, availability, delivery performance, and fleet alerts.

## 2. Core Journeys

### 2.1 Captain Management

1. Fleet views captain status via `DASH_FLEET_CAPTAIN_STATUS` screen (`GET /api/amn/captains`).
2. Fleet monitors captain availability and connection status.
3. Fleet tracks captain performance metrics (delivery time, rating, earnings).
4. Fleet manages captain assignments and schedules.

### 2.2 DSH Delivery Monitoring

1. Fleet views DSH deliveries via `DASH_FLEET_DSH_DELIVERIES` screen (`GET /api/ops/dls/orders`).
2. Fleet monitors real-time delivery status and tracking.
3. Fleet tracks delivery performance and SLA compliance.
4. Fleet manages delivery assignments and rerouting.

### 2.3 Fleet Alerts

1. Fleet views fleet alerts via `DASH_FLEET_ALERTS` screen (linked to G-ALERT-BIND guard).
2. Fleet monitors critical alerts (SOS, incidents, SLA breaches).
3. Fleet responds to alerts and escalates as needed.
4. Fleet tracks alert resolution and follow-up actions.

## 3. Guards & Policies

- **RBAC**: Role-based access control (fleet role required for all screens).
- **Privacy**: Captain PII masked in analytics and reports.
- **Audit Logging**: All fleet management actions logged with full context.
- **Alert Integration**: Fleet alerts linked to G-ALERT-BIND guard for real-time notifications.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Screen ID                   | Service | Description               | Endpoint               |
| --------------------------- | ------- | ------------------------- | ---------------------- |
| `DASH_FLEET_CAPTAIN_STATUS` | AMN     | Captain status monitoring | `/api/amn/captains`    |
| `DASH_FLEET_DSH_DELIVERIES` | DSH     | DSH delivery monitoring   | `/api/ops/dls/orders`  |
| `DASH_FLEET_ALERTS`         | GLOBAL  | Fleet alerts              | `[TBD]` (G-ALERT-BIND) |

_Full catalog available in `dashboards/fleet/SCREENS_CATALOG.csv`._

### 4.2 API Surface

The dashboard integrates with AMN and DSH services for fleet operations. Refer to individual service documentation in `docs/explainar/services/` for complete API details.

## 5. Service Integration & Smart Engine

### 5.1 Service Integration

DASH-FLEET integrates with the following services:

- **Primary Services**: AMN (captain management), DSH (delivery monitoring)
- **Service Classification**:
  - AMN: Primary Service (full fleet access)
  - DSH: Primary Service (full fleet access)

### 5.2 Smart Engine Integration

- **Captain Ranking**: Captains ranked by performance and availability
- **Alert Prioritization**: Critical alerts (SOS, SLA breaches) prioritized
- **Personalization**: Fleet preferences and filters personalized

## 6. Navigation & User Experience

### 6.1 Main Navigation

- **Captains Tab**: Captain status and management
- **Deliveries Tab**: DSH delivery monitoring
- **Alerts Tab**: Fleet alerts and notifications
- **Analytics Tab**: Fleet performance analytics

### 6.2 Top App Bar

- **Title**: Context-aware title (Captains, Deliveries, Alerts, Analytics)
- **Actions**: Quick actions (filter, search, refresh, assign)
- **Notifications**: Fleet alert notifications

### 6.3 Home Screen Features

- **Captain Status**: Online/offline captain count
- **Active Deliveries**: Real-time delivery tracking
- **Active Alerts**: Critical alerts requiring attention
- **Quick Actions**: Assign delivery, view captain, respond to alert

### 6.4 Design System

- **RTL Support**: Full RTL support for Arabic interface
- **Theme**: Light/dark theme support
- **Accessibility**: WCAG AA compliance
- **Localization**: Arabic and English support

## 7. Features & Capabilities

### 7.1 Captain Management

- **Status Monitoring**: Real-time captain status tracking
- **Availability Tracking**: Captain availability and connection status
- **Performance Metrics**: Delivery time, rating, earnings tracking
- **Assignment Management**: Captain assignment and scheduling

### 7.2 Delivery Monitoring

- **Real-Time Tracking**: Live delivery status monitoring
- **SLA Compliance**: SLA breach detection and alerts
- **Rerouting**: Delivery rerouting and optimization
- **Performance Analytics**: Delivery performance metrics

### 7.3 Fleet Alerts

- **SOS Alerts**: Emergency alerts from captains
- **SLA Breaches**: Delivery time exceeding SLA
- **Incidents**: Fleet incidents requiring attention
- **System Alerts**: Technical issues affecting operations

## 8. Integrations & Runtime Variables

- **Primary services**: `AMN` (captain management, ride tracking), `DSH` (delivery monitoring, order tracking).
- **Shared services**: `RuntimeVariablesService`, `SmartEngineService`.
- **Supporting services**: `WLT` (captain earnings), `NOTIFICATIONS` (fleet alerts), `IDENTITY` (authentication, RBAC).
- **Runtime examples**:
  - `VAR_FLEET_CAPTAIN_AVAILABILITY_TIMEOUT_SEC` — Captain availability timeout (default: 300 seconds).
  - `VAR_FLEET_DELIVERY_SLA_MIN` — Delivery SLA (default: 30 minutes).
  - `VAR_FLEET_ALERT_ESCALATION_THRESHOLD_SEC` — Alert escalation threshold (default: 60 seconds).
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. Captain Status Management

### Status Types

- **ONLINE**: Captain is online and available for assignments.
- **OFFLINE**: Captain is offline or unavailable.
- **BUSY**: Captain is currently on a delivery/ride.
- **BREAK**: Captain is on break.

### Availability Tracking

Fleet monitors:

- Real-time connection status.
- Last seen timestamp.
- Current assignment status.
- Performance metrics (delivery time, rating).

## 7. Delivery Performance

### Key Metrics

- **Delivery Time**: Average time from pickup to delivery.
- **SLA Compliance**: Percentage of deliveries within SLA.
- **Reroute Rate**: Percentage of deliveries requiring rerouting.
- **PoD Success Rate**: Percentage of successful proof-of-delivery.

### Performance Tracking

Fleet tracks:

- Real-time delivery status.
- Captain assignment and handoff.
- Delivery route optimization.
- Customer feedback and ratings.

## 8. Fleet Alerts

### Alert Types

- **SOS Alerts**: Emergency alerts from captains (AMN trips).
- **SLA Breaches**: Delivery time exceeding SLA.
- **Incidents**: Fleet incidents requiring attention.
- **System Alerts**: Technical issues affecting fleet operations.

### Alert Workflow

1. Alert generated via G-ALERT-BIND guard.
2. Alert displayed on fleet dashboard.
3. Fleet responds to alert:
   - Acknowledges alert.
   - Takes appropriate action.
   - Escalates if needed.
4. Alert resolved and logged.

## 9. Captain Performance Analytics

### Performance Metrics

- **Delivery Count**: Total deliveries completed.
- **Average Rating**: Customer rating average.
- **Earnings**: Total earnings from deliveries/rides.
- **SLA Compliance**: Percentage of on-time deliveries.

### Performance Segmentation

- **Top Performers**: Captains with highest ratings and on-time delivery.
- **At-Risk Captains**: Captains with declining performance.
- **New Captains**: Recently onboarded captains.

## 10. References & Review

- Sources: `dashboards/fleet/SCREENS_CATALOG.csv`, `oas/services/amn/openapi.yaml`, `oas/services/dsh/openapi.yaml`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Screen catalog: `dashboards/fleet/SCREENS_CATALOG.csv`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
