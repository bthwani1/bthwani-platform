# WAVE-KWD/02 — Build, Test, Containers & Runtime (Refined)

**Version:** 2025-11-14  
**Service:** SRV-KWD-01 v1.0 (LOCKED)  
**Session ID:** 20251114-KWD-WAVE-02

---

## 📋 Overview

هذا الأمر الموسّع يغطي **البناء الكامل والاختبارات والحاويات والعقود** لخدمة **KWD (KoWADER)**. تم إعادة صياغته ليتناسب مع البنية الفعلية للمشروع ويكون قابلاً للتطبيق في بيئة Cursor/CI.

---

## 🎯 الأهداف

1. ✅ **فحص السورس كود** الكامل: type-check, lint, format, build
2. ✅ **اختبارات Unit** مع تغطية ≥90% lines & ≥85% branches
3. ✅ **اختبارات E2E** لجميع الـ endpoints الحرجة
4. ✅ **اختبارات العقود** (Contract Tests) ضد OpenAPI spec
5. ⚠️ **ترحيلات DB** (dry-run) - يتطلب قاعدة بيانات
6. ⚠️ **بناء الحاويات** وفحص أمني - يتطلب Docker
7. ⚠️ **اختبارات Runtime** - يتطلب خدمة عاملة
8. ✅ **تقارير موحّدة** وربط بـ SSOT

---

## 📦 البنية التحتية

### Scripts المساعدة

```
scripts/
├── kwd/
│   ├── kwd-build-check.js       # Build & static checks
│   ├── kwd-unit-tests.js        # Unit tests runner
│   ├── kwd-e2e-tests.js         # E2E tests runner
│   ├── kwd-contract-tests.js    # Contract tests validator
│   └── kwd-wave-runner.js       # Main orchestrator
├── ci/
│   └── healthcheck.sh           # Docker health check
```

### Dockerfile

```
docker/
└── KwdService.Dockerfile        # Multi-stage production build
```

### Tests

```
test/
└── kwd/
    └── kwd-public.e2e-spec.ts   # E2E tests for public API

src/modules/kwd/services/
└── listing-command.service.spec.ts  # Unit tests
```

---

## 🚀 الاستخدام

### Option 1: تشغيل كامل (مرحلة واحدة)

```bash
node scripts/kwd/kwd-wave-runner.js
```

### Option 2: تشغيل مراحل منفصلة

```bash
# 1. Build & Static Checks
node scripts/kwd/kwd-build-check.js

# 2. Unit Tests
node scripts/kwd/kwd-unit-tests.js

# 3. E2E Tests
node scripts/kwd/kwd-e2e-tests.js

# 4. Contract Tests
node scripts/kwd/kwd-contract-tests.js
```

### Option 3: تشغيل في CI/CD

```yaml
# .github/workflows/kwd-wave-02.yml
name: KWD WAVE-02

on:
  push:
    branches: [main, develop]
    paths:
      - 'src/modules/kwd/**'
      - 'oas/services/kwd/**'
      - 'test/kwd/**'

jobs:
  wave-kwd-02:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run WAVE-KWD/02
        run: node scripts/kwd/kwd-wave-runner.js
        env:
          SESSION_ID: ${{ github.run_id }}-KWD-WAVE-02
      
      - name: Upload Reports
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: kwd-wave-reports
          path: dist/kwd/
```

---

## 📊 المخرجات

### تقارير أساسية

```
dist/kwd/
├── STATIC_CHECKS.md           # Type-check, lint, prettier, build
├── UNIT_TESTS_SUMMARY.md      # Unit tests results & coverage
├── E2E_TESTS_SUMMARY.md       # E2E tests results
├── CONTRACT_TESTS_SUMMARY.md  # OpenAPI validation
├── KWD_GUARDS_REPORT.md       # Overall guards status
├── PR_SUMMARY.md              # Pull request recommendation
├── AUDIT_SUMMARY.md           # Compliance audit
├── wave-results.json          # Machine-readable results
└── coverage/                  # Coverage reports
```

