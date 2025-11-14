# Website Service Exposure (`bthwani.com`)

Public pages stay marketing/SEO-only and hand off transactional flows to the web-app. This file tracks which services are advertised and where they deep-link.

- **Surface:** `bthwani.com`
- **Role:** Marketing / content
- **Canonical Host:** VAR_SITE_CANONICAL_HOST = bthwani.com
- **Robots:** Allow + sitemap + structured data

## Default Exposure Matrix

| Service  | Web Exposure                   | Deep Link Target            | Notes                                                         |
| -------- | ------------------------------ | --------------------------- | ------------------------------------------------------------- |
| DSH v2.2 | Landing page + feature blocks  | https://app.bthwani.com/dsh | Primary CTA directs to web-app checkout.                      |
| KNZ v1.1 | Category pages + SEO content   | https://app.bthwani.com/knz | Highlight verticals; sensitive categories labelled view-only. |
| AMN v1.0 | Info page with native-app CTA  | https://app.bthwani.com/amn | Prominent “Open in App” buttons.                              |
| KWD v1.0 | Search teaser + knowledge base | https://app.bthwani.com/kwd | Encourages signing in for full workspace actions.             |
| MRF v2.0 | Incident management overview   | https://app.bthwani.com/mrf | Emphasises SLA & chat features.                               |
| ESF v1.2 | Enablement overview            | https://app.bthwani.com/esf | Provides structured schema.org data.                          |
| SND v1.0 | Support vertical story         | https://app.bthwani.com/snd | CTA to open specialist assistance.                            |
| ARB v2.0 | Booking landing                | https://app.bthwani.com/arb | Captures leads then routes to PWA.                            |
| WLT v1.0 | Mentioned within pricing FAQ   | https://app.bthwani.com/wlt | No standalone CTA; referenced inside DSH flows.               |

## Behaviour

1. Pages remain indexable (`robots.txt` allow). Canonical tags point to themselves; the web-app declares cross-canonical when needed.
2. Each CTA retains UTM parameters so analytics can measure conversion (site.service_click → webapp.deeplink_open).
3. When a service is disabled (`hidden` mode) the relevant CTA swaps to a generic `/install` or contact form link.

- **Governance rule:** لا يتم تعديل ظهور الخدمات من خلال الكود؛ يتم التحكم به من لوحة التحكم عبر مفاتيح التشغيل `VAR_WEBAPP_FEATURE_*` لضمان التطابق مع واجهة APP-USER.

## Content & SEO Rules

- Structured data (Schema.org) published for every service page.
- Deep-link metadata (`al:web:url`, `web-app-capable`) maintained for PWA detection.
- Marketing copy must avoid promising operations that are in light or hidden state—coordinate with runtime settings documented in `../webapp/SERVICES.md`.

## Governance Reference

- No POST/PUT/PATCH/DELETE calls from the marketing site.
- Any data pulled from DSH must pass through cache/proxy with explicit TTL (see `../README.md`).
- Keep performance budgets: LCP≤2000ms, INP≤150ms, CLS≤0.10.

Updates to runtime modes should be reflected in this matrix alongside the web-app document to stay in sync.
