# ESF Module (اسعِفني)

Emergency blood donation matching service for the BThwani platform.

## Overview

ESF (اسعِفني) is a service that connects blood donation requesters with compatible donors in real-time. The service handles:

- Blood donation requests with ABO/Rh compatibility matching
- Donor availability management
- Secure encrypted chat between requesters and donors
- Real-time notifications
- Admin monitoring and configuration
- Support moderation tools

## Architecture

### Entities

- **EsfRequestEntity**: Blood donation requests
- **EsfDonorProfileEntity**: Donor profiles and availability
- **EsfChatMessageEntity**: Encrypted chat messages
- **EsfMatchEntity**: Matches between requests and donors
- **EsfConfigEntity**: Runtime configuration
- **EsfAuditLogEntity**: Audit trail

### Services

- **EsfRequestService**: Request creation and management
- **EsfMatchingService**: ABO/Rh compatibility matching engine
- **EsfDonorProfileService**: Donor profile and availability management
- **EsfChatService**: Encrypted chat with phone masking
- **EsfNotificationAdapter**: Push notifications with quiet hours
- **EsfIdentityAdapter**: Integration with Identity service for blood type
- **EsfMetricsCollector**: KPIs and SLA monitoring
- **EsfAuditLogger**: Immutable audit logging

### Controllers

- **EsfUserController**: User-facing endpoints (`/esf/*`)
- **EsfAdminController**: Admin endpoints (`/esf/admin/*`)
- **EsfSupportController**: Support endpoints (`/esf/support/*`)

## API Endpoints

### User Endpoints

- `POST /esf/requests` - Create blood donation request
- `GET /esf/requests/:request_id` - Get request details
- `GET /esf/requests` - List my requests
- `GET /esf/matches/inbox` - Get donor matches inbox
- `PATCH /esf/me/availability` - Update donor availability
- `GET /esf/me/profile` - Get ESF donor profile
- `GET /esf/requests/:request_id/messages` - List chat messages
- `POST /esf/requests/:request_id/messages` - Send chat message

### Admin Endpoints

- `GET /esf/admin/requests` - Search requests (Step-Up required)
- `GET /esf/admin/config` - Get runtime config (Step-Up required)
- `PATCH /esf/admin/config` - Update runtime config (Step-Up required)
- `GET /esf/admin/metrics` - Get metrics (Step-Up required)
- `GET /esf/admin/alerts` - Get alerts (Step-Up required)

### Support Endpoints

- `GET /esf/support/requests/:request_id` - Get request (masked)
- `GET /esf/support/requests/:request_id/messages` - Get messages (masked)
- `POST /esf/support/actions` - Apply moderation action (Step-Up required)

## Features

### Matching Engine

- Strict ABO/Rh compatibility matching
- City-based and radius-based matching
- Cooldown period enforcement (default 90 days)
- Batch size control (default 10 matches)
- SLA target tracking (default 30 minutes)

### Privacy & Security

- AES-256-GCM encryption for chat messages
- Phone number masking
- No raw phone numbers in logs
- RBAC/ABAC for admin and support access
- Step-Up authentication for sensitive operations
- Idempotency keys for all POST/PATCH operations

### Notifications

- Push notifications via Notifications service
- Quiet hours: 22:00-08:00 (Asia/Aden) with urgent override
- 24-hour deduplication window

### Metrics & Alerts

- Match time tracking
- No-show rate monitoring
- Closure time tracking
- Yellow/Red alert thresholds

## Runtime Variables

- `VAR_ESF_MAX_RADIUS_KM` - Maximum matching radius in km (default: 50)
- `VAR_ESF_MATCH_BATCH_SIZE` - Number of matches per request (default: 10)
- `VAR_ESF_DONOR_COOLDOWN_DAYS` - Cooldown period after donation (default: 90)
- `VAR_ESF_SLA_MATCH_MINUTES` - SLA target for matching (default: 30)
- `VAR_ESF_QUIET_HOURS` - Quiet hours format: "HH:MM-HH:MM" (default: "22:00-08:00")
- `VAR_CHAT_RETENTION_DAYS` - Chat message retention (default: 30)
- `VAR_MSG_FIELD_ENCRYPTION_KEY` - AES-GCM encryption key (hex format)
- `NOTIFICATIONS_SERVICE_URL` - Notifications service endpoint
- `IDENTITY_SERVICE_URL` - Identity service endpoint

## Database

All tables are prefixed with `esf_`:

- `esf_requests`
- `esf_donor_profiles`
- `esf_chat_messages`
- `esf_matches`
- `esf_config`
- `esf_audit_logs`

## RBAC Roles

- `user_requester` - Create and manage requests
- `user_donor` - Set availability and respond to matches
- `admin_operator` - Configure and monitor (Step-Up required)
- `support_agent` - Investigate and moderate (Step-Up for actions)

## Governance

- Namespace: `/esf/*`
- Aliases: `/es3afni`, `/blood` (redirect 308 until 2025-12-15, then 410)
- Timezone: Asia/Aden
- Idempotency: Required for all POST/PATCH
- Pagination: Cursor-based with limit

## Next Steps

1. Add unit tests for services
2. Add E2E tests for controllers
3. Implement webhook support for notifications
4. Add rate limiting per user
5. Implement chat retention cleanup job
6. Add OpenAPI specification

