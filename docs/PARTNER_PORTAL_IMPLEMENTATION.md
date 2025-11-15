# Partner Portal & APP-PARTNER Implementation Summary

## Overview
This document summarizes the implementation of the Partner Portal (WEB-PARTNER) and APP-PARTNER application, including authentication, RBAC/ABAC, DSH integrations, ARB integrations, WLT integrations, and subscription management.

## 1. Partner Module Structure

### 1.1 Authentication (`PartnerAuthController`)
- **Endpoints:**
  - `POST /partner/auth/login` - Partner login with phone + OTP
  - `POST /partner/auth/refresh` - Refresh JWT token
  - `GET /partner/auth/profile` - Get partner profile

### 1.2 Partner Portal (`PartnerPortalController`)
- **Base Path:** `/partner/portal`
- **Domain:** `partner.bthwani.com`
- **Features:**
  - Dashboard overview
  - Orders management (DSH)
  - Bookings management (ARB)
  - Finance overview and ledger
  - Settlements
  - Exports
  - Subscriptions
  - Store management

## 2. RBAC/ABAC Implementation

### 2.1 Partner Roles
- **OWNER**: Full access to all resources
- **MANAGER**: Orders, bookings, store management
- **CASHIER**: Finance read, exports, settlements
- **MARKETER**: Subscriptions, promos, profile read

### 2.2 Permissions Matrix
| Resource | Action | Owner | Manager | Cashier | Marketer |
|----------|--------|-------|---------|---------|----------|
| finance | read | ✓ | ✗ | ✓ | ✗ |
| settlements | read | ✓ | ✗ | ✓ | ✗ |
| subscription | read | ✓ | ✗ | ✗ | ✓ |
| subscription | request | ✓ | ✗ | ✗ | ✓ |
| store | update | ✓ | ✓ | ✗ | ✗ |
| store | toggle | ✓ | ✓ | ✗ | ✗ |
| orders | read | ✓ | ✓ | ✗ | ✗ |
| orders | update | ✓ | ✓ | ✗ | ✗ |
| bookings | read | ✓ | ✓ | ✗ | ✗ |
| bookings | update | ✓ | ✓ | ✗ | ✗ |
| exports | create | ✓ | ✗ | ✓ | ✗ |
| profile | read | ✓ | ✓ | ✗ | ✓ |
| profile | update | ✓ | ✗ | ✗ | ✗ |

### 2.3 Guards
- **RBAC Guard**: Role-based access control (checks user roles)
- **ABAC Guard**: Attribute-based access control (checks permissions)
- **Idempotency Guard**: Ensures idempotent operations
- **JWT Auth Guard**: Validates JWT tokens

## 3. DSH (Delivery & Shopping) Integrations

### 3.1 Partner Endpoints
- `GET /dls/partner/profile` - Get partner profile
- `GET /dls/partner/orders` - List orders
- `GET /dls/partner/orders/:order_id` - Get order details
- `POST /dls/partner/orders/:order_id/accept` - Accept order
- `POST /dls/partner/orders/:order_id/reject` - Reject order
- `POST /dls/partner/orders/:order_id/prepare` - Prepare order
- `POST /dls/partner/orders/:order_id/ready` - Mark order as ready
- `POST /dls/partner/orders/:order_id/handoff` - Handoff to platform

### 3.2 Chat & Notes
- `GET /dls/partner/orders/:order_id/chat/messages` - List chat messages
- `POST /dls/partner/orders/:order_id/chat/messages` - Send message
- `POST /dls/partner/orders/:order_id/chat/read-ack` - Mark as read
- `GET /dls/partner/orders/:order_id/notes` - List notes
- `POST /dls/partner/orders/:order_id/notes` - Create note

### 3.3 Entities
- `OrderChatMessageEntity` - Chat messages with PII masking
- `OrderNoteEntity` - Internal/customer/system notes

## 4. ARB (Deposits & Bookings) Integrations

### 4.1 Partner Endpoints
- `GET /api/arb/partner/bookings` - List bookings
- `GET /api/arb/partner/bookings/:booking_id` - Get booking details
- `POST /api/arb/partner/bookings/:booking_id/confirm` - Confirm booking
- `POST /api/arb/partner/bookings/:booking_id/reject` - Reject booking

### 4.2 Chat
- Chat endpoints are handled via `ArbChatController` (shared with customers)

## 5. WLT (Wallet & Ledger) Integrations

### 5.1 Finance Overview
- `GET /wallet/partner/finance/overview` - Get finance overview
  - Total sales (DSH + ARB)
  - Total commissions (DSH + ARB)
  - Net payable
  - Pending balance
  - Next settlement date

### 5.2 Ledger & Transactions
- `GET /wallet/partner/finance/transactions` - List ledger transactions
  - Filter by service, category, date range
  - Cursor-based pagination
  - CoA mapping included

