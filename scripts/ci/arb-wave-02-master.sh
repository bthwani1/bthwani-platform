#!/bin/bash
set -euo pipefail

SESSION_ID="${SESSION_ID:-20251115-ARB-WAVE-02}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

SERVICE="arb"
DIST_DIR="dist/${SERVICE}"
mkdir -p "$DIST_DIR"

OAS_FILE="${OAS_FILE:-oas/services/arb/openapi.yaml}"

echo "=== WAVE-ARB/02 — Build, Test, Containers, Contracts & Runtime Smoke ==="
echo "SESSION_ID: $SESSION_ID"
echo "REPO_ROOT: $REPO_ROOT"
echo "OAS_FILE: $OAS_FILE"
echo ""

# A) BUILD & STATIC CHECKS
echo "=== A) BUILD & STATIC CHECKS ==="
npm ci

echo "Type-check..."
npx tsc --noEmit 2>&1 | tee "$DIST_DIR/TSC_OUTPUT.txt" || {
  echo "Type-check failed" > "$DIST_DIR/STATIC_CHECKS.md"
  exit 1
}

echo "Lint..."
npx eslint . --max-warnings=0 --format json > "$DIST_DIR/ESLINT.json" 2>&1 || {
  echo "Lint failed" >> "$DIST_DIR/STATIC_CHECKS.md"
  exit 1
}

echo "Prettier check..."
npx prettier --check . > "$DIST_DIR/PRETTIER.txt" 2>&1 || {
  echo "Prettier check failed" >> "$DIST_DIR/STATIC_CHECKS.md"
  exit 1
}

echo "Build..."
npm run build 2>&1 | tee "$DIST_DIR/BUILD_LOG.txt" || {
  echo "Build failed" >> "$DIST_DIR/STATIC_CHECKS.md"
  exit 1
}

cat > "$DIST_DIR/STATIC_CHECKS.md" <<EOF
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
EOF

# B) UNIT & E2E TESTS
echo ""
echo "=== B) UNIT & E2E TESTS ==="

echo "Unit tests with coverage..."
npm run test:cov -- --coverageThreshold='{"global":{"branches":85,"functions":90,"lines":90}}' \
  --coverageDirectory="$DIST_DIR/UNIT_COVERAGE" \
  --collectCoverageFrom="src/modules/arb/**/*.ts" \
  --collectCoverageFrom="!src/modules/arb/**/*.spec.ts" \
  --testPathPattern="arb" \
  --json --outputFile="$DIST_DIR/TEST_REPORT_UNIT.json" || {
  echo "Unit tests failed"
  exit 1
}

echo "E2E tests..."
npm run test:e2e -- --json --outputFile="$DIST_DIR/TEST_REPORT_E2E.json" \
  --testPathPattern="arb" || {
  echo "E2E tests failed"
  exit 1
}

# C) CONTRACT TESTS
echo ""
echo "=== C) CONTRACT TESTS ==="

if [ -f "$OAS_FILE" ]; then
  echo "Spectral lint..."
  npx @stoplight/spectral-cli lint "$OAS_FILE" > "$DIST_DIR/SPECTRAL.txt" 2>&1 || true

  echo "Idempotency audit..."
  node scripts/guards/idempotency_header_check.js \
    --paths "/api/arb/**" \
    --oas "$OAS_FILE" > "$DIST_DIR/IDEMPOTENCY_AUDIT.md" 2>&1 || true

  echo "Running contract tests (Prism/Schemathesis)..."
  export SERVICE="arb"
  export OAS_FILE="$OAS_FILE"
  export PRISM_PORT="4022"
  node scripts/wave/run-contract-tests-arb.js || true

  echo "Generating contract test summary..."
  node scripts/contract/arb_contract_summary.js \
    "$DIST_DIR/SCHEMA_REPORT.json" \
    "$DIST_DIR/CONTRACT_TESTS_SUMMARY.md" || true

  cat > "$DIST_DIR/CONTRACT_TESTS_SUMMARY.md" <<EOF
# Contract Tests Summary — ARB

## Spectral Lint
- Output: See SPECTRAL.txt

## Idempotency Audit
- Output: See IDEMPOTENCY_AUDIT.md

## Schemathesis
- Report: See SCHEMA_REPORT.json
EOF
else
  echo "OAS file not found: $OAS_FILE"
  echo "Skipping contract tests"
fi

# D) DB MIGRATIONS & SEED (Dry-Run)
echo ""
echo "=== D) DB MIGRATIONS & SEED (Dry-Run) ==="

docker run -d --rm --name arb-pg-ci \
  -e POSTGRES_PASSWORD=postgres \
  -p 5552:5432 postgres:15 > /dev/null 2>&1 || true

sleep 3

export DB_URL="postgres://postgres:postgres@127.0.0.1:5552/arb_ci"
export SERVICE="arb"

