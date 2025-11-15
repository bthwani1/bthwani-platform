# Field Module (APP-FIELD BFF)

Backend-for-frontend for the field mobile app. Sole purpose: partner acquisition and onboarding only.

## Overview

APP-FIELD is a mobile application for internal teams and contracted field agents to:
- Capture partner leads
- Conduct site surveys
- Collect KYC documents
- Capture consent/contract acknowledgments
- Complete readiness checklists

**Scope Lock**: Partner acquisition → verification → onboarding → go-live readiness only. No links to DSH/ARB/WLT/DASHboards.

## Architecture

### Controllers

- **FieldAuthController** (`/field/auth/*`): Authentication, OTP verification, profile, zones
- **FieldTasksController** (`/field/tasks/*`): Task management, route optimization
- **FieldPartnersController** (`/field/partners/*`): Partner onboarding flows
- **FieldMediaController** (`/field/media/*`): Media upload pre-signing

### Services

- **FieldAuthService**: Authentication orchestration
- **FieldTasksService**: Task orchestration with SLA checks
- **FieldPartnersService**: Partner onboarding flow orchestration
- **FieldMediaService**: Media operations
- **FieldMetricsCollector**: KPIs and SLA metrics
- **FieldAuditLogger**: Audit logging

### Adapters

- **FieldIdentityAdapter**: Identity & HR/Agent Registry integration
- **FieldTaskEngineAdapter**: Task & Route Engine integration
- **FieldPartnerOnboardingAdapter**: Partner Onboarding Core integration
- **FieldMediaStoreAdapter**: Media Store integration
- **FieldNotificationsAdapter**: Notifications Hub integration

## API Endpoints

### Authentication

- `POST /field/auth/login` - Request OTP
- `POST /field/auth/verify` - Verify OTP and get tokens
- `GET /field/auth/me` - Get agent profile
- `GET /field/auth/zones` - Get assigned zones
- `POST /field/auth/tutorial/complete` - Mark tutorial as complete

### Tasks

- `GET /field/tasks` - List tasks (with filters)
- `GET /field/tasks/today` - Get today's tasks
- `GET /field/tasks/:task_id` - Get task details
- `PATCH /field/tasks/:task_id/status` - Update task status
- `POST /field/tasks/:task_id/visit/start` - Start visit
- `POST /field/tasks/:task_id/visit/finish` - Finish visit
- `GET /field/tasks/route/optimize` - Get optimized route

### Partners

- `POST /field/partners/leads` - Create partner lead
- `PATCH /field/partners/leads/:partner_id` - Update partner lead
- `POST /field/partners/:partner_id/site-survey` - Submit site survey
- `POST /field/partners/:partner_id/kyc-docs` - Submit KYC documents
- `POST /field/partners/:partner_id/consent` - Submit consent/contract
- `POST /field/partners/:partner_id/readiness` - Submit readiness checklist
- `GET /field/partners` - List partners
- `GET /field/partners/:partner_id` - Get partner profile
- `POST /field/partners/:partner_id/visits` - Create unplanned visit (step-up required)

### Media

- `POST /field/media/presigned-url` - Generate pre-signed URL for upload
- `POST /field/media/:media_id/verify` - Verify upload completion
- `GET /field/media/partners/:partner_id` - List partner media

## Configuration

Required environment variables:

- `IDENTITY_SERVICE_URL` - Identity service base URL
- `TASK_ENGINE_SERVICE_URL` - Task engine service base URL
- `PARTNER_ONBOARDING_SERVICE_URL` - Partner onboarding service base URL
- `MEDIA_STORE_SERVICE_URL` - Media store service base URL
- `NOTIFICATIONS_SERVICE_URL` - Notifications service base URL

## Security

- JWT authentication required for all endpoints (except login/verify)
- Step-up authentication required for sensitive actions (unplanned visits)
- RBAC: agent/supervisor roles
- ABAC: zone-based access control
- Phone masking for external contacts
- Idempotency keys required for write operations

## Observability

### Events

- `field.screen_view`
- `field.task_status_change`
- `field.form_submit`
- `field.sync_event`

### Metrics

- `field.tasks_overdue_rate`
- `field.sync_error_rate`
- `field.offline_duration_p75`
- `field.guard_violations`

## Related Documentation

- Screen catalog: `apps/field/SCREENS_CATALOG.csv`
- Architecture spec: See project root C4 model JSON

