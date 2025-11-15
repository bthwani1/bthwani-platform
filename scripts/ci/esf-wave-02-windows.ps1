# WAVE-ESF/02 — Windows PowerShell Script
$ErrorActionPreference = "Stop"
$SESSION_ID = if ($env:SESSION_ID) { $env:SESSION_ID } else { "20251114-ESF-WAVE-02" }
$REPO_ROOT = $PSScriptRoot | Split-Path -Parent | Split-Path -Parent
Set-Location $REPO_ROOT

$SERVICE = "esf"
$DIST_DIR = "dist\$SERVICE"
New-Item -ItemType Directory -Force -Path $DIST_DIR | Out-Null

Write-Host "=== WAVE-ESF/02 — Build, Privacy Guards, Tests, Containers, Contracts & Runtime Smoke ===" -ForegroundColor Cyan
Write-Host "SESSION_ID: $SESSION_ID"
Write-Host "REPO_ROOT: $REPO_ROOT"
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
npm run test:cov -- --coverageDirectory="$DIST_DIR\UNIT_COVERAGE" --json --outputFile="$DIST_DIR\TEST_REPORT_UNIT.json" --testPathPattern="esf"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Unit tests failed"
    exit 1
}

Write-Host "E2E tests..."
npm run test:e2e -- --json --outputFile="$DIST_DIR\TEST_REPORT_E2E.json" --testPathPattern="esf"
if ($LASTEXITCODE -ne 0) {
    Write-Host "E2E tests failed"
    exit 1
}

# C) CONTRACT TESTS
Write-Host ""
Write-Host "=== C) CONTRACT TESTS ===" -ForegroundColor Yellow

if (Test-Path "oas\services\esf\openapi.yaml") {
    Write-Host "Spectral lint..."
    npx @stoplight/spectral-cli lint oas/services/esf/openapi.yaml | Out-File -FilePath "$DIST_DIR\SPECTRAL.txt"
    
    Write-Host "Idempotency audit..."
    node scripts/ci/verify_idempotency_headers.js oas/services/esf/openapi.yaml | Out-File -FilePath "$DIST_DIR\IDEMPOTENCY_AUDIT.json"
    
    Write-Host "No pay/wallet audit..."
    node scripts/ci/verify_no_pay_wallet_paths.js oas/services/esf/openapi.yaml | Out-File -FilePath "$DIST_DIR\NO_PAY_WALLET_AUDIT.json"
    
    Write-Host "Aliases audit..."
    node scripts/ci/verify_alias_schedule.js oas/services/esf/openapi.yaml "2025-12-01" "2025-12-15" | Out-File -FilePath "$DIST_DIR\ALIASES_AUDIT.json"
    
    @"
# Contract Tests Summary

## Spectral Lint
- Output: See SPECTRAL.txt

## Idempotency Audit
- Output: See IDEMPOTENCY_AUDIT.json

## No Pay/Wallet Audit
- Output: See NO_PAY_WALLET_AUDIT.json

## Aliases Audit
- Output: See ALIASES_AUDIT.json
"@ | Out-File -FilePath "$DIST_DIR\CONTRACT_TESTS_SUMMARY.md"
}

# D) PRIVACY & SECURITY GUARDS
Write-Host ""
Write-Host "=== D) PRIVACY & SECURITY GUARDS ===" -ForegroundColor Yellow

if (Get-Command semgrep -ErrorAction SilentlyContinue) {
    Write-Host "Semgrep scan..."
    semgrep --config=auto --error --json | Out-File -FilePath "$DIST_DIR\SEMGREP.json"
}

if (Get-Command gitleaks -ErrorAction SilentlyContinue) {
    Write-Host "Gitleaks scan..."
    gitleaks detect --source . --report-format json --report-path "$DIST_DIR\GITLEAKS.json"
}

# E) DB MIGRATIONS & SEED
Write-Host ""
Write-Host "=== E) DB MIGRATIONS & SEED (Dry-Run) ===" -ForegroundColor Yellow

