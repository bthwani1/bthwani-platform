# APP-PARTNER - Partner Mobile Application

## 1. Overview

The **APP-PARTNER** is the partner-facing mobile application for the BThwani platform. It enables partners to manage orders, bookings, store settings, policies, zones, inventory, and view financial information including settlements and earnings. The app integrates with DSH (Delivery & Shopping), ARB (Escrow & Bookings), and WLT (Wallet & Ledger) services.

## 2. Core Journeys

### 2.1 Order Management (DSH)

1. Partner receives order notification and views order list via `GET /api/dls/partner/orders`.
2. Partner views order details via `GET /api/dls/partner/orders/{order_id}`.
3. Partner accepts order via `POST /api/dls/partner/orders/{order_id}/accept` (Idempotency-Key required).
4. Partner rejects order via `POST /api/dls/partner/orders/{order_id}/reject` with reason.
5. Partner marks order as ready via `POST /api/dls/partner/orders/{order_id}/ready`.
6. Partner completes pickup via `POST /api/dls/partner/orders/{order_id}/pickup/close` with 6-digit code.
7. Partner hands off to platform captain via `POST /api/dls/partner/orders/{order_id}/handoff`.
8. Partner issues receipt via `POST /api/dls/partner/orders/{order_id}/receipt/issue`.

### 2.2 Chat & Communication

1. Partner views chat messages via `GET /api/dls/partner/orders/{order_id}/chat/messages`.
2. Partner sends chat message via `POST /api/dls/partner/orders/{order_id}/chat/messages` (Idempotency-Key required).
3. Partner acknowledges read status via `POST /api/dls/partner/orders/{order_id}/chat/read-ack`.
4. All chat messages encrypted (AES-GCM) with phone masking.

### 2.3 Store Management

1. Partner views policies via `GET /api/dls/partners/me/policies`.
2. Partner updates policies via `PATCH /api/dls/partners/me/policies` (delivery modes, channels).
3. Partner views zones via `GET /api/dls/partners/me/zones`.
4. Partner updates zones via `PATCH /api/dls/partners/me/zones` (coverage areas).
5. Partner manages slots via `GET /api/dls/partners/me/slots`, `POST /api/dls/partners/me/slots`, `DELETE /api/dls/partners/me/slots/{slot_id}`.
6. Partner adjusts inventory via `POST /api/dls/partners/me/inventory/adjust`.

### 2.4 ARB (Escrow & Bookings)

1. Partner creates offer via `POST /api/arb/offers` with deposit rules.
2. Partner manages bookings via `GET /api/arb/partner/bookings`.
3. Partner updates booking status and communicates via encrypted chat.

### 2.5 Financial Management

1. Partner views finance overview via WLT integration (sales, commissions, net payable).
2. Partner views settlements via WLT integration.
3. Partner views ledger transactions with CoA mapping.
4. Partner requests exports (masked for partners).

## 3. Guards & Policies

