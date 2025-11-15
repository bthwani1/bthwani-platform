# DASH-PARTNER - Partner Dashboard

## 1. Overview

The **DASH-PARTNER** is the partner-facing web dashboard for viewing partner performance, orders, bookings, and revenue analytics. It provides a web-based interface aligned with APP-PARTNER mobile application functionality, enabling partners to manage their business through both mobile and web interfaces. The dashboard integrates with DSH (Delivery & Shopping) and ARB (Escrow & Bookings) services.

## 2. Core Journeys

### 2.1 Partner Overview

1. Partner views overview via `DASH_PARTNER_OVERVIEW` screen showing key indicators.
2. Partner reviews order metrics and revenue summaries.
3. Partner tracks performance trends and analytics.
4. Partner accesses quick actions for common tasks.

### 2.2 DSH Order Management

1. Partner views DSH orders via `DASH_PARTNER_DSH_ORDERS` screen (`GET /api/dls/partner/orders`).
2. Partner reviews order details and status (aligned with APP-PARTNER).
3. Partner manages order actions (accept, reject, ready, handoff).
4. Partner tracks order history and analytics.

### 2.3 ARB Booking Management

1. Partner views ARB bookings via `DASH_PARTNER_ARB_BOOKINGS` screen (`GET /api/arb/partner/bookings`).
2. Partner manages booking approvals and modifications.
3. Partner tracks booking revenue and escrow status.
4. Partner communicates with customers via encrypted chat.

## 3. Guards & Policies

- **RBAC**: Role-based access control (partner role required, with OWNER/MANAGER/CASHIER/MARKETER sub-roles).
- **Idempotency-Key**: Required for all state-changing operations (orders, bookings).
- **Privacy**: Partner PII masked in analytics and exports.
- **Step-Up**: Required for critical actions (bank updates, financial exports).
- **Audit Logging**: All partner actions logged with full context.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Screen ID                   | Service | Description                | Endpoint                    |
| --------------------------- | ------- | -------------------------- | --------------------------- |
| `DASH_PARTNER_OVERVIEW`     | GLOBAL  | Partner overview dashboard | `[TBD]`                     |
| `DASH_PARTNER_DSH_ORDERS`   | DSH     | DSH order management       | `/api/dls/partner/orders`   |
| `DASH_PARTNER_ARB_BOOKINGS` | ARB     | ARB booking management     | `/api/arb/partner/bookings` |

_Full catalog available in `dashboards/partner/SCREENS_CATALOG.csv`._

### 4.2 API Surface

The dashboard integrates with DSH and ARB services, aligned with APP-PARTNER mobile application. Refer to individual service documentation in `docs/explainar/services/` for complete API details.

## 5. Service Integration & Smart Engine

### 5.1 Service Integration

DASH-PARTNER integrates with the following services:

- **Primary Services**: DSH (order management), ARB (bookings), WLT (finance)
- **Service Classification**:
  - DSH: Primary Service (full partner access)
  - ARB: Secondary Service (full partner access)
  - WLT: Primary Service (full financial access)

### 5.2 Smart Engine Integration

- **Order Ranking**: Orders ranked by priority (new, pending, ready)
- **Performance Prioritization**: High-performance metrics prioritized
- **Personalization**: Partner preferences and filters personalized

## 6. Navigation & User Experience

### 6.1 Main Navigation

- **Overview Tab**: Partner overview and KPIs
- **Orders Tab**: DSH order management
- **Bookings Tab**: ARB booking management
- **Finance Tab**: Financial overview and settlements
- **Settings Tab**: Store settings and configuration

### 6.2 Top App Bar

- **Title**: Context-aware title (Overview, Orders, Bookings, Finance, Settings)
- **Actions**: Quick actions (filter, search, refresh, export)
- **Notifications**: Order and booking notifications

### 6.3 Home Screen Features

- **Order Summary**: Quick stats (pending, accepted, ready)
- **Revenue Summary**: Today's revenue, net payable, next settlement
- **Active Bookings**: Active ARB bookings count
- **Quick Actions**: Accept order, view finance, manage store

