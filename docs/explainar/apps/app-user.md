# APP-USER - User Mobile Application

## 1. Overview

The **APP-USER** is the primary customer-facing mobile application for the BThwani platform. It provides access to all platform services including DSH (Delivery & Shopping), KNZ (Marketplace), AMN (Safe Taxi), KWD (Jobs Platform), SND (On-demand Services), MRF (Lost & Found), ESF (Blood Donation), ARB (Escrow & Bookings), and WLT (Wallet & Ledger) for payments. The application features a comprehensive navigation system with bottom tab bar, service discovery, order management, wallet integration, and full support for all platform services.

## 2. Core Journeys

### 2.1 DSH (Delivery & Shopping) Journey

#### 2.1.1 Browse & Discovery

1. User opens app and lands on home screen (`APP_USER_HOME`) showing service cards and quick access.
2. User browses DSH categories (restaurants, supermarkets, fruits & veggies, fashion, sweets, global stores, quick tasks).
3. User views partner stores and policies via `GET /api/dls/partners/{partner_id}/policies`.
4. User checks partner coverage zones via `GET /api/dls/partners/{partner_id}/zones`.
5. User views available Dark-Store slots via `GET /api/dls/slots` (`APP_USER_DSH_SLOTS`).

#### 2.1.2 Quote & Checkout

1. User requests initial quote via `POST /api/dls/quotes` (`APP_USER_DSH_QUOTES`) for Dark-Store slots.
2. User selects slot and proceeds to checkout (`APP_USER_DSH_CHECKOUT`).
3. User creates order via `POST /api/dls/orders` with `Idempotency-Key` and payment selection.
4. User selects Dark-Store slot via `APP_USER_DSH_CHECKOUT_SLOT` (`PATCH /api/dls/orders/{order_id}`) after order creation.
5. User initiates payment via `POST /api/wlt/intents` (`APP_USER_WLT_PAYMENT_INTENT`).
6. User polls payment status via `GET /api/wlt/intents/{intent_id}` (`APP_USER_WLT_PAYMENT_STATUS`).
7. User confirms payment via `POST /api/wlt/intents/{intent_id}/confirm` (`APP_USER_WLT_PAYMENT_CONFIRM`) if requires_action.

#### 2.1.3 Order Management

1. User views orders list via `GET /api/dls/orders` (`APP_USER_DSH_ORDERS`) with pagination.
2. User views order details via `GET /api/dls/orders/{order_id}` (`APP_USER_DSH_ORDER_DETAILS`).
3. User tracks order in real-time via `GET /api/dls/orders/{order_id}/tracking` (`APP_USER_DSH_ORDER_TRACKING`).
4. User views order timeline via `GET /api/dls/orders/{order_id}/timeline` (`APP_USER_DSH_ORDER_TIMELINE`).
5. User checks ETA via `GET /api/dls/orders/{order_id}/eta` (`APP_USER_DSH_ORDER_ETA`).
6. User updates order via `PATCH /api/dls/orders/{order_id}` (`APP_USER_DSH_ORDER_UPDATE`) within permitted window.
7. User cancels order via `POST /api/dls/orders/{order_id}/cancel` (`APP_USER_DSH_ORDER_CANCEL`) with reason from `GET /api/dls/cancel-reasons` (`APP_USER_DSH_CANCEL_REASONS`).
8. User reorders via `POST /api/dls/orders/{order_id}/reorder` (`APP_USER_DSH_REORDER`) to create new order from previous.

#### 2.1.4 Communication & Notes

1. User views chat messages via `GET /api/dls/orders/{order_id}/chat/messages` (`APP_USER_DSH_ORDER_CHAT`).
2. User sends chat message via `POST /api/dls/orders/{order_id}/chat/messages` (`APP_USER_DSH_ORDER_CHAT_SEND`) with `Idempotency-Key`.
3. User acknowledges read status via `POST /api/dls/orders/{order_id}/chat/read-ack` (`APP_USER_DSH_CHAT_READ_ACK`).
4. User views order notes via `GET /api/dls/orders/{order_id}/notes` (`APP_USER_DSH_ORDER_NOTES`).
5. User creates order note via `POST /api/dls/orders/{order_id}/notes` (`APP_USER_DSH_ORDER_NOTES_CREATE`).

