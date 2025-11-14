# Web Host Policies

This reference consolidates how the DSH service interacts with the public site (thwani.com), the customer web app (pp.bthwani.com), and the API host (pi.bthwani.com). Use it for onboarding, security reviews, and SEO/performance checks. Detailed service matrices live alongside this file under web/.

## 1. Hosts and Scope

| Host | Purpose | DSH interaction | Notes |
| --- | --- | --- | --- |
| pi.bthwani.com | Core SRV-DSH v2.2 API | Full read/write surface | Bearer JWT required. Idempotency-Key mandatory on unsafe methods. HMAC webhooks (anti-replay ≤ 300s). |
| pp.bthwani.com | Customer web application (APP-USER) | Consumes pi.bthwani.com for browse → quote → order → payment → PoD → chat | Guests can browse. Sessions in HttpOnly cookie + CSRF token. Service modes mirror the customer app; defaults tracked in webapp/SERVICES.md. |
| thwani.com | Marketing/SEO site | Optional cached GET-only reads (coverage, hours, CTA) | No POST/PUT/PATCH/DELETE. Content via CMS/SSG behind edge cache; any DSH data must have explicit TTL. Live CTAs documented in website/SERVICES.md. |

## 2. Key Customer Flows (pp.bthwani.com ⇄ pi.bthwani.com)

- Quote / slot discovery: POST /api/dls/quotes (service toggle state: see webapp/SERVICES.md).
- Order lifecycle: POST /api/dls/orders → PATCH /api/dls/orders/{order_id} → GET /api/dls/orders{...}
- Payment: POST /wallet/intents → GET /wallet/intents/{id} → POST /pay/confirm
- PoD & pickup: POST /api/dls/orders/{order_id}/pod/verify, POST .../pickup/close
- Chat (masked, AES-GCM): POST|GET /api/dls/orders/{order_id}/chat/messages, POST .../read-ack
- Policies/coverage: GET /api/dls/partners/{partner_id}/policies, GET .../zones

## 3. Marketing Site (thwani.com)

- Purely informational (services, cities, pricing snapshots, case studies). Exposure matrix: website/SERVICES.md.
- SEO enabled: robots allow, sitemap + Schema.org, CTAs point to pp.bthwani.com/install.
- No authentication, no write operations. Any DSH-derived numbers must use cached GETs with conservative TTL and masking where necessary.

## 4. Security & Governance Guards

- Origins: CORS allows only https://app.bthwani.com.
- Sessions: JWT (HttpOnly, SameSite=Lax) + CSRF token for non-GET operations.
- Idempotency: global guard on all write calls.
- Webhooks: backend only, HMAC + anti-replay ≤ 300s.
- Privacy: phone masking in chat, encrypted payloads (AES-GCM), retention ≤ 30 days.
- Financial: wallet ledger internal; bank settlements require dual-sign; customer receipts comply with SRV-DSH v2.2.
- Global guards enforced: G-LEDGER-INVARIANTS, G-IDEMPOTENCY, G-WEBHOOK-HMAC≤300s, G-STEPUP-GUARD, G-PRIVACY-EXPORT, G-TRACE=1.0, G-PARITY≥0.90.

## 5. Performance / UX Policies

- Budgets: LCP ≤ 2000 ms, INP ≤ 150 ms, CLS ≤ 0.10 (tracked for both hosts).
- thwani.com: SSR/SSG + edge cache, static resources with SRI, CSP nonce, HSTS, COOP/CORP.
- pp.bthwani.com: selective SSR for entry/landing pages; remainder as hydrated SPA. PWA manifest optional; limited offline (cached order list).
- Locale & timezone: Arabic + English (RTL default), Asia/Aden timezone.

## 6. Operational Matrix

| Host | DSH operations | Example endpoints | RBAC | Policy highlights |
| --- | --- | --- | --- | --- |
| thwani.com | GET (optional, via proxy cache) | /api/dls/partners/{id}/zones (cached) | public | Robots Allow, cache-first, **no auth, no write** |
| pp.bthwani.com | Full GET/POST/PATCH flows | /api/dls/orders, /wallet/intents | user | JWT HttpOnly, CSRF, idempotency, rate limits |
| pi.bthwani.com | Service endpoints | All SRV-DSH v2.2 routes | service | HMAC webhooks, Step-Up for financial/approval paths |

---

_Last reviewed: 2025-11-14 01:00:00 +03:00_
