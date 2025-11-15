# DASH-BI - Business Intelligence Dashboard

## 1. Overview

The **DASH-BI** is the business intelligence dashboard providing advanced analytics, reporting, and data insights across all platform services (DSH, WLT, ARB, KNZ, SND, KWD, AMN, ESF, MRF). It offers executive summaries, service-level metrics, financial overviews, and cross-service analytics for data-driven decision making.

## 2. Core Journeys

### 2.1 Executive Summary

1. Executive views summary via `DASH_BI_EXEC_SUMMARY` screen showing high-level KPIs.
2. Executive reviews platform-wide metrics and trends.
3. Executive tracks key performance indicators across all services.
4. Executive accesses drill-down analytics for detailed insights.

### 2.2 Service Metrics

1. BI views service metrics via `DASH_BI_SERVICE_METRICS` screen showing KPIs per service.
2. BI analyzes service performance (DSH, WLT, ARB, KNZ, SND, KWD, AMN, ESF, MRF).
3. BI tracks service-level trends and comparisons.
4. BI exports service reports for stakeholder review.

### 2.3 Financial Overview

1. BI views financial overview via `DASH_BI_FINANCIAL_OVERVIEW` screen (`GET /api/wlt/analytics`).
2. BI analyzes financial metrics (revenue, commissions, settlements, payouts).
3. BI tracks financial trends and forecasts.
4. BI integrates with finance dashboard for detailed financial data.

## 3. Guards & Policies

- **RBAC**: Role-based access control (bi role required for all screens, with read-only access for some metrics).
- **Privacy**: All PII masked in analytics and reports (G-PRIVACY-EXPORT guard).
- **Step-Up**: Required for unmasked exports and sensitive financial data.
- **Audit Logging**: All BI access and export actions logged with full context.
- **Data Retention**: Analytics data retained per entity retention policies.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

| Screen ID                    | Service | Description                 | Endpoint             |
| ---------------------------- | ------- | --------------------------- | -------------------- |
| `DASH_BI_EXEC_SUMMARY`       | GLOBAL  | Executive summary dashboard | `[TBD]`              |
| `DASH_BI_SERVICE_METRICS`    | GLOBAL  | Service-level KPIs          | `[TBD]`              |
| `DASH_BI_FINANCIAL_OVERVIEW` | WLT     | Financial analytics         | `/api/wlt/analytics` |

_Full catalog available in `dashboards/bi/SCREENS_CATALOG.csv`._

### 4.2 API Surface

The dashboard integrates with all platform services for analytics and reporting. Refer to individual service documentation in `docs/explainar/services/` for complete API details.

## 5. Service Integration & Smart Engine

### 5.1 Service Integration

DASH-BI integrates with all platform services:

- **Primary Services**: DSH, WLT, ARB, KNZ, AMN (full analytics access)
- **Secondary Services**: KWD, SND, ESF, MRF (full analytics access)
- **Service Classification**: All services visible in analytics

### 5.2 Smart Engine Integration

- **Metric Prioritization**: High-value metrics prioritized
- **Trend Analysis**: Smart trend detection and forecasting
- **Personalization**: BI preferences and filters personalized

## 6. Navigation & User Experience

### 6.1 Main Navigation

- **Executive Tab**: Executive summary and high-level KPIs
- **Services Tab**: Service-level metrics and analytics
- **Financial Tab**: Financial analytics and forecasting
- **Cross-Service Tab**: Cross-service analytics and insights

### 6.2 Top App Bar

- **Title**: Context-aware title (Executive Summary, Service Metrics, Financial, Cross-Service)
- **Actions**: Quick actions (export, filter, refresh, customize)
- **Notifications**: Data refresh notifications

### 6.3 Home Screen Features

- **Executive Summary**: Platform-wide KPIs and trends
- **Service Health**: Service status and performance
- **Financial Overview**: Revenue and financial trends
- **Quick Actions**: Export report, view service, customize dashboard

### 6.4 Design System

- **RTL Support**: Full RTL support for Arabic interface
- **Theme**: Light/dark theme support
- **Accessibility**: WCAG AA compliance
- **Localization**: Arabic and English support

## 7. Features & Capabilities

### 7.1 Executive Summary

- **Platform KPIs**: Total orders, revenue, active users
- **Trend Analysis**: Week-over-week, month-over-month trends
- **Service Health**: Service status and availability
- **Forecasting**: Revenue and growth projections

