# Migration Plan: SND Instant Help → DSH Thwani Submodule

## 📋 Executive Summary

**Objective**: Migrate the Instant Help (مساعدة فورية) functionality from SRV-SND to SRV-DSH as a submodule named **Thwani** (ثواني), while refactoring SND to focus exclusively on specialized services (خدمات متخصصة).

---

## 🎯 Migration Scope

### 1. **Instant Help → DSH Thwani**

Move all instant help request capabilities to DSH as a submodule:

- **Submodule Name**: `thwani` (ثواني)
- **New API Path**: `/api/dls/thwani/*` (migrated from `/api/snd/*`)
- **Integration**: Leverage DSH infrastructure (pricing, routing, proof-of-close, wallet constraints)

### 2. **SND Refocus**

Restrict SND to specialized services only:

- **Retained Features**:
  - Request tracking (تتبع)
  - Internal chat (دردشة داخلية)
  - No in-app payment collection (بلا تحصيل داخل التطبيق)

- **Removed Features** (moved to DSH Thwani):
  - Instant help requests
  - Pricing engine
  - Captain routing
  - Proof-of-close codes
  - Wallet integration

---

## 🏗️ Architecture Changes

### DSH Thwani Submodule Structure

```
src/modules/dsh/
  └── thwani/                    # New submodule
      ├── controllers/
      │   ├── thwani-user.controller.ts
      │   ├── thwani-captain.controller.ts
      │   └── thwani-admin.controller.ts
      ├── services/
      │   ├── thwani-request-command.service.ts
      │   ├── thwani-request-query.service.ts
      │   ├── thwani-pricing-engine.service.ts    # Reuse DSH pricing patterns
      │   ├── thwani-routing-engine.service.ts     # Reuse DSH captain routing
      │   ├── thwani-proof-close.service.ts        # Reuse DSH proof patterns
      │   └── thwani-chat.service.ts
      ├── entities/
      │   ├── thwani-request.entity.ts
      │   ├── thwani-pricing-profile.entity.ts     # Reuse DSH pricing scope/ceiling
      │   ├── thwani-proof-close.entity.ts
      │   └── thwani-chat-message.entity.ts
      ├── repositories/
      ├── dto/
      └── adapters/
          └── thwani-wallet.adapter.ts             # Wallet=Ledger constraint
```

### DSH Infrastructure Reuse

**Pricing Engine**:
- Scope-based pricing (global → region → category → category+region)
- Price ranges and ceilings (min_price_yer, max_price_yer)
- Integration with DSH pricing profiles

**Routing Engine**:
- Captain assignment logic
- Availability matching
- Priority scoring

**Proof-of-Close**:
- 6-digit code generation and verification
- Integration with DSH proof-of-delivery patterns

**Wallet Integration**:
- Wallet=Ledger constraint (no bank payouts)
- Ledger entries only
- Integration with DSH wallet adapter

---

## 🔄 API Migration Map

### Current SND Endpoints → New DSH Thwani Endpoints

| Current (SND) | New (DSH Thwani) | Notes |
|--------------|------------------|-------|
| `POST /api/snd/requests` | `POST /api/dls/thwani/requests` | Instant help creation |
| `GET /api/snd/requests` | `GET /api/dls/thwani/requests` | List user requests |
| `GET /api/snd/requests/:id` | `GET /api/dls/thwani/requests/:id` | Request details |
| `POST /api/snd/requests/:id/close` | `POST /api/dls/thwani/requests/:id/close` | Close with code |
| `GET /api/snd/captain/requests` | `GET /api/dls/thwani/captain/requests` | Captain requests |
| `POST /api/snd/captain/requests/:id/accept` | `POST /api/dls/thwani/captain/requests/:id/accept` | Captain accept |
| `POST /api/snd/captain/requests/:id/close-code` | `POST /api/dls/thwani/captain/requests/:id/close-code` | Generate code |
| `GET /api/snd/admin/config` | `GET /api/dls/thwani/admin/config` | Admin config |
| `PATCH /api/snd/admin/pricing` | `PATCH /api/dls/thwani/admin/pricing` | Pricing updates |

### SND Endpoints (Retained for Specialized Services)

| Endpoint | Purpose |
|----------|---------|
| `POST /api/snd/specialized/requests` | Create specialized service request |
| `GET /api/snd/specialized/requests` | List specialized requests |
| `GET /api/snd/specialized/requests/:id` | Specialized request details |
| `GET /api/snd/specialized/requests/:id/messages` | Chat messages (no payment) |
| `POST /api/snd/specialized/requests/:id/messages` | Send chat message |