### تقارير إضافية (عند التوفر)

```
dist/kwd/
├── DB_MIGRATIONS.md           # Migration dry-run results
├── CONTAINER_SECURITY.md      # Docker security scan
├── RUNTIME_PROBE.json         # Performance metrics
└── ARTIFACTS_WAVE_KWD_02.zip  # All artifacts bundled
```

---

## ✅ معايير القبول (GO/NO-GO)

### ✅ إلزامي (MUST PASS)

| Check | Threshold | Status |
|-------|-----------|--------|
| **Type Check** | No errors | ✅ |
| **ESLint** | Max warnings = 0 | ✅ |
| **Prettier** | All files formatted | ✅ |
| **Build** | Successful compilation | ✅ |
| **Unit Tests** | Coverage ≥90% lines, ≥85% branches | ✅ |
| **E2E Tests** | All critical flows pass | ✅ |
| **Contract Tests** | OpenAPI spec valid, no critical violations | ✅ |

### ⚠️ مستحسن (SHOULD PASS)

| Check | Threshold | Status |
|-------|-----------|--------|
| **DB Migrations** | Dry-run no errors | ⚠️ (requires DB) |
| **Container Build** | Hadolint pass, Trivy HIGH/CRITICAL=0 | ⚠️ (requires Docker) |
| **Runtime Smoke** | p75 ≤150ms for /api/kawader/* | ⚠️ (requires running service) |

---

## 🔧 إصلاح الأخطاء الشائعة

### TypeScript Errors

```bash
# Check types
npx tsc --noEmit

# Fix common issues
npm run build
```

### Linting Errors

```bash
# Auto-fix
npm run lint

# Check only
npx eslint src/modules/kwd --max-warnings=0
```

### Formatting

```bash
# Auto-format
npm run format

# Check only
npx prettier --check "src/modules/kwd/**/*.ts"
```

### Test Failures

```bash
# Run specific test
npx jest src/modules/kwd/services/listing-command.service.spec.ts

# Run with coverage
npm run test:cov

# Debug test
npm run test:debug
```

### Contract Violations

```bash
# Lint OpenAPI spec
npx @stoplight/spectral-cli lint oas/services/kwd/openapi.yaml

# Validate structure
node scripts/kwd/kwd-contract-tests.js
```

---

## 📝 الخطوات التفصيلية

### A) Build & Static Checks

```bash
# 1. Install dependencies
npm ci

# 2. Type check
npx tsc --noEmit

# 3. Lint
npx eslint src/modules/kwd --max-warnings=0

# 4. Format check
npx prettier --check "src/modules/kwd/**/*.ts"

# 5. Build
npm run build
```

**Output:** `dist/kwd/STATIC_CHECKS.md`

---

### B) Unit Tests

```bash
# Run with coverage
npx jest --testPathPattern=src/modules/kwd \
  --coverage \
  --coverageDirectory=dist/kwd/coverage \
  --coverageThreshold='{"global":{"branches":85,"functions":90,"lines":90,"statements":90}}'
```

**Output:** `dist/kwd/UNIT_TESTS_SUMMARY.md`, `dist/kwd/coverage/`

---

### C) E2E Tests

```bash
# Run KWD E2E tests
npx jest --testPathPattern=test/.*kwd.*.e2e-spec.ts \
  --config ./test/jest-e2e.json
```

**Output:** `dist/kwd/E2E_TESTS_SUMMARY.md`

---

### D) Contract Tests

```bash
# Lint OpenAPI spec
npx @stoplight/spectral-cli lint oas/services/kwd/openapi.yaml \
  --format json \
  > dist/kwd/spectral-report.json

# Validate structure
node scripts/kwd/kwd-contract-tests.js
```

**Output:** `dist/kwd/CONTRACT_TESTS_SUMMARY.md`, `dist/kwd/spectral-report.json`

---

### E) DB Migrations (Dry Run) ⚠️

```bash
# Start temporary Postgres
docker run -d --rm --name kwd-pg \
  -e POSTGRES_PASSWORD=postgres \
  -p 5545:5432 \
  postgres:15

