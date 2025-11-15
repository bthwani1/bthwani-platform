# SRV-DSH - Delivery & Shopping Platform

## 1. Overview

The **DSH** service powers the end-to-end delivery and dark-store experience. It orchestrates the customer journey from browsing and checkout through proof-of-delivery, coordinating APP-USER, APP-PARTNER, APP-CAPTAIN, APP-FIELD, and the operational/finance dashboards. DSH supports platform fleet, partner fleet, and pickup scenarios, and integrates with the wallet `WLT` for payments and settlements.

## 2. Core Journeys

### 2.1 Customer Journey (APP-USER)

1. Customer requests a quote and slot via `POST /api/dls/quotes`.
2. Places an order with `POST /api/dls/orders`, providing `Idempotency-Key` and payment channel.
3. Tracks status using `GET /api/dls/orders/{order_id}` plus tracking/chat/receipt endpoints.
4. Modifies or cancels through `PATCH /api/dls/orders/{order_id}` or `POST .../cancel` within the permitted window.

### 2.2 Partner Journey (APP-PARTNER)

1. Partner accepts or rejects the order using `POST /api/dls/partner/orders/{order_id}/accept|reject`.
2. Manages policies and zones via `GET|PATCH /api/dls/partners/me/policies` and `.../zones`.
3. Marks order as ready (`ready`) or completes pickup via `POST .../pickup/close` depending on channel.
4. Sends notifications through `POST /api/dls/partners/{partner_id}/notifications` when needed.

### 2.3 Captain Journey (APP-CAPTAIN)

1. Captain fetches assigned/available orders (`GET /api/dls/captain/orders`).
2. Accepts or rejects and records arrival events (`arrived-store`, `arrived-customer`).
3. Uses masked chat endpoints (`/chat/messages`) with customers/partners.
4. Completes the order with proof-of-delivery `POST .../pod/verify` or pickup codes `POST .../pickup/close`.

### 2.4 Ops & Finance Journey

- Ops teams manage disputes, incidents, and dispatch through `/api/ops/dls/...` and `/api/fleet/...`.
- Finance teams run settlements and reconciliation via `/api/fin/settlements`, `/wallet/*`, applying dual-sign policies.

## 3. Guards & Policies

- **Idempotency-Key** enforced on all state-changing calls (orders, payouts, VAR updates).
- **Step-Up** required for critical approvals (settlements, unmasking, bank updates).
- **Privacy**: chat payloads masked and encrypted (AES-GCM); unmask flows require dual approval.
- **Webhooks**: all inbound endpoints enforce HMAC signatures with â‰¤300s replay window.
- **Ledger**: every monetary movement flows through `WLT`, satisfying `G-LEDGER-INVARIANTS`.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Surface      | screen_id                | Description                         | Source                                   |
| ------------ | ------------------------ | ----------------------------------- | ---------------------------------------- |
| APP-USER     | `app_user.checkout`      | Checkout flow and payment selection | `apps/user/SCREENS_CATALOG.csv`          |
| APP-USER     | `app_user.order.details` | Order detail and tracking screen    | `apps/user/SCREENS_CATALOG.csv`          |
| APP-PARTNER  | `partner.orders.detail`  | Partner order management view       | `apps/partner/SCREENS_CATALOG.csv`       |
| APP-CAPTAIN  | `captain.orders.detail`  | Captain execution dashboard         | `apps/captain/SCREENS_CATALOG.csv`       |
| APP-FIELD    | `field.partner.intake`   | Field onboarding form for partners  | `apps/field/SCREENS_CATALOG.csv`         |
| DASH-OPS     | `ops.orders.board`       | Operations monitoring board         | `dashboards/ops/SCREENS_CATALOG.csv`     |
| DASH-FINANCE | `finance.settlements`    | Settlements and payout workflows    | `dashboards/finance/SCREENS_CATALOG.csv` |

_Full catalog available in the generated reference `docs/explainar/generated/dsh.generated.md`._

