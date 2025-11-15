# KWD Scripts — Build, Test & Validation

**Service:** SRV-KWD-01 v1.0  
**Purpose:** Automated testing and validation scripts for KWD service

---

## 📁 Scripts Overview

| Script | Purpose | Duration | Status |
|--------|---------|----------|--------|
| `kwd-build-check.js` | Type-check, lint, prettier, build | ~30s | ✅ Ready |
| `kwd-unit-tests.js` | Unit tests with coverage thresholds | ~10s | ✅ Ready |
| `kwd-e2e-tests.js` | End-to-end API tests | ~15s | ✅ Ready |
| `kwd-contract-tests.js` | OpenAPI spec validation | ~5s | ✅ Ready |
| `kwd-wave-runner.js` | Orchestrates all checks | ~60s | ✅ Ready |

---

## 🚀 Quick Start

### Run Individual Checks

```bash
# Contract Tests (fastest, no dependencies)
node scripts/kwd/kwd-contract-tests.js

# Build & Static Checks
node scripts/kwd/kwd-build-check.js

# Unit Tests (requires: npm ci)
node scripts/kwd/kwd-unit-tests.js

# E2E Tests (requires: test database)
node scripts/kwd/kwd-e2e-tests.js
```

### Run Complete Wave

```bash
# Full validation suite
node scripts/kwd/kwd-wave-runner.js
```

Output: `dist/kwd/KWD_GUARDS_REPORT.md`

---

## 📝 Script Details

### 1. kwd-contract-tests.js

**Purpose:** Validates OpenAPI specification

**Checks:**
- Spectral linting (errors & warnings)
- Structure validation (11 checks)
- Server allowlist compliance
- Required sections presence

**Usage:**
```bash
node scripts/kwd/kwd-contract-tests.js
```

**Output:**
- `dist/kwd/CONTRACT_TESTS_SUMMARY.md`
- `dist/kwd/spectral-report.json`

**Exit Codes:**
- `0` = Pass
- `1` = Fail

---

### 2. kwd-build-check.js

**Purpose:** Static code quality checks

**Checks:**
1. TypeScript type-check (`tsc --noEmit`)
2. ESLint (`eslint --max-warnings=0`)
3. Prettier (`prettier --check`)
4. Build (`npm run build`)

**Usage:**
```bash
node scripts/kwd/kwd-build-check.js
```

**Output:**
- `dist/kwd/STATIC_CHECKS.md`

**Exit Codes:**
- `0` = All checks passed
- `1` = One or more checks failed

---

### 3. kwd-unit-tests.js

**Purpose:** Unit tests with coverage

**Coverage Thresholds:**
- Lines: ≥90%
- Branches: ≥85%
- Functions: ≥90%
- Statements: ≥90%

**Usage:**
```bash
node scripts/kwd/kwd-unit-tests.js
```

**Output:**
- `dist/kwd/UNIT_TESTS_SUMMARY.md`
- `dist/kwd/coverage/` (lcov reports)

**Exit Codes:**
- `0` = Tests passed & coverage met
- `1` = Tests failed or coverage below threshold

---

### 4. kwd-e2e-tests.js

**Purpose:** End-to-end API tests

**Test Suites:**
- KWD Public API (6 scenarios)
- Admin API (future)
- Support API (future)

**Prerequisites:**
- Test database available
- Migrations applied

**Usage:**
```bash
# Setup test DB
export DB_URL=postgresql://user:pass@localhost:5432/kwd_test

# Run tests
node scripts/kwd/kwd-e2e-tests.js
```

**Output:**
- `dist/kwd/E2E_TESTS_SUMMARY.md`

**Exit Codes:**
- `0` = All E2E tests passed
- `1` = One or more tests failed

---

### 5. kwd-wave-runner.js

**Purpose:** Orchestrates all validation checks

**Execution Order:**
1. Build & Static Checks
2. Unit Tests
3. E2E Tests
4. Contract Tests
5. DB Migrations (skipped if no DB)
6. Container Build (skipped if no Docker)
7. Runtime Smoke (skipped if service not running)
8. Generate Reports

**Usage:**
```bash
# With session ID
SESSION_ID=my-wave node scripts/kwd/kwd-wave-runner.js

# Default session ID (auto-generated)
node scripts/kwd/kwd-wave-runner.js
```

**Outputs:**
- `dist/kwd/KWD_GUARDS_REPORT.md` - Overall status
- `dist/kwd/PR_SUMMARY.md` - PR recommendation
- `dist/kwd/AUDIT_SUMMARY.md` - Compliance audit
- `dist/kwd/wave-results.json` - Machine-readable results

**Exit Codes:**
- `0` = All checks passed
- `1` = One or more checks failed

---

## 🔧 Troubleshooting

### Script Fails: "Cannot find module"

**Solution:**
```bash
npm ci
```

### TypeScript Errors

**Solution:**
```bash
# Check types
npx tsc --noEmit

# Fix and retry
npm run build
```

### ESLint Errors

**Solution:**
```bash
# Auto-fix
npm run lint

# Check only
npx eslint src/modules/kwd --max-warnings=0
```

### Prettier Errors

**Solution:**
```bash
# Auto-format
npm run format

# Check only
npx prettier --check "src/modules/kwd/**/*.ts"
```

### E2E Tests Fail: Database Connection

**Solution:**
```bash
# Setup local Postgres
docker run -d --name kwd-test-db \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15

# Set DB URL
export DB_URL=postgresql://postgres:postgres@localhost:5432/kwd_test

# Run migrations
npm run migration:up

# Retry tests
node scripts/kwd/kwd-e2e-tests.js
```

---

## 📊 Output Reports

All scripts generate reports in `dist/kwd/`:

```
dist/kwd/
├── CONTRACT_TESTS_SUMMARY.md      # OpenAPI validation
├── STATIC_CHECKS.md               # Build & linting
├── UNIT_TESTS_SUMMARY.md          # Unit test results
├── E2E_TESTS_SUMMARY.md           # E2E test results
├── KWD_GUARDS_REPORT.md           # Overall wave status
├── PR_SUMMARY.md                  # Pull request summary
├── AUDIT_SUMMARY.md               # Compliance audit
├── wave-results.json              # Machine-readable
└── coverage/                      # Coverage HTML reports
```

---

## 🎯 CI/CD Integration

### GitHub Actions

```yaml
name: KWD Validation

on:
  push:
    paths:
      - 'src/modules/kwd/**'
      - 'oas/services/kwd/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: node scripts/kwd/kwd-wave-runner.js
      
      - uses: actions/upload-artifact@v3
        with:
          name: kwd-reports
          path: dist/kwd/
```

### GitLab CI

```yaml
kwd:validate:
  stage: test
  image: node:18
  script:
    - npm ci
    - node scripts/kwd/kwd-wave-runner.js
  artifacts:
    paths:
      - dist/kwd/
    reports:
      junit: dist/kwd/junit.xml
```

---

## 📚 Reference

- **WAVE Guide:** `scripts/kwd/WAVE-KWD-02-REFINED.md`
- **Service README:** `src/modules/kwd/README.md`
- **OpenAPI Spec:** `oas/services/kwd/openapi.yaml`

---

**Maintainer:** BThwani Engineering  
**Last Updated:** 2025-11-14