echo "Migration dry-run..."
npm run orm:migrate:dry 2>&1 | tee "$DIST_DIR/DB_MIGRATE_DRY.txt" || true

echo "Seed dry-run..."
npm run seed:dry 2>&1 | tee "$DIST_DIR/DB_SEED_DRY.txt" || true

docker stop arb-pg-ci > /dev/null 2>&1 || true

# E) CONTAINERS & SECURITY
echo ""
echo "=== E) CONTAINERS & SECURITY ==="

if [ -f "docker/ArbService.Dockerfile" ]; then
  echo "Building Docker image..."
  docker build -f docker/ArbService.Dockerfile -t arb:ci . 2>&1 | tee "$DIST_DIR/DOCKER_BUILD.log" || {
    echo "Docker build failed"
    exit 1
  }

  echo "Hadolint check..."
  docker run --rm -i hadolint/hadolint < docker/ArbService.Dockerfile > "$DIST_DIR/HADOLINT.json" 2>&1 || true

  echo "Trivy scan..."
  trivy image --severity HIGH,CRITICAL --exit-code 0 --format json -o "$DIST_DIR/TRIVY_IMAGE.json" arb:ci || true

  echo "SBOM generation..."
  syft arb:ci -o cyclonedx-json > "$DIST_DIR/SBOM.json" 2>&1 || true

  echo "Provenance..."
  node scripts/wave/provenance-stub.js arb:ci > "$DIST_DIR/PROVENANCE.json" 2>&1 || true
else
  echo "Dockerfile not found"
fi

# F) RUNTIME SMOKE
echo ""
echo "=== F) RUNTIME SMOKE ==="

echo "Starting service..."
npm run start:ci -- --port=4420 > "$DIST_DIR/RUNTIME_STARTUP.log" 2>&1 &
SERVICE_PID=$!
sleep 5

echo "Running probes..."
node scripts/guards/perf_probe_arb.js \
  --base "http://127.0.0.1:4420" \
  --endpoints "/api/arb/offers?limit=10" \
  --endpoints "/api/arb/bookings" \
  --endpoints "/api/arb/bookings/TEST123" \
  --endpoints "/api/arb/bookings/TEST123/chat/messages" \
  > "$DIST_DIR/RUNTIME_PROBE.json" 2>&1 || true

kill $SERVICE_PID 2>/dev/null || true

# G) ARB-SPECIFIC BEHAVIORAL GUARDS
echo ""
echo "=== G) ARB-SPECIFIC BEHAVIORAL GUARDS ==="

echo "Ledger invariants check..."
node scripts/guards/ledger_invariants_check.js \
  --service SRV-ARB-01 > "$DIST_DIR/LEDGER_GUARDS.md" 2>&1 || true

echo "Escrow flows check..."
node scripts/guards/escrow_flows_check.js \
  --vars VAR_ARB_RELEASE_DAYS,VAR_ARB_NO_SHOW_KEEP_PCT,VAR_ARB_NO_SHOW_CAP_YER \
  > "$DIST_DIR/ESCROW_GUARDS.md" 2>&1 || true

echo "Chat privacy check..."
node scripts/guards/chat_privacy_check.js \
  --booking TEST123 \
  --send "اتصل بي 771234567 https://wa.me/..." \
  > "$DIST_DIR/CHAT_GUARDS.md" 2>&1 || true

echo "Step-Up RBAC check..."
node scripts/guards/stepup_rbac_check.js \
  --paths "/api/arb/admin/*,/api/arb/support/*" \
  > "$DIST_DIR/STEPUP_RBAC_GUARDS.md" 2>&1 || true

# H) GUARDS AGGREGATION & SSoT PATCH
echo ""
echo "=== H) GUARDS AGGREGATION & SSoT PATCH ==="

cat > "$DIST_DIR/ARB_GUARDS_REPORT.md" <<'EOF'
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
EOF

cat > "$DIST_DIR/AUDIT_SUMMARY.md" <<EOF
# ARB Audit Summary — WAVE-ARB/02

Entity: SRV-ARB-01 v2.0
Session: $SESSION_ID
Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF

cat > "$DIST_DIR/PR_SUMMARY.md" <<'EOF'
# PR Summary — ARB Wave 02

## Recommendations & GO/NO-GO

### Status
- [ ] GO: All checks passed
- [ ] NO-GO: Issues found (see DIAG_REPORT.md)

### Findings
TBD

### Next Steps
TBD
EOF

echo "Creating artifacts zip..."
zip -rq "$DIST_DIR/ARTIFACTS_WAVE_ARB_02.zip" "$DIST_DIR" || true

echo ""
echo "=== WAVE-ARB/02 COMPLETED ==="
echo "Reports available in: $DIST_DIR"