### 5.3 Settlements
- `GET /wallet/partner/finance/settlements` - List settlement batches
- `GET /wallet/partner/settlements/:settlement_id` - Get settlement details

### 5.4 Exports
- `POST /wallet/partner/exports` - Export finance report
  - Masked for partners (privacy)
  - Supports multiple formats (CSV, PDF, Excel)

### 5.5 CoA Mapping
- **Service:** `CoaMappingService`
- **Mappings:**
  - `4101` - DSH Sales Revenue
  - `4102` - ARB Sales Revenue
  - `4200` - Platform Commission
  - `4201` - Subscription Fee
  - `2001` - Settlement Receivable
  - `2002` - Refund Payable
  - `5001` - Platform Revenue

## 6. Subscription Management

### 6.1 Plans
- **Free Plan** (`partner_free`): Standard commission, basic reports
- **Partner Pro** (`partner_pro`): Commission discount (8% vs 12%), priority listing, featured badge
- **Partner Pro+** (`partner_pro_plus`): All Pro benefits + shared marketing campaigns

### 6.2 Endpoints
- `GET /wallet/partner/subscriptions/status` - Get current subscription
- `GET /wallet/partner/subscriptions/plans` - List available plans
- `POST /wallet/partner/subscriptions/checkout` - Checkout subscription
  - Payment methods: `wallet_balance`, `settlement_deduction`

### 6.3 Financial Integration
- Subscription fees are posted to ledger as `SUBSCRIPTION_FEE` (DEBIT) and `REVENUE` (CREDIT)
- Platform account is auto-created if it doesn't exist

## 7. Security & Privacy

### 7.1 PII Masking
- Phone numbers masked in chat messages
- Links masked in chat messages
- Bank references masked in settlements

### 7.2 Audit Logging
- All financial transactions logged
- Subscription checkouts logged
- Order actions logged

### 7.3 Idempotency
- All mutating operations require `Idempotency-Key` header
- Idempotency checked at service level

## 8. API Contracts

### 8.1 Error Format (RFC7807)
```json
{
  "type": "https://api.bthwani.com/problems/error-type",
  "title": "Error Title",
  "status": 400,
  "code": "ERROR-CODE",
  "detail": "Error detail message",
  "traceId": "trace-id"
}
```

### 8.2 Pagination
- Cursor-based pagination
- `cursor` and `limit` query parameters
- `next_cursor` and `prev_cursor` in response

### 8.3 Idempotency
- Required header: `Idempotency-Key`
- TTL: 24 hours (configurable)
- Stored in idempotency repository

## 9. Module Dependencies

### 9.1 PartnerModule
- Imports: `CoreModule`, `SharedModule`, `DshModule`, `ArbModule`, `WltModule`
- Exports: `PartnerAuthService`, `PartnerRoleService`

### 9.2 DshModule
- Added: `OrderChatMessageEntity`, `OrderNoteEntity`
- Added: `OrderChatMessageRepository`, `OrderNoteRepository`
- Added: `DshOrderChatService`, `DshOrderNotesService`
- Added: `DshOrderChatController`, `DshOrderNotesController`

### 9.3 WltModule
- Added: `CoaMappingService`
- Exports: `SubscriptionService`, `CoaMappingService`

## 10. Pending Enhancements

1. **Subscription Entity**: Create dedicated entity for managing subscriptions
2. **Deferred Billing**: Complete `settlement_deduction` payment method
3. **Next Settlement Date**: Calculate and display next settlement date
4. **Bank Reference**: Add masked bank reference in settlement details
5. **Store Toggle**: Implement actual store open/close functionality
6. **Branches Management**: Full CRUD for partner branches
7. **OTP Verification**: Integrate with Identity service for OTP verification
8. **Partner Entity**: Create dedicated partner entity/repository

## 11. Testing Checklist

- [ ] Unit tests for `PartnerAuthService`
- [ ] Unit tests for `PartnerRoleService`
- [ ] Unit tests for `DshOrderChatService`
- [ ] Unit tests for `DshOrderNotesService`
- [ ] Unit tests for `CoaMappingService`
- [ ] E2E tests for authentication flow
- [ ] E2E tests for order management flow
- [ ] E2E tests for finance overview
- [ ] E2E tests for subscription checkout
- [ ] Integration tests for RBAC/ABAC guards

## 12. Deployment Notes

### 12.1 Environment Variables
- `JWT_SECRET` or `JWT_PUBLIC_KEY` - JWT signing key
- `JWT_ALG` - JWT algorithm (RS256 or HS256)
- `DB_URL` - Database connection string
- `CACHE_URL` - Cache connection string (for idempotency)

### 12.2 Database Migrations
- Create `dsh_order_chat_messages` table
- Create `dsh_order_notes` table
- Add indexes for performance

### 12.3 Domain Configuration
- Configure `partner.bthwani.com` to point to API gateway
- Set up CORS for partner portal
- Configure rate limiting for partner endpoints