### 4.2 API Surface

The service exposes 250+ routes spanning admin, customer, partner, captain, ops, and finance domains. Refer to the generated reference `docs/explainar/generated/dsh.generated.md`, which updates automatically and includes a SHA checksum at the end.

## 5. Integrations & Runtime Variables

- **Dependent services**: `WLT` (payments/settlements), `ARB` (escrow bookings), `KNZ` and `SND` for cross-service fulfillment.
- **Applications**: `APP-USER`, `APP-PARTNER`, `APP-CAPTAIN`, `APP-FIELD`, dashboards (`ops`, `finance`, `support`).
- **Runtime examples**:
  - `VAR_DSH_DEFAULT_DELIVERY_MODE` — default delivery mode when partner mode not set.
  - `VAR_CHAT_RETENTION_DAYS` — chat retention period in days.
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

### 5.1 Partner Reminder Automation (T+4m)

- **Activation conditions**: orders with `state ∈ {NEW, PENDING_PARTNER_ACCEPT}` on channels `partner_delivery` or `pickup`, with no accept/reject action recorded. A timer is scheduled at assignment (`T+4` minutes SLA).
- **Pre-send checks (at T+4m)**: atomic verification that the order is still pending, store is available, reminder not sent within the dedup window, quiet hours (if enabled) allow it, and governance guards (rate limits, allowlists, privacy masking, audit immutability) all pass.
- **Channel priority & retries**: ordered `WhatsApp → SMS → Push`. Each channel allows up to two attempts (retry backoff 30s then 90s) before falling back to the next channel. Dedup window: `VAR_NOTIF_DEDUP_WINDOW_MIN`. Per-store rate ceiling: `VAR_NOTIF_PARTNER_RATE_PER_15MIN`.
- **Runtime variables**:
  - `VAR_DLS_PARTNER_ACCEPT_SLA_MIN` (default 4 minutes) controls the first reminder timer.
  - `VAR_NOTIF_DEDUP_WINDOW_MIN` (default 10 minutes) prevents duplicate reminders.
  - `VAR_NOTIF_CHANNEL_PRIORITY` (default `["wa","sms","push"]`).
  - `VAR_NOTIF_WA_TEMPLATE` / `VAR_NOTIF_SMS_TEMPLATE` (default `partner_accept_reminder_v1`).
  - `VAR_NOTIF_ESCALATE_MIN` (default 6) triggers Ops escalation if still pending after the reminder.
  - `VAR_LINK_PARTNER_ORDER_BASE`, `VAR_DEEPLINK_PARTNER_ORDER_BASE` supply deep links and web URLs.
- **Templates**:
  - WhatsApp template `partner_accept_reminder_v1`: “تنبيه: لديك طلب رقم {{order_id}} بانتظار الموافقة منذ {{minutes}} دقيقة. يرجى قبول أو رفض الآن لتجنّب التأخير.” Buttons open the deep link (`{{deeplink_order}}`) or web order URL (`{{web_order_url}}`).
  - SMS fallback (≤160 chars): “تنبيه بثواني: طلب #{{order_id}} بانتظار موافقتك منذ {{minutes}} د. افتح: {{short_web_url}} لقبول/رفض فورًا.”
  - All fields enforce masking; no raw customer PII is transmitted.
- **Execution sequence**:
  1. DSH schedules timer on assignment.
  2. At T+4m it assembles payload `{order_id, store_id, phone, locale, web_url, deeplink, minutes, correlation_id}` and calls Notification Service with `X-Idempotency-Key = hash(order_id|store_id|T+4m)`.
  3. Notification Service validates dedup/rate limits, sends WhatsApp via BSP, then escalates to SMS/Push on recoverable errors or non-confirmed delivery.
  4. Any inbound replies/webhook callbacks land on `/notifications/inbound` and are tied back to the order audit trail.
  5. If the partner accepts during execution, the workflow halts before sending further channels.
  6. At T+6m with no action, the order is flagged into Ops queue (DASH-OPS) with SLA badge.
