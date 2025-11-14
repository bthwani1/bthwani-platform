# BThwani Platform

**Mono-repository** containing specifications, runtime code, documentation, and governance for the BThwani multi-service platform.

## Repository Strategy

This repository follows a **mono-repo architecture** where **everything** related to the platform lives in one place:

- ✅ **OpenAPI Specifications** (`oas/`) — API contracts for all services
- ✅ **Runtime Code** (`src/`) — NestJS service implementations
- ✅ **Documentation** (`docs/`) — Service documentation, governance, and guidance
- ✅ **Scripts & Tools** (`scripts/`, `tools/`) — Build, validation, and audit automation
- ✅ **Registry & Artifacts** (`registry/`, `dist/`) — SSOT index, audit reports, traceability matrices
- ✅ **Applications & Dashboards** (`apps/`, `dashboards/`) — Screen catalogs and UI specifications
- ✅ **Web Surfaces** (`web/`) — Web app and website configurations

## Current Status

### Services

| Service             | Code | Status       | Version | Notes                                                                                                               |
| ------------------- | ---- | ------------ | ------- | ------------------------------------------------------------------------------------------------------------------- |
| Delivery & Shopping | DSH  | 🟢 **READY** | 2.2     | **Runtime implementation complete** - Database, JWT auth, Orders/Captains/Partners/Customers APIs, CI/CD integrated |
| Wallet / Ledger     | WLT  | DRAFT        | 1.0     | Under development                                                                                                   |
| Escrow & Bookings   | ARB  | DRAFT        | 2.0     | Under development                                                                                                   |
| Marketplace         | KNZ  | DRAFT        | 1.1     | Under development                                                                                                   |
| Safe Taxi           | AMN  | DRAFT        | 1.0     | Under development                                                                                                   |
| Jobs Platform       | KWD  | DRAFT        | 1.0     | Under development                                                                                                   |
| On-demand Services  | SND  | DRAFT        | 1.0     | Under development                                                                                                   |
| Lost & Found        | MRF  | DRAFT        | 2.0     | Under development                                                                                                   |
| Blood Donation      | ESF  | DRAFT        | 1.2     | Under development                                                                                                   |

### Known Issues

- **Sev-1 (RESOLVED)**: DSH service runtime implementation is complete. Full NestJS module structure with database integration, JWT authentication, business logic, and all controllers. See `registry/APPROVALS_LOG.md` for details.

## Quick Start

### Prerequisites

- Node.js 18+ (LTS)
- Python 3.9+ (for scripts)
- Git

### Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration (database, JWT keys, etc.)

# Run database migrations (if database is set up)
npm run migration:up

# Start development server (NestJS)
npm run start:dev

# The API will be available at:
# - http://localhost:3000/api
# - Swagger UI: http://localhost:3000/api/docs
# - Health check: http://localhost:3000/api/health/live

# Validate OpenAPI contracts
npm run contracts

# Build master OpenAPI spec
npm run build:openapi

# Check for contract drift
npm run check:openapi

# Run tests
npm test

# Build for production
npm run build
```

### Service Development

Each service follows the NestJS structure under `src/modules/<service-code>/`:

```
src/
  core/            # Global pipes, filters, interceptors, guards, logger
  shared/          # Cross-cutting services, adapters, utils
  modules/
    dsh/           # DSH service implementation
      controllers/
      services/
      repositories/
      entities/
      dto/
      mappers/
```

See `docs/Guidancefiles/ReposiGOV.mdc` for governance rules and `docs/explainar/services/srv-dsh.md` for service documentation.

## Governance

- **Branch Protection**: See `docs/Guidancefiles/ReposiGOV.mdc` section 2
- **Guards & CI**: See `docs/Guidancefiles/ReposiGOV.mdc` section 3
- **Change Lifecycle**: See `docs/Guidancefiles/ReposiGOV.mdc` section 4
- **SSOT Registry**: `registry/SSOT_INDEX.json`

## Contributing

1. Create a branch: `feat/*`, `fix/*`, `chore/*`, `docs/*`, or `hotfix/*`
2. Follow the change lifecycle (see Governance)
3. Ensure all guards pass before opening a PR
4. Update `registry/SSOT_INDEX.json` if service/app/dashboard status changes

## License

ISC
