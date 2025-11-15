# WAVE-ESF/02 — Build, Privacy Guards, Tests, Containers, Contracts & Runtime Smoke

## Overview

Complete CI/CD pipeline for ESF service (SRV-ESF-01 v1.2) covering build, tests, contracts, privacy guards, containers, and runtime smoke tests.

## Prerequisites

- Node.js LTS
- Docker
- (Optional) Semgrep, Gitleaks, Hadolint, Trivy, Syft for security scans

## Quick Start

### Linux/macOS

```bash
npm run wave:esf:02
```

### Windows

```powershell
npm run wave:esf:02:windows
```

### Manual Execution

```bash
SESSION_ID=20251114-ESF-WAVE-02 bash scripts/ci/esf-wave-02-master.sh
```

## Pipeline Steps

### A) Build & Static Checks

- TypeScript type-check (`tsc --noEmit`)
- ESLint with zero warnings
- Prettier format check
- NestJS build

**Outputs:**
- `dist/esf/TSC_OUTPUT.txt`
- `dist/esf/ESLINT.json`
- `dist/esf/PRETTIER.txt`
- `dist/esf/BUILD_LOG.txt`
- `dist/esf/STATIC_CHECKS.md`

### B) Unit & E2E Tests

- Unit tests with coverage thresholds:
  - Branches: ≥85%
  - Functions: ≥90%
  - Lines: ≥90%
- E2E tests for controllers

**Outputs:**
- `dist/esf/UNIT_COVERAGE/` (lcov.info)
- `dist/esf/TEST_REPORT_UNIT.json`
- `dist/esf/TEST_REPORT_E2E.json`

### C) Contract Tests

- Spectral lint for OpenAPI spec
- Idempotency-Key audit (all POST/PATCH must have it)
- No Pay/Wallet paths audit (SSOT invariant)
- Aliases schedule audit (/es3afni, /blood)

**Outputs:**
- `dist/esf/SPECTRAL.txt`
- `dist/esf/IDEMPOTENCY_AUDIT.json`
- `dist/esf/NO_PAY_WALLET_AUDIT.json`
- `dist/esf/ALIASES_AUDIT.json`
- `dist/esf/CONTRACT_TESTS_SUMMARY.md`

### D) Privacy & Security Guards

- Semgrep scan (privacy/PII/secrets)
- Gitleaks scan (secrets in code)
- OPA policies (RBAC/ABAC/Step-Up)

**Outputs:**
- `dist/esf/SEMGREP.json`
- `dist/esf/GITLEAKS.json`
- `dist/esf/OPA.txt`

### E) DB Migrations & Seed (Dry-Run)

- Migration dry-run validation
- Seed dry-run validation
- DB constraints audit (ABO/Rh strict, cooldown, radius)

**Outputs:**
- `dist/esf/DB_MIGRATE_DRY.txt`
- `dist/esf/DB_SEED_DRY.txt`
- `dist/esf/DB_CONSTRAINTS_AUDIT.json`

### F) Containers & Supply Chain

- Docker build (`docker/EsfService.Dockerfile`)
- Hadolint (Dockerfile linting)
- Trivy (vulnerability scan)
- SBOM generation (CycloneDX)
- Provenance generation

**Outputs:**
- `dist/esf/DOCKER_BUILD.txt`
- `dist/esf/HADOLINT.json`
- `dist/esf/TRIVY_IMAGE.json`
- `dist/esf/SBOM.json`
- `dist/esf/PROVENANCE.json`

### G) Runtime Smoke & Negative Tests

- Health checks (`/esf/health/live`, `/esf/health/ready`)
- Create request (with Idempotency-Key)
- Negative test (missing Idempotency-Key → 400/428)
- Donor availability update
- Messages (GET/POST) with masking verification
- Performance probe (p75 latency)

**Outputs:**
- `dist/esf/HEALTH.json`
- `dist/esf/HEALTH_READY.json`
- `dist/esf/REQ_CREATE.json`
- `dist/esf/NEG_NO_IDEMPOTENCY.txt`
- `dist/esf/AVAIL_OK.json`
- `dist/esf/MSGS_LIST.json`
- `dist/esf/MSGS_POST.json`
- `dist/esf/QUIET_HOURS_CHECK.json`
- `dist/esf/RUNTIME_PROBE.json`

