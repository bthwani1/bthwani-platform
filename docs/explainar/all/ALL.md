# BThwani Platform - Complete Documentation

**Complete documentation index for all services, applications, dashboards, and web surfaces.**

---

## Table of Contents

### Part I: Services (SRV-\*)

1. [SRV-DSH - Delivery & Shopping](#srv-dsh)
2. [SRV-WLT - Wallet & Ledger](#srv-wlt)
3. [SRV-ARB - Escrow & Bookings](#srv-arb)
4. [SRV-KNZ - Marketplace](#srv-knz)
5. [SRV-AMN - Safe Taxi](#srv-amn)
6. [SRV-KWD - Jobs Platform](#srv-kwd)
7. [SRV-SND - On-demand Services](#srv-snd)
8. [SRV-MRF - Lost & Found](#srv-mrf)
9. [SRV-ESF - Blood Donation](#srv-esf)

### Part II: Applications (APP-\*)

10. [APP-USER - User Mobile Application](#app-user)
11. [APP-PARTNER - Partner Mobile Application](#app-partner)
12. [APP-CAPTAIN - Captain Mobile Application](#app-captain)
13. [APP-FIELD - Field Operations Application](#app-field)

### Part III: Dashboards (DASH-\*)

14. [DASH-ADMIN - Admin Dashboard](#dash-admin)
15. [DASH-OPS - Operations Dashboard](#dash-ops)
16. [DASH-FINANCE - Finance Dashboard](#dash-finance)
17. [DASH-SUPPORT - Support Dashboard](#dash-support)
18. [DASH-MARKETING - Marketing Dashboard](#dash-marketing)
19. [DASH-FLEET - Fleet Dashboard](#dash-fleet)
20. [DASH-PARTNER - Partner Dashboard](#dash-partner)
21. [DASH-BI - Business Intelligence Dashboard](#dash-bi)
22. [DASH-SSOT - SSOT Control Dashboard](#dash-ssot)
23. [DASH-SECURITY - Security Dashboard](#dash-security)

### Part IV: Web Surfaces (WEB-\*)

24. [WEB-APP - Customer Web Application](#web-app)
25. [WEB-WEBSITE - Marketing Website](#web-website)

---

## Part I: Services

<a name="srv-dsh"></a>

# SRV-DSH - Delivery & Shopping

_See full documentation: [`docs/explainar/services/srv-dsh.md`](../services/srv-dsh.md)_

## 1. Overview

The **DSH** service (Delivery & Shopping) is the core delivery and shopping platform service for the BThwani platform. It handles order management, partner onboarding, captain dispatch, customer interactions, product catalog management (MPC & Store Listings), and integrates with WLT for payments and NOTIFICATIONS for partner reminders.

## 2. Core Journeys

### 2.1 Order Lifecycle

1. Customer creates order via `POST /api/dls/orders` with `Idempotency-Key`.
2. Partner receives notification and accepts/rejects via `POST /api/dls/partner/orders/{order_id}/accept`.
3. Partner marks order as ready via `POST /api/dls/partner/orders/{order_id}/ready`.
4. Captain picks up order and delivers via `POST /api/dls/captain/orders/{order_id}/delivered`.
5. Customer verifies delivery via PoD or pickup close.

### 2.2 Partner Onboarding

1. Field agent initiates partner intake via `POST /api/dls/partners/intake`.
2. Partner submits identity and KYC documents.
3. Partner creates store and sets coverage zones.
4. Partner submits for review and admin approves.

## 3. Guards & Policies

- **Idempotency-Key**: Required on all state-changing calls.
- **Step-Up**: Required for critical approvals (partner approval, financial operations).
- **Privacy**: All chat payloads encrypted (AES-GCM); phone numbers masked.
- **Webhooks**: HMAC signatures with ≤300s replay window.
- **SLA Monitoring**: Partner accept SLA (default: 4 minutes).

## 4. Service Classification & Smart Engine

- **Classification**: Primary Service (full integration with Smart Engine)
- **Smart Engine**: Service ranking, category ranking, item ranking with personalization
- **Unified Search**: DSH Search Adapter for categories, stores, products
- **Banner Service**: DSH-specific banners for promotions and featured content

## 5. Integrations

- **WLT**: Payment processing, escrow holds, settlements.
- **NOTIFICATIONS**: Partner reminders (T+4m), escalations (T+6m).
- **IDENTITY**: Authentication, profile management.
- **Shared Services**: UnifiedSearchService, SmartEngineService, BannerService, RuntimeVariablesService.

---

<a name="srv-wlt"></a>

# SRV-WLT - Wallet & Ledger

_See full documentation: [`docs/explainar/services/srv-wlt.md`](../services/srv-wlt.md)_

## 1. Overview

The **WLT** service is the core financial service providing unified wallet and ledger operations for all BThwani platform financial transactions. It orchestrates double-entry ledger system with Wallet=Ledger invariants, internal wallet accounts, escrow/hold management, payment provider orchestration, settlement batching with dual-sign approvals, and COD policy enforcement.

## 2. Core Journeys

### 2.1 Account Management

1. User/Partner/Captain accounts are created automatically on first transaction.
2. Accounts can be queried via `GET /wallet/accounts/{account_id}/balance`.
3. Internal transfers between accounts via `POST /wallet/transfers` with `Idempotency-Key`.

### 2.2 Payment Processing

1. Payment intents created via `POST /pay/intents` for upstream orders.
2. Provider charges executed via `POST /pay/providers/{provider_code}/charge`.
3. Provider webhooks received with HMAC verification (≤300s replay window).

### 2.3 Settlements

1. Settlement batches created via `POST /wallet/settlements` with Step-Up.
2. Batches require dual-sign approval via `POST /wallet/settlements/{batch_id}/approve`.
3. Export generation for bank files with privacy levels.

## 3. Service Classification & Smart Engine

- **Classification**: Primary Service (core financial service)
- **Smart Engine**: Financial operations prioritized and personalized
- **Payment Intent Flow**: Payment intent creation, status polling, confirmation workflow

## 4. Guards & Policies

- **Idempotency-Key**: Required on all state-changing calls.
- **Step-Up**: Required for settlements, config updates, unmasked exports.
- **Dual-Sign**: All bank payouts require dual-sign (two distinct accounts).
- **Wallet=Ledger**: Internal ledger is single source of truth.

---

<a name="srv-arb"></a>

# SRV-ARB - Escrow & Bookings

_See full documentation: [`docs/explainar/services/srv-arb.md`](../services/srv-arb.md)_

## 1. Overview

The **ARB** service (عربون) handles deposits and bookings for service offers with escrow management. It provides offer management with deposit rules, booking system with escrow holds, escrow engine (hold/release/refund/forfeit), encrypted chat between customers and partners, admin configuration and metrics, and support dispute resolution.

## 2. Core Journeys

### 2.1 Offer Management (Partner)

1. Partner creates offer via `POST /api/arb/offers` with deposit rules.
2. Partner updates offer via `PATCH /api/arb/offers/:offer_id`.
3. Offers are searchable via `GET /api/arb/offers` (public).

### 2.2 Booking Creation (Customer)

1. Customer searches offers via `GET /api/arb/offers`.
2. Customer creates booking via `POST /api/arb/bookings` with deposit hold.
3. Escrow hold automatically created via WLT integration.

## 3. Service Classification & Smart Engine

- **Classification**: Secondary Service (full integration with Smart Engine)
- **Smart Engine**: Offer ranking, category ranking with personalization
- **Unified Search**: ARB Search Adapter for offers and bookings
- **Banner Service**: ARB-specific banners for promotions

## 4. Guards & Policies

- **Idempotency-Key**: Required on all state-changing calls.
- **Step-Up**: Required for critical approvals.
- **Privacy**: Chat payloads encrypted (AES-256-GCM); phone numbers masked.
- **Webhooks**: HMAC signatures with ≤300s replay window.

---

<a name="srv-knz"></a>

# SRV-KNZ - Marketplace

_See full documentation: [`docs/explainar/services/srv-knz.md`](../services/srv-knz.md)_

## 1. Overview

The **KNZ** service handles marketplace listings, categories, orders, chat, fees, and moderation. It provides categories admin, fees admin, reporting query, export service, abuse moderation, and SSOT bridge functionality.

## 2. Core Journeys

### 2.1 Categories Management (Admin)

1. Admin creates category via `POST /knz/admin/categories` (Step-Up required).
2. Admin updates category via `PUT /knz/admin/categories/:category_id`.
3. Admin enables/disables categories via `POST /knz/admin/categories/:category_id/enable|disable`.

### 2.2 Fees Management (Admin)

1. Admin creates fee profile via `POST /knz/admin/fees` (Step-Up required).
2. Admin updates fee profile via `PUT /knz/admin/fees/:id`.
3. Fee profiles scoped by: global, region, category, or subcategory.

## 3. Service Classification & Smart Engine

- **Classification**: Primary Service (full integration with Smart Engine)
- **Smart Engine**: Listing ranking, category ranking with personalization
- **Unified Search**: KNZ Search Adapter for listings and categories
- **Banner Service**: KNZ-specific banners for promotions

## 4. Guards & Policies

- **Idempotency-Key**: Required on all state-changing calls.
- **Step-Up**: Required for category/fee changes, SSOT approvals.
- **Privacy**: Export service enforces masking (G-PRIVACY-EXPORT guard).
- **RBAC**: Role-based access control (admin, ops, support, finance, marketing, ssot_governor, security).

---

<a name="srv-amn"></a>

# SRV-AMN - Safe Taxi

_See full documentation: [`docs/explainar/services/srv-amn.md`](../services/srv-amn.md)_

## 1. Overview

The **AMN** service (أمن) provides safe taxi ride services with real-time tracking, SOS emergency features, and captain management. It handles ride quotes, trip creation, captain dispatch, real-time tracking, payment processing, and emergency response.

## 2. Core Journeys

### 2.1 Ride Request (Customer)

1. Customer requests quote via `POST /api/amn/quotes` with pickup and dropoff locations.
2. Customer creates trip via `POST /api/amn/trips` with quote acceptance.
3. Customer tracks trip via `GET /api/amn/trips/:trip_id`.
4. Customer completes trip and processes payment via WLT integration.

### 2.2 Captain Journey

1. Captain receives ride offers via `GET /api/amn/captain/offers`.
2. Captain accepts offer via `POST /api/amn/captain/offers/:offer_id/accept`.
3. Captain navigates to pickup and dropoff locations.
4. Captain triggers SOS if needed via `POST /api/amn/trips/:trip_id/sos`.

## 3. Service Classification & Smart Engine

- **Classification**: Primary Service (full integration with Smart Engine)
- **Smart Engine**: Trip ranking, captain ranking with personalization

## 4. Guards & Policies

- **Idempotency-Key**: Required on all state-changing calls.
- **Step-Up**: Required for sensitive operations.
- **Privacy**: All data encrypted; phone numbers masked.
- **SOS**: Emergency alerts with immediate response workflow.

---

<a name="srv-kwd"></a>

# SRV-KWD - Jobs Platform

_See full documentation: [`docs/explainar/services/srv-kwd.md`](../services/srv-kwd.md)_

## 1. Overview

The **KWD** service (KoWADER) is a free job board platform for Yemen, connecting job seekers with employers. It provides free job listings (no payments, no booking), full CRUD via APP-USER mobile app, read-only search via public web, admin approval workflow with moderation, support moderation for abuse/fraud reporting, skills catalog with synonyms, and configurable ranking.

## 2. Core Journeys

### 2.1 Job Seeker Journey

1. Job seeker searches listings via `GET /api/kawader/search` (public, optional auth).
2. Job seeker views listing details via `GET /api/kawader/{id}` (public).
3. Job seeker reports suspicious listing via `POST /api/kawader/{id}/report`.

### 2.2 Employer Journey

1. Employer creates listing via `POST /api/kawader` (User JWT, Idempotency-Key required).
2. Listing enters `pending_review` status.
3. Admin reviews and approves/rejects.
4. Employer updates listing via `PATCH /api/kawader/{id}`.

## 3. Service Classification & Smart Engine

- **Classification**: Secondary Service (full integration with Smart Engine)
- **Smart Engine**: Job listing ranking with personalization and configurable algorithms

## 4. Guards & Policies

- **Idempotency-Key**: Required on all transactional POST operations.
- **Step-Up**: Required for sensitive admin/support actions.
- **Privacy**: Export service enforces masking.
- **RBAC**: Role-based access control (admin, support).

---

<a name="srv-snd"></a>

# SRV-SND - On-demand Services

_See full documentation: [`docs/explainar/services/srv-snd.md`](../services/srv-snd.md)_

## 1. Overview

The **SND** service (سند) provides on-demand services including instant requests and specialized service requests. It handles request creation, pricing calculation, routing to captains or specialized providers, encrypted chat, proof-of-close workflows, and wallet integration.

## 2. Core Journeys

### 2.1 Instant Request (Customer)

1. Customer creates instant request via `POST /api/snd/requests` with category and details.
2. System calculates pricing and routes to available captain.
3. Captain accepts and completes request.
4. Captain generates 6-digit code for proof-of-close.
5. Customer verifies and closes request.

### 2.2 Specialized Request (Customer)

1. Customer creates specialized request via `POST /api/snd/requests` (specialized type).
2. Request assigned to specialized service provider.
3. Customer communicates via encrypted chat.
4. External payment processing (no internal billing).

## 3. Service Classification & Smart Engine

- **Classification**: Secondary Service (full integration with Smart Engine)
- **Smart Engine**: Request ranking with personalization

## 4. Guards & Policies

- **Idempotency-Key**: Required on all write operations.
- **Privacy**: Chat messages encrypted (AES-256-GCM); phone numbers masked.
- **Pricing**: Category-specific profiles with region overrides.
- **Routing**: Auto-routing to captains or manual queue assignment.

---

<a name="srv-mrf"></a>

# SRV-MRF - Lost & Found

_See full documentation: [`docs/explainar/services/srv-mrf.md`](../services/srv-mrf.md)_

## 1. Overview

The **MRF** service (مفقودات) handles lost and found reports with matching algorithms, encrypted chat, and recovery workflows. It provides report creation, item matching, communication between finders and reporters, and recovery coordination.

## 2. Core Journeys

### 2.1 Report Creation

1. User creates lost item report via `POST /api/mrf/reports` (Idempotency-Key required).
2. System matches with found items using similarity algorithms.
3. User receives match notifications.
4. User communicates with finder via encrypted chat.

### 2.2 Recovery Workflow

1. Finder creates found item report.
2. System matches with lost reports.
3. Reporter and finder communicate via encrypted chat.
4. Recovery coordinated and item returned.

## 3. Service Classification & Smart Engine

- **Classification**: Rare Service (full integration with Smart Engine)
- **Smart Engine**: Report ranking with personalization

## 4. Guards & Policies

- **Idempotency-Key**: Required on all state-changing calls.
- **Privacy**: All chat payloads encrypted (AES-GCM); phone numbers masked.
- **Matching**: Similarity algorithms with configurable thresholds.

---

<a name="srv-esf"></a>

# SRV-ESF - Blood Donation

_See full documentation: [`docs/explainar/services/srv-esf.md`](../services/srv-esf.md)_

## 1. Overview

The **ESF** service (اسعِفني) is an emergency blood donation matching service that connects blood requesters with donors. It provides request creation, donor matching, communication workflows, and emergency escalation.

## 2. Core Journeys

### 2.1 Blood Request (Requester)

1. Requester creates blood request via `POST /api/esf/requests` (Idempotency-Key required).
2. System matches with available donors based on blood type and location.
3. Requester receives match notifications.
4. Requester communicates with donors via encrypted chat.

### 2.2 Donor Journey

1. Donor registers availability via `POST /api/esf/donors` (Idempotency-Key required).
2. Donor receives match notifications.
3. Donor communicates with requester via encrypted chat.
4. Donor coordinates donation location and time.

## 3. Service Classification & Smart Engine

- **Classification**: Secondary Service (full integration with Smart Engine)
- **Smart Engine**: Request ranking, donor matching with personalization

## 4. Guards & Policies

- **Idempotency-Key**: Required on all state-changing calls.
- **Privacy**: All chat payloads encrypted (AES-GCM); phone numbers masked.
- **Emergency**: High-priority requests trigger immediate matching and escalation.

---

## Part II: Applications

<a name="app-user"></a>

# APP-USER - User Mobile Application

_See full documentation: [`docs/explainar/apps/app-user.md`](../apps/app-user.md)_

## 1. Overview

The **APP-USER** is the primary customer-facing mobile application for the BThwani platform. It provides access to all platform services including DSH, KNZ, AMN, KWD, SND, MRF, ESF, ARB, and WLT for payments.

## 2. Core Journeys

### 2.1 DSH (Delivery & Shopping) Journey

1. User browses categories and products via home screen.
2. User requests quote via `POST /api/dls/quotes` for Dark-Store slots.
3. User creates order via `POST /api/dls/orders` with `Idempotency-Key`.
4. User tracks order and communicates via encrypted chat.
5. User verifies delivery via PoD or pickup close.

### 2.2 Other Services

- **AMN**: Safe taxi rides with real-time tracking.
- **ARB**: Escrow bookings with deposit holds.
- **KWD**: Job listings search and creation.
- **SND**: On-demand service requests.
- **MRF**: Lost & found reports.
- **ESF**: Blood donation requests and matching.

## 3. Service Classification & Smart Engine

- **Service Classification**: Three-tier system (Primary/Secondary/Rare)
  - **Primary Services**: DSH, WLT, ARB, KNZ, AMN (full integration)
  - **Secondary Services**: KWD, SND, ESF (full integration)
  - **Rare Services**: MRF (full integration)
- **Smart Engine Integration**: Service ranking, category ranking, item ranking with personalization
- **Unified Search**: Cross-service search with text, voice, and image support

## 4. Navigation & User Experience

- **Bottom Tab Bar**: Home, Services, Orders, Wallet, Profile
- **Top App Bar**: Context-aware title, actions, notifications
- **Home Screen**: Service cards, quick access, notifications, search
- **Design System**: RTL support, theme, accessibility, localization

## 5. Guards & Policies

- **Idempotency-Key**: Required on all state-changing calls.
- **Step-Up**: Required for sensitive operations.
- **Privacy**: All chat payloads encrypted (AES-GCM); phone numbers masked.
- **Payment**: All payments flow through WLT service.

---

<a name="app-partner"></a>

# APP-PARTNER - Partner Mobile Application

_See full documentation: [`docs/explainar/apps/app-partner.md`](../apps/app-partner.md)_

## 1. Overview

The **APP-PARTNER** is the partner-facing mobile application for the BThwani platform. It enables partners to manage orders, bookings, store settings, policies, zones, inventory, and view financial information including settlements and earnings.

## 2. Core Journeys

### 2.1 Order Management (DSH)

1. Partner receives order notification and views order list.
2. Partner accepts/rejects order via `POST /api/dls/partner/orders/{order_id}/accept`.
3. Partner marks order as ready and completes pickup.
4. Partner hands off to platform captain and issues receipt.

### 2.2 Store Management

1. Partner views and updates policies via `GET/PATCH /api/dls/partners/me/policies`.
2. Partner manages zones via `GET/PATCH /api/dls/partners/me/zones`.
3. Partner manages slots and adjusts inventory.

## 3. Service Classification & Smart Engine

- **Service Integration**: DSH (Primary), ARB (Secondary), WLT (Primary)
- **Smart Engine**: Order ranking, notification prioritization, personalization

## 4. Navigation & User Experience

- **Bottom Tab Bar**: Orders, Store, Finance, Bookings, Profile
- **Top App Bar**: Context-aware title, actions, notifications
- **Home Screen**: Order summary, revenue summary, quick actions
- **Design System**: RTL support, theme, accessibility, localization

## 5. Guards & Policies

- **Idempotency-Key**: Required on all state-changing calls.
- **Step-Up**: Required for critical approvals.
- **Privacy**: All chat payloads encrypted (AES-GCM); phone numbers masked.
- **RBAC/ABAC**: Role-based access control (OWNER, MANAGER, CASHIER, MARKETER).

---

<a name="app-captain"></a>

# APP-CAPTAIN - Captain Mobile Application

_See full documentation: [`docs/explainar/apps/app-captain.md`](../apps/app-captain.md)_

## 1. Overview

The **APP-CAPTAIN** is the captain-facing mobile application for delivery and ride services. It enables captains to receive job offers, accept deliveries/rides, navigate to locations, complete deliveries, manage earnings, and trigger emergency SOS.

## 2. Core Journeys

### 2.1 DSH Delivery Journey

1. Captain receives delivery offer via `GET /api/dls/captain/orders`.
2. Captain accepts offer and navigates to pickup location.
3. Captain picks up order and navigates to delivery location.
4. Captain completes delivery with PoD (code or photo).

### 2.2 AMN Ride Journey

1. Captain receives ride offer via `GET /api/amn/captain/offers`.
2. Captain accepts offer and navigates to pickup location.
3. Captain picks up passenger and navigates to dropoff location.
4. Captain completes trip and processes payment.

## 3. Guards & Policies

- **Idempotency-Key**: Required on all state-changing calls.
- **Privacy**: All data encrypted; phone numbers masked.
- **SOS**: Emergency alerts with immediate response workflow.

---

<a name="app-field"></a>

# APP-FIELD - Field Operations Application

_See full documentation: [`docs/explainar/apps/app-field.md`](../apps/app-field.md)_

## 1. Overview

The **APP-FIELD** is the field operations application for partner onboarding, KYC verification, store setup, and partner approval workflows. It enables field agents to manage the complete partner onboarding lifecycle.

## 2. Core Journeys

### 2.1 Partner Onboarding Workflow

1. Field agent initiates partner intake via `POST /api/dls/partners/intake`.
2. Partner submits identity information.
3. Partner uploads KYC documents.
4. Partner creates store and sets coverage zones.
5. Partner submits for review and admin approves.

## 3. Guards & Policies

- **Idempotency-Key**: Required on all state-changing calls.
- **Step-Up**: Required for partner approval.
- **Privacy**: All documents encrypted; PII masked.

---

## Part III: Dashboards

<a name="dash-admin"></a>

# DASH-ADMIN - Admin Dashboard

_See full documentation: [`docs/explainar/dashboards/dash-admin.md`](../dashboards/dash-admin.md)_

## 1. Overview

The **DASH-ADMIN** is the primary administrative dashboard for the BThwani platform. It provides a unified governance interface for reviewing decisions, managing service lifecycle status, and overseeing platform-wide operations.

## 2. Core Features

- Service lifecycle management (READY, DRAFT status).
- Decision management with SSOT integration.
- Platform overview and key indicators.
- Service artifacts and build status tracking.
- Banner management for DSH/KNZ/ARB.
- Runtime variables management.

## 2.1 Service Classification & Smart Engine

- **Service Integration**: All platform services (governance access)
- **Smart Engine**: Service ranking, decision prioritization, personalization

## 3. Guards & Policies

- **Step-Up**: Required for all decision approvals.
- **RBAC**: Admin role required for all screens.
- **SSOT Integration**: All decisions linked to SSOT records.

---

<a name="dash-ops"></a>

# DASH-OPS - Operations Dashboard

_See full documentation: [`docs/explainar/dashboards/dash-ops.md`](../dashboards/dash-ops.md)_

## 1. Overview

The **DASH-OPS** is the operations dashboard for monitoring and managing live orders, rides, and operational workflows across DSH, AMN, and SND services.

## 2. Core Features

- Live order monitoring and dispatch management.
- Webhook and inbound message monitoring.
- Partner notification management.
- SLA breach monitoring and dispute management.
- Audit log viewing and compliance tracking.

## 3. Guards & Policies

- **HMAC Verification**: All inbound webhooks must have valid HMAC signatures.
- **RBAC**: Ops role required for all screens.
- **Privacy**: PII masked in audit logs.

---

<a name="dash-finance"></a>

# DASH-FINANCE - Finance Dashboard

_See full documentation: [`docs/explainar/dashboards/dash-finance.md`](../dashboards/dash-finance.md)_

## 1. Overview

The **DASH-FINANCE** is the financial dashboard for managing ledger operations, settlements, payouts, and financial reporting across WLT, DSH, and ARB services.

## 2. Core Features

- Ledger overview and account management.
- Settlement batch creation and dual-sign approval.
- Payout management and bank reconciliation.
- Financial reporting and exports.

## 3. Guards & Policies

- **Step-Up**: Required for all settlement approvals.
- **Dual-Sign**: All bank payouts require dual-sign.
- **Privacy**: All exports must have privacy masking.
- **RBAC**: Finance role required for all screens.

---

<a name="dash-support"></a>

# DASH-SUPPORT - Support Dashboard

_See full documentation: [`docs/explainar/dashboards/dash-support.md`](../dashboards/dash-support.md)_

## 1. Overview

The **DASH-SUPPORT** is the support dashboard for managing customer support tickets, incidents, escalations, and user assistance across DSH, AMN, ARB, ESF, and MRF services.

## 2. Core Features

- Ticket management with privacy masking.
- Fleet incident tracking.
- ARB escalation management.
- Service-specific support workflows.

## 3. Guards & Policies

- **Privacy**: All PII masked in support interfaces.
- **RBAC**: Support role required for all screens.
- **Step-Up**: Required for sensitive actions.

---

<a name="dash-marketing"></a>

# DASH-MARKETING - Marketing Dashboard

_See full documentation: [`docs/explainar/dashboards/dash-marketing.md`](../dashboards/dash-marketing.md)_

## 1. Overview

The **DASH-MARKETING** is the marketing dashboard for managing campaigns, promotions, partner performance, and marketplace analytics across KNZ and DSH services.

## 2. Core Features

- Campaign management for marketplace promotions.
- Partner performance analytics.
- Marketing analytics integration with BI dashboard.

## 3. Guards & Policies

- **RBAC**: Marketing role required for all screens.
- **Step-Up**: Required for campaign budget changes.
- **Privacy**: Partner PII masked in analytics.

---

<a name="dash-fleet"></a>

# DASH-FLEET - Fleet Dashboard

_See full documentation: [`docs/explainar/dashboards/dash-fleet.md`](../dashboards/dash-fleet.md)_

## 1. Overview

The **DASH-FLEET** is the fleet management dashboard for monitoring and managing captains, deliveries, and fleet operations across AMN and DSH services.

## 2. Core Features

- Captain status monitoring and availability tracking.
- DSH delivery monitoring and performance tracking.
- Fleet alerts and SOS incident management.

## 3. Guards & Policies

- **RBAC**: Fleet role required for all screens.
- **Privacy**: Captain PII masked in analytics.
- **Alert Integration**: Linked to G-ALERT-BIND guard.

---

<a name="dash-partner"></a>

# DASH-PARTNER - Partner Dashboard

_See full documentation: [`docs/explainar/dashboards/dash-partner.md`](../dashboards/dash-partner.md)_

## 1. Overview

The **DASH-PARTNER** is the partner-facing web dashboard for viewing partner performance, orders, bookings, and revenue analytics. It provides a web-based interface aligned with APP-PARTNER mobile application.

## 2. Core Features

- Partner overview dashboard with key indicators.
- DSH order management (aligned with APP-PARTNER).
- ARB booking management.
- Financial analytics and reporting.

## 3. Guards & Policies

- **RBAC**: Partner role required with sub-roles (OWNER, MANAGER, CASHIER, MARKETER).
- **Idempotency-Key**: Required for all state-changing operations.
- **Step-Up**: Required for critical actions.

---

<a name="dash-bi"></a>

# DASH-BI - Business Intelligence Dashboard

_See full documentation: [`docs/explainar/dashboards/dash-bi.md`](../dashboards/dash-bi.md)_

## 1. Overview

The **DASH-BI** is the business intelligence dashboard providing advanced analytics, reporting, and data insights across all platform services.

## 2. Core Features

- Executive summary with platform-wide KPIs.
- Service-level metrics and performance analytics.
- Financial overview and forecasting.
- Cross-service analytics and user journey analysis.

## 3. Guards & Policies

- **RBAC**: BI role required for all screens.
- **Privacy**: All PII masked in analytics and reports.
- **Step-Up**: Required for unmasked exports.

---

<a name="dash-ssot"></a>

# DASH-SSOT - SSOT Control Dashboard

_See full documentation: [`docs/explainar/dashboards/dash-ssot.md`](../dashboards/dash-ssot.md)_

## 1. Overview

The **DASH-SSOT** is the Single Source of Truth (SSOT) control dashboard for managing governance decisions, tracking SSOT index status, monitoring guard compliance, and overseeing platform-wide governance.

## 2. Core Features

- SSOT index overview and service status tracking.
- Decision management with approval workflow.
- Guard monitoring and compliance tracking.

## 3. Guards & Policies

- **Step-Up**: Required for all decision approvals.
- **RBAC**: SSOT governor role required for all screens.
- **SSOT Compliance**: All decisions must comply with governance policies.

---

<a name="dash-security"></a>

# DASH-SECURITY - Security Dashboard

_See full documentation: [`docs/explainar/dashboards/dash-security.md`](../dashboards/dash-security.md)_

## 1. Overview

The **DASH-SECURITY** is the security dashboard for monitoring security incidents, privacy controls, wallet security, and platform-wide security posture.

## 2. Core Features

- Security incident tracking and management.
- Wallet security controls and G-LEDGER-INVARIANTS monitoring.
- Privacy export tracking and G-PRIVACY-EXPORT compliance.

## 3. Guards & Policies

- **G-PRIVACY-EXPORT**: All exports must have privacy masking.
- **G-LEDGER-INVARIANTS**: Wallet=Ledger invariants must be maintained.
- **RBAC**: Security role required for all screens.

---

## Part IV: Web Surfaces

<a name="web-app"></a>

# WEB-APP - Customer Web Application

_See full documentation: [`docs/explainar/web/web-webapp.md`](../web/web-webapp.md)_

## 1. Overview

The **WEB-APP** (`app.bthwani.com`) is the browser-based Progressive Web Application (PWA) that mirrors the APP-USER mobile application functionality. It provides access to all platform services with configurable service modes controlled via runtime variables.

## 2. Core Features

- PWA with offline support and push notifications.
- Service modes (full, browse_only, info_only, search_details_only, embedded_only, hidden).
- Deep links and session flow management.
- Native app integration and handoff.
- Service Classification & Smart Engine integration.
- Navigation & User Experience with bottom tab bar and top app bar.

## 3. Service Modes

- **DSH**: full — Full checkout + tracking flows.
- **KNZ**: browse_only — Catalog browse/details only.
- **AMN**: info_only — Shows marketplace info screens.
- **KWD**: search_details_only — Search + detail views, no CRUD.
- **MRF**: full — Full incident filing and chat.
- **ESF**: full — Full enablement (request + matching).
- **SND**: full — Specialist assistance.
- **ARB**: full — Booking + 6-digit lock workflows.
- **WLT**: embedded_only — Only within DSH checkout flows.

## 4. Guards & Policies

- **JWT + CSRF**: Enforced for unsafe operations.
- **Idempotency-Key**: Required on all POST/PATCH flows.
- **Step-Up**: Required for sensitive actions.
- **Privacy**: All chat payloads encrypted (AES-GCM).

---

<a name="web-website"></a>

# WEB-WEBSITE - Marketing Website

_See full documentation: [`docs/explainar/web/web-website.md`](../web/web-website.md)_

## 1. Overview

The **WEB-WEBSITE** (`bthwani.com`) is the public marketing and SEO-focused website for the BThwani platform. It provides informational content about platform services while handing off all transactional flows to the web app.

## 2. Core Features

- Service landing pages with feature blocks.
- Category pages and SEO content.
- Deep links to web app with UTM parameters.
- Structured data (Schema.org) for all service pages.

## 3. Service Exposure Matrix

- **DSH**: Landing page + feature blocks → `https://app.bthwani.com/dsh`
- **KNZ**: Category pages + SEO content → `https://app.bthwani.com/knz`
- **AMN**: Info page with native-app CTA → `https://app.bthwani.com/amn`
- **KWD**: Search teaser + knowledge base → `https://app.bthwani.com/kwd`
- **MRF**: Incident management overview → `https://app.bthwani.com/mrf`
- **ESF**: Enablement overview → `https://app.bthwani.com/esf`
- **SND**: Support vertical story → `https://app.bthwani.com/snd`
- **ARB**: Booking landing → `https://app.bthwani.com/arb`
- **WLT**: Mentioned within pricing FAQ → `https://app.bthwani.com/wlt`

## 4. Guards & Policies

- **No Authentication**: Public access, no user authentication required.
- **No Write Operations**: No POST/PUT/PATCH/DELETE calls.
- **SEO Enabled**: Robots allow, sitemap + Schema.org structured data.
- **Performance**: LCP ≤ 2000 ms, INP ≤ 150 ms, CLS ≤ 0.10.

---

## Summary

This comprehensive documentation covers:

- **9 Services**: DSH, WLT, ARB, KNZ, AMN, KWD, SND, MRF, ESF
- **4 Applications**: APP-USER, APP-PARTNER, APP-CAPTAIN, APP-FIELD
- **10 Dashboards**: ADMIN, OPS, FINANCE, SUPPORT, MARKETING, FLEET, PARTNER, BI, SSOT, SECURITY
- **2 Web Surfaces**: WEB-APP, WEB-WEBSITE

All documentation follows a consistent structure with:

- Overview and purpose
- Core journeys and workflows
- Guards and policies
- Service Classification & Smart Engine Integration
- Navigation & User Experience (for apps and dashboards)
- Features & Capabilities
- API endpoints and interfaces
- Integrations and runtime variables
- Database Migrations & Seeders (for services)
- API Endpoints Summary (for services)
- References and review information

---

**Last Updated**: 2025-02-01  
**Source**: `docs/explainar/` directory  
**Version**: 2.0.0

## Recent Updates (v2.0.0)

This version includes comprehensive updates across all documentation files:

- **Service Classification & Smart Engine**: Added three-tier service classification (Primary/Secondary/Rare) with Smart Engine integration details
- **Unified Search Integration**: Added Unified Search adapter details for DSH, KNZ, and ARB services
- **Banner Service Integration**: Added Banner Service details for DSH, KNZ, and ARB services
- **Navigation & User Experience**: Added detailed navigation and UX sections for all applications and dashboards
- **Features & Capabilities**: Added comprehensive features sections for all applications and dashboards
- **Database Migrations**: Added detailed migration table descriptions for all services
- **API Endpoints Summary**: Added consolidated API endpoints summaries for all services
- **Runtime Variables**: Expanded runtime variables documentation with service-specific examples