- **Governance & security**: outbound calls use Idempotency-Key; provider credentials live in Vault; attempt logs are immutable (payload hash, channel, timestamps). Inbound webhooks require HMAC with ≤300s anti-replay window. Locale fallback (ar→en) is honored per store preference.
- **Edge cases**: acceptance before T+4m cancels reminders; invalid store contact escalates immediately; quiet hours defer or soften messaging; consecutive orders respect store rate limits.
- **Observability metrics**: `notif.partner.accept_reminder.sent{channel}`, `...delivered`, `...click_rate`, `...convert_accept_within_2m`, plus `notif.dedup_hits`, `notif.rate_limited`, and UI guard violations.
- **Definition of Done**: templates approved in sandbox and production, time-travel tests cover T+4/T+6, audit trail shows the full chain, buttons open partner app/web, and guards (`G-IDEMPOTENCY`, `G-WEBHOOK-HMAC≤300s`, `G-PRIVACY-EXPORT`, `G-AUDIT-IMMUTABLE`, `G-RATE-LIMIT`) validated.

## 6. Product Catalog Management (MPC & Store Listings)

- **Scope**: master product catalog (MPC) for canonical data, partner store listings for localized price/availability, pricing profiles, promotions, inventory, search/SEO, and import/export tooling.
- **Catalog layers**:
  1. _MPC_: `product`, `product_variant`, `product_media`, `product_attribute_value`, `category`, `attribute`, `taxonomy_map` hold the single source of truth (names, attributes, media, taxonomy).
  2. _Partner Store Listing_: `store_product`, `store_variant`, `inventory_ledger`, `promotion`, `bundle` extend MPC per store with price, availability, limits, bundles, and stock.
  3. _Profiles & Policies_: pricing profiles, rounding rules, sensitive-item policies, and availability schedules per city/store.
  4. _Search & SEO_: text indexes, synonyms, slugs, sitemap contributions (when published to web).
- **Data model outline**:
  - Core tables as cited above with recommended indexes (GIN/trigram on product text, BTREE on `category_id`/`store_id`/`variant_id`, partial index for `store_variant(is_available=true)`).
  - Governance tables: `audit_log` (immutable), `import_job`, `media_job` for traceability.
- **Lifecycle**:
  1. Define categories/attributes.
  2. Create MPC products/variants and upload media via signed URLs.
  3. Moderate text/media before publish.
  4. Link stores (auto/manual) to seed `store_product` & `store_variant` with local pricing and policies.
  5. Feed inventory (API/CSV/POS integrations) into `inventory_ledger` and derive availability.
  6. Apply promotions/bundles and effective price windows.
  7. Publish read models for APP-USER and expose management via DASH-PRODUCT & partner tools.
  8. Maintain catalog (archival, expiry handling, audits).
- **Management surfaces**:
  - _DASH-PRODUCT_: categories, attributes, products/variants, media moderation, taxonomy mapping, SEO settings, bulk import/export, moderation queue.
  - _Partner surfaces_: price/toggle availability, fast stock uploads, local promotions within policy bounds.
- **API snapshots**:
  - Catalog admin routes (`GET/PATCH /catalog/categories`, `/catalog/attributes`, `/catalog/products`, `/catalog/taxonomy`, `/catalog/bulk/...`).
  - Partner catalog routes (`GET /partner/stores/:store_id/menus`, `PUT .../pricing`, `POST .../inventory/bulk`).
  - Client consumption reads from `store_variant` filtered by availability with cursor pagination/sorting.
- **Pricing & inventory operations**:
  - Pricing fields `price_yer`, `sale_price_yer`, effective windows, rounding enforcement, per-store pricing files, guardrails on discounts.
  - Inventory supports sources (manual, CSV, API, POS), `on_hand/reserved`, safety stock, backorder options, dark-store windows.
