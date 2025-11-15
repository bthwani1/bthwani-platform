# SND Module (سند)

Service for instant help requests and specialized services on the BThwani platform.

## Overview

SND (سند) provides a unified service for two types of help requests:

1. **Instant Help (مساعدة فورية)**: Quick, on-demand assistance with pricing, captain routing, and in-app completion with proof-of-close codes
2. **Specialized Services (خدمات متخصصة)**: Professional services with chat-only tracking and external payment processing

## Architecture

### Entities

- **SndRequestEntity**: Main request entity supporting both instant and specialized types
- **SndCategoryEntity**: Request categories (instant-only, specialized-only, or both)
- **SndPricingProfileEntity**: Pricing ranges and caps for instant requests (by scope: global, region, category, category+region)
- **SndChatMessageEntity**: Encrypted chat messages with phone masking
- **SndProofCloseEntity**: 6-digit close codes for instant request completion
- **SndConfigEntity**: Service configuration by scope
- **SndAuditLogEntity**: Immutable audit trail

### Services

- **SndRequestCommandService**: Request creation and status updates
- **SndRequestQueryService**: Request queries and listings
- **PricingEngineService**: Pricing calculation for instant requests (category > region > global)
- **RoutingEngineService**: Request routing (captain, specialized provider, or manual queue)
- **SndChatService**: Encrypted chat with phone masking and content filtering
- **SndProofCloseService**: 6-digit code generation and verification for instant requests
- **SndAuditLogger**: Immutable audit logging
- **SndMetricsCollectorService**: KPIs and metrics collection

### Adapters

- **SndWalletAdapter**: Integration with WLT service for ledger entries (instant only, no bank payouts)
- **SndNotificationAdapter**: Push notifications with quiet hours
- **SndIdentityAdapter**: Masked contact information for chat

### Controllers

- **SndUserController**: User endpoints (`/api/snd/requests`)
- **SndCaptainController**: Captain endpoints (`/api/snd/captain/requests`)
- **SndAdminController**: Admin endpoints (`/api/snd/admin`)
- **SndSupportController**: Support endpoints (`/api/snd/support`)

## Features

### Request Creation

- **Instant Requests**: Include pricing calculation, routing, and completion workflow
- **Specialized Requests**: Chat-only tracking with external payment processing
- **Idempotency**: All write operations require `Idempotency-Key` header

### Pricing (Instant Only)

- Price ranges (min/max in YER minor units)
- Category-specific profiles
- Region-specific overrides
- Review flags for unclear requests
- No pricing for specialized services

### Routing

- **Captain**: Auto-routing to available captains for instant requests
- **Specialized Provider**: Assignment to specialized service providers
- **Manual Queue**: Admin-controlled assignment

### Chat

- AES-256-GCM encryption for message bodies
- Phone number masking (`XX***XX` format)
- Link masking in messages
- Content filtering (phone numbers, payment terms)
- Urgent message flagging

### Proof-of-Close (Instant Only)

- 6-digit code generation by captain
- Verification by requester with recipient name
- Automatic ledger entry creation via WLT adapter
- Request status update to `CLOSED`

### Wallet Integration

- **Ledger entries only** for instant requests (no bank payouts)
- Integration with WLT service
- Idempotent transaction creation
- Automatic entry on request close

### Audit & Metrics

- Immutable audit logs for all sensitive operations
- KPIs: SLA compliance, cancellation rate, dispute rate, reroute count, avg resolution time
- Request status and type breakdowns

## API Endpoints

### User Endpoints (`/api/snd/requests`)

- `POST /` - Create request (instant|specialized)
- `GET /` - List user requests
- `GET /:request_id` - Get request details
- `POST /:request_id/status` - Update request status
- `POST /:request_id/close` - Close request with 6-digit code
- `GET /:request_id/messages` - List chat messages
- `POST /:request_id/messages` - Send chat message

### Captain Endpoints (`/api/snd/captain/requests`)

- `GET /` - List instant requests for captain
- `GET /:request_id` - Get request details
- `POST /:request_id/accept` - Accept instant request
- `POST /:request_id/status` - Update request status
- `POST /:request_id/close-code` - Generate close code
- `GET /:request_id/messages` - List chat messages
- `POST /:request_id/messages` - Send chat message

### Admin Endpoints (`/api/snd/admin`)

- `GET /config` - Get SND configuration
- `PATCH /config` - Update configuration (Step-Up required)
- `PATCH /pricing` - Update pricing profile (Step-Up required)
- `GET /kpis` - Get KPIs and metrics

### Support Endpoints (`/api/snd/support`)

- `GET /cases` - List support cases
- `GET /cases/:case_id` - Get case details
- `POST /actions` - Apply support action (Step-Up required for sensitive operations)

## Security

- **RBAC/ABAC**: Role-based access control for all endpoints
- **Idempotency**: Required for all POST/PATCH/DELETE operations
- **Phone Masking**: All phone numbers masked in chat
- **Encryption**: AES-256-GCM for chat messages
- **Audit Logging**: Immutable logs for all sensitive operations
- **Step-Up Auth**: Required for admin config changes and support actions

## Configuration

### Environment Variables

- `VAR_SND_CHAT_ENCRYPTION_KEY` - Chat encryption key (hex)
- `VAR_SND_CHAT_RETENTION_DAYS` - Chat message retention (default: 30)
- `WLT_API_URL` - Wallet service URL
- `NOTIFICATIONS_API_URL` - Notifications service URL
- `IDENTITY_API_URL` - Identity service URL

## Service Code

**SRV-SND-01**

## References

- C4 Model: `C4_SND_ALL_SURFACES` (version 2025-11-15)
- SSOT Ref: SRV-SND-01 (approved 2025-10-30)
- Decisions: DEC-DASH-20251104-A1 (guards/global)
- Finance Invariants: Wallet=Ledger, Bank payouts dual-sign, Idempotency + HMAC

