# WEB-APP - Customer Web Application

## 1. Overview

The **WEB-APP** (`app.bthwani.com`) is the browser-based Progressive Web Application (PWA) that mirrors the APP-USER mobile application functionality. It provides access to all platform services with configurable service modes controlled via runtime variables. The web app enables customers to browse, order, track, and manage transactions through a web interface while maintaining feature parity with the mobile app.

## 2. Core Journeys

### 2.1 DSH (Delivery & Shopping) Journey

1. User browses categories and products via home screen.
2. User requests quote via `POST /api/dls/quotes` for Dark-Store slots.
3. User creates order via `POST /api/dls/orders` with `Idempotency-Key` and payment selection.
4. User tracks order via `GET /api/dls/orders/{order_id}` and tracking endpoints.
5. User communicates via encrypted chat (`/api/dls/orders/{order_id}/chat/messages`).
6. User verifies delivery via PoD (`/api/dls/orders/{order_id}/pod/verify`) or pickup close (`/api/dls/orders/{order_id}/pickup/close`).
7. User provides feedback via `POST /api/dls/orders/{order_id}/feedback`.
8. User views receipt via `GET /api/dls/orders/{order_id}/receipt`.

### 2.2 AMN (Safe Taxi) Journey

1. User views marketplace info screens (info_only mode).
2. User redirected to native app for full functionality where needed.
3. User can view ride information and pricing.

### 2.3 ARB (Escrow & Bookings) Journey

1. User browses offers via `GET /api/arb/offers`.
2. User creates booking via `POST /api/arb/bookings` with deposit hold (Step-Up enforced).
3. User manages booking and communicates via encrypted chat.
4. User tracks escrow status and receives refunds based on policies.

### 2.4 Other Services

- **KNZ**: Browse catalog and view details (browse_only mode, sensitive categories view-only).
- **KWD**: Search and view job listings (search_details_only mode, no CRUD actions).
- **SND**: Create instant help or specialized service requests (full mode).
- **MRF**: File lost and found reports (full mode).
- **ESF**: Create blood donation requests and match with donors (full mode).
- **WLT**: Embedded only within DSH checkout flows (embedded_only mode).

## 3. Guards & Policies

- **JWT + CSRF**: Enforced for unsafe operations (shared session with mobile app).
- **Idempotency-Key**: Required on all POST/PATCH flows.
- **Step-Up**: Required for sensitive actions (settlements, payouts, ARB bookings).
- **Privacy**: All chat payloads encrypted (AES-GCM); phone numbers masked; no raw PII in logs.
- **Webhooks**: All inbound endpoints enforce HMAC signatures with ≤300s replay window.
- **Payment**: All payments flow through WLT service with proper ledger entries.
- **CORS**: Only allows `https://app.bthwani.com`.
- **Sessions**: JWT (HttpOnly, SameSite=Lax) + CSRF token for non-GET operations.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Screen ID                   | Service | Description                | Endpoint                                   |
| --------------------------- | ------- | -------------------------- | ------------------------------------------ |
| `WEBAPP_HOME`               | GLOBAL  | Main home screen           | `[TBD]`                                    |
| `WEBAPP_DSH_CHECKOUT`       | DSH     | Checkout flow              | `/api/dls/orders`                          |
| `WEBAPP_DSH_ORDERS`         | DSH     | Orders list                | `/api/dls/orders`                          |
| `WEBAPP_DSH_ORDER_DETAILS`  | DSH     | Order details and tracking | `/api/dls/orders/{order_id}`               |
| `WEBAPP_DSH_ORDER_TRACKING` | DSH     | Real-time tracking         | `/api/dls/orders/{order_id}/tracking`      |
| `WEBAPP_DSH_ORDER_CHAT`     | DSH     | Encrypted chat             | `/api/dls/orders/{order_id}/chat/messages` |
| `WEBAPP_WLT_PAYMENT_INTENT` | WLT     | Payment intent creation    | `/api/wlt/intents`                         |
| `WEBAPP_WLT_PAYMENT_STATUS` | WLT     | Payment status polling     | `/api/wlt/intents/{intent_id}`             |
| `WEBAPP_AMN_INFO`           | AMN     | Marketplace info screens   | `[TBD]`                                    |
| `WEBAPP_ARB_BOOKINGS`       | ARB     | Escrow bookings            | `/api/arb/bookings`                        |
| `WEBAPP_KNZ_BROWSE`         | KNZ     | Catalog browse             | `/api/knz/listings`                        |
| `WEBAPP_KWD_SEARCH`         | KWD     | Job search                 | `/api/kawader/search`                      |