#### 2.1.5 Delivery & Completion

1. User verifies delivery via PoD (`APP_USER_DSH_ORDER_POD`) using `POST /api/dls/orders/{order_id}/pod/verify` for platform delivery channel.
2. User completes pickup via `APP_USER_DSH_PICKUP_CLOSE` using `POST /api/dls/orders/{order_id}/pickup/close` with 6-digit code for pickup channel.
3. User provides feedback via `POST /api/dls/orders/{order_id}/feedback` (`APP_USER_DSH_ORDER_FEEDBACK`) rating store/captain.
4. User views receipt via `GET /api/dls/orders/{order_id}/receipt` (`APP_USER_DSH_ORDER_RECEIPT`).

### 2.2 AMN (Safe Taxi) Journey

1. User requests quote via `POST /api/amn/quotes` with pickup and dropoff locations.
2. User creates trip via `POST /api/amn/trips` with quote acceptance.
3. User tracks trip via `GET /api/amn/trips/:trip_id`.
4. User views rides list via `GET /api/amn/rides` (`APP_USER_AMN_RIDES`).
5. User completes trip and processes payment via WLT integration.

### 2.3 ARB (Escrow & Bookings) Journey

1. User browses offers via `GET /api/arb/offers`.
2. User creates booking via `POST /api/arb/bookings` with deposit hold.
3. User views bookings list via `GET /api/arb/bookings` (`APP_USER_ARB_BOOKINGS`).
4. User manages booking and communicates via encrypted chat.
5. User tracks escrow status and receives refunds based on policies.

### 2.4 Other Services

- **KWD**: Search and view job listings via `GET /api/kawader/search`, create listings via `POST /api/kawader`, report abuse via `POST /api/kawader/{id}/report`.
- **SND**: Create instant help or specialized service requests via `POST /api/snd/requests`.
- **MRF**: File lost and found reports via `POST /api/mrf/reports`.
- **ESF**: Create blood donation requests via `POST /api/esf/requests` and match with donors.
- **KNZ**: Browse marketplace listings via `GET /api/knz/listings` (read-only on web, full CRUD on mobile).

## 3. Guards & Policies

- **Idempotency-Key** enforced on all state-changing calls (orders, bookings, trips, requests).
- **Step-Up** required for sensitive operations (payment confirmations, bank updates).
- **Privacy**: All chat payloads encrypted (AES-GCM); phone numbers masked; no raw PII in logs.
- **Webhooks**: All inbound endpoints enforce HMAC signatures with ≤300s replay window.
- **Payment**: All payments flow through WLT service with proper ledger entries.

## 4. Screens / APIs / Interfaces

### 4.1 Complete Screen Catalog

#### 4.1.1 Global Screens

| Screen ID       | Service | Description      | Endpoint |
| --------------- | ------- | ---------------- | -------- |
| `APP_USER_HOME` | GLOBAL  | Main home screen | `[TBD]`  |

#### 4.1.2 DSH (Delivery & Shopping) Screens

