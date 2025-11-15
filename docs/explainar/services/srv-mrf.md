# SRV-MRF - Lost & Found

## 1. Overview

The **MRF** service handles lost and found items management for the BThwani platform. This service is currently in DRAFT status and under development.

## 2. Core Journeys

_To be documented as the service is developed._

## 3. Guards & Policies

- **Idempotency-Key** will be enforced on all state-changing calls.
- **Step-Up** will be required for critical approvals.
- **Privacy**: PII masking and encryption will be applied.
- **Webhooks**: all inbound endpoints will enforce HMAC signatures with ≤300s replay window.

## 4. Screens / APIs / Interfaces

### 4.1 Representative Screens

_To be documented as screens are defined._

### 4.2 API Surface

The service API specification is in development. Refer to `oas/services/mrf/openapi.yaml` for current status.

## 5. Service Classification & Smart Engine

### 5.1 Service Classification

MRF is classified as a **Rare Service** in the Smart Engine system:

- **Rare Services**: Specialized services accessible via search or direct navigation
- **Characteristics**:
  - Not always visible on home screen
  - Lower priority in search results
  - Full feature set enabled by default when accessed

### 5.2 Runtime Variables Integration

MRF integrates with the unified `RuntimeVariablesService` for:

- **Service Flags**: `VAR_SVC_MRF_ENABLED` (default: true)
- **Scoped Configuration**: Zone > City > Service > Global precedence
- **Caching Layer**: Performance optimization for frequent lookups
- **Type-Safe Access**: Methods for service flags and configuration

## 6. Integrations & Runtime Variables

- **Dependent services**: To be determined.
- **Shared services**: `RuntimeVariablesService`.
- **Applications**: `APP-USER`, dashboards (to be determined).
- **Runtime examples**:
  - `VAR_SVC_MRF_ENABLED` — enable/disable MRF service globally.
  - `VAR_WEBAPP_FEATURE_MRF_MODE` — MRF mode for web-app (default: "full").
  - Runtime variables to be documented as the service is developed.

## 7. Database Migrations & Seeders

### 6.1 Migrations

Database migrations will be created as entities are defined.

### 6.2 Seeders

Seeders will be created for initial configuration and test data (dev environment only).

### 6.3 Migration Execution

**To run migrations:**

```bash
# Run all pending migrations
npm run migration:up

# Or via MikroORM CLI
npx mikro-orm migration:up
```

**Note**: See `docs/MIGRATION_DEPLOYMENT.md` for detailed deployment instructions.

## 7. References & Review

- Sources: `oas/services/mrf/openapi.yaml`, `apps/**/SCREENS_CATALOG.csv`, `dashboards/**/SCREENS_CATALOG.csv`, `registry/SSOT_INDEX.json`, runtime catalog VARs.
- Database: MRF entities and migrations (to be created).
- Last human review: 2025-01-15.

**Source SHA256**: `[To be generated]`
