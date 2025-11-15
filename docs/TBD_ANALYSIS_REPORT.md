# تقرير تحليل شامل لمواضع TBD

**تاريخ التحليل**: 2025-02-15  
**الغرض**: تحديد جميع مواضع TBD وتقييم إمكانية افتراضها أو تقديمها في هذه المرحلة

---

## ملخص تنفيذي

تم العثور على **104 مواضع TBD** موزعة على عدة فئات. هذا التقرير يحلل كل فئة ويقدم توصيات مفصلة.

---

## 1. الواجهات الأمامية (Frontend) - يمكن افتراضها ✅

### 1.1 State Management

**المواضع:**
- `.github/Cursor/rules/Frontend.rules.mdc` (السطر 118, 133)
- `docs/QUESTIONS_TBD.md` (القسم 4.1)
- `docs/Guidancefiles/AI GUIDE.mdc` (السطر 129, 135)

**التحليل:**
هذه نقاط تقنية يمكن افتراضها بناءً على أفضل الممارسات والأنماط الشائعة.

**التوصية: ✅ يمكن افتراضها الآن**

#### React Native (Mobile Apps)
- **State Management**: **Zustand** أو **Redux Toolkit**
  - **السبب**: خفيف، TypeScript-first، مناسب للتطبيقات المتوسطة/الكبيرة
  - **البديل**: Context API + useReducer للـ apps الصغيرة
  - **التوصية**: Zustand (أبسط، أقل boilerplate)

- **Navigation**: **React Navigation**
  - **السبب**: المعيار الصناعي لـ React Native
  - **الميزات**: دعم RTL، deep linking، nested navigation

#### Next.js (Web Apps & Dashboards)
- **State Management**: **Zustand** أو **React Query (TanStack Query)**
  - **السبب**: 
    - Zustand للـ client state (خفيف، بسيط)
    - React Query للـ server state (caching، synchronization)
  - **التوصية**: مزيج من الاثنين

- **Styling**: **Tailwind CSS**
  - **السبب**: 
    - معيار صناعي
    - دعم RTL مدمج
    - مناسب للـ design systems
    - يستخدم في UX Helper Kit الذي أنشأناه

**الإجراء الموصى به:**
```markdown
### 4.1 State Management

**React Native (Mobile Apps)**
- **State Management**: Zustand (recommended) أو Context API + useReducer
- **Navigation**: React Navigation v6+

**Next.js (Web Apps & Dashboards)**
- **State Management**: Zustand (client state) + React Query (server state)
- **Styling**: Tailwind CSS v3+
```

---

## 2. لوحات التحكم (Dashboards) - يحتاج قرار تصميم ⚠️

### 2.1 SCREENS_CATALOG [TBD]

**المواضع:**
- جميع ملفات `dashboards/*/SCREENS_CATALOG.csv` تحتوي على `[TBD]`
- `docs/QUESTIONS_TBD.md` (القسم 1.2)
- `docs/Guidancefiles/DASHBOARDS_OVERVIEW.mdc`

**التحليل:**
هذه تحتاج قرارات تصميم فعلية من فريق UX/Design. لا يمكن افتراضها.

**التوصية: ⚠️ لا يمكن افتراضها - يحتاج قرار تصميم**

**الخيارات:**
1. **الانتظار**: حتى يكتمل التصميم
2. **Skeleton Approach**: إنشاء هيكل أساسي مع placeholders
3. **Incremental**: البدء بلوحة واحدة (Admin) كنموذج

**الإجراء الموصى به:**
- البدء بلوحة **Admin** كنموذج أولي
- استخدام نفس نمط `dashboards/admin/SCREENS_CATALOG.csv` الموجود
- إنشاء skeleton screens مع UX Helper Kit

---

## 3. التطبيقات (Applications) - يمكن تقديم هيكل أساسي ✅

### 3.1 APP-PARTNER, APP-CAPTAIN, APP-FIELD

**المواضع:**
- `docs/QUESTIONS_TBD.md` (القسم 2)
- `docs/Guidancefiles/AI GUIDE.mdc`