_Full catalog aligned with `apps/user/SCREENS_CATALOG.csv`._

### 4.2 API Surface

The application integrates with all platform services via `api.bthwani.com`. Refer to individual service documentation in `docs/explainar/services/` for complete API details.

## 5. Service Integration & Smart Engine

### 5.1 Service Integration

WEB-APP integrates with all platform services:

- **Primary Services**: DSH, WLT, ARB, KNZ, AMN (full or partial access based on mode)
- **Secondary Services**: KWD, SND, ESF, MRF (full or partial access based on mode)
- **Service Classification**: All services visible with configurable modes

### 5.2 Smart Engine Integration

- **Service Ranking**: Services ranked by user preferences and usage
- **Personalization**: Service recommendations and suggestions personalized
- **Mode-Based Features**: Features enabled/disabled based on service mode

## 6. Navigation & User Experience

### 6.1 Main Navigation

- **Home Tab**: Service discovery and quick access
- **Services Tab**: Service-specific navigation (DSH, KNZ, AMN, etc.)
- **Orders Tab**: Order management and tracking
- **Profile Tab**: User profile and settings

### 6.2 Top App Bar

- **Title**: Context-aware title (Home, Services, Orders, Profile)
- **Actions**: Quick actions (search, filter, refresh)
- **Notifications**: Notification badge with unread count

### 6.3 Home Screen Features

- **Service Cards**: Service cards with mode-based CTAs
- **Quick Access**: Quick access to recent orders and favorites
- **Notifications**: Recent notifications and alerts
- **Search**: Unified search across all services

### 6.4 Design System

- **RTL Support**: Full RTL support for Arabic interface
- **Theme**: Light/dark theme support
- **Accessibility**: WCAG AA compliance
- **Localization**: Arabic and English support
- **Responsive**: Responsive design for all devices

## 7. Features & Capabilities

### 7.1 DSH Features

- **Full Mode**: Complete checkout, tracking, chat, PoD verification
- **Category Browsing**: Browse 7 main categories (restaurants, supermarkets, etc.)
- **Order Management**: Order tracking, chat, feedback, receipt viewing
- **Payment Integration**: Embedded WLT payment intents

### 7.2 Other Service Features

- **KNZ (browse_only)**: Catalog browsing, view-only for sensitive categories
- **AMN (info_only)**: Marketplace info screens, native app redirect
- **KWD (search_details_only)**: Search and view job listings, no CRUD
- **SND (full)**: Create instant help and specialized requests
- **MRF (full)**: File lost and found reports with chat
- **ESF (full)**: Create blood donation requests and matching
- **ARB (full)**: Booking creation with escrow and 6-digit lock
- **WLT (embedded_only)**: Payment intents within DSH checkout

### 7.3 PWA Features

- **Installable**: Browser install prompts and PWA installation
- **Offline Support**: Cached order list and offline functionality
- **Push Notifications**: Real-time push notifications
- **Service Worker**: App-like experience with service worker

### 7.4 Deep Links & Handoff

- **Deep Links**: Deep link handling from marketing site
- **Session Flow**: Guest user authentication and routing
- **Native App Handoff**: PWA prompts for native app installation
- **UTM Tracking**: UTM parameter preservation for analytics

## 8. Integrations & Runtime Variables

- **Primary services**: `DSH`, `KNZ`, `AMN`, `KWD`, `SND`, `MRF`, `ESF`, `ARB`, `WLT`.
- **Shared services**: `RuntimeVariablesService`, `SmartEngineService`, `UnifiedSearchService`, `BannerService`.
- **Supporting services**: `IDENTITY` (authentication, profile), `NOTIFICATIONS` (push notifications).
- **Runtime examples**:
  - `VAR_WEBAPP_FEATURE_DSH_MODE` — DSH mode (default: "full").
  - `VAR_WEBAPP_FEATURE_KNZ_MODE` — KNZ mode (default: "browse_only").
  - `VAR_WEBAPP_FEATURE_AMN_MODE` — AMN mode (default: "info_only").
  - `VAR_WEBAPP_FEATURE_KWD_MODE` — KWD mode (default: "search_details_only").
  - `VAR_WEBAPP_FEATURE_MRF_MODE` — MRF mode (default: "full").
  - `VAR_WEBAPP_FEATURE_ESF_MODE` — ESF mode (default: "full").
  - `VAR_WEBAPP_FEATURE_SND_MODE` — SND mode (default: "full").
  - `VAR_WEBAPP_FEATURE_ARB_MODE` — ARB mode (default: "full").
  - `VAR_WEBAPP_FEATURE_WLT_MODE` — WLT mode (default: "embedded_only").
  - `VAR_WEBAPP_ROBOTS_INDEX` — Robots indexing control (default: "noindex").
  - `VAR_WEBAPP_DEEPLINKS_ENABLED` — Deep links enabled (default: true).
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. Service Modes

