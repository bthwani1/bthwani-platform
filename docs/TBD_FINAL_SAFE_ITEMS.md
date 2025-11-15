# القائمة النهائية - ما يمكن افتراضه الآن بأمان 100%

**تاريخ التحليل**: 2025-02-15  
**المنهجية**: تحليل عميق جداً - **Zero Impact فقط**

---

## ✅ آمن 100% - Zero Impact (يمكن التنفيذ فوراً)

### 1. Runtime Variables (Safe Defaults)

#### 1.1 VAR_AMN_ALLOWED_REGIONS

**السبب:**
- ✅ قيم runtime قابلة للتعديل من لوحة التحكم
- ✅ لا تؤثر على الكود
- ✅ قيم آمنة (المناطق الرئيسية)
- ✅ يمكن إضافة/حذف مناطق لاحقاً بدون أي تأثير

**الإجراء:**
```csv
VAR_AMN_ALLOWED_REGIONS,AMN,"[""sanaa"",""aden"",""taiz""]",AMN,"قائمة المناطق المفعلة لخدمة النقل الآمن",DRAFT,"قيم افتراضية آمنة - قابلة للتعديل من لوحة التحكم"
```

#### 1.2 Infrastructure Variables

**السبب:**
- ✅ PLACEHOLDER_* فقط (لا قيم حقيقية)
- ✅ Vault references (آمن)
- ✅ لا تؤثر على الكود

**الإجراء:**
```csv
VAR_INFRA_API_BASE_URL_RENDER,GLOBAL,PLACEHOLDER_RENDER_API_URL,GLOBAL,"Base URL لـ Render API",DRAFT,"Vault reference - لا تخزن في الكود"
VAR_INFRA_CDN_PROVIDER,GLOBAL,bunny,GLOBAL,"مزوّد CDN",DRAFT,"قابل للتغيير من لوحة التحكم"
VAR_INFRA_DB_CLUSTER_URI,GLOBAL,PLACEHOLDER_DB_CLUSTER_URI,GLOBAL,"Database cluster URI",DRAFT,"Vault reference - encrypted"
VAR_INFRA_MONITORING_PROVIDER,GLOBAL,grafana,GLOBAL,"مزوّد Monitoring",DRAFT,"Grafana/Prometheus/OpenTelemetry"
```

#### 1.3 Voice/Image Search Variables

**السبب:**
- ✅ DISABLED افتراضياً (آمن)
- ✅ قابل للتفعيل لاحقاً بدون تأثير
- ✅ ميزة اختيارية

**الإجراء:**
```csv
VAR_SEARCH_VOICE_PROVIDER,GLOBAL,google,GLOBAL,"مزوّد Voice Search",DRAFT,"google/azure/aws - Default: DISABLED"
VAR_SEARCH_VOICE_ENABLED_GLOBAL,GLOBAL,false,GLOBAL,"تفعيل Voice Search عالمياً",DRAFT,"يتطلب قرار تفعيل - حالياً معطل"
VAR_SEARCH_IMAGE_PROVIDER,GLOBAL,google,GLOBAL,"مزوّد Image Search",DRAFT,"google/azure/aws - Default: DISABLED"
VAR_SEARCH_IMAGE_ENABLED_DSH,DSH,false,DSH,"تفعيل Image Search في DSH",DRAFT,"يتطلب قرار تفعيل - حالياً معطل"
```

### 2. Guard Scripts (Skeleton)

**السبب:**
- ✅ scripts فحص فقط (لا تؤثر على الكود)
- ✅ قابلة للتعديل 100%
- ✅ لا تبعيات

**الإجراء:**
- إنشاء skeleton scripts
- ربطها بـ CI/CD
- توثيق الاستخدام

---

## ⚠️ Recommended فقط - مع تحذيرات واضحة

### 3. Frontend Stack (Recommended, ليس Mandatory)

**السبب:**
- ⚠️ قد يؤثر على هيكل المشروع
- ⚠️ قابل للتغيير لكن يحتاج جهد
- ✅ لكن UX Helper Kit يستخدم Tailwind CSS بالفعل

**الصياغة الآمنة:**
```markdown
### 4.1 Mobile Apps (React Native)

- **State Management**: [Recommended: Zustand أو Context API + useReducer]
  - **ملاحظة مهمة**: قابل للتغيير حسب احتياجات المشروع. سيتم تحديده نهائياً عند بناء التطبيقات.
  
- **Navigation**: [Recommended: React Navigation v6+]
  - **ملاحظة مهمة**: المعيار الصناعي، لكن قابل للتغيير. سيتم تحديده نهائياً عند بناء التطبيقات.

- **Styling**: [Recommended: React Native StyleSheet + Design Tokens]
  - **ملاحظة مهمة**: سيتم تحديده نهائياً عند بناء التطبيقات.

### 4.2 Web Apps & Dashboards (Next.js)

- **State Management**: [Recommended: Zustand (client state) + React Query (server state)]
  - **ملاحظة مهمة**: قابل للتغيير حسب احتياجات المشروع. سيتم تحديده نهائياً عند بناء الواجهات.

- **Navigation**: Next.js App Router (built-in)
  - **ملاحظة**: مدمج في Next.js، لا حاجة لاختيار.

- **Styling**: [Recommended: Tailwind CSS v3+]
  - **ملاحظة مهمة**: مستخدم بالفعل في UX Helper Kit. قابل للتغيير. سيتم تحديده نهائياً عند بناء الواجهات.
```