- **Media pipeline**: upload intent → signed URL → storage, multiple renditions + LQIP, automated validation, moderation status, signed delivery URLs.
- **Search/SEO**: bilingual synonyms, slug management, category mapping for partner imports, ability to exclude categories from indexing.
- **Integrations**: CSV/ZIP templates with error reports, API webhooks (HMAC + ≤300s anti-replay), SFTP nightly jobs, field app capture.
- **Substitutions & sensitive goods**: variant substitution lists with priority, picking confirmation rules, RBAC policies for restricted items.
- **Performance**: cached read models, denormalised views, avoidance of N+1, cursor pagination, <150ms p75 target for catalog queries.
- **Acceptance gates (DoD)**: no product published without valid category + hero image + variant; CSV imports generate error reports; audit trail for every change; 1:1 trace between admin screens and `operation_id`; search performance targets met; policy OPA guards enforce classification/image/price constraints.
- **Runtime levers**: see `runtime/RUNTIME_VARS_CATALOG.csv` entries (`VAR_MPC_PRICE_ROUNDING_MODE`, `VAR_DSH_CATALOG_IMPORT_MAX_ROWS`, `VAR_DSH_CATALOG_MODERATION_REQUIRED`, etc.) for operations toggled via control panel.

## 7. Incentives & Loyalty Stack

- **Scope**: subscriptions (user/partner), captain levels, automatic discounts, coupons/promos, and rewards/points redemption are now modeled via `registry/dsh_incentives.json` and enforced inside the ordering flow through the new `DshIncentivesService`.
- **Profiles**:
  - _User plans_ (`sub_user_pro_monthly`, `sub_user_family_yearly`) define delivery-fee discounts, free-delivery quotas, support priority, and rewards multipliers.
  - _Partner plans_ (`sub_partner_pro`) tune commission, ranking boosts, badges, and marketing tooling exposure.
  - _Captain levels_ (Bronze → Elite) gate revenue share, priority score, and performance thresholds.
- **Discount surfaces**:
  - _Automatic rules_ (e.g., weekend supermarket fee reduction, large basket rebate) are scoped by city/category/day/time, have explicit funding splits, and produce ledger-ready discount lines.
  - _Coupons / promo codes_ (`WELCOME10`, `FREEDLV_SM`) carry eligibility policies (user segment, geography, partner allowlists), stacking constraints, usage limits, and caps.
  - _Stacking order_: base price → subscription perks → automatic discounts → rewards redemption → coupon, with guardrails (`min_net_total_yer`, `max_total_discount_pct`, prevent negative totals).
- **Rewards**:
  - Base earning ratio `VAR_DSH_REWARDS_POINTS_PER_1000_YER` plus plan/category multipliers; redemption converts 100 pts → 1,000 YER, applies to delivery first, enforces per-order % caps and min basket totals.
  - Expiry (`VAR_DSH_REWARDS_EXPIRY_DAYS`), anti-fraud (earn only after `status=completed`, revoke on refund, step-up on mass redeem) captured for governance.
- **Runtime levers**: every subscription/discount/coupon/reward artifact maps to VAR\_\* keys recorded in `runtime/RUNTIME_VARS_CATALOG.csv`, enabling control-plane toggles (e.g., `VAR_DSH_COUPONS_ENABLED`, `VAR_DSH_DISC_SUPERMARKET_WEEKEND_PCT`, `VAR_DSH_REWARDS_MAX_DISCOUNT_PCT_PER_ORDER`).
- **Execution**:
  - `DshOrdersService` now calls the incentives engine before persisting orders, storing adjustment line items, coupon/subscription metadata, guardrail hits, and points redeemed in `order.pricing`.
  - Wallet authorizations use the post-incentive total, ensuring ledger parity with invoice breakdown (basket, delivery, subscription discount, auto discount, coupon, rewards, guardrail rollbacks).

## 8. Database Migrations & Seeders

### 8.1 Migrations

The DSH service includes database migrations for core entities:

#### Migration: `dsh_categories` Table

