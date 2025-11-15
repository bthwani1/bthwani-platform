# النقاط المفتوحة غير المحسومة [TBD]

**آخر تحديث**: 2025-02-01  
**الحالة**: قيد المراجعة

---

## 1. لوحات التحكم (Dashboards)

### 1.1 التصميم العام

- [ ] **تصميم لوحة Finance**
  - الشاشات المطلوبة
  - التبويبات الرئيسية والفرعية
  - ربط بـ WLT, DSH, ARB
  - متطلبات Step-Up و Dual-Sign

- [ ] **تصميم لوحة Ops**
  - الشاشات المطلوبة
  - ربط بـ DSH, AMN, SND
  - متطلبات المراقبة والتتبع

- [ ] **تصميم لوحة Admin**
  - الشاشات المطلوبة
  - ربط بجميع الخدمات
  - متطلبات الحوكمة و SSOT

- [ ] **تصميم باقي اللوحات**
  - Support, Marketing, Fleet, Partner, BI, SSOT, Security
  - الشاشات المطلوبة لكل لوحة
  - متطلبات RBAC و Privacy

### 1.2 SCREENS_CATALOG

- [ ] إنشاء `dashboards/**/SCREENS_CATALOG.csv` لجميع اللوحات
- [ ] تحديد screen_id لكل شاشة
- [ ] ربط الشاشات بـ API endpoints
- [ ] تحديد الأدوار والصلاحيات لكل شاشة

---

## 2. التطبيقات (Applications)

### 2.1 APP-PARTNER

- [ ] إكمال التطوير
- [ ] ربط بـ DSH, ARB, WLT
- [ ] تطبيق RBAC/ABAC (OWNER, MANAGER, CASHIER, MARKETER)

### 2.2 APP-CAPTAIN

- [ ] إكمال التطوير
- [ ] ربط بـ DSH, AMN, WLT
- [ ] تطبيق SOS و Emergency workflows

### 2.3 APP-FIELD

- [ ] إكمال التطوير
- [ ] ربط بـ DSH, ARB
- [ ] تطبيق Partner Onboarding workflows

---

## 3. الخدمات (Services)

### 3.1 الخدمات قيد التطوير

- [ ] **WLT**: إكمال التطوير (DRAFT → READY)
- [ ] **ARB**: إكمال التطوير (DRAFT → READY)
- [ ] **KNZ**: إكمال التطوير (DRAFT → READY)
- [ ] **AMN**: إكمال التطوير (DRAFT → READY)
- [ ] **SND**: إكمال التطوير (DRAFT → READY)
- [ ] **MRF**: إكمال التطوير (DRAFT → READY)

### 3.2 OpenAPI Specifications

- [ ] تحديث `oas/services/*/openapi.yaml` للخدمات قيد التطوير
- [ ] التأكد من الالتزام بـ Path Prefixes
- [ ] التأكد من Error Shape الموحد
- [ ] التأكد من Idempotency-Key في العمليات الحرجة

---

## 4. الواجهات الأمامية (Frontend)

### 4.1 State Management

- [x] **Recommended**: Zustand (React Native) أو Zustand + React Query (Next.js)
  - **ملاحظة**: قابل للتغيير حسب احتياجات المشروع. سيتم تحديده نهائياً عند بناء التطبيقات/الواجهات.
  - **المصدر**: `.github/Cursor/rules/Frontend.rules.mdc` (القسم 4.1, 4.2)

### 4.2 Navigation

- [x] **Recommended**: React Navigation v6+ (React Native) أو Next.js App Router (Next.js)
  - **ملاحظة**: قابل للتغيير. سيتم تحديده نهائياً عند بناء التطبيقات/الواجهات.
  - **المصدر**: `.github/Cursor/rules/Frontend.rules.mdc` (القسم 4.1, 4.2)

### 4.3 Styling

