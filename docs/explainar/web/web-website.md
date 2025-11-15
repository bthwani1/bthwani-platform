# WEB-WEBSITE - Marketing Website

## 1. Overview

The **WEB-WEBSITE** (`bthwani.com`) is the public marketing and SEO-focused website for the BThwani platform. It provides informational content about platform services, features, and capabilities while handing off all transactional flows to the web app (`app.bthwani.com`). The website is fully indexable by search engines and serves as the primary marketing and content hub.

## 2. Core Journeys

### 2.1 Service Discovery

1. User visits `bthwani.com` and browses service landing pages.
2. User views service features, pricing, and capabilities.
3. User clicks CTA to deep-link to web app (`app.bthwani.com/{service}`).
4. User is redirected to web app for transactional flows.

### 2.2 Content Browsing

1. User browses category pages and SEO content.
2. User views service information and feature blocks.
3. User accesses knowledge base and FAQ sections.
4. User views structured data and Schema.org markup.

### 2.3 Lead Capture

1. User views service landing pages with CTAs.
2. User clicks "Sign Up" or "Get Started" buttons.
3. User is redirected to web app with UTM parameters.
4. Analytics track conversion (site.service_click → webapp.deeplink_open).

## 3. Guards & Policies

- **No Authentication**: Public access, no user authentication required.
- **No Write Operations**: No POST/PUT/PATCH/DELETE calls from marketing site.
- **Read-Only**: GET-only operations via cached/proxy endpoints.
- **SEO Enabled**: Robots allow, sitemap + Schema.org structured data.
- **Performance**: LCP ≤ 2000 ms, INP ≤ 150 ms, CLS ≤ 0.10.
- **Caching**: All DSH-derived data must use cached GETs with conservative TTL.
- **Privacy**: PII masking where necessary in cached data.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Screen ID                   | Service | Description                    | Deep Link Target              |
| --------------------------- | ------- | ------------------------------ | ----------------------------- |
| `WEBSITE_HOME`              | GLOBAL  | Homepage                       | `[TBD]`                       |
| `WEBSITE_DSH_LANDING`       | DSH     | DSH landing page               | `https://app.bthwani.com/dsh` |
| `WEBSITE_KNZ_CATEGORIES`    | KNZ     | Category pages + SEO content   | `https://app.bthwani.com/knz` |
| `WEBSITE_AMN_INFO`          | AMN     | Info page with native-app CTA  | `https://app.bthwani.com/amn` |
| `WEBSITE_KWD_SEARCH_TEASER` | KWD     | Search teaser + knowledge base | `https://app.bthwani.com/kwd` |
| `WEBSITE_MRF_OVERVIEW`      | MRF     | Incident management overview   | `https://app.bthwani.com/mrf` |
| `WEBSITE_ESF_OVERVIEW`      | ESF     | Enablement overview            | `https://app.bthwani.com/esf` |
| `WEBSITE_SND_STORY`         | SND     | Support vertical story         | `https://app.bthwani.com/snd` |
| `WEBSITE_ARB_LANDING`       | ARB     | Booking landing                | `https://app.bthwani.com/arb` |
| `WEBSITE_PRICING_FAQ`       | WLT     | Pricing FAQ (WLT mentioned)    | `https://app.bthwani.com/wlt` |

_Full catalog available in `web/website/SERVICES.md`._

### 4.2 API Surface

The website does not make direct API calls. Any data displayed must:

- Come from cached/proxy endpoints with explicit TTL.
- Use GET-only operations.
- Pass through edge cache.
- Mask PII where necessary.

## 5. Service Integration & Smart Engine

### 5.1 Service Integration

WEB-WEBSITE integrates with all platform services for marketing:

- **Primary Services**: DSH, KNZ, AMN (marketing content and landing pages)
- **Secondary Services**: KWD, SND, ESF, MRF, ARB (marketing content)
- **Service Classification**: All services visible in marketing content

### 5.2 Smart Engine Integration

- **Content Personalization**: Service content personalized based on user preferences
- **CTA Optimization**: CTA behavior optimized based on service modes
- **SEO Optimization**: SEO content optimized for search engines

## 6. Navigation & User Experience

### 6.1 Main Navigation