- **File**: `migrations/Migration20250201000008_CreateDshCategoriesTable.ts`
- **Purpose**: Creates table for DSH internal categories (restaurants, supermarkets, quick tasks, etc.)
- **Key Fields**:
  - `code` (unique): Category code (e.g., `dsh_restaurants`, `dsh_quick_task`)
  - `name_ar` / `name_en`: Localized names
  - `description_ar` / `description_en`: Localized descriptions
  - `status`: Category status (`active`, `inactive`, `archived`)
  - `sort_order`: Display ordering
  - `is_featured`: Featured category flag
  - `is_active`: Active status flag
  - `tags`: JSONB array for tags (NEARBY, NEW, TRENDING, SEASONAL, etc.)
  - `available_regions` / `available_cities`: JSONB arrays for regional availability
  - `var_enabled`: Runtime variable name for enable/disable control (e.g., `VAR_DSH_CAT_RESTAURANTS_ENABLED`)
  - `icon_url` / `image_url`: Media URLs
  - `metadata`: JSONB for additional metadata
- **Indexes**:
  - Unique index on `code`
  - Composite index on `status, sort_order`
  - Index on `is_featured`
  - GIN indexes on `tags`, `available_regions`, `available_cities`

#### Migration: `thwani_requests.dsh_category_code`

- **File**: `migrations/Migration20250201000009_AddDshCategoryCodeToThwaniRequests.ts`
- **Purpose**: Links Thwani requests to DSH category `dsh_quick_task`
- **Changes**:
  - Adds `dsh_category_code` column to `thwani_requests` table
  - Sets default value `dsh_quick_task` for existing records
  - Creates index on `dsh_category_code` for query performance

### 8.2 Seeders

#### Seeder: DSH Categories

- **File**: `migrations/seeders/SeedDshCategories.ts`
- **Purpose**: Seeds default DSH categories for initial setup
- **Categories Seeded**:
  1. `dsh_restaurants` (مطاعم) - Restaurants and cafes
  2. `dsh_supermarkets` (سوبرماركت / بقالات) - Supermarkets and groceries
  3. `dsh_fruits_veggies` (خضار وفواكه) - Fresh fruits and vegetables
  4. `dsh_fashion` (أناقتي) - Fashion and style
  5. `dsh_sweets_cafes` (حلا) - Sweets and cafes
  6. `dsh_global_stores` (متاجر عالمية) - Global stores and websites
  7. `dsh_quick_task` (طلبات فورية / مهام سريعة) - Instant requests / Quick tasks (Thwani)
- **Behavior**: Idempotent — only creates categories that don't already exist (checks by `code`)
- **Usage**:

  ```bash
  # Via npm script
  npm run seed:dsh-categories

  # Or via Node.js directly
  node -e "require('./dist/migrations/seeders/SeedDshCategories').seedDshCategories(em).then(() => process.exit(0))"
  ```

### 8.3 Migration Execution

**To run migrations:**

```bash
# Run all pending migrations
npm run migration:up

# Or via MikroORM CLI
npx mikro-orm migration:up
```

**To run seeder:**

```bash
# After migrations are complete
npm run seed:dsh-categories
```

**Note**: See `docs/MIGRATION_DEPLOYMENT.md` for detailed deployment instructions, including SQL fallback options if MikroORM CLI encounters entity discovery issues.

## 9. References & Review

- Sources: `oas/services/dsh/openapi.yaml`, `apps/**/SCREENS_CATALOG.csv`, `dashboards/**/SCREENS_CATALOG.csv`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Database: `migrations/Migration20250201000008_CreateDshCategoriesTable.ts`, `migrations/Migration20250201000009_AddDshCategoryCodeToThwaniRequests.ts`, `migrations/seeders/SeedDshCategories.ts`.
- Last human review: 2025-11-14 02:30 +03.

---

**Source SHA256**: `5f038d7e861808cc12f103eadeb02db539f069b1d22664757316fdf675ba54b6`