- [x] **Recommended**: React Native StyleSheet (React Native) أو Tailwind CSS v3+ (Next.js)
  - **ملاحظة**: Tailwind CSS مستخدم بالفعل في UX Helper Kit. قابل للتغيير. سيتم تحديده نهائياً عند بناء الواجهات.
  - **المصدر**: `.github/Cursor/rules/Frontend.rules.mdc` (القسم 4.2)

---

## 5. Smart Engine & Unified Search

### 5.1 Voice Search

- [x] **Runtime Variables**: تم إضافتها مع DISABLED افتراضياً
  - `VAR_SEARCH_VOICE_PROVIDER=google` (قابل للتغيير)
  - `VAR_SEARCH_VOICE_ENABLED_GLOBAL=false` (يتطلب قرار تفعيل)
  - **ملاحظة**: الميزة معطلة افتراضياً. يمكن تفعيلها لاحقاً من لوحة التحكم.
  - **المصدر**: `runtime/RUNTIME_VARS_CATALOG.csv`

### 5.2 Image Search

- [x] **Runtime Variables**: تم إضافتها مع DISABLED افتراضياً
  - `VAR_SEARCH_IMAGE_PROVIDER=google` (قابل للتغيير)
  - `VAR_SEARCH_IMAGE_ENABLED_DSH=false` (يتطلب قرار تفعيل)
  - **ملاحظة**: الميزة معطلة افتراضياً. يمكن تفعيلها لاحقاً من لوحة التحكم.
  - **المصدر**: `runtime/RUNTIME_VARS_CATALOG.csv`

### 5.3 Personalization

- [ ] تحسين خوارزميات Personalization
  - User Preferences
  - Recent Orders
  - Favorite Stores
  - Location-based Ranking

---

## 6. Runtime Variables

### 6.1 متغيرات [TBD]

- [x] **VAR_AMN_ALLOWED_REGIONS**: تم تحديد قيم افتراضية آمنة
  - القيمة: `["sanaa","aden","taiz"]`
  - **ملاحظة**: قيم قابلة للتعديل من لوحة التحكم. لا تأثير على الكود.
  - **المصدر**: `runtime/RUNTIME_VARS_CATALOG.csv`
- [x] **Infrastructure Variables**: تم إضافتها مع PLACEHOLDER_*
  - `VAR_INFRA_API_BASE_URL_RENDER`, `VAR_INFRA_CDN_PROVIDER`, `VAR_INFRA_DB_CLUSTER_URI`, `VAR_INFRA_MONITORING_PROVIDER`
  - **ملاحظة**: جميعها Vault references. آمنة 100%.
  - **المصدر**: `runtime/RUNTIME_VARS_CATALOG.csv`
- [ ] تحديد Scope للمتغيرات الجديدة (يتم تلقائياً عند الإضافة)
- [ ] تحديد Service References للمتغيرات الجديدة (يتم تلقائياً عند الإضافة)

### 6.2 متغيرات الخدمات

- [ ] متغيرات WLT (Payment Providers, Limits, إلخ)
- [ ] متغيرات ARB (Escrow Timeout, Deposit Rules, إلخ)
- [ ] متغيرات KNZ (Fees, Moderation, إلخ)
- [ ] متغيرات AMN (Regions, Pricing, إلخ)
- [ ] متغيرات SND (Pricing, Routing, إلخ)
- [ ] متغيرات MRF (Matching Thresholds, إلخ)

---

## 7. Guards & CI/CD

### 7.1 سكربتات الحُرّاس

- [x] `scripts/guard_openapi.mjs` — فحص OpenAPI (تم إنشاؤه)
- [x] `scripts/guard_secrets.mjs` — فحص الأسرار (تم إنشاؤه - basic check)
- [x] `scripts/guard_routes_parity.mjs` — فحص Parity (تم إنشاؤه)
- [ ] ربطها بـ `.github/workflows/gates.yml` (يحتاج إعداد CI/CD)
- [ ] سكربتات أخرى حسب الحاجة

### 7.2 GitHub Actions

- [ ] ربط سكربتات الحُرّاس بـ `.github/workflows/gates.yml`
- [ ] تفعيل جميع الحُرّاس العالمية
- [ ] إعداد Release Gate

