# DASH-MARKETING - Marketing Dashboard

## 1. Overview

The **DASH-MARKETING** is the marketing dashboard for managing campaigns, promotions, partner performance, and marketplace analytics across KNZ (Marketplace) and DSH (Delivery & Shopping). It provides tools for campaign management, partner monitoring, and marketing analytics integration with BI dashboard.

## 2. Core Journeys

### 2.1 Campaign Management

1. Marketing views campaigns via `DASH_MARKETING_CAMPAIGNS` screen (`GET /api/knz/campaigns`).
2. Marketing creates promotional campaigns for marketplace listings.
3. Marketing manages campaign budgets and targeting.
4. Marketing tracks campaign performance and ROI.

### 2.2 Partner Performance

1. Marketing views DSH partner performance via `DASH_MARKETING_DSHPARTNERS` screen (`GET /api/dls/partners/pending`).
2. Marketing monitors active and pending store performance.
3. Marketing tracks partner onboarding and activation rates.
4. Marketing analyzes partner sales and commission data.

### 2.3 Marketing Analytics

1. Marketing views analytics via `DASH_MARKETING_ANALYTICS` screen (linked to BI dashboard).
2. Marketing tracks marketing KPIs and metrics.
3. Marketing analyzes campaign effectiveness and user engagement.
4. Marketing exports reports for stakeholder review.

## 3. Guards & Policies

- **RBAC**: Role-based access control (marketing role required for all screens).
- **Step-Up**: Required for campaign budget changes and partner policy updates.
- **Privacy**: Partner PII masked in analytics and reports.
- **Audit Logging**: All campaign and partner actions logged with full context.
- **Idempotency-Key**: Required for all state-changing operations (campaigns, promotions).

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Screen ID                    | Service | Description             | Endpoint                    |
| ---------------------------- | ------- | ----------------------- | --------------------------- |
| `DASH_MARKETING_CAMPAIGNS`   | KNZ     | Campaign management     | `/api/knz/campaigns`        |
| `DASH_MARKETING_DSHPARTNERS` | DSH     | DSH partner performance | `/api/dls/partners/pending` |
| `DASH_MARKETING_ANALYTICS`   | GLOBAL  | Marketing analytics     | `[TBD]` (linked to BI)      |

_Full catalog available in `dashboards/marketing/SCREENS_CATALOG.csv`._

### 4.2 API Surface

The dashboard integrates with KNZ and DSH services for marketing operations. Refer to individual service documentation in `docs/explainar/services/` for complete API details.

## 5. Service Integration & Smart Engine

### 5.1 Service Integration

DASH-MARKETING integrates with the following services:

- **Primary Services**: KNZ (marketplace campaigns), DSH (partner performance)
- **Service Classification**:
  - KNZ: Primary Service (full marketing access)
  - DSH: Primary Service (full marketing access)

### 5.2 Smart Engine Integration

- **Campaign Ranking**: Campaigns ranked by performance and ROI
- **Partner Prioritization**: High-performing partners prioritized
- **Personalization**: Marketing preferences and filters personalized

## 6. Navigation & User Experience

### 6.1 Main Navigation

- **Campaigns Tab**: Campaign management and analytics
- **Partners Tab**: DSH partner performance and analytics
- **Analytics Tab**: Marketing analytics and BI integration
- **Settings Tab**: Campaign settings and configuration

### 6.2 Top App Bar

- **Title**: Context-aware title (Campaigns, Partners, Analytics, Settings)
- **Actions**: Quick actions (create campaign, export report, filter)
- **Notifications**: Campaign performance notifications

### 6.3 Home Screen Features

- **Campaign Summary**: Active campaigns and performance
- **Partner Performance**: Top performing partners
- **Marketing KPIs**: Key marketing indicators
- **Quick Actions**: Create campaign, view analytics, export report

### 6.4 Design System

- **RTL Support**: Full RTL support for Arabic interface
- **Theme**: Light/dark theme support
- **Accessibility**: WCAG AA compliance
- **Localization**: Arabic and English support

## 7. Features & Capabilities

### 7.1 Campaign Management

- **Campaign Creation**: Create marketplace and partner promotions
- **Budget Management**: Campaign budget allocation and tracking
- **Targeting**: Audience targeting and segmentation
- **Performance Tracking**: Campaign metrics and ROI

### 7.2 Partner Performance

- **Performance Analytics**: Partner sales and commission tracking
- **Store Analytics**: Store performance metrics
- **Activation Tracking**: Partner onboarding and activation rates
- **Segmentation**: Partner segmentation (top performers, new, at-risk)

### 7.3 Marketing Analytics

- **BI Integration**: Integration with BI dashboard
- **Cross-Service Metrics**: Marketing metrics across services
- **User Engagement**: User engagement analysis
- **Campaign ROI**: Campaign ROI tracking and analysis

## 8. Integrations & Runtime Variables

- **Primary services**: `KNZ` (marketplace campaigns), `DSH` (partner performance, store analytics).
- **Shared services**: `RuntimeVariablesService`, `SmartEngineService`, `BannerService`.
- **Supporting services**: `BI` (marketing analytics), `IDENTITY` (authentication, RBAC).
- **Runtime examples**:
  - `VAR_MARKETING_CAMPAIGN_BUDGET_MAX_YER` — Maximum campaign budget (default: 1,000,000 YER).
  - `VAR_MARKETING_PARTNER_PROMO_RATE_PCT` — Partner promotion rate (default: 10%).
  - `VAR_MARKETING_ANALYTICS_REFRESH_INTERVAL_SEC` — Analytics refresh interval (default: 300 seconds).
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. Campaign Management

### Campaign Types

- **Marketplace Promotions**: Discounts and special offers for KNZ listings.
- **Partner Promotions**: Store-specific promotions for DSH partners.
- **Platform-Wide Campaigns**: Cross-service promotional campaigns.

### Campaign Workflow

1. Marketing creates campaign with:
   - Campaign name and description.
   - Budget allocation.
   - Target audience and targeting rules.
   - Start/end dates.
   - Idempotency-Key header.

2. System activates campaign:
   - Applies promotions to eligible listings/partners.
   - Tracks campaign performance.
   - Monitors budget consumption.

3. Marketing reviews performance:
   - Views campaign metrics (impressions, clicks, conversions).
   - Adjusts budget or targeting (Step-Up required).
   - Pauses or ends campaign.

## 7. Partner Performance Analytics

### Key Metrics

- **Active Stores**: Number of active DSH partners.
- **Pending Stores**: Number of partners awaiting activation.
- **Sales Volume**: Total sales per partner.
- **Commission Revenue**: Platform commission from partners.
- **Activation Rate**: Partner onboarding to activation conversion.

### Partner Segmentation

- **Top Performers**: Partners with highest sales volume.
- **New Partners**: Recently onboarded partners.
- **At-Risk Partners**: Partners with declining performance.

## 8. BI Integration

### Analytics Dashboard

Marketing analytics are integrated with BI dashboard for:

- Cross-service marketing metrics.
- User engagement analysis.
- Campaign ROI tracking.
- Market trend analysis.

### Data Export

Marketing can export:

- Campaign performance reports.
- Partner analytics (masked PII).
- Marketing KPI summaries.

## 9. References & Review

- Sources: `dashboards/marketing/SCREENS_CATALOG.csv`, `oas/services/knz/openapi.yaml`, `oas/services/dsh/openapi.yaml`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Screen catalog: `dashboards/marketing/SCREENS_CATALOG.csv`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