### 7.2 Service-Level Metrics

- **DSH Analytics**: Order volume, partner performance, SLA compliance
- **WLT Analytics**: Transaction volume, settlements, payouts
- **ARB Analytics**: Booking volume, escrow, dispute resolution
- **Other Services**: KNZ, KWD, AMN, ESF, MRF, SND metrics

### 7.3 Financial Analytics

- **Revenue Analysis**: Revenue by service, trends, forecasts
- **Settlement Analytics**: Settlement batch volume, processing time
- **Financial Forecasting**: Revenue projections, cash flow analysis
- **Budget Tracking**: Budget vs. actual comparisons

### 7.4 Cross-Service Analytics

- **User Journey**: User engagement across services
- **Operational Efficiency**: Platform-wide SLA compliance
- **Cost Analysis**: Cost per transaction, resource utilization
- **Trend Analysis**: Cross-service usage patterns

## 8. Integrations & Runtime Variables

- **Primary services**: All platform services (DSH, WLT, ARB, KNZ, SND, KWD, AMN, ESF, MRF).
- **Shared services**: `RuntimeVariablesService`, `SmartEngineService`.
- **Supporting services**: `IDENTITY` (authentication, RBAC), data warehouse/ETL pipelines.
- **Runtime examples**:
  - `VAR_BI_DATA_REFRESH_INTERVAL_MIN` — Data refresh interval (default: 15 minutes).
  - `VAR_BI_EXPORT_MASKING_ENABLED` — Export masking flag (default: true).
  - `VAR_BI_RETENTION_DAYS` — Analytics data retention (default: 365 days).
  - Runtime keys managed through the control panel and documented in `runtime/RUNTIME_VARS_CATALOG.csv`.

## 6. Executive Summary

### Platform-Wide KPIs

- **Total Orders**: Cross-service order volume (DSH, ARB, AMN, SND).
- **Total Revenue**: Platform revenue across all services.
- **Active Users**: User engagement metrics.
- **Service Health**: Service status and availability.

### Trend Analysis

- Week-over-week growth.
- Month-over-month trends.
- Year-over-year comparisons.
- Seasonal patterns and forecasts.

## 7. Service-Level Metrics

### DSH Metrics

- Order volume and growth.
- Average order value.
- Partner performance.
- Delivery time and SLA compliance.

### WLT Metrics

- Transaction volume.
- Settlement batches.
- Payout processing.
- Ledger balance trends.

### ARB Metrics

- Booking volume.
- Escrow amounts.
- Booking completion rate.
- Dispute resolution time.

### Other Services

- **KNZ**: Listing volume, search CTR, abuse reports.
- **KWD**: Job listings, applications, moderation actions.
- **AMN**: Ride volume, captain performance, SOS incidents.
- **ESF**: Blood donation requests, matching success rate.
- **MRF**: Lost & found reports, recovery rate.
- **SND**: Request volume, completion rate, specialist assignments.

## 8. Financial Analytics

### Revenue Analysis

- Total platform revenue.
- Revenue by service.
- Revenue trends and forecasts.
- Commission and fee breakdown.

### Settlement Analytics

- Settlement batch volume.
- Settlement processing time.
- Partner payout trends.
- Bank reconciliation status.

### Financial Forecasting

- Revenue projections.
- Cash flow analysis.
- Budget vs. actual comparisons.
- Financial health indicators.

## 9. Cross-Service Analytics

### User Journey Analysis

- User engagement across services.
- Service adoption rates.
- Cross-service usage patterns.
- User retention and churn.

### Operational Efficiency

- Platform-wide SLA compliance.
- Resource utilization.
- Cost per transaction.
- Operational efficiency trends.

## 10. Data Export & Reporting

### Export Formats

- CSV for data analysis.
- Excel for stakeholder reports.
- JSON for API integration.
- PDF for executive summaries.

### Privacy Controls

- All exports masked by default (G-PRIVACY-EXPORT guard).
- Step-Up required for unmasked exports.
- Audit logging for all export actions.
- Data retention compliance.

## 11. References & Review

- Sources: `dashboards/bi/SCREENS_CATALOG.csv`, `oas/services/*/openapi.yaml`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Screen catalog: `dashboards/bi/SCREENS_CATALOG.csv`.
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
