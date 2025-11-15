# خطة حل مواضع TBD - خطة تنفيذية

## Phase 1: Frontend Stack (فوري) ✅

### 1.1 تحديث Frontend Rules

**الملف**: `.github/Cursor/rules/Frontend.rules.mdc`

**التغييرات:**
```markdown
### 4.1 Mobile Apps (React Native)
- **State Management**: Zustand (recommended) أو Context API + useReducer
- **Navigation**: React Navigation v6+
- **Styling**: React Native StyleSheet + Design Tokens

### 4.2 Web Apps & Dashboards (Next.js)
- **State Management**: Zustand (client state) + React Query (server state)
- **Navigation**: Next.js App Router (built-in)
- **Styling**: Tailwind CSS v3+ (RTL support enabled)
```

**الإجراء:**
1. استبدال `[TBD]` بالقيم المحددة أعلاه
2. إضافة ملاحظة: "تم تحديدها بناءً على أفضل الممارسات"
3. تحديث `docs/QUESTIONS_TBD.md` لإزالة هذه النقاط

---

## Phase 2: Runtime Variables (فوري) ✅

### 2.1 تحديث VAR_AMN_ALLOWED_REGIONS

**الملف**: `runtime/RUNTIME_VARS_CATALOG.csv`

**التغيير:**
```csv
VAR_AMN_ALLOWED_REGIONS,AMN,"[""sanaa"",""aden"",""taiz""]",AMN,"قائمة المناطق المفعلة لخدمة النقل الآمن",DRAFT,"قيم افتراضية آمنة - قابلة للتعديل من لوحة التحكم"
```

**السبب:**
- قيم آمنة (المناطق الرئيسية)
- قابلة للتعديل من لوحة التحكم
- لا تؤثر على الخدمات الأخرى

### 2.2 إضافة Infrastructure Variables

**الملف**: `runtime/RUNTIME_VARS_CATALOG.csv`

**الإضافات:**
```csv
VAR_INFRA_API_BASE_URL_RENDER,GLOBAL,PLACEHOLDER_RENDER_API_URL,GLOBAL,"Base URL لـ Render API",DRAFT,"Vault reference - لا تخزن في الكود"
VAR_INFRA_CDN_PROVIDER,GLOBAL,bunny,GLOBAL,"مزوّد CDN",DRAFT,"قابل للتغيير من لوحة التحكم"
VAR_INFRA_DB_CLUSTER_URI,GLOBAL,PLACEHOLDER_DB_CLUSTER_URI,GLOBAL,"Database cluster URI",DRAFT,"Vault reference - encrypted"
VAR_INFRA_MONITORING_PROVIDER,GLOBAL,grafana,GLOBAL,"مزوّد Monitoring",DRAFT,"Grafana/Prometheus/OpenTelemetry"
```

---

## Phase 3: Screen Endpoints (أسبوع 1) ✅

### 3.1 تحديث APP_USER_HOME

**الملف**: `apps/user/SCREENS_CATALOG.csv`

**التغيير:**
```csv
APP_USER_HOME,الرئيسية العامة,GLOBAL,GET /api/dls/categories,user,READY,"نقطة الانطلاق - عرض الفئات"
```

### 3.2 تحديث Dashboard Screens

**الملفات**: `dashboards/*/SCREENS_CATALOG.csv`

**نمط التحديث:**
- ربط screens بـ endpoints موجودة في OpenAPI
- استخدام `[TBD]` فقط للـ endpoints غير الموجودة بعد
- توثيق السبب في عمود notes

---

## Phase 4: Guard Scripts (أسبوع 2) ✅

### 4.1 إنشاء guard_openapi.mjs

**الملف**: `scripts/guard_openapi.mjs`

**الوظيفة:**
- فحص صحة OpenAPI files
- التحقق من Path Prefixes
- التحقق من Error Shape
- التحقق من Idempotency-Key

### 4.2 إنشاء guard_secrets.mjs

**الملف**: `scripts/guard_secrets.mjs`

**الوظيفة:**
- استخدام gitleaks للفحص
- التحقق من عدم وجود secrets في الكود
- التحقق من PLACEHOLDER_* usage

### 4.3 إنشاء guard_routes_parity.mjs

**الملف**: `scripts/guard_routes_parity.mjs`

**الوظيفة:**
- مقارنة OpenAPI routes مع الكود الفعلي
- اكتشاف routes مفقودة
- اكتشاف routes إضافية

---

## Phase 5: Smart Engine Variables (حسب الحاجة) ⚠️

### 5.1 إضافة Voice/Image Search Variables

**الملف**: `runtime/RUNTIME_VARS_CATALOG.csv`

**الإضافات:**
```csv
VAR_SEARCH_VOICE_PROVIDER,GLOBAL,google,GLOBAL,"مزوّد Voice Search",DRAFT,"google/azure/aws - Default: DISABLED"
VAR_SEARCH_VOICE_ENABLED_GLOBAL,GLOBAL,false,GLOBAL,"تفعيل Voice Search عالمياً",DRAFT,"يتطلب قرار تفعيل"
VAR_SEARCH_IMAGE_PROVIDER,GLOBAL,google,GLOBAL,"مزوّد Image Search",DRAFT,"google/azure/aws - Default: DISABLED"
VAR_SEARCH_IMAGE_ENABLED_DSH,DSH,false,DSH,"تفعيل Image Search في DSH",DRAFT,"يتطلب قرار تفعيل"
```

**السبب:**
- افتراض DISABLED (آمن)
- توثيق كيفية التفعيل
- إزالة [TBD] من الكود

---

## Checklist التنفيذ

### Phase 1: Frontend Stack
- [ ] تحديث `.github/Cursor/rules/Frontend.rules.mdc`
- [ ] تحديث `docs/QUESTIONS_TBD.md` (إزالة القسم 4)
- [ ] تحديث `docs/Guidancefiles/AI GUIDE.mdc`

### Phase 2: Runtime Variables
- [ ] تحديث `VAR_AMN_ALLOWED_REGIONS`
- [ ] إضافة Infrastructure variables
- [ ] تحديث `docs/QUESTIONS_TBD.md` (القسم 6.1, 12.1)

### Phase 3: Screen Endpoints
- [ ] تحديث `apps/user/SCREENS_CATALOG.csv`
- [ ] تحديث `dashboards/*/SCREENS_CATALOG.csv`
- [ ] تحديث `docs/explainar/*.md`

### Phase 4: Guard Scripts
- [ ] إنشاء `scripts/guard_openapi.mjs`
- [ ] إنشاء `scripts/guard_secrets.mjs`
- [ ] إنشاء `scripts/guard_routes_parity.mjs`
- [ ] ربطها بـ `.github/workflows/gates.yml`
- [ ] تحديث `docs/QUESTIONS_TBD.md` (القسم 7)

### Phase 5: Smart Engine
- [ ] إضافة Voice/Image Search variables
- [ ] توثيق كيفية التفعيل
- [ ] تحديث `docs/QUESTIONS_TBD.md` (القسم 5)

---

## النتائج المتوقعة

بعد تنفيذ هذه الخطة:

1. **تقليل TBDs**: من 104 → ~30 (فقط ما يحتاج قرارات تصميم)
2. **تمكين التطوير**: Frontend stack واضح
3. **قيم آمنة**: Runtime variables مع defaults آمنة
4. **CI/CD جاهز**: Guard scripts تعمل
5. **توثيق واضح**: جميع القرارات موثقة

---

**آخر تحديث**: 2025-02-15  
**الحالة**: جاهز للتنفيذ

