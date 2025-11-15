# Captain Module (APP-CAPTAIN BFF)

## Overview

This module implements the BFF (Backend for Frontend) for APP-CAPTAIN mobile application. It orchestrates interactions between the captain mobile app and backend services (DSH, AMN, WLT, Identity).

## Architecture

The module follows NestJS best practices with clear separation of concerns:

```
captain/
  controllers/     # HTTP request handlers
    captain-auth.controller.ts
    captain-availability.controller.ts
    captain-jobs.controller.ts
    captain-pod.controller.ts
    captain-earnings.controller.ts
  services/        # Business logic & orchestration
    captain-auth.service.ts
    captain-availability.service.ts
    captain-jobs.service.ts
    captain-pod.service.ts
    captain-earnings.service.ts
  dto/             # Data Transfer Objects
    auth/
    availability/
    jobs/
    pod/
    earnings/
```

## Controllers

### CaptainAuthController (`/auth`)
- `POST /auth/login` - Start OTP flow
- `POST /auth/otp/verify` - Verify OTP and issue JWT
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout captain

### CaptainAvailabilityController (`/api`)
- `PATCH /api/dls/availability` - Update DSH availability
- `PATCH /api/amn/availability` - Update AMN availability
- `GET /api/availability/status` - Get current availability status

### CaptainJobsController (`/api`)
- `GET /api/dls/jobs/offers` - List DSH job offers
- `POST /api/dls/jobs/:id/accept` - Accept DSH job
- `POST /api/dls/jobs/:id/reject` - Reject DSH job
- `PATCH /api/dls/jobs/:id/status` - Update DSH job status
- `GET /api/amn/offers` - List AMN trip offers
- `POST /api/amn/trips/:id/accept` - Accept AMN trip
- `PATCH /api/amn/trips/:id/status` - Update AMN trip status
- `POST /api/amn/trips/:id/negotiate` - Negotiate AMN fare (80-120%)
- `POST /api/dls/location` - Update captain location

### CaptainPodController (`/api/dls/jobs`)
- `POST /api/dls/jobs/:id/pod/code` - Submit PoD code (6-digit)
- `POST /api/dls/jobs/:id/pod/photo` - Submit PoD photo (with masking)

### CaptainEarningsController (`/wallet`)
- `GET /wallet/me/balance` - Get captain wallet balance
- `GET /wallet/me/earnings` - Get earnings breakdown
- `POST /wallet/payouts` - Create payout request (step-up required)
- `GET /wallet/payouts` - Get payout history

## Guards

All endpoints enforce:
- **JwtAuthGuard** - JWT authentication (except public auth endpoints)
- **RbacGuard** - Role-based access control (`captain` role)
- **IdempotencyGuard** - Idempotency key required for POST/PATCH operations
- **StepUpGuard** - Step-up authentication for sensitive operations (payouts)

## Service Dependencies

- **DshModule** - DSH service for delivery jobs
- **AmnModule** - AMN service for safe taxi rides
- **WltModule** - Wallet service for earnings and payouts

## TODO

- [ ] Integrate with Identity service for OTP verification
- [ ] Integrate with routing_dispatch service for availability
- [ ] Implement idempotency checking
- [ ] Add AMN eligibility checks (female only)
- [ ] Implement PoD photo masking and storage
- [ ] Integrate with WLT service for earnings/payouts
- [ ] Add location tracking integration
- [ ] Implement fare negotiation validation

## Error Codes

See `apps/captain/ERROR_CATALOG.json` for complete error catalog:
- `CAP-OTP-INVALID` (401)
- `CAP-NOT-ELIGIBLE-AMN` (403)
- `CAP-OFFER-EXPIRED` (409)
- `CAP-POD-INVALID` (422)
- `CAP-PAYOUT-LIMIT` (422)

## Related Documentation

- `apps/captain/SCREENS_CATALOG.csv` - Screen inventory
- `apps/captain/TRACEABILITY.json` - Screen-to-endpoint mapping
- `docs/app-captain-architecture.json` - C4 architecture model