| Screen ID                         | Service | Description                    | Endpoint                                   |
| --------------------------------- | ------- | ------------------------------ | ------------------------------------------ |
| `APP_USER_DSH_CHECKOUT`           | DSH     | Checkout flow                  | `/api/dls/orders`                          |
| `APP_USER_DSH_CHECKOUT_SLOT`      | DSH     | Dark-Store slot selection      | `/api/dls/orders/{order_id}`               |
| `APP_USER_DSH_QUOTES`             | DSH     | Initial pricing quote          | `/api/dls/quotes`                          |
| `APP_USER_DSH_ORDERS`             | DSH     | Orders list with pagination    | `/api/dls/orders`                          |
| `APP_USER_DSH_ORDER_DETAILS`      | DSH     | Order details and tracking     | `/api/dls/orders/{order_id}`               |
| `APP_USER_DSH_ORDER_CANCEL`       | DSH     | Order cancellation             | `/api/dls/orders/{order_id}/cancel`        |
| `APP_USER_DSH_ORDER_TRACKING`     | DSH     | Real-time order tracking       | `/api/dls/orders/{order_id}/tracking`      |
| `APP_USER_DSH_ORDER_RECEIPT`      | DSH     | Order receipt/invoice          | `/api/dls/orders/{order_id}/receipt`       |
| `APP_USER_DSH_ORDER_FEEDBACK`     | DSH     | Order feedback and rating      | `/api/dls/orders/{order_id}/feedback`      |
| `APP_USER_DSH_ORDER_CHAT`         | DSH     | Encrypted chat messages        | `/api/dls/orders/{order_id}/chat/messages` |
| `APP_USER_DSH_CHAT_READ_ACK`      | DSH     | Chat read acknowledgment       | `/api/dls/orders/{order_id}/chat/read-ack` |
| `APP_USER_DSH_ORDER_CHAT_SEND`    | DSH     | Send chat message              | `/api/dls/orders/{order_id}/chat/messages` |
| `APP_USER_DSH_ORDER_POD`          | DSH     | Proof-of-delivery verification | `/api/dls/orders/{order_id}/pod/verify`    |
| `APP_USER_DSH_PICKUP_CLOSE`       | DSH     | Pickup close with 6-digit code | `/api/dls/orders/{order_id}/pickup/close`  |
| `APP_USER_DSH_ORDER_TIMELINE`     | DSH     | Order timeline/events          | `/api/dls/orders/{order_id}/timeline`      |
| `APP_USER_DSH_ORDER_ETA`          | DSH     | Estimated time of arrival      | `/api/dls/orders/{order_id}/eta`           |
| `APP_USER_DSH_CANCEL_REASONS`     | DSH     | Cancel reasons list            | `/api/dls/cancel-reasons`                  |
| `APP_USER_DSH_REORDER`            | DSH     | Reorder from previous order    | `/api/dls/orders/{order_id}/reorder`       |
| `APP_USER_DSH_SLOTS`              | DSH     | Available Dark-Store slots     | `/api/dls/slots`                           |
| `APP_USER_DSH_PARTNER_POLICIES`   | DSH     | Partner store policies         | `/api/dls/partners/{partner_id}/policies`  |
| `APP_USER_DSH_PARTNER_ZONES`      | DSH     | Partner coverage zones         | `/api/dls/partners/{partner_id}/zones`     |
| `APP_USER_DSH_ORDER_NOTES`        | DSH     | Order notes view               | `/api/dls/orders/{order_id}/notes`         |
| `APP_USER_DSH_ORDER_NOTES_CREATE` | DSH     | Create order note              | `/api/dls/orders/{order_id}/notes`         |
| `APP_USER_DSH_ORDER_UPDATE`       | DSH     | Update order details           | `/api/dls/orders/{order_id}`               |

#### 4.1.3 WLT (Wallet & Ledger) Screens

| Screen ID                      | Service | Description             | Endpoint                               |
| ------------------------------ | ------- | ----------------------- | -------------------------------------- |
| `APP_USER_WLT_PAYMENT_INTENT`  | WLT     | Payment intent creation | `/api/wlt/intents`                     |
| `APP_USER_WLT_PAYMENT_STATUS`  | WLT     | Payment status polling  | `/api/wlt/intents/{intent_id}`         |
| `APP_USER_WLT_PAYMENT_CONFIRM` | WLT     | Payment confirmation    | `/api/wlt/intents/{intent_id}/confirm` |
| `APP_USER_WLT_WALLET`          | WLT     | Wallet and payments     | `[TBD]`                                |

#### 4.1.4 AMN (Safe Taxi) Screens

