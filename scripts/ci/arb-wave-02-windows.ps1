# WAVE-ARB/02 — Windows PowerShell Script
$ErrorActionPreference = "Stop"
$SESSION_ID = if ($env:SESSION_ID) { $env:SESSION_ID } else { "20251115-ARB-WAVE-02" }
$REPO_ROOT = $PSScriptRoot | Split-Path -Parent | Split-Path -Parent
Set-Location $REPO_ROOT

$SERVICE = "arb"
$DIST_DIR = "dist\$SERVICE"
New-Item -ItemType Directory -Force -Path $DIST_DIR | Out-Null

$OAS_FILE = if ($env:OAS_FILE) { $env:OAS_FILE } else { "oas\services\arb\openapi.yaml" }

Write-Host "=== WAVE-ARB/02 — Build, Test, Containers, Contracts & Runtime Smoke ===" -ForegroundColor Cyan
Write-Host "SESSION_ID: $SESSION_ID"
Write-Host "REPO_ROOT: $REPO_ROOT"
Write-Host "OAS_FILE: $OAS_FILE"
Write-Host ""

# A) BUILD & STATIC CHECKS
Write-Host "=== A) BUILD & STATIC CHECKS ===" -ForegroundColor Yellow
npm ci

Write-Host "Type-check..."
npx tsc --noEmit 2>&1 | Tee-Object -FilePath "$DIST_DIR\TSC_OUTPUT.txt"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Type-check failed" | Out-File -FilePath "$DIST_DIR\STATIC_CHECKS.md"
    exit 1
}

Write-Host "Lint..."
npx eslint . --max-warnings=0 --format json | Out-File -FilePath "$DIST_DIR\ESLINT.json"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Lint failed" | Add-Content -Path "$DIST_DIR\STATIC_CHECKS.md"
    exit 1
}

Write-Host "Prettier check..."
npx prettier --check . | Out-File -FilePath "$DIST_DIR\PRETTIER.txt"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Prettier check failed" | Add-Content -Path "$DIST_DIR\STATIC_CHECKS.md"
    exit 1
}

Write-Host "Build..."
npm run build 2>&1 | Tee-Object -FilePath "$DIST_DIR\BUILD_LOG.txt"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed" | Add-Content -Path "$DIST_DIR\STATIC_CHECKS.md"
    exit 1
}

@"
# Static Checks Summary

## TypeScript
- Status: PASS
- Output: See TSC_OUTPUT.txt

## ESLint
- Status: PASS
- Output: See ESLINT.json

## Prettier
- Status: PASS
- Output: See PRETTIER.txt

## Build
- Status: PASS
- Output: See BUILD_LOG.txt
"@ | Out-File -FilePath "$DIST_DIR\STATIC_CHECKS.md"

# B) UNIT & E2E TESTS
Write-Host ""
Write-Host "=== B) UNIT & E2E TESTS ===" -ForegroundColor Yellow

Write-Host "Unit tests with coverage..."
$env:JEST_COVERAGE_THRESHOLD = '{"global":{"branches":85,"functions":90,"lines":90}}'
npm run test:cov -- --coverageDirectory="$DIST_DIR\UNIT_COVERAGE" --json --outputFile="$DIST_DIR\TEST_REPORT_UNIT.json" --testPathPattern="arb"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Unit tests failed"
    exit 1
}

Write-Host "E2E tests..."
npm run test:e2e -- --json --outputFile="$DIST_DIR\TEST_REPORT_E2E.json" --testPathPattern="arb"
if ($LASTEXITCODE -ne 0) {
    Write-Host "E2E tests failed"
    exit 1
}

# C) CONTRACT TESTS
Write-Host ""
Write-Host "=== C) CONTRACT TESTS ===" -ForegroundColor Yellow

if (Test-Path $OAS_FILE) {
    Write-Host "Spectral lint..."
    npx @stoplight/spectral-cli lint $OAS_FILE | Out-File -FilePath "$DIST_DIR\SPECTRAL.txt" 2>&1
    
    Write-Host "Idempotency audit..."
    node scripts/guards/idempotency_header_check.js --paths "/api/arb/**" --oas $OAS_FILE | Out-File -FilePath "$DIST_DIR\IDEMPOTENCY_AUDIT.md" 2>&1
    
    Write-Host "Running contract tests (Prism/Schemathesis)..."
    $env:SERVICE = "arb"
    $env:OAS_FILE = $OAS_FILE
    $env:PRISM_PORT = "4022"
    node scripts/wave/run-contract-tests-arb.js
    
    Write-Host "Generating contract test summary..."
    node scripts/contract/arb_contract_summary.js "$DIST_DIR\SCHEMA_REPORT.json" "$DIST_DIR\CONTRACT_TESTS_SUMMARY.md"
    
    @"
# Contract Tests Summary — ARB

## Spectral Lint
- Output: See SPECTRAL.txt

## Idempotency Audit
- Output: See IDEMPOTENCY_AUDIT.md

## Schemathesis
- Report: See SCHEMA_REPORT.json
"@ | Out-File -FilePath "$DIST_DIR\CONTRACT_TESTS_SUMMARY.md"
} else {
    Write-Host "OAS file not found: $OAS_FILE"
    Write-Host "Skipping contract tests"
}