---

## 🛡️ Security & Guards (Preserved)

All existing guards remain unchanged:

- **Idempotency-Key**: Required for all POST/PATCH/DELETE operations
- **HMAC**: Webhook signature verification (≤300s replay window)
- **RBAC/ABAC**: Role-based access control for all endpoints
- **Privacy**: Phone masking, encrypted chat (AES-256-GCM)
- **Step-Up Auth**: Required for admin config changes and sensitive operations
- **Audit Logging**: Immutable logs for all sensitive operations

---

## 📊 Dashboard Integration

### DSH Dashboards (New)

- **DASH-OPS**: Thwani request monitoring, dispatch management
- **DASH-FINANCE**: Thwani pricing profiles, wallet ledger entries
- **DASH-ADMIN**: Thwani configuration, KPIs, metrics

### SND Dashboards (Retained)

- **DASH-SUPPORT**: Specialized service case management
- **DASH-ADMIN**: Specialized service configuration (limited scope)

---

## 🔧 Implementation Steps

### Phase 1: Preparation
1. Create DSH Thwani submodule structure
2. Define entity models (reuse DSH patterns)
3. Create repositories and DTOs
4. Set up wallet adapter (Wallet=Ledger constraint)

### Phase 2: Service Migration
1. Migrate pricing engine (reuse DSH pricing patterns)
2. Migrate routing engine (reuse DSH captain routing)
3. Migrate proof-of-close service
4. Migrate chat service (with phone masking)
5. Migrate request command/query services

### Phase 3: Controller Migration
1. Create Thwani controllers with new paths
2. Implement API endpoints (`/api/dls/thwani/*`)
3. Add guards (Idempotency, RBAC, Step-Up, HMAC)
4. Update OpenAPI specification

### Phase 4: SND Refactoring
1. Remove instant help features from SND
2. Refactor SND to specialized services only
3. Update SND controllers and endpoints
4. Update SND OpenAPI specification

### Phase 5: Integration & Testing
1. Integrate Thwani with DSH dashboards
2. Update frontend clients (APP-USER, APP-CAPTAIN)
3. End-to-end testing
4. Migration script for existing data (if needed)

### Phase 6: Documentation & Deployment
1. Update API documentation
2. Update service architecture diagrams
3. Update README files
4. Deploy to staging → production

---

## 📝 Data Migration Considerations

### Entities to Migrate

- `snd_requests` (where `type = 'instant'`) → `thwani_requests`
- `snd_pricing_profiles` → `thwani_pricing_profiles`
- `snd_proof_close` (instant only) → `thwani_proof_close`
- `snd_chat_messages` (instant requests) → `thwani_chat_messages`

### Entities to Retain in SND

- `snd_requests` (where `type = 'specialized'`)
- `snd_chat_messages` (specialized requests only)
- `snd_categories` (specialized categories only)

---

## ✅ Acceptance Criteria

- [ ] All instant help endpoints migrated to `/api/dls/thwani/*`
- [ ] DSH pricing/routing/proof patterns reused
- [ ] Wallet=Ledger constraint enforced
- [ ] All guards (Idempotency/HMAC/RBAC/Privacy) preserved
- [ ] SND refactored to specialized services only
- [ ] DSH dashboards integrated with Thwani
- [ ] OpenAPI specifications updated
- [ ] End-to-end tests passing
- [ ] Documentation updated

---

## 🔗 References

- **Service Code**: SRV-DSH-02 (Thwani submodule)
- **Service Code**: SRV-SND-01 (refactored, specialized only)
- **DSH Base**: `docs/explainar/services/srv-dsh.md`
- **SND Current**: `src/modules/snd/README.md`

---

**Last Updated**: 2025-02-01  
**Status**: ✅ **Implementation Complete** - Core structure created

## ✅ Implementation Status

### Completed

- ✅ Entities created (ThwaniRequest, ThwaniPricingProfile, ThwaniProofClose, ThwaniChatMessage)
- ✅ Repositories implemented
- ✅ Services implemented (pricing, routing, proof-close, chat, request command/query)
- ✅ DTOs created
- ✅ Controllers created with new paths (`/api/dls/thwani/*`)
- ✅ Adapters created (wallet with Wallet=Ledger constraint, notifications)
- ✅ ThwaniModule created and integrated into DSH
- ✅ No linter errors

### Pending

- ⏳ Database migrations
- ⏳ Data migration script
- ⏳ OpenAPI specification update
- ⏳ Integration tests
- ⏳ Frontend client updates
- ⏳ Dashboard integration