| Screen ID            | Service | Description     | Endpoint         |
| -------------------- | ------- | --------------- | ---------------- |
| `APP_USER_AMN_RIDES` | AMN     | Safe taxi rides | `/api/amn/rides` |

#### 4.1.5 ARB (Escrow & Bookings) Screens

| Screen ID               | Service | Description     | Endpoint            |
| ----------------------- | ------- | --------------- | ------------------- |
| `APP_USER_ARB_BOOKINGS` | ARB     | Escrow bookings | `/api/arb/bookings` |

_Full catalog available in `apps/user/SCREENS_CATALOG.csv`._

### 4.2 API Surface

The application integrates with all platform services. Refer to individual service documentation in `docs/explainar/services/` for complete API details.

## 5. Service Classification & Smart Engine

### 5.1 Service Classification (Primary/Secondary/Rare)

The application uses a three-tier service classification system powered by the Smart Engine:

#### Primary Services (الخدمات الأساسية)

These are the core, high-frequency services prominently displayed on the home screen:

- **DSH** (Delivery & Shopping) — Primary e-commerce and delivery service
- **WLT** (Wallet & Ledger) — Primary payment and financial service
- **KNZ** (Marketplace) — Primary marketplace service

**Characteristics**:

- Always visible on home screen
- Featured in service cards
- High priority in search results
- Full feature set enabled by default

#### Secondary Services (الخدمات الثانوية)

These are important but less frequently used services:

- **AMN** (Safe Taxi) — Secondary transportation service
- **ARB** (Escrow & Bookings) — Secondary booking service
- **KWD** (Jobs Platform) — Secondary job board service

**Characteristics**:

- Visible in services tab
- Accessible from home screen service cards
- Moderate priority in search results
- Configurable feature modes

#### Rare Services (الخدمات النادرة)

These are specialized services accessed on-demand:

- **SND** (On-demand Services) — Specialized help requests
- **MRF** (Lost & Found) — Incident reporting
- **ESF** (Blood Donation) — Emergency blood matching

**Characteristics**:

- Accessible via search or deep links
- Lower priority in search results
- Full feature set but less prominent UI
- Contextual access (e.g., emergency situations)

### 5.2 Smart Engine Integration

The Smart Engine (`SmartEngineService`) provides intelligent ranking and personalization across three levels:

1. **Service Level**: Primary/Secondary/Rare classification determines service visibility and priority
2. **Category Level**: Within DSH, categories are ranked (restaurants, supermarkets, fashion, etc.)
3. **Item Level**: Stores, products, listings, and offers are ranked based on relevance, favorites, and trends

**Smart Features**:

- Personalized service ordering based on user behavior
- Category ranking within services (e.g., DSH categories)
- Item ranking with relevance scoring
- Smart suggestions based on:
  - User favorites
  - Recent usage
  - Location (region/city)
  - Tags (TRENDING, NEW, SEASONAL, HIGH_VALUE)
  - Time of day

### 5.3 Service Discovery & Navigation

Services are organized and presented based on their classification:

- **Home Screen**: Primary services prominently displayed with service cards
- **Services Tab**: All services organized by classification (Primary → Secondary → Rare)
- **Search Results**: Services ranked by classification and relevance
- **Deep Links**: Direct navigation to any service regardless of classification

## 6. Integrations & Runtime Variables

- **Primary services**: `DSH`, `KNZ`, `AMN`, `KWD`, `SND`, `MRF`, `ESF`, `ARB`, `WLT`.
- **Supporting services**: `IDENTITY` (authentication, profile), `NOTIFICATIONS` (push notifications).
- **Runtime examples**:
  - `VAR_WEBAPP_FEATURE_DSH_MODE` — DSH mode (default: "full").
  - `VAR_WEBAPP_FEATURE_KNZ_MODE` — KNZ mode (default: "browse_only").
  - `VAR_WEBAPP_FEATURE_AMN_MODE` — AMN mode (default: "info_only").
  - `VAR_WEBAPP_FEATURE_KWD_MODE` — KWD mode (default: "search_details_only").
  - `VAR_UI_SMART_SUGGESTIONS_ENABLED` — Smart suggestions enabled.
  - `VAR_UI_SMART_RESUME_ENABLED` — Smart resume enabled.
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 7. Service Modes (Web App)