- **Idempotency-Key** enforced on all state-changing calls (orders, bookings, policies, zones, inventory).
- **Step-Up** required for critical approvals (bank updates, financial exports).
- **Privacy**: All chat payloads encrypted (AES-GCM); phone numbers masked; no raw PII in logs.
- **RBAC/ABAC**: Role-based access control (OWNER, MANAGER, CASHIER, MARKETER) with permission matrix.
- **Webhooks**: All inbound endpoints enforce HMAC signatures with ≤300s replay window.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Screen ID                        | Service | Description              | Endpoint                                           |
| -------------------------------- | ------- | ------------------------ | -------------------------------------------------- |
| `PARTNER_ORDERS_LIST`            | DSH     | Orders list              | `/api/dls/partner/orders`                          |
| `PARTNER_ORDER_DETAILS`          | DSH     | Order details            | `/api/dls/partner/orders/{order_id}`               |
| `PARTNER_ORDER_ACTIONS`          | DSH     | Accept/reject/ready      | `/api/dls/partner/orders/{order_id}/accept`        |
| `PARTNER_CHAT`                   | DSH     | Encrypted chat           | `/api/dls/partner/orders/{order_id}/chat/messages` |
| `PARTNER_CHAT_HISTORY`           | DSH     | Chat history             | `/api/dls/partner/orders/{order_id}/chat/messages` |
| `PARTNER_CHAT_READ_ACK`          | DSH     | Chat read acknowledgment | `/api/dls/partner/orders/{order_id}/chat/read-ack` |
| `PARTNER_ORDER_NOTES`            | DSH     | Order notes              | `/api/dls/partner/orders/{order_id}/notes`         |
| `PARTNER_ORDER_NOTES_CREATE`     | DSH     | Create order note        | `/api/dls/partner/orders/{order_id}/notes`         |
| `PARTNER_ORDER_TIMELINE`         | DSH     | Order timeline           | `/api/dls/partner/orders/{order_id}/timeline`      |
| `PARTNER_PICKUP_CLOSE`           | DSH     | Pickup close with code   | `/api/dls/partner/orders/{order_id}/pickup/close`  |
| `PARTNER_ORDER_READY`            | DSH     | Mark order ready         | `/api/dls/partner/orders/{order_id}/ready`         |
| `PARTNER_ORDER_REJECT`           | DSH     | Reject order             | `/api/dls/partner/orders/{order_id}/reject`        |
| `PARTNER_ORDER_HANDOFF`          | DSH     | Handoff to platform      | `/api/dls/partner/orders/{order_id}/handoff`       |
| `PARTNER_POLICIES`               | DSH     | Delivery policies        | `/api/dls/partners/me/policies`                    |
| `PARTNER_POLICIES_UPDATE`        | DSH     | Update policies          | `/api/dls/partners/me/policies`                    |
| `PARTNER_ZONES`                  | DSH     | Coverage zones           | `/api/dls/partners/me/zones`                       |
| `PARTNER_ZONES_UPDATE`           | DSH     | Update zones             | `/api/dls/partners/me/zones`                       |
| `PARTNER_SLOTS`                  | DSH     | Time slots management    | `/api/dls/partners/me/slots`                       |
| `PARTNER_SLOTS_UPSERT`           | DSH     | Add/update slot          | `/api/dls/partners/me/slots`                       |
| `PARTNER_SLOTS_DELETE`           | DSH     | Delete slot              | `/api/dls/partners/me/slots/{slot_id}`             |
| `PARTNER_INVENTORY_ADJUST`       | DSH     | Inventory adjustment     | `/api/dls/partners/me/inventory/adjust`            |
| `PARTNER_NOTIFICATIONS_DISPATCH` | DSH     | Send notification        | `/api/dls/partners/{partner_id}/notifications`     |
| `PARTNER_RECEIPT_ISSUE`          | DSH     | Issue final receipt      | `/api/dls/partner/orders/{order_id}/receipt/issue` |
| `PARTNER_FINANCE_OVERVIEW`       | WLT     | Finance overview         | `/wallet/partner/finance/overview`                 |
| `PARTNER_LEDGER`                 | WLT     | Ledger transactions      | `/wallet/partner/ledger`                           |
| `PARTNER_SETTLEMENTS`            | WLT     | Settlements list         | `/wallet/partner/settlements`                      |
| `PARTNER_SUBSCRIPTIONS_STATUS`   | WLT     | Subscription status      | `/subscriptions/status`                            |
| `PARTNER_SUBSCRIPTIONS_CHECKOUT` | WLT     | Subscription checkout    | `/subscriptions/checkout`                          |
| `PARTNER_ARB_OFFERS`             | ARB     | ARB offers management    | `/api/arb/offers`                                  |
| `PARTNER_ARB_BOOKINGS`           | ARB     | ARB bookings             | `/api/arb/partner/bookings`                        |

_Full catalog available in `apps/partner/SCREENS_CATALOG.csv`._

### 4.2 API Surface

The application integrates with DSH, ARB, and WLT services. Refer to individual service documentation in `docs/explainar/services/` for complete API details.

## 5. Service Classification & Smart Engine

### 5.1 Service Integration

APP-PARTNER integrates with the following services:

- **Primary Services**: DSH (order management, store settings), ARB (bookings, offers), WLT (finance, settlements)
- **Service Classification**:
  - DSH: Primary Service (full integration)
  - ARB: Secondary Service (full integration)
  - WLT: Primary Service (full integration for finance)

### 5.2 Smart Engine Integration

- **Order Ranking**: Orders ranked by priority (new, pending, ready)
- **Notification Prioritization**: Critical notifications (order acceptance) prioritized over informational
- **Personalization**: Store settings and preferences personalized per partner

## 6. Navigation & User Experience

### 6.1 Bottom Tab Bar Navigation

- **Orders Tab**: Main orders list with filters (pending, accepted, ready, completed)
- **Store Tab**: Store management (policies, zones, slots, inventory)
- **Finance Tab**: Financial overview, settlements, ledger, subscriptions
- **Bookings Tab**: ARB offers and bookings management
- **Profile Tab**: Partner profile, settings, notifications

### 6.2 Top App Bar

- **Title**: Context-aware title (Orders, Store Settings, Finance, etc.)
- **Actions**: Quick actions (filter, search, refresh)
- **Notifications**: Notification badge with unread count