The web app supports configurable service modes controlled via runtime variables:

### Mode Types

- **full**: Full interaction (create/update/track) — mirrors mobile app behavior.
- **browse_only**: Read-only UI, browse and view details only.
- **info_only**: Shows marketplace info screens, redirects to native app where needed.
- **search_details_only**: Enables search + detail views, no CRUD actions.
- **embedded_only**: Only exposed within specific flows (e.g., WLT in DSH checkout).
- **hidden**: Surface not rendered; deep links redirect to `/install` or CTA.

### Default Service Modes

| Service  | Default Mode        | Notes                                                                 |
| -------- | ------------------- | --------------------------------------------------------------------- |
| DSH v2.2 | full                | Full checkout + tracking flows. Mirrors mobile app behaviour.         |
| KNZ v1.1 | browse_only         | Catalog browse/details only; sensitive categories are view-only.      |
| AMN v1.0 | info_only           | Shows marketplace info screens; redirects to native app where needed. |
| KWD v1.0 | search_details_only | Enables search + detail views, no CRUD actions.                       |
| MRF v2.0 | full                | Full incident filing and internal chat.                               |
| ESF v1.2 | full                | Full enablement (request + matching).                                 |
| SND v1.0 | full                | Specialist assistance; no internal billing.                           |
| ARB v2.0 | full                | Booking + 6-digit lock workflows (step-up enforced).                  |
| WLT v1.0 | embedded_only       | Only exposed within DSH checkout flows.                               |

## 7. Runtime Control & Governance

### Runtime Variable Control

- Operations flip runtime variables via the control panel.
- PWA reads variables at boot to decide which components to expose.
- Any change is logged via `webapp.service_mode_change` event.
- **Governance rule**: لا يتم تعطيل أو تفعيل أي خدمة على الويب-آب من خلال الكود أو تعديل ثابت؛ كل التغييرات تتم حصريًا عبر مفاتيح التشغيل `VAR_WEBAPP_FEATURE_*` لضمان التوافق مع تطبيق المستخدم.

### Feature Parity

The web app maintains feature parity with APP-USER mobile application:

- Same API endpoints and data models.
- Same security and privacy controls.
- Same service modes and runtime behavior.
- Same user journeys and workflows.

## 8. Deep Links & Session Flow

### Deep Link Handling

1. Marketing site points to deep routes (e.g., `https://app.bthwani.com/dsh?utm=site`).
2. Guest users land on sign-in/register and return to the original route once authenticated.
3. Logged-in users reach the target screen immediately.
4. Native app hand-off is offered through PWA prompts (`/.well-known`, install banners).

### Session Management

- Shared session with mobile app (JWT tokens).
- HttpOnly cookies with SameSite=Lax.
- CSRF tokens for non-GET operations.
- Session timeout and refresh handling.

## 9. PWA Features

### Progressive Web App

- Installable via browser prompts.
- Offline support for cached order list.
- Push notifications support.
- App-like experience with service worker.

### Native App Integration

- Deep links to native app where appropriate.
- PWA prompts for native app installation.
- Hand-off flows for services requiring native features.

## 10. Performance & UX

### Performance Budgets

- LCP ≤ 2000 ms (Largest Contentful Paint).
- INP ≤ 150 ms (Interaction to Next Paint).
- CLS ≤ 0.10 (Cumulative Layout Shift).

### UX Features

- Selective SSR for entry/landing pages.
- Hydrated SPA for main application.
- RTL support (Arabic + English).
- Asia/Aden timezone handling.
- Responsive design for all devices.

## 11. SEO & Indexing

### SEO Configuration

- Robots: `noindex` by default (controlled via `VAR_WEBAPP_ROBOTS_INDEX`).
- Canonical tags for cross-canonical with marketing site.
- Structured data (Schema.org) for service pages.
- Deep-link metadata (`al:web:url`, `web-app-capable`) for PWA detection.

## 12. References & Review

- Sources: `web/webapp/SERVICES.md`, `web/README.md`, `apps/user/SCREENS_CATALOG.csv`, `oas/services/*/openapi.yaml`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Service modes: `web/webapp/SERVICES.md`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