The web app (`app.bthwani.com`) mirrors APP-USER functionality with configurable service modes:

- **DSH**: `full` — Full checkout + tracking flows.
- **KNZ**: `browse_only` — Catalog browse/details only.
- **AMN**: `info_only` — Shows marketplace info screens.
- **KWD**: `search_details_only` — Search + detail views, no CRUD.
- **MRF**: `full` — Full incident filing and chat.
- **ESF**: `full` — Full enablement (request + matching).
- **SND**: `full` — Specialist assistance.
- **ARB**: `full` — Booking + 6-digit lock workflows.
- **WLT**: `embedded_only` — Only within DSH checkout flows.

## 8. Navigation & User Experience

### 8.1 Bottom Tab Bar Navigation

The application features a bottom tab bar (`nav.user_bottom_tabs`) with the following tabs:

| Tab ID         | Icon       | Label (AR)   | Label (EN) | Description                            |
| -------------- | ---------- | ------------ | ---------- | -------------------------------------- |
| `tab.home`     | home       | الرئيسية     | Home       | Service discovery and quick access     |
| `tab.orders`   | list-check | الطلبات      | Orders     | Active and historical transactions     |
| `tab.wallet`   | wallet     | المحفظة      | Wallet     | Balance, transactions, payment methods |
| `tab.services` | grid       | الخدمات      | Services   | All platform services access           |
| `tab.profile`  | user       | الملف الشخصي | Profile    | User settings, preferences, support    |

### 8.2 Top App Bar

The top app bar (`ui.user_app_bar`) includes:

- **Left**: Service filter chips (All/DSH/AMN/ARB/KNZ/KWD/SND/MRF/ESF)
- **Center**: Title + Search bar (unified search across services)
- **Right**: Notifications icon, Cart icon (for DSH), Profile menu

### 8.3 Home Screen Features

The home screen (`APP_USER_HOME`) provides:

- **Service Cards**: Quick access to all platform services (DSH, KNZ, AMN, KWD, SND, MRF, ESF, ARB)
- **Featured Categories**: DSH categories with featured items
- **Quick Actions**: Recent orders, active bookings, pending payments
- **Promotions**: Active campaigns and offers
- **Search Bar**: Unified search across all services
- **Notifications**: Push notification center access

### 8.4 Service-Specific Flows

Each service has dedicated flows accessible from:

- **Home Screen**: Service cards and quick access buttons
- **Services Tab**: Service-specific entry points
- **Deep Links**: Direct navigation to service screens
- **Notifications**: Push notification actions

### 8.5 Order Management Features

- **Order List**: Paginated list with filters (status, date range, service)
- **Order Details**: Complete order information with timeline
- **Real-time Tracking**: Live location updates and status changes
- **Chat Integration**: Encrypted chat with partners/captains
- **Quick Actions**: Reorder, cancel, update, feedback
- **Receipt Management**: View and share receipts

### 8.6 Wallet Integration

- **Balance Display**: Real-time wallet balance
- **Transaction History**: Paginated transaction list
- **Payment Methods**: Saved payment methods management
- **Payment Flow**: Integrated payment intent creation and confirmation
- **Settlements**: View settlement history (for partners)

### 8.7 Design System

- **Theme**: GOV-02 tokens, RTL support (Arabic + English)
- **Typography**: Legible fonts with numeric emphasis
- **Motion**: Light transitions with progress feedback
- **Accessibility**: High contrast, screen reader support
- **Localization**: Full Arabic/English support with Asia/Aden timezone

## 9. Features & Capabilities

### 9.1 DSH Features