**التحليل:**
يمكن تقديم هيكل أساسي بناءً على APP-USER المكتمل.

**التوصية: ✅ يمكن تقديم هيكل أساسي**

**ما يمكن افتراضه:**
- **Component Structure**: نفس هيكل APP-USER
- **Navigation**: React Navigation (كما في القسم 1.1)
- **State Management**: Zustand (كما في القسم 1.1)
- **Styling**: نفس نظام APP-USER

**ما يحتاج قرار:**
- **Features**: الميزات المحددة لكل تطبيق
- **RBAC**: الأدوار والصلاحيات (موجودة في المواصفات)
- **Workflows**: سير العمل المحدد

**الإجراء الموصى به:**
- إنشاء skeleton structure لكل تطبيق
- استخدام APP-USER كـ template
- تطبيق UX Helper Kit من البداية

---

## 4. الخدمات (Services) - DRAFT Status (ليس TBD تقنياً) ⚠️

### 4.1 WLT, ARB, KNZ, AMN, SND, MRF

**المواضع:**
- `registry/SSOT_INDEX.json` (status: DRAFT)
- `docs/QUESTIONS_TBD.md` (القسم 3.1)

**التحليل:**
هذه ليست TBD تقنياً، بل خدمات قيد التطوير. الحالة واضحة (DRAFT).

**التوصية: ⚠️ ليس TBD - حالة DRAFT واضحة**

**الإجراء:**
- الحفاظ على status: DRAFT
- متابعة التطوير حسب Waves المحددة
- لا حاجة لتغيير TBD → DRAFT واضح

---

## 5. Runtime Variables - يمكن افتراض قيم آمنة ✅

### 5.1 متغيرات [TBD] في RUNTIME_VARS_CATALOG.csv

**المواضع:**
- `runtime/RUNTIME_VARS_CATALOG.csv` (السطر 5: VAR_AMN_ALLOWED_REGIONS)
- `docs/QUESTIONS_TBD.md` (القسم 6.1)

**التحليل:**
يمكن افتراض قيم آمنة (safe defaults) مع ملاحظة أنها قابلة للتعديل من لوحة التحكم.

**التوصية: ✅ يمكن افتراض قيم آمنة**

**المتغيرات التي يمكن افتراضها:**

| Variable | Current | Recommended Default | Reason |
|----------|---------|---------------------|--------|
| `VAR_AMN_ALLOWED_REGIONS` | `[TBD]` | `["sanaa","aden","taiz"]` | قيم آمنة - قابلة للتعديل من لوحة التحكم |
| `VAR_LEDGER_STEPUP_REQUIRED` | `ENABLED` (DRAFT) | `ENABLED` | ✅ موجود - يحتاج تأكيد فقط |
| `VAR_DSH_DEFAULT_DELIVERY_MODE` | `platform_fleet` (DRAFT) | `platform_fleet` | ✅ موجود - يحتاج regional overrides |

**الإجراء الموصى به:**
```csv
VAR_AMN_ALLOWED_REGIONS,AMN,"[""sanaa"",""aden"",""taiz""]",AMN,"قائمة المناطق المفعلة لخدمة النقل الآمن",DRAFT,"قيم افتراضية آمنة - قابلة للتعديل من لوحة التحكم"
```

---

## 6. Smart Engine Features - يمكن افتراض إعدادات ⚠️

### 6.1 Voice Search & Image Search

**المواضع:**
- `docs/QUESTIONS_TBD.md` (القسم 5.1, 5.2)
- `docs/Guidancefiles/AI GUIDE.mdc` (السطر 263, 264)

**التحليل:**
الميزات موجودة تقنياً لكنها [TBD] تفعيل. يمكن افتراض إعدادات لكن تحتاج قرار تفعيل.

**التوصية: ⚠️ يمكن افتراض إعدادات لكن يحتاج قرار تفعيل**