### 6.4 Design System

- **RTL Support**: Full RTL support for Arabic interface
- **Theme**: Light/dark theme support
- **Accessibility**: WCAG AA compliance
- **Localization**: Arabic and English support

## 7. Features & Capabilities

### 7.1 Partner Overview

- **Key Indicators**: Total orders, revenue, active bookings
- **Performance Metrics**: Acceptance rate, delivery time, ratings
- **Quick Actions**: View orders, manage bookings, view finance
- **Trends**: Performance trends and analytics

### 7.2 DSH Order Management

- **Order List**: Filterable order list with pagination
- **Order Actions**: Accept, reject, mark ready, handoff
- **Order Analytics**: Order volume, acceptance rate, ratings
- **Mobile-Web Alignment**: Feature parity with APP-PARTNER

### 7.3 ARB Booking Management

- **Booking List**: Booking requests and management
- **Booking Actions**: Confirm, reject, manage amendments
- **Escrow Tracking**: Escrow status and release tracking
- **Chat Integration**: Encrypted chat with customers

### 7.4 Financial Management

- **Finance Overview**: Sales, commissions, net payable
- **Settlements**: Settlement history and details
- **Exports**: Finance report exports (masked)
- **Analytics**: Financial trends and forecasting

## 8. Integrations & Runtime Variables

- **Primary services**: `DSH` (order management, store settings), `ARB` (bookings, offers).
- **Shared services**: `RuntimeVariablesService`, `SmartEngineService`.
- **Supporting services**: `WLT` (finance, settlements), `IDENTITY` (authentication, RBAC), `NOTIFICATIONS` (order notifications).
- **Runtime examples**:
  - `VAR_DLS_PARTNER_ACCEPT_SLA_MIN` — Partner accept SLA (default: 4 minutes).
  - `VAR_PARTNER_DASHBOARD_REFRESH_INTERVAL_SEC` — Dashboard refresh interval (default: 30 seconds).
  - `VAR_PARTNER_EXPORT_MASKING_ENABLED` — Export masking flag (default: true).
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. Partner Overview Dashboard

### Key Indicators

- **Total Orders**: Number of orders (today, week, month).
- **Revenue**: Total revenue and net payable.
- **Active Bookings**: Number of active ARB bookings.
- **Performance Metrics**: Order acceptance rate, average delivery time, customer ratings.

### Quick Actions

- View pending orders.
- Accept/reject orders.
- Manage store settings.
- View financial reports.

## 7. DSH Order Management

### Order Workflow (Web)

Aligned with APP-PARTNER mobile workflow:

1. Partner receives order notification.
2. Partner views order list on dashboard.
3. Partner accepts/rejects order via web interface.
4. Partner marks order as ready.
5. Partner completes pickup and handoff.
6. Partner issues receipt.

### Order Analytics

- Order volume trends.
- Acceptance rate.
- Average order value.
- Customer ratings and feedback.

## 8. ARB Booking Management

### Booking Workflow (Web)

1. Partner views booking requests.
2. Partner reviews booking details and deposit rules.
3. Partner confirms or rejects booking.
4. Partner manages booking amendments.
5. Partner communicates via encrypted chat.
6. Partner tracks escrow status and releases.

### Booking Analytics

- Booking volume trends.
- Confirmation rate.
- Average booking value.
- Escrow release patterns.

## 9. Mobile-Web Alignment

### Feature Parity

The dashboard maintains feature parity with APP-PARTNER:

- Same order/booking management workflows.
- Same RBAC/ABAC permission matrix.
- Same API endpoints and data models.
- Same security and privacy controls.

### Web-Specific Features

- Enhanced analytics and reporting.
- Bulk operations and exports.
- Advanced filtering and search.
- Multi-store management (for partners with multiple stores).

## 10. References & Review

- Sources: `dashboards/partner/SCREENS_CATALOG.csv`, `apps/partner/SCREENS_CATALOG.csv`, `oas/services/dsh/openapi.yaml`, `oas/services/arb/openapi.yaml`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Screen catalog: `dashboards/partner/SCREENS_CATALOG.csv`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