# Set DB URL
export DB_URL=postgresql://postgres:postgres@localhost:5545/kwd_ci

# Run migrations dry-run
npm run orm:migrate:dry

# Cleanup
docker stop kwd-pg
```

**Output:** `dist/kwd/DB_MIGRATIONS.md`

---

### F) Container Build & Security ⚠️

```bash
# Build image
docker build -f docker/KwdService.Dockerfile -t kwd:ci .

# Lint Dockerfile
hadolint docker/KwdService.Dockerfile \
  --format json \
  > dist/kwd/HADOLINT.json

# Security scan
trivy image --severity HIGH,CRITICAL \
  --exit-code 1 \
  --format json \
  -o dist/kwd/TRIVY_IMAGE.json \
  kwd:ci

# Generate SBOM
syft kwd:ci -o cyclonedx-json > dist/kwd/SBOM.json
```

**Output:** `dist/kwd/CONTAINER_SECURITY.md`, `dist/kwd/SBOM.json`

---

### G) Runtime Smoke Tests ⚠️

```bash
# Start service
npm run start:prod &

# Wait for ready
sleep 10

# Probe endpoints
curl -f http://localhost:3000/health/live
curl -f http://localhost:3000/health/ready
curl -f "http://localhost:3000/api/kawader/search?keyword=test&limit=10"

# Measure performance
# (using Apache Bench, wrk, or custom script)
```

**Output:** `dist/kwd/RUNTIME_PROBE.json`

---

## 🎯 Integration مع SSOT

```bash
# Update SSOT registry
node scripts/ssot/patch_index.js \
  --index registry/SSOT_INDEX.json \
  --add dist/kwd/SBOM.json \
  --add dist/kwd/KWD_GUARDS_REPORT.md \
  --add dist/kwd/AUDIT_SUMMARY.md \
  --add dist/kwd/PR_SUMMARY.md

# Log approval
node scripts/ssot/append_approval.js \
  --log registry/APPROVALS_LOG.md \
  --session 20251114-KWD-WAVE-02 \
  --entity SRV-KWD-01 \
  --action BUILD_TEST \
  --status AUTO
```

---

## 🔍 استكشاف الأخطاء

### Common Issues

1. **TypeScript errors in new code**
   - Run `npm run build` to see specific errors
   - Check imports and types
   - Ensure all required types are defined

2. **Jest tests failing**
   - Check test database setup
   - Verify mocks are configured correctly
   - Run individual tests for debugging

3. **OpenAPI validation failures**
   - Check for missing required fields
   - Ensure servers list contains only API URLs
   - Validate against OpenAPI 3.1 spec

4. **Coverage below thresholds**
   - Write tests for uncovered code paths
   - Focus on services and critical business logic
   - Check coverage report for specific files

---

## 📚 المراجع

- **Service README:** `src/modules/kwd/README.md`
- **OpenAPI Spec:** `oas/services/kwd/openapi.yaml`
- **Engineering Guidelines:** `.github/Cursor/rules/`
- **SSOT Index:** `registry/SSOT_INDEX.json`

---

## ✅ Checklist

- [ ] All scripts executable: `chmod +x scripts/kwd/*.js scripts/ci/*.sh`
- [ ] Dependencies installed: `npm ci`
- [ ] OpenAPI spec exists: `oas/services/kwd/openapi.yaml`
- [ ] KWD module built: `src/modules/kwd/`
- [ ] Tests written: `test/kwd/`, `src/**/*.spec.ts`
- [ ] Dockerfile created: `docker/KwdService.Dockerfile`
- [ ] CI workflow configured: `.github/workflows/kwd-wave-02.yml`

---

**Status:** ✅ Ready for Execution  
**Last Updated:** 2025-11-14  
**Maintainer:** BThwani Engineering