**السبب في "Recommended":**
- نترك مجال للقرارات المستقبلية
- لا نلزم المشروع بخيارات قد تتغير
- نقدم توصيات بناءً على أفضل الممارسات

---

## ❌ لا يمكن افتراضه الآن

### 4. Screen Endpoints

#### 4.1 APP_USER_HOME

**السبب:**
- ⚠️ لم أجد endpoint مناسب واضح في DSH OpenAPI
- ⚠️ قد يحتاج endpoint جديد
- ❌ قد يؤثر على تصميم Home Screen

**الإجراء:**
- الحفاظ على `[TBD]` حتى يتم تحديد endpoint مناسب
- أو استخدام `GET /api/dls/orders` كـ placeholder مع ملاحظة

#### 4.2 Screens مرتبطة بخدمات DRAFT

**السبب:**
- ❌ WLT, ARB, KNZ, AMN, SND, MRF في حالة DRAFT
- ❌ Endpoints قد تتغير
- ❌ قد يؤثر على تطوير الخدمات

**الإجراء:**
- الحفاظ على `[TBD]` حتى تكتمل الخدمات

### 5. Dashboard Screens

**السبب:**
- ❌ تحتاج تصميم فعلي
- ❌ لا توجد endpoints واضحة
- ❌ قد يؤثر على تطوير Dashboard

**الإجراء:**
- الحفاظ على `[TBD]` حتى يكتمل التصميم

---

## خطة التنفيذ الآمنة

### Phase 1: Runtime Variables (15 دقيقة) ✅

**Zero Impact - آمن 100%**

1. تحديث `VAR_AMN_ALLOWED_REGIONS`
2. إضافة Infrastructure variables
3. إضافة Voice/Image Search variables
4. تحديث `docs/QUESTIONS_TBD.md`

### Phase 2: Frontend Stack Documentation (10 دقائق) ⚠️

**Recommended فقط - مع تحذيرات**

1. تحديث `.github/Cursor/rules/Frontend.rules.mdc`
   - استخدام "Recommended" (ليس Mandatory)
   - إضافة ملاحظات واضحة
2. تحديث `docs/QUESTIONS_TBD.md`
   - نقل إلى "Recommended" بدلاً من TBD

### Phase 3: Guard Scripts (20 دقيقة) ✅

**Zero Impact - آمن 100%**

1. إنشاء `scripts/guard_openapi.mjs`
2. إنشاء `scripts/guard_secrets.mjs`
3. إنشاء `scripts/guard_routes_parity.mjs`
4. ربطها بـ `.github/workflows/gates.yml`

---

## النتائج المتوقعة

بعد تنفيذ Phase 1, 2, 3:

- ✅ **تقليل TBDs**: من 104 → ~90
- ✅ **Zero Impact**: لا تأثير على الخطوات القادمة
- ✅ **قيم آمنة**: جميع القيم قابلة للتعديل
- ✅ **توثيق واضح**: Recommended (ليس Mandatory)
- ✅ **Guard Scripts**: جاهزة للاستخدام

---

## Checklist التنفيذ

### Phase 1: Runtime Variables
- [ ] تحديث `VAR_AMN_ALLOWED_REGIONS` في `runtime/RUNTIME_VARS_CATALOG.csv`
- [ ] إضافة Infrastructure variables
- [ ] إضافة Voice/Image Search variables
- [ ] تحديث `docs/QUESTIONS_TBD.md` (القسم 6.1, 12.1, 5.1, 5.2)

### Phase 2: Frontend Stack
- [ ] تحديث `.github/Cursor/rules/Frontend.rules.mdc` (Recommended)
- [ ] تحديث `docs/Guidancefiles/AI GUIDE.mdc` (Recommended)
- [ ] تحديث `docs/QUESTIONS_TBD.md` (القسم 4 - Recommended)

### Phase 3: Guard Scripts
- [ ] إنشاء `scripts/guard_openapi.mjs`
- [ ] إنشاء `scripts/guard_secrets.mjs`
- [ ] إنشاء `scripts/guard_routes_parity.mjs`
- [ ] ربطها بـ `.github/workflows/gates.yml`
- [ ] تحديث `docs/QUESTIONS_TBD.md` (القسم 7.1)

---

**آخر تحديث**: 2025-02-15  
**الحالة**: جاهز للتنفيذ الآمن 100%