---

## 8. Master OpenAPI

### 8.1 بناء Master OpenAPI

- [ ] بناء `oas/master/Master_OpenAPI.yaml` من ملفات الخدمات
- [ ] التأكد من Skeleton العام (info, tags, securitySchemes)
- [ ] التأكد من أن المسارات (paths) تأتي من per-service

### 8.2 Source Kit

- [ ] إعداد حزمة `KIT.zip`
- [ ] تضمين جميع الملفات المطلوبة
- [ ] إعداد تقارير الحُرّاس

---

## 9. التوثيق

### 9.1 توثيق الخدمات

- [ ] تحديث `docs/explainar/services/*.md` للخدمات قيد التطوير
- [ ] إضافة Database Migrations & Seeders
- [ ] إضافة API Endpoints Summary

### 9.2 توثيق التطبيقات

- [ ] تحديث `docs/explainar/apps/*.md` للتطبيقات قيد التطوير
- [ ] إضافة Navigation & User Experience
- [ ] إضافة Features & Capabilities

### 9.3 توثيق اللوحات

- [ ] إنشاء `docs/explainar/dashboards/*.md` لجميع اللوحات
- [ ] إضافة Navigation & User Experience
- [ ] إضافة Features & Capabilities

---

## 10. اختبارات

### 10.1 Unit Tests

- [ ] إكمال Unit Tests للخدمات قيد التطوير
- [ ] إكمال Unit Tests للتطبيقات قيد التطوير

### 10.2 Integration Tests

- [ ] إكمال Integration Tests للخدمات
- [ ] إكمال Integration Tests للتطبيقات

### 10.3 E2E Tests

- [ ] إكمال E2E Tests للخدمات
- [ ] إكمال E2E Tests للتطبيقات
- [ ] إكمال E2E Tests للوحات

---

## 11. الأمن والخصوصية

### 11.1 Privacy Policies

- [ ] تحديد سياسات Privacy لكل خدمة
- [ ] تحديد Retention Periods
- [ ] تحديد PII Classification

### 11.2 Security Policies

- [ ] تحديد Security Policies
- [ ] تحديد Encryption Standards
- [ ] تحديد Access Control Policies

---

## 12. البنية التحتية

### 12.1 Infrastructure Variables

- [x] **تم إضافة Infrastructure Variables** في `runtime/RUNTIME_VARS_CATALOG.csv`
  - `VAR_INFRA_API_BASE_URL_RENDER` (PLACEHOLDER_RENDER_API_URL)
  - `VAR_INFRA_CDN_PROVIDER` (bunny)
  - `VAR_INFRA_DB_CLUSTER_URI` (PLACEHOLDER_DB_CLUSTER_URI)
  - `VAR_INFRA_MONITORING_PROVIDER` (grafana)
- [x] **ربط بـ Vault**: جميع الأسرار تستخدم PLACEHOLDER_* مع ملاحظة Vault reference
- [x] **CDN Provider**: تم تحديده كـ bunny (قابل للتغيير)
- [x] **Database Cluster URI**: PLACEHOLDER_DB_CLUSTER_URI (Vault reference)

### 12.2 Monitoring & Alerting

- [ ] إعداد Monitoring (Grafana/Prometheus/OpenTelemetry)
- [ ] إعداد Alerting (SLO/SLI)
- [ ] إعداد Logging (Structured JSON)

---

## ملاحظات

- جميع النقاط المفتوحة يجب أن تُحسم من خلال:
  1. مناقشة مع الحوكمة/SSoT
  2. اتخاذ القرار وتوثيقه
  3. تحديث الملفات المتأثرة
  4. إزالة `[TBD]` بعد الحسم

- عند حسم أي نقطة، يجب:
  - تحديث هذا الملف
  - تحديث الملفات المتأثرة
  - إزالة `[TBD]` من الكود والوثائق

---

**آخر تحديث**: 2025-02-01  
**الحالة**: قيد المراجعة