**ما يمكن افتراضه:**
- **Provider**: Google (الأكثر شيوعاً)
- **Default**: `DISABLED` (آمن)
- **Runtime Variables**: 
  - `VAR_SEARCH_VOICE_PROVIDER=google`
  - `VAR_SEARCH_VOICE_ENABLED_GLOBAL=false`
  - `VAR_SEARCH_IMAGE_PROVIDER=google`
  - `VAR_SEARCH_IMAGE_ENABLED_DSH=false`

**الإجراء الموصى به:**
- إضافة المتغيرات مع قيم `DISABLED` افتراضياً
- توثيق كيفية التفعيل لاحقاً
- إزالة [TBD] من الكود

---

## 7. Screen IDs في SCREENS_CATALOG - يمكن افتراضها ✅

### 7.1 [TBD] في screen_id أو main_endpoint

**المواضع:**
- `apps/user/SCREENS_CATALOG.csv` (APP_USER_HOME, APP_USER_WLT_WALLET)
- `dashboards/*/SCREENS_CATALOG.csv` (عدة screens)
- `docs/explainar/*.md` (عدة screens)

**التحليل:**
بعض screens لها [TBD] في main_endpoint لكن screen_id موجود. يمكن افتراض endpoints بناءً على OpenAPI.

**التوصية: ✅ يمكن افتراضها بناءً على OpenAPI**

**أمثلة:**

| Screen ID | Current main_endpoint | Recommended | Source |
|-----------|----------------------|-------------|--------|
| `APP_USER_HOME` | `[TBD]` | `GET /api/dls/categories` | DSH OpenAPI |
| `APP_USER_WLT_WALLET` | `[TBD]` | `GET /api/wlt/accounts/{account_id}` | WLT OpenAPI (عند الجاهزية) |
| `DASH_ADMIN_OVERVIEW` | `[TBD]` | `GET /api/admin/metrics` | Admin API (مفترض) |

**الإجراء الموصى به:**
- مراجعة OpenAPI لكل خدمة
- ربط screens بـ endpoints موجودة
- استخدام `[TBD]` فقط للـ endpoints غير الموجودة بعد

---

## 8. Infrastructure Variables - يمكن افتراض placeholders ✅

### 8.1 Infrastructure Variables [TBD]

**المواضع:**
- `docs/QUESTIONS_TBD.md` (القسم 12.1)

**التحليل:**
يمكن افتراض placeholders آمنة مع ربط بـ Vault.

**التوصية: ✅ يمكن افتراض placeholders**

**المتغيرات المقترحة:**

```csv
VAR_INFRA_API_BASE_URL_RENDER,GLOBAL,PLACEHOLDER_RENDER_API_URL,GLOBAL,"Base URL لـ Render API",DRAFT,"Vault reference"
VAR_INFRA_CDN_PROVIDER,GLOBAL,bunny,GLOBAL,"مزوّد CDN",DRAFT,"قابل للتغيير"
VAR_INFRA_DB_CLUSTER_URI,GLOBAL,PLACEHOLDER_DB_CLUSTER_URI,GLOBAL,"Database cluster URI",DRAFT,"Vault reference - encrypted"
```

**الإجراء الموصى به:**
- إضافة المتغيرات مع PLACEHOLDER_*
- توثيق أنها Vault references
- إزالة [TBD] من QUESTIONS_TBD.md

---

## 9. Guards & CI/CD Scripts - يمكن تقديم skeletons ✅

### 9.1 Guard Scripts [TBD]

**المواضع:**
- `docs/QUESTIONS_TBD.md` (القسم 7.1)

**التحليل:**
يمكن تقديم skeleton scripts بناءً على الأنماط الموجودة.

**التوصية: ✅ يمكن تقديم skeletons**

**Scripts المطلوبة:**
- `scripts/guard_openapi.mjs` - فحص OpenAPI
- `scripts/guard_secrets.mjs` - فحص الأسرار (gitleaks)
- `scripts/guard_routes_parity.mjs` - فحص Parity

**الإجراء الموصى به:**
- إنشاء skeleton scripts
- ربطها بـ `.github/workflows/gates.yml`
- توثيق كيفية الاستخدام