- **Category Browsing**: Browse 7 DSH categories (restaurants, supermarkets, fruits & veggies, fashion, sweets, global stores, quick tasks)
- **Quote System**: Request initial pricing quotes before checkout
- **Slot Selection**: Choose Dark-Store delivery slots
- **Order Management**: Full CRUD operations on orders (create, read, update, cancel, reorder)
- **Real-time Tracking**: Live order tracking with ETA updates
- **Timeline View**: Complete order event timeline
- **Encrypted Chat**: Secure communication with partners and captains
- **Order Notes**: Add and view order notes
- **PoD Verification**: Proof-of-delivery for platform deliveries
- **Pickup Codes**: 6-digit code verification for pickup orders
- **Feedback System**: Rate stores and captains
- **Receipt Management**: View and share receipts
- **Partner Information**: View store policies and coverage zones

### 9.2 Payment Features

- **Payment Intents**: Create payment intents for orders
- **Payment Status**: Poll payment status with requires_action handling
- **Payment Confirmation**: Confirm payments with PSP responses
- **Wallet Integration**: View balance and transaction history
- **Multiple Payment Methods**: Support for various payment providers

### 9.3 Service Integration

- **Unified Search**: Search across all services (DSH, KNZ, KWD, etc.)
- **Service Discovery**: Quick access to all platform services
- **Cross-Service Navigation**: Seamless navigation between services
- **Service-Specific Features**: Full feature set per service mode

### 9.4 Notification System

- **Push Notifications**: Real-time push notifications for orders, bookings, rides
- **In-App Notifications**: Notification center with unread counts
- **Notification Actions**: Quick actions from notifications (view order, accept booking, etc.)

### 9.5 User Profile Features

- **Profile Management**: Edit profile information
- **Settings**: App settings and preferences
- **Language Selection**: Switch between Arabic and English
- **Support Access**: Contact support and view help center
- **Account Management**: Manage account settings and security

## 10. Runtime Variables & Configuration

### 9.1 Service Mode Variables

- `VAR_WEBAPP_FEATURE_DSH_MODE` — DSH mode (default: "full")
- `VAR_WEBAPP_FEATURE_KNZ_MODE` — KNZ mode (default: "browse_only")
- `VAR_WEBAPP_FEATURE_AMN_MODE` — AMN mode (default: "info_only")
- `VAR_WEBAPP_FEATURE_KWD_MODE` — KWD mode (default: "search_details_only")
- `VAR_WEBAPP_FEATURE_MRF_MODE` — MRF mode (default: "full")
- `VAR_WEBAPP_FEATURE_ESF_MODE` — ESF mode (default: "full")
- `VAR_WEBAPP_FEATURE_SND_MODE` — SND mode (default: "full")
- `VAR_WEBAPP_FEATURE_ARB_MODE` — ARB mode (default: "full")
- `VAR_WEBAPP_FEATURE_WLT_MODE` — WLT mode (default: "embedded_only")

### 9.2 DSH-Specific Variables

- `VAR_DLS_PARTNER_ACCEPT_SLA_MIN` — Partner accept SLA (default: 4 minutes)
- `VAR_DLS_DEFAULT_DELIVERY_MODE` — Default delivery mode
- `VAR_CHAT_RETENTION_DAYS` — Chat retention period
- `VAR_DSH_CAT_RESTAURANTS_ENABLED` — Restaurants category enabled
- `VAR_DSH_CAT_QUICK_TASK_ENABLED` — Quick tasks category enabled

### 9.3 Notification Variables

- `VAR_NOTIF_DEDUP_WINDOW_MIN` — Notification deduplication window (default: 10 minutes)
- `VAR_NOTIF_CHANNEL_PRIORITY` — Channel priority (default: ["wa","sms","push"])

All runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 11. References & Review

- Sources: `apps/user/SCREENS_CATALOG.csv`, `oas/services/*/openapi.yaml`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Screen catalog: `apps/user/SCREENS_CATALOG.csv` (32 screens documented).
- Service documentation: `docs/explainar/services/` for complete API details.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
