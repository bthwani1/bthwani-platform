# KNZ Module

Marketplace service for KNZ listings, search, chat, orders and escrow-related state.

## Structure

```
knz/
  controllers/     # HTTP request handlers
    categories-admin.controller.ts
    fees-admin.controller.ts
    reporting-query.controller.ts
    export.controller.ts
    abuse-moderation.controller.ts
    ssot-bridge.controller.ts
  services/        # Business logic
    categories-admin.service.ts
    fees-admin.service.ts
    reporting-query.service.ts
    export.service.ts
    abuse-moderation.service.ts
    ssot-bridge.service.ts
    audit-log.service.ts
  repositories/    # Data access layer
    category.repository.ts
    fee-profile.repository.ts
    listing.repository.ts
    knz-order.repository.ts
    abuse-report.repository.ts
    audit-log.repository.ts
  entities/        # Domain entities
    category.entity.ts
    fee-profile.entity.ts
    listing.entity.ts
    knz-order.entity.ts
    abuse-report.entity.ts
    audit-log.entity.ts
  dto/             # Data Transfer Objects for validation
    categories/
    fees/
    reporting/
    export/
    abuse/
    common/
```

## Features

### Categories Admin
- Create, update, enable/disable categories and subcategories
- Manage sensitive category flags
- Full audit logging

### Fees Admin
- Configure fee profiles with global, region, category, or subcategory scope
- Fee overrides with conditional logic
- Step-Up authentication required for financial changes

### Reporting Query
- List listings, orders, and abuse reports with filtering
- Get metrics and KPIs (active listings, reports per 100, search CTR)
- Row-level masking for PII based on RBAC

### Export Service
- Export listings, orders, abuse reports, and metrics
- Enforced masking for sensitive data (G-PRIVACY-EXPORT guard)
- Support for CSV, Excel, and JSON formats

### Abuse Moderation
- Moderate listings (warn, hide, soft block, hard block, escalate)
- Resolve abuse reports
- Full audit trail

### SSOT Bridge
- Get SSOT decisions related to KNZ
- Check parity/trace/gaps for KNZ artifacts
- Get guard statuses (G-IDEMPOTENCY, G-NO-SECRETS, G-PRIVACY-EXPORT, G-TRACE, G-PARITY)
- Approve SSOT decisions with Step-Up

## API Routes

### Categories Admin
- `POST /knz/admin/categories` - Create category (admin, Step-Up)
- `PUT /knz/admin/categories/:category_id` - Update category (admin, Step-Up)
- `GET /knz/admin/categories/:category_id` - Get category (admin, ops, support)
- `GET /knz/admin/categories` - List categories (admin, ops, support)
- `POST /knz/admin/categories/:category_id/enable` - Enable category (admin, Step-Up)
- `POST /knz/admin/categories/:category_id/disable` - Disable category (admin, Step-Up)

### Fees Admin
- `POST /knz/admin/fees` - Create fee profile (admin, Step-Up)
- `PUT /knz/admin/fees/:id` - Update fee profile (admin, Step-Up)
- `GET /knz/admin/fees/:id` - Get fee profile (admin, finance)
- `GET /knz/admin/fees` - List fee profiles (admin, finance, ops)
- `GET /knz/admin/fees/scope/:scope` - Find by scope (admin, finance)

### Reporting Query
- `GET /knz/reporting/listings` - List listings (admin, ops, support)
- `GET /knz/reporting/listings/:id` - Get listing (admin, ops, support)
- `GET /knz/reporting/orders` - List orders (admin, ops, support, finance)
- `GET /knz/reporting/orders/:id` - Get order (admin, ops, support, finance)
- `GET /knz/reporting/abuse-reports` - List abuse reports (admin, ops, support)
- `GET /knz/reporting/abuse-reports/:id` - Get abuse report (admin, ops, support)
- `GET /knz/reporting/metrics` - Get metrics (admin, ops, finance, marketing)

### Export
- `POST /knz/export` - Export data (admin, finance, ops) - Masked only

### Abuse Moderation
- `GET /knz/admin/abuse/reports` - List abuse reports (admin, ops, support)
- `GET /knz/admin/abuse/reports/:id` - Get abuse report (admin, ops, support)
- `POST /knz/admin/abuse/listings/:id/moderate` - Moderate listing (admin, ops, support)
- `PUT /knz/admin/abuse/reports/:id/resolve` - Resolve report (admin, ops, support)

### SSOT Bridge
- `GET /knz/admin/ssot/decisions` - Get decisions (admin, ssot_governor)
- `GET /knz/admin/ssot/parity/:artifact_type/:artifact_id` - Get parity (admin, ssot_governor)
- `GET /knz/admin/ssot/guards` - Get guard statuses (admin, ssot_governor, security)
- `POST /knz/admin/ssot/decisions/:id/approve` - Approve decision (ssot_governor, Step-Up)

## Guards

- **RBAC Guard**: Enforces role-based access control
  - `admin`: Full access to all endpoints
  - `ops`: Operational endpoints
  - `support`: Support-related endpoints
  - `finance`: Financial endpoints
  - `marketing`: Marketing endpoints
  - `ssot_governor`: SSOT-related endpoints
  - `security`: Security-related endpoints

- **Step-Up Guard**: Required for sensitive operations
  - Category creation/updates
  - Fee profile creation/updates
  - SSOT decision approvals

- **Privacy Export Guard (G-PRIVACY-EXPORT)**: Enforced in ExportService
  - Blocks unmasked exports
  - All exports must have `mask_sensitive: true`

## Audit Logging

All admin actions are logged to `knz_audit_logs` table with:
- Entity type and ID
- Action performed
- User ID and email
- Old and new values
- IP address, user agent, trace ID
- Request metadata

## Next Steps

1. Implement MikroORM migrations for all entities
2. Add unit tests for services and repositories
3. Add E2E tests for controllers
4. Integrate with WLT service for escrow operations
5. Implement read models for optimized dashboard queries
6. Add BI integration for analytics
7. Implement chat functionality integration