### H) Guards Aggregation

- Complete guards report
- Audit summary
- PR summary
- Artifacts bundle (ZIP)

**Outputs:**
- `dist/esf/ESF_GUARDS_REPORT.md`
- `dist/esf/AUDIT_SUMMARY.md`
- `dist/esf/PR_SUMMARY.md`
- `dist/esf/ARTIFACTS_WAVE_ESF_02.zip`

## SSOT Invariants Verified

✅ **No Payments**: No `/wallet` or `/pay` paths in ESF API  
✅ **Phone Masking**: All phone numbers masked in responses  
✅ **AES-GCM Encryption**: Chat messages encrypted at field level  
✅ **Idempotency-Key**: Required for all POST/PATCH operations  
✅ **Quiet Hours**: 22:00–08:00 Asia/Aden with urgent override  
✅ **Aliases Schedule**: `/es3afni`, `/blood` → 308 from 2025-12-01 → 410 at 2025-12-15

## Acceptance Criteria

- ✅ Type-check/Lint/Prettier: PASS with zero warnings
- ✅ Unit/E2E: PASS with coverage ≥90% lines, ≥85% branches
- ✅ Contracts: PASS (no critical violations, Idempotency-Key documented, no pay/wallet paths)
- ✅ Privacy/Security: PASS (0 critical findings, phone masking enforced, OPA policies pass)
- ✅ DB: PASS (migrations/seed dry-run, constraints verified)
- ✅ Containers: PASS (Hadolint pass, Trivy HIGH/CRITICAL=0)
- ✅ Runtime: PASS (health OK, negative tests pass, p75 ≤150ms or documented)

## Scripts Reference

### Verification Scripts

- `scripts/ci/verify_idempotency_headers.js` — Verify Idempotency-Key in OpenAPI
- `scripts/ci/verify_no_pay_wallet_paths.js` — Verify no payment paths
- `scripts/ci/verify_alias_schedule.js` — Verify aliases schedule
- `scripts/ci/verify_esf_constraints.js` — Verify DB constraints
- `scripts/ci/perf_probe_esf.js` — Runtime performance probe

### Build Scripts

- `scripts/ci/esf-wave-02-master.sh` — Main pipeline (Linux/macOS)
- `scripts/ci/esf-wave-02-windows.ps1` — Main pipeline (Windows)
- `scripts/ci/build_esf_artifacts.js` — Create artifacts bundle

## Troubleshooting

### Build Fails

- Check `dist/esf/BUILD_LOG.txt` for errors
- Verify TypeScript compilation: `npx tsc --noEmit`
- Check ESLint: `npx eslint . --max-warnings=0`

### Tests Fail

- Check coverage thresholds in `jest.config.js`
- Review `dist/esf/TEST_REPORT_UNIT.json` and `TEST_REPORT_E2E.json`
- Ensure test database is configured

### Contract Tests Fail

- Review `dist/esf/IDEMPOTENCY_AUDIT.json` for missing Idempotency-Key
- Check `dist/esf/NO_PAY_WALLET_AUDIT.json` for payment paths
- Verify OpenAPI spec: `npx @stoplight/spectral-cli lint oas/services/esf/openapi.yaml`

### Docker Build Fails

- Check `dist/esf/DOCKER_BUILD.txt`
- Verify Dockerfile syntax: `hadolint docker/EsfService.Dockerfile`

## Artifacts

All artifacts are collected in `dist/esf/` and bundled in `dist/esf/ARTIFACTS_WAVE_ESF_02.zip`.

## SSOT Updates

After successful run, the following are updated:

- `registry/SSOT_INDEX.json` — ESF status and artifacts paths
- `registry/APPROVALS_LOG.md` — Wave 02 approval entry

## References

- Service: SRV-ESF-01 v1.2 (اسعِفني)
- Namespace: `/esf/*`
- OpenAPI: `oas/services/esf/openapi.yaml`
- Documentation: `src/modules/esf/README.md`