### 6.3 Home Screen Features

- **Order Summary**: Quick stats (pending, accepted, ready)
- **Revenue Summary**: Today's revenue, net payable, next settlement
- **Quick Actions**: Accept order, mark ready, view finance
- **Notifications**: Recent notifications and reminders

### 6.4 Design System

- **RTL Support**: Full RTL support for Arabic interface
- **Theme**: Light/dark theme support
- **Accessibility**: WCAG AA compliance
- **Localization**: Arabic and English support

## 7. Features & Capabilities

### 7.1 DSH Order Management

- **Order List**: Filterable list with cursor pagination
- **Order Actions**: Accept, reject, mark ready, handoff, issue receipt
- **Order Details**: Full order details with timeline
- **Chat**: Encrypted chat with customers
- **Notes**: Internal order notes
- **Pickup Management**: 6-digit code for pickup close

### 7.2 Store Management

- **Policies**: Delivery modes and channel configuration
- **Zones**: Coverage area management
- **Slots**: Time slot management for Dark-Store
- **Inventory**: Inventory adjustment and tracking

### 7.3 ARB Integration

- **Offers**: Create and manage service offers
- **Bookings**: View and manage customer bookings
- **Chat**: Encrypted chat with customers
- **Escrow**: Automatic escrow hold/release

### 7.4 Financial Management

- **Finance Overview**: Sales, commissions, net payable
- **Ledger**: Transaction history with CoA mapping
- **Settlements**: Settlement history and details
- **Exports**: Finance report exports (masked)
- **Subscriptions**: Subscription plans and checkout

### 7.5 Notification System

- **Push Notifications**: Real-time order notifications
- **Reminders**: Automated reminders (T+4m for pending orders)
- **In-App Notifications**: Notification center with unread counts
- **Channel Priority**: WhatsApp → SMS → Push

## 8. Integrations & Runtime Variables

- **Primary services**: `DSH` (order management, store settings), `ARB` (bookings, offers), `WLT` (finance, settlements).
- **Shared services**: `RuntimeVariablesService`, `SmartEngineService`.
- **Supporting services**: `IDENTITY` (authentication, profile), `NOTIFICATIONS` (push notifications, reminders).
- **Runtime examples**:
  - `VAR_DLS_PARTNER_ACCEPT_SLA_MIN` — Partner accept SLA (default: 4 minutes).
  - `VAR_NOTIF_DEDUP_WINDOW_MIN` — Notification deduplication window (default: 10 minutes).
  - `VAR_NOTIF_PARTNER_RATE_PER_15MIN` — Per-store rate ceiling.
  - `VAR_SVC_DSH_ENABLED` — Enable/disable DSH service.
  - `VAR_SVC_ARB_ENABLED` — Enable/disable ARB service.
  - `VAR_SVC_WLT_ENABLED` — Enable/disable WLT service.
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 9. RBAC/ABAC System

### Partner Roles

- **OWNER**: Full access to all resources.
- **MANAGER**: Orders, bookings, store management.
- **CASHIER**: Finance read, exports, settlements.
- **MARKETER**: Subscriptions, promos, profile read.

### Permission Matrix

| Resource     | Action | Owner | Manager | Cashier | Marketer |
| ------------ | ------ | ----- | ------- | ------- | -------- |
| finance      | read   | ✓     | ✗       | ✓       | ✗        |
| settlements  | read   | ✓     | ✗       | ✓       | ✗        |
| subscription | read   | ✓     | ✗       | ✗       | ✓        |
| store        | update | ✓     | ✓       | ✗       | ✗        |
| orders       | read   | ✓     | ✓       | ✗       | ✗        |
| orders       | update | ✓     | ✓       | ✗       | ✗        |
| bookings     | read   | ✓     | ✓       | ✗       | ✗        |
| bookings     | update | ✓     | ✓       | ✗       | ✗        |
| exports      | create | ✓     | ✗       | ✓       | ✗        |

## 10. Partner Reminder Automation

Partners receive automated reminders (T+4m) for pending orders:

- WhatsApp → SMS → Push channel priority.
- Deduplication window: `VAR_NOTIF_DEDUP_WINDOW_MIN`.
- Rate limiting: `VAR_NOTIF_PARTNER_RATE_PER_15MIN`.
- Escalation to Ops at T+6m if no action.

## 11. References & Review

- Sources: `apps/partner/SCREENS_CATALOG.csv`, `oas/services/dsh/openapi.yaml`, `oas/services/arb/openapi.yaml`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Screen catalog: `apps/partner/SCREENS_CATALOG.csv`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