- **Home**: Homepage with service overview
- **Services**: Service landing pages (DSH, KNZ, AMN, etc.)
- **About**: Platform information and company details
- **Support**: Knowledge base and FAQ sections

### 6.2 Top App Bar

- **Title**: Context-aware title (Home, Services, About, Support)
- **Actions**: Quick actions (search, language toggle)
- **CTAs**: Service-specific CTAs with deep links

### 6.3 Home Screen Features

- **Service Overview**: Platform services overview
- **Feature Blocks**: Service feature highlights
- **CTAs**: Primary CTAs to web app deep links
- **SEO Content**: SEO-optimized content blocks

### 6.4 Design System

- **RTL Support**: Full RTL support for Arabic interface
- **Theme**: Light/dark theme support
- **Accessibility**: WCAG AA compliance
- **Localization**: Arabic and English support
- **Responsive**: Responsive design for all devices

## 7. Features & Capabilities

### 7.1 Service Landing Pages

- **DSH Landing**: Delivery & shopping features and CTAs
- **KNZ Categories**: Marketplace category pages with SEO content
- **AMN Info**: Safe taxi info page with native app CTA
- **KWD Search Teaser**: Job search teaser and knowledge base
- **MRF Overview**: Lost & found incident management overview
- **ESF Overview**: Blood donation enablement overview
- **SND Story**: Specialist assistance support vertical story
- **ARB Landing**: Booking landing with lead capture
- **WLT Pricing FAQ**: Pricing FAQ with WLT mentions

### 7.2 SEO Features

- **Structured Data**: Schema.org markup for all service pages
- **Sitemap**: XML sitemap for search engine indexing
- **Robots**: Robots.txt allow for full indexing
- **Canonical Tags**: Canonical tags for SEO optimization
- **Deep-Link Metadata**: PWA detection metadata

### 7.3 Content Management

- **CMS/SSG**: Content management via CMS or static site generation
- **Edge Cache**: Static resources with edge caching
- **Cached Data**: Cached GET-only data from DSH
- **PII Masking**: PII masking in cached data

### 7.4 Analytics & Tracking

- **UTM Parameters**: UTM parameters on all CTAs
- **Conversion Tracking**: site.service_click → webapp.deeplink_open
- **Event Logging**: Service exposure change events
- **Performance Monitoring**: LCP, INP, CLS tracking

## 8. Integrations & Runtime Variables

- **Primary services**: All platform services (marketing content only).
- **Shared services**: `RuntimeVariablesService` (for service mode checks).
- **Supporting services**: CMS/SSG (content management), edge cache (performance).
- **Runtime examples**:
  - `VAR_SITE_CANONICAL_HOST` — Canonical host (default: "bthwani.com").
  - `VAR_WEBAPP_FEATURE_DSH_MODE` — DSH mode (affects CTA behavior).
  - `VAR_WEBAPP_FEATURE_KNZ_MODE` — KNZ mode (affects CTA behavior).
  - `VAR_WEBAPP_FEATURE_AMN_MODE` — AMN mode (affects CTA behavior).
  - `VAR_WEBAPP_FEATURE_KWD_MODE` — KWD mode (affects CTA behavior).
  - `VAR_WEBAPP_FEATURE_MRF_MODE` — MRF mode (affects CTA behavior).
  - `VAR_WEBAPP_FEATURE_ESF_MODE` — ESF mode (affects CTA behavior).
  - `VAR_WEBAPP_FEATURE_SND_MODE` — SND mode (affects CTA behavior).
  - `VAR_WEBAPP_FEATURE_ARB_MODE` — ARB mode (affects CTA behavior).
  - `VAR_WEBAPP_FEATURE_WLT_MODE` — WLT mode (affects CTA behavior).
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. Service Exposure Matrix

### Default Exposure Matrix

