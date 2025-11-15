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

## 5. Integrations & Runtime Variables

- **Dependent services**: To be determined.
- **Applications**: `APP-USER`, dashboards (to be determined).
- **Runtime variables**: To be documented as the service is developed.

## 6. Database Migrations & Seeders

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
