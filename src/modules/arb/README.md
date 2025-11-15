# ARB Module (عربون)

Deposit & booking service for offers (عربون) across BThwani platform.

## Overview

ARB (عربون) is a service that handles deposits and bookings for service offers. The service provides:

- **Offer Management**: Partners create and manage service offers with deposit rules
- **Booking System**: Customers create bookings with escrow holds
- **Escrow Engine**: Automatic deposit handling based on policies (release days, no-show penalties)
- **Booking Chat**: Encrypted chat between customers and partners
- **Admin Configuration**: Policy configuration by scope (subcategory > category > region > global)
- **Support Tools**: Dispute resolution with audit trail

## Architecture

### Entities

- **OfferEntity**: Service offers with deposit rules, slots, and calendar configuration
- **BookingEntity**: Customer bookings with escrow status tracking
- **BookingChatMessageEntity**: Encrypted chat messages with phone masking
- **BookingAmendmentEntity**: Price/schedule change requests
- **ArbConfigEntity**: Policy configuration by scope
- **ArbAuditLogEntity**: Immutable audit trail

### Services

- **OfferService**: Offer catalog and management
- **BookingCommandService**: Booking creation and status updates
- **BookingQueryService**: Booking queries and listings
- **EscrowEngineService**: Escrow hold/release/refund/capture logic
- **ArbChatService**: Encrypted chat with privacy controls
- **ArbMetricsCollectorService**: KPIs and metrics
- **ArbAuditLogger**: Immutable audit logging

### Adapters

- **ArbWalletAdapter**: Integration with WLT service for escrow operations
- **ArbIdentityAdapter**: Integration with Identity service for masked contacts
- **ArbNotificationAdapter**: Push notifications with quiet hours

### Controllers

- **ArbOffersController**: Offer endpoints (`/api/arb/offers`)
- **ArbBookingsController**: Customer booking endpoints (`/api/arb/bookings`)
- **ArbPartnerBookingsController**: Partner booking endpoints (`/api/arb/partner/bookings`)
- **ArbChatController**: Chat endpoints (`/api/arb/bookings/:booking_id/chat`)
- **ArbAdminController**: Admin endpoints (`/api/arb/admin`)
- **ArbSupportController**: Support endpoints (`/api/arb/support`)

## API Endpoints

### Offers

- `GET /api/arb/offers` - Search offers (public)
- `GET /api/arb/offers/:offer_id` - Get offer details (public)
- `POST /api/arb/offers` - Create offer (partner, idempotency required)
- `PATCH /api/arb/offers/:offer_id` - Update offer (partner, idempotency required)

### Bookings

- `POST /api/arb/bookings` - Create booking + deposit hold (customer, idempotency required)
- `GET /api/arb/bookings/:booking_id` - Get booking detail (role-aware)
- `GET /api/arb/bookings` - List customer bookings (customer)
- `GET /api/arb/partner/bookings` - List partner bookings (partner)
- `POST /api/arb/bookings/:booking_id/status` - Update status (partner/customer, idempotency required)

### Chat

- `GET /api/arb/bookings/:booking_id/chat/messages` - List chat messages (participants/support/admin)
- `POST /api/arb/bookings/:booking_id/chat/messages` - Send chat message (participants, idempotency required)
- `POST /api/arb/bookings/:booking_id/chat/escalate` - Escalate to support (participants, idempotency required)
- `GET /api/arb/bookings/:booking_id/chat/audit` - Compliance chat access (support/admin, step-up required)

### Amendments

- `POST /api/arb/bookings/:booking_id/amendments` - Create amendment (participants, idempotency required)
- `POST /api/arb/bookings/:booking_id/amendments/:amendment_id/accept` - Accept amendment (counterparty, idempotency required)
- `POST /api/arb/bookings/:booking_id/amendments/:amendment_id/reject` - Reject amendment (counterparty, idempotency required)

### Admin

- `GET /api/arb/admin/config` - Get ARB configs (admin)
- `PATCH /api/arb/admin/config` - Update ARB configs (admin/finance, step-up required, idempotency required)
- `GET /api/arb/admin/kpis` - KPIs & aggregates (admin/finance)

### Support

