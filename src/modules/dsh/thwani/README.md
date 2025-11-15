# Thwani Module (ثواني)

Instant help request submodule within the DSH service.

## Overview

**Thwani** (ثواني) is a submodule of DSH that handles instant help requests. It was migrated from SRV-SND to leverage DSH infrastructure (pricing, routing, proof-of-close, wallet constraints).

## Architecture

### Entities

- **ThwaniRequestEntity**: Instant help request entity
- **ThwaniPricingProfileEntity**: Pricing profiles with scope-based hierarchy (global → region → category → category+region)
- **ThwaniProofCloseEntity**: 6-digit close codes for request completion
- **ThwaniChatMessageEntity**: Encrypted chat messages with phone masking

### Services

- **ThwaniPricingEngineService**: Calculates pricing using DSH scope pattern
- **ThwaniRoutingEngineService**: Routes requests to captains (reuses DSH routing)
- **ThwaniProofCloseService**: Manages 6-digit close codes (reuses DSH proof pattern)
- **ThwaniChatService**: Encrypted chat with phone masking (AES-256-GCM)
- **ThwaniRequestCommandService**: Request creation and status updates
- **ThwaniRequestQueryService**: Request queries and listings

### Adapters

- **ThwaniWalletAdapter**: Wallet integration with **Wallet=Ledger constraint** (ledger entries only, no bank payouts)
- **ThwaniNotificationAdapter**: Notification service integration

### Controllers

- **ThwaniUserController**: User endpoints (`/api/dls/thwani/requests`)
- **ThwaniCaptainController**: Captain endpoints (`/api/dls/thwani/captain/requests`)

## API Endpoints

### User Endpoints (`/api/dls/thwani/requests`)

- `POST /` - Create instant help request
- `GET /` - List user requests
- `GET /:request_id` - Get request details
- `POST /:request_id/status` - Update request status
- `POST /:request_id/close` - Close request with 6-digit code
- `GET /:request_id/messages` - List chat messages
- `POST /:request_id/messages` - Send chat message

### Captain Endpoints (`/api/dls/thwani/captain/requests`)

- `GET /` - List instant requests for captain
- `GET /:request_id` - Get request details
- `POST /:request_id/accept` - Accept instant request
- `POST /:request_id/status` - Update request status
- `POST /:request_id/close-code` - Generate close code
- `GET /:request_id/messages` - List chat messages
- `POST /:request_id/messages` - Send chat message

## Security & Guards

- **Idempotency-Key**: Required for all POST/PATCH/DELETE operations
- **RBAC/ABAC**: Role-based access control for all endpoints
- **Privacy**: Phone masking, encrypted chat (AES-256-GCM)
- **Step-Up Auth**: Required for admin config changes and sensitive operations

## Configuration

### Environment Variables

- `VAR_THWANI_CHAT_ENCRYPTION_KEY` - Chat encryption key (hex)
- `VAR_THWANI_CHAT_RETENTION_DAYS` - Chat message retention (default: 30)
- `WLT_API_URL` - Wallet service URL
- `NOTIFICATIONS_API_URL` - Notifications service URL

## DSH Infrastructure Reuse

### Pricing Engine

- Scope-based pricing: global → region → category → category+region
- Price ranges and ceilings (min_price_yer, max_price_yer)
- Integration with DSH pricing profiles

### Routing Engine

- Captain assignment logic
- Availability matching
- Priority scoring

### Proof-of-Close

- 6-digit code generation and verification
- Integration with DSH proof-of-delivery patterns

### Wallet Integration

- **Wallet=Ledger constraint**: ledger entries only, no bank payouts
- Integration with DSH wallet adapter

## Service Code

**SRV-DSH-02** (Thwani submodule)

## Migration Notes

This module was migrated from SRV-SND to SRV-DSH. See `docs/MIGRATION_SND_TO_DSH_THWANI.md` for details.

## References

- **DSH Base**: `docs/explainar/services/srv-dsh.md`
- **Migration Plan**: `docs/MIGRATION_SND_TO_DSH_THWANI.md`
- **SND Original**: `src/modules/snd/README.md`