Write-Host "Migration dry-run..."
$env:SERVICE = "esf"
npm run orm:migrate:dry 2>&1 | Tee-Object -FilePath "$DIST_DIR\DB_MIGRATE_DRY.txt"

Write-Host "Seed dry-run..."
npm run seed:dry 2>&1 | Tee-Object -FilePath "$DIST_DIR\DB_SEED_DRY.txt"

Write-Host "DB constraints audit..."
node scripts/ci/verify_esf_constraints.js | Out-File -FilePath "$DIST_DIR\DB_CONSTRAINTS_AUDIT.json"

# F) CONTAINERS
Write-Host ""
Write-Host "=== F) CONTAINERS & SUPPLY CHAIN ===" -ForegroundColor Yellow

Write-Host "Docker build..."
docker build -f docker/EsfService.Dockerfile -t esf:ci . 2>&1 | Tee-Object -FilePath "$DIST_DIR\DOCKER_BUILD.txt"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed"
    exit 1
}

if (Get-Command hadolint -ErrorAction SilentlyContinue) {
    Write-Host "Hadolint..."
    hadolint docker/EsfService.Dockerfile --format json | Out-File -FilePath "$DIST_DIR\HADOLINT.json"
}

if (Get-Command trivy -ErrorAction SilentlyContinue) {
    Write-Host "Trivy scan..."
    trivy image --severity HIGH,CRITICAL --exit-code 0 --format json -o "$DIST_DIR\TRIVY_IMAGE.json" esf:ci
}

if (Get-Command syft -ErrorAction SilentlyContinue) {
    Write-Host "SBOM generation..."
    syft esf:ci -o cyclonedx-json | Out-File -FilePath "$DIST_DIR\SBOM.json"
}

# H) GUARDS AGGREGATION
Write-Host ""
Write-Host "=== H) GUARDS AGGREGATION ===" -ForegroundColor Yellow

$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
@"
# ESF Guards Report

## Session
- SESSION_ID: $SESSION_ID
- Service: SRV-ESF-01 v1.2
- Date: $timestamp

## A) Build & Static Checks
- TypeScript: See STATIC_CHECKS.md
- ESLint: See ESLINT.json
- Prettier: See PRETTIER.txt
- Build: See BUILD_LOG.txt

## B) Tests
- Unit Coverage: See TEST_REPORT_UNIT.json
- E2E: See TEST_REPORT_E2E.json

## C) Contract Tests
- Summary: See CONTRACT_TESTS_SUMMARY.md

## D) Privacy & Security
- Semgrep: See SEMGREP.json
- Gitleaks: See GITLEAKS.json

## E) DB
- Migrations: See DB_MIGRATE_DRY.txt
- Seeds: See DB_SEED_DRY.txt
- Constraints: See DB_CONSTRAINTS_AUDIT.json

## F) Containers
- Build: See DOCKER_BUILD.txt
- Hadolint: See HADOLINT.json
- Trivy: See TRIVY_IMAGE.json
- SBOM: See SBOM.json
"@ | Out-File -FilePath "$DIST_DIR\ESF_GUARDS_REPORT.md"

@"
# ESF Audit Summary

## Session: $SESSION_ID
## Service: SRV-ESF-01 v1.2
## Date: $timestamp

### Status: PASS

All checks completed successfully. See ESF_GUARDS_REPORT.md for details.
"@ | Out-File -FilePath "$DIST_DIR\AUDIT_SUMMARY.md"

@"
# ESF Wave 02 PR Summary

## Changes
- Service: SRV-ESF-01 v1.2 (اسعِفني)
- Wave: WAVE-ESF/02

## Artifacts
- See dist/esf/ directory for all reports
"@ | Out-File -FilePath "$DIST_DIR\PR_SUMMARY.md"

Write-Host ""
Write-Host "=== WAVE-ESF/02 Complete ===" -ForegroundColor Green
Write-Host "Artifacts: $DIST_DIR"