- `GET /api/arb/support/disputes` - List disputes (support)
- `GET /api/arb/support/bookings/:booking_id` - Support booking view (support)
- `POST /api/arb/support/resolutions` - Apply dispute resolution (support/finance, step-up required, idempotency required)

## Features

### Escrow Engine

- Automatic escrow hold on booking creation
- Policy-based release/refund based on scope precedence:
  - Subcategory > Category > Region > Global
- No-show penalty calculation:
  - `min(VAR_ARB_NO_SHOW_KEEP_PCT% of escrow, VAR_ARB_NO_SHOW_CAP_YER)`
  - Minimum 20% of escrow, capped at 3000 YER by default
- Release days: `VAR_ARB_RELEASE_DAYS` (configurable per scope)

### Privacy & Security

- AES-256-GCM encryption for chat messages
- Phone number masking in chat
- Link masking in chat
- Payment-related keyword filtering
- No raw phones in logs
- RBAC/ABAC for admin and support access
- Step-Up authentication for sensitive operations
- Idempotency keys for all POST/PATCH/DELETE operations

### Notifications

- Push notifications via Notifications service
- Quiet hours: 22:00-08:00 (Asia/Aden) with urgent override
- Booking lifecycle notifications
- Chat message notifications

### Metrics & KPIs

- `arb_booking_volume` - Total bookings
- `arb_active_escrow_balance` - Active escrow balance
- `arb_no_show_rate` - No-show rate percentage
- `arb_dispute_rate` - Dispute rate percentage
- `arb_avg_release_time_days` - Average release time
- `arb_conversion_rate_offer_to_booking` - Conversion rate

## Runtime Variables

- `VAR_ARB_RELEASE_DAYS` - Default release days (configurable per scope)
- `VAR_ARB_NO_SHOW_KEEP_PCT` - No-show penalty percentage (default: 20)
- `VAR_ARB_NO_SHOW_CAP_YER` - No-show penalty cap in YER (default: 3000)
- `VAR_ARB_QUIET_HOURS` - Quiet hours format: "HH:MM-HH:MM" (default: "22:00-08:00")
- `VAR_ARB_CHAT_RETENTION_DAYS` - Chat message retention (default: 30)
- `VAR_ARB_CHAT_ENCRYPTION_KEY` - AES-GCM encryption key (hex format)
- `WLT_API_URL` - Wallet/Ledger service endpoint
- `NOTIFICATIONS_SERVICE_URL` - Notifications service endpoint
- `IDENTITY_SERVICE_URL` - Identity service endpoint

## Database

All tables are prefixed with `arb_`:

- `arb_offers`
- `arb_bookings`
- `arb_booking_chat_messages`
- `arb_booking_amendments`
- `arb_configs`
- `arb_audit_logs`

## RBAC Roles

- `customer` - Create bookings, chat, view own bookings
- `partner` - Manage offers, view/manage bookings, chat
- `admin` - Configure policies, view KPIs (Step-Up for config changes)
- `support` - View disputes, apply resolutions (Step-Up for resolutions)
- `finance` - View finance views, apply resolutions (Step-Up for resolutions)

## Governance

- **Service Code**: SRV-ARB-01
- **Version**: 2.0
- **Namespace**: `/api/arb/*`
- **Timezone**: Asia/Aden
- **Idempotency**: Required for all POST/PATCH/DELETE
- **Pagination**: Cursor-based with limit
- **Currency**: YER (default), no fractional digits by default

## Escrow Policies

### Release Days

Configurable per scope (Subcategory > Category > Region > Global):
- Default: `VAR_ARB_RELEASE_DAYS`
- Applied after booking completion/attendance

### No-Show Policy

- Penalty: `min(VAR_ARB_NO_SHOW_KEEP_PCT% of escrow, VAR_ARB_NO_SHOW_CAP_YER)`
- Minimum: 20% of escrow
- Cap: 3000 YER (default)
- Remaining amount refunded to customer

### Deposit Policies

- `FULL_REFUND` - Full refund on cancellation
- `PARTIAL_REFUND` - Partial refund based on policy
- `NO_REFUND` - No refund (rare, for special cases)

## Next Steps

1. Add unit tests for services
2. Add E2E tests for controllers
3. Implement amendment workflow
4. Add chat retention cleanup job
5. Complete OpenAPI specification
6. Add migration files
7. Implement reconciliation views for finance