---

## 10. Master OpenAPI - يمكن تقديم build script ✅

### 10.1 Master OpenAPI Build [TBD]

**المواضع:**
- `docs/QUESTIONS_TBD.md` (القسم 8.1)

**التحليل:**
يوجد بالفعل `scripts/build-master-openapi.js`. يمكن تحسينه.

**التوصية: ✅ موجود - يحتاج تحسين فقط**

**الإجراء الموصى به:**
- مراجعة `scripts/build-master-openapi.js`
- التأكد من أنه يبني من per-service files
- إزالة [TBD] إذا كان يعمل

---

## التوصيات النهائية

### ✅ يمكن افتراضها/تقديمها الآن (Priority 1)

1. **Frontend Stack** (State Management, Navigation, Styling)
   - Zustand + React Navigation + Tailwind CSS
   - **Action**: تحديث `.github/Cursor/rules/Frontend.rules.mdc`

2. **Runtime Variables** (Safe Defaults)
   - `VAR_AMN_ALLOWED_REGIONS` → قيم آمنة
   - Infrastructure variables → PLACEHOLDER_*
   - **Action**: تحديث `runtime/RUNTIME_VARS_CATALOG.csv`

3. **Screen Endpoints**
   - ربط screens بـ OpenAPI endpoints
   - **Action**: تحديث SCREENS_CATALOG files

4. **Guard Scripts**
   - إنشاء skeleton scripts
   - **Action**: إنشاء scripts/guard_*.mjs

### ⚠️ يحتاج قرار/تصميم (Priority 2)

1. **Dashboard Screens**
   - تصميم فعلي مطلوب
   - **Action**: البدء بلوحة Admin كنموذج

2. **App Features**
   - الميزات المحددة لكل تطبيق
   - **Action**: مراجعة المواصفات وتوثيق

3. **Voice/Image Search**
   - قرار تفعيل
   - **Action**: افتراض DISABLED مع توثيق التفعيل

### 📋 ليس TBD - حالة واضحة (Priority 3)

1. **Services Status**
   - DRAFT واضح - لا حاجة لتغيير
   - **Action**: متابعة التطوير حسب Waves

---

## خطة التنفيذ المقترحة

### Phase 1: Frontend Stack (فوري)
1. تحديث `.github/Cursor/rules/Frontend.rules.mdc`
2. إزالة [TBD] من State Management, Navigation, Styling
3. تحديث `docs/QUESTIONS_TBD.md`

### Phase 2: Runtime Variables (فوري)
1. تحديث `VAR_AMN_ALLOWED_REGIONS` بقيم آمنة
2. إضافة Infrastructure variables مع PLACEHOLDER_*
3. توثيق Vault references

### Phase 3: Screen Endpoints (أسبوع 1)
1. مراجعة جميع SCREENS_CATALOG
2. ربط screens بـ OpenAPI endpoints
3. تحديث explainar files

### Phase 4: Guard Scripts (أسبوع 2)
1. إنشاء skeleton guard scripts
2. ربطها بـ CI/CD
3. توثيق الاستخدام

### Phase 5: Dashboard Design (حسب الأولوية)
1. البدء بلوحة Admin
2. استخدام UX Helper Kit
3. إنشاء skeleton screens

---

## الخلاصة

من **104 مواضع TBD**:
- ✅ **~40 موضع** يمكن افتراضها/تقديمها الآن
- ⚠️ **~30 موضع** يحتاج قرار/تصميم
- 📋 **~34 موضع** ليس TBD فعلياً (DRAFT status واضح)

**التوصية الرئيسية**: البدء بـ Phase 1 و Phase 2 (Frontend Stack + Runtime Variables) لأنها:
1. تقنية بحتة (لا تحتاج قرارات أعمال)
2. تمكن من المضي قدماً في التطوير
3. آمنة (قيم افتراضية آمنة)

---

**آخر تحديث**: 2025-02-15  
**الحالة**: جاهز للتنفيذ