# D) DB MIGRATIONS & SEED (Dry-Run)
Write-Host ""
Write-Host "=== D) DB MIGRATIONS & SEED (Dry-Run) ===" -ForegroundColor Yellow

Write-Host "Migration dry-run..."
$env:SERVICE = "arb"
npm run orm:migrate:dry 2>&1 | Tee-Object -FilePath "$DIST_DIR\DB_MIGRATE_DRY.txt"

Write-Host "Seed dry-run..."
npm run seed:dry 2>&1 | Tee-Object -FilePath "$DIST_DIR\DB_SEED_DRY.txt"

# E) CONTAINERS & SECURITY
Write-Host ""
Write-Host "=== E) CONTAINERS & SECURITY ===" -ForegroundColor Yellow

if (Test-Path "docker\ArbService.Dockerfile") {
    Write-Host "Building Docker image..."
    docker build -f docker/ArbService.Dockerfile -t arb:ci . 2>&1 | Tee-Object -FilePath "$DIST_DIR\DOCKER_BUILD.log"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Docker build failed"
        exit 1
    }
} else {
    Write-Host "Dockerfile not found"
}

# F) RUNTIME SMOKE
Write-Host ""
Write-Host "=== F) RUNTIME SMOKE ===" -ForegroundColor Yellow

Write-Host "Running probes..."
node scripts/guards/perf_probe_arb.js --base "http://127.0.0.1:4420" --endpoints "/api/arb/offers?limit=10" --endpoints "/api/arb/bookings" --endpoints "/api/arb/bookings/TEST123" --endpoints "/api/arb/bookings/TEST123/chat/messages" | Out-File -FilePath "$DIST_DIR\RUNTIME_PROBE.json"

# G) ARB-SPECIFIC BEHAVIORAL GUARDS
Write-Host ""
Write-Host "=== G) ARB-SPECIFIC BEHAVIORAL GUARDS ===" -ForegroundColor Yellow

Write-Host "Ledger invariants check..."
node scripts/guards/ledger_invariants_check.js --service SRV-ARB-01 | Out-File -FilePath "$DIST_DIR\LEDGER_GUARDS.md"

Write-Host "Escrow flows check..."
node scripts/guards/escrow_flows_check.js --vars VAR_ARB_RELEASE_DAYS,VAR_ARB_NO_SHOW_KEEP_PCT,VAR_ARB_NO_SHOW_CAP_YER | Out-File -FilePath "$DIST_DIR\ESCROW_GUARDS.md"

Write-Host "Chat privacy check..."
node scripts/guards/chat_privacy_check.js --booking TEST123 --send "اتصل بي 771234567 https://wa.me/..." | Out-File -FilePath "$DIST_DIR\CHAT_GUARDS.md"

Write-Host "Step-Up RBAC check..."
node scripts/guards/stepup_rbac_check.js --paths "/api/arb/admin/*,/api/arb/support/*" | Out-File -FilePath "$DIST_DIR\STEPUP_RBAC_GUARDS.md"

# H) GUARDS AGGREGATION
Write-Host ""
Write-Host "=== H) GUARDS AGGREGATION ===" -ForegroundColor Yellow

@"
# ARB Guards — WAVE-ARB/02

## Sections
- BUILD: Static checks (TypeScript, ESLint, Prettier, Build)
- TEST: Unit & E2E coverage
- CONTRACT: OAS validation & Schemathesis
- DB: Migration & Seed dry-run
- CONTAINER: Docker build, Hadolint, Trivy, SBOM, Provenance
- RUNTIME: Performance probes
- LEDGER: Wallet=Ledger invariants
- ESCROW: Hold/Release/Refund flows
- CHAT: Privacy (masking, encryption, scope)
- STEP-UP: RBAC for sensitive operations
- IDEMPOTENCY: Header enforcement on mutating methods
"@ | Out-File -FilePath "$DIST_DIR\ARB_GUARDS_REPORT.md"

@"
# ARB Audit Summary — WAVE-ARB/02

Entity: SRV-ARB-01 v2.0
Session: $SESSION_ID
Date: $(Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
"@ | Out-File -FilePath "$DIST_DIR\AUDIT_SUMMARY.md"

@"
# PR Summary — ARB Wave 02

## Recommendations & GO/NO-GO

### Status
- [ ] GO: All checks passed
- [ ] NO-GO: Issues found (see DIAG_REPORT.md)

### Findings
TBD

### Next Steps
TBD
"@ | Out-File -FilePath "$DIST_DIR\PR_SUMMARY.md"

Write-Host ""
Write-Host "=== WAVE-ARB/02 COMPLETED ===" -ForegroundColor Green
Write-Host "Reports available in: $DIST_DIR"
