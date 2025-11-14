# Web-App Service Exposure (`app.bthwani.com`)

This document tracks how the browser-based app mirrors the customer mobile app. All feature toggles inherit the same defaults as today; operations can change behaviour later via runtime variables without touching code.

- **Surface:** `app.bthwani.com`
- **Role:** APP-USER (PWA with deep links)
- **Canonical Governance:** Refer to `../README.md` for security guards, SEO posture, and host interaction policies.

## Default Service Modes

| Service  | Default Mode        | Runtime Variable            | Notes                                                                 |
| -------- | ------------------- | --------------------------- | --------------------------------------------------------------------- |
| DSH v2.2 | full                | VAR_WEBAPP_FEATURE_DSH_MODE | Full checkout + tracking flows. Mirrors mobile app behaviour.         |
| KNZ v1.1 | browse_only         | VAR_WEBAPP_FEATURE_KNZ_MODE | Catalog browse/details only; sensitive categories are view-only.      |
| AMN v1.0 | info_only           | VAR_WEBAPP_FEATURE_AMN_MODE | Shows marketplace info screens; redirects to native app where needed. |
| KWD v1.0 | search_details_only | VAR_WEBAPP_FEATURE_KWD_MODE | Enables search + detail views, no CRUD actions.                       |
| MRF v2.0 | full                | VAR_WEBAPP_FEATURE_MRF_MODE | Full incident filing and internal chat.                               |
| ESF v1.2 | full                | VAR_WEBAPP_FEATURE_ESF_MODE | Full enablement (request + matching).                                 |
| SND v1.0 | full                | VAR_WEBAPP_FEATURE_SND_MODE | Specialist assistance; no internal billing.                           |
| ARB v2.0 | full                | VAR_WEBAPP_FEATURE_ARB_MODE | Booking + 6-digit lock workflows (step-up enforced).                  |
| WLT v1.0 | embedded_only       | VAR_WEBAPP_FEATURE_WLT_MODE | Only exposed within DSH checkout flows.                               |

**Modes:**

- `full` → Full interaction (create/update/track).
- `light` / `browse_only` / `info_only` → Read-only UI, actions disabled.
- `hidden` → Surface not rendered; deep links redirect to `/install` or CTA.

## Runtime Control

- Ops flips the runtime vars above via the control panel; the PWA reads them at boot to decide which components to expose.
- Any change is logged via `webapp.service_mode_change` (see monitoring section in `../README.md`).
- **Governance rule:** لا يتم تعطيل أو تفعيل أي خدمة على الويب-آب من خلال الكود أو تعديل ثابت؛ كل التغييرات تتم حصريًا عبر مفاتيح التشغيل `VAR_WEBAPP_FEATURE_*` لضمان التوافق مع تطبيق المستخدم.

## Deep Links & Session Flow

1. Marketing site points to deep routes (e.g. `https://app.bthwani.com/dsh?utm=site`).
2. Guest users land on sign-in/register and return to the original route once authenticated.
3. Logged-in users reach the target screen immediately.
4. Native app hand-off is offered through PWA prompts (`/.well-known`, install banners).

## Guards & Compliance

- JWT + CSRF enforced for unsafe operations (shared session with mobile app).
- Idempotency-Key required on POST/PATCH flows.
- Sensitive actions (settlements, payouts) trigger step-up authentication.
- Chat payloads mask numbers and encrypt fields (AES-GCM) per privacy policy.

For host-level policies, consult `../README.md`.