| Service  | Web Exposure                   | Deep Link Target            | Notes                                                         |
| -------- | ------------------------------ | --------------------------- | ------------------------------------------------------------- |
| DSH v2.2 | Landing page + feature blocks  | https://app.bthwani.com/dsh | Primary CTA directs to web-app checkout.                      |
| KNZ v1.1 | Category pages + SEO content   | https://app.bthwani.com/knz | Highlight verticals; sensitive categories labelled view-only. |
| AMN v1.0 | Info page with native-app CTA  | https://app.bthwani.com/amn | Prominent "Open in App" buttons.                              |
| KWD v1.0 | Search teaser + knowledge base | https://app.bthwani.com/kwd | Encourages signing in for full workspace actions.             |
| MRF v2.0 | Incident management overview   | https://app.bthwani.com/mrf | Emphasises SLA & chat features.                               |
| ESF v1.2 | Enablement overview            | https://app.bthwani.com/esf | Provides structured schema.org data.                          |
| SND v1.0 | Support vertical story         | https://app.bthwani.com/snd | CTA to open specialist assistance.                            |
| ARB v2.0 | Booking landing                | https://app.bthwani.com/arb | Captures leads then routes to PWA.                            |
| WLT v1.0 | Mentioned within pricing FAQ   | https://app.bthwani.com/wlt | No standalone CTA; referenced inside DSH flows.               |

### CTA Behavior

- When service is enabled: CTA links to web app deep link.
- When service is disabled (`hidden` mode): CTA swaps to generic `/install` or contact form link.
- UTM parameters retained for analytics tracking.

## 7. Content & SEO Rules

### SEO Configuration

- **Robots**: Allow + sitemap + structured data.
- **Canonical Tags**: Point to themselves; web app declares cross-canonical when needed.
- **Structured Data**: Schema.org published for every service page.
- **Deep-Link Metadata**: `al:web:url`, `web-app-capable` maintained for PWA detection.

### Content Guidelines

- Marketing copy must avoid promising operations that are in light or hidden state.
- Coordinate with runtime settings documented in `web/webapp/SERVICES.md`.
- Content must be accurate and reflect current service capabilities.
- Update content when service modes change.

## 8. Governance & Runtime Control

### Governance Rules

- **No Code Changes**: لا يتم تعديل ظهور الخدمات من خلال الكود؛ يتم التحكم به من لوحة التحكم عبر مفاتيح التشغيل `VAR_WEBAPP_FEATURE_*` لضمان التطابق مع واجهة APP-USER.
- **Sync with Web App**: Updates to runtime modes should be reflected in this matrix alongside the web-app document to stay in sync.
- **No Write Operations**: No POST/PUT/PATCH/DELETE calls from the marketing site.
- **Cached Data Only**: Any data pulled from DSH must pass through cache/proxy with explicit TTL.

### Analytics Tracking

- UTM parameters on all CTAs.
- Conversion tracking: `site.service_click` → `webapp.deeplink_open`.
- Event logging for service exposure changes.

## 9. Performance & Architecture

### Performance Budgets

- **LCP**: ≤ 2000 ms (Largest Contentful Paint).
- **INP**: ≤ 150 ms (Interaction to Next Paint).
- **CLS**: ≤ 0.10 (Cumulative Layout Shift).

### Architecture

- **SSR/SSG**: Server-side rendering or static site generation.
- **Edge Cache**: Static resources with SRI (Subresource Integrity).
- **Security Headers**: CSP nonce, HSTS, COOP/CORP.
- **Static Resources**: Optimized images, fonts, and assets.

## 10. Data Handling

### Cached Data

- All DSH-derived data must use cached GETs.
- Conservative TTL for cached data.
- PII masking where necessary.
- Explicit cache invalidation policies.

### No Direct API Calls

- Website does not make direct API calls to `api.bthwani.com`.
- All data must pass through cache/proxy layer.
- GET-only operations.
- No authentication required.

## 11. Deep Links & Handoff

### Deep Link Strategy

1. Marketing site CTAs point to deep routes (e.g., `https://app.bthwani.com/dsh?utm=site`).
2. UTM parameters preserved for analytics.
3. Web app handles authentication and routing.
4. Native app hand-off offered through PWA prompts.

### Handoff Flow

- Guest users: Redirected to sign-in/register, then return to original route.
- Logged-in users: Reach target screen immediately.
- Native app: Prominent "Open in App" buttons for services requiring native features.

## 12. References & Review

- Sources: `web/website/SERVICES.md`, `web/README.md`, `web/webapp/SERVICES.md`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Service exposure: `web/website/SERVICES.md`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
