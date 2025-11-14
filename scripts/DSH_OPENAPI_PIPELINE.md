# DSH OpenAPI & Artifact Pipeline

This guide captures the local workflow to keep the DSH specification and datasets in sync with the scripts/ helpers.

## 1. Regenerate the OpenAPI Spec

`
python scripts/generate_dsh_openapi.py \
  --routes data/dsh/DSH_routes_complete.csv \
  --output oas/services/dsh/openapi.yaml \
  --baseline oas/services/dsh/openapi.yaml
`

- --baseline preserves curated component schemas (orders, payroll, partner flows) instead of the placeholders emitted from the CSV.
- The generator injects idempotency headers, pagination params, path parameters, surface tags, and guard annotations pulled from the CSV.

## 2. Bundle Downstream Artifacts

`
python scripts/build_dsh_artifacts.py \
  --routes-csv data/dsh/DSH_routes_complete.csv \
  --screens-csv data/dsh/DSH_screens_complete.csv \
  --routes-summary data/dsh/routes_SUMMARY.json \
  --routes-excluded data/dsh/DSH_routes_excluded.json \
  --screens-summary data/dsh/screens_SUMMARY.json \
  --screens-rejected data/dsh/SCREENS_REJECTED.json
`

Outputs a timestamped directory under uild/ plus an ARTIFACTS.zip with SHA-256 hashes for traceability.

## 3. CI Wiring Checklist

- [ ] Add the commands above to nightly/pre-merge pipelines so drift between CSVs and OAS is detected quickly.
- [ ] Run Spectral and openapi-diff against the previous published spec to flag breaking changes before deploy.
- [ ] Publish uild/**/BUILD_SUMMARY.json as an artifact to simplify release reviews.
- [ ] Export curated CSVs to data/dsh/ within the repo; the commands assume that path.

## 4. Manual Spot Validation

Spot-check a few high-risk flows after regeneration:

1. POST /api/dls/orders — Checkout payload aligns (items, payment_method, slot_id).
2. POST /api/hr/payroll/runs/{id}/approve — Dual-sign guard and webhook payloads.
3. POST /api/finance/settlements/{id}/payouts — Step-up guard + MoneyValue rounding rules.

Document discrepancies in docs/QUESTIONS_TBD.mdc until code owners confirm.

## 5. Nightly Automation Idea

A GitHub Action (PowerShell runner) can:

1. Sync the latest CSV snapshot.
2. Run both commands above.
3. Commit the diff to an internal chore/dsh-artifacts-<date> branch for review.

Ping the platform guild if you need support wiring this into existing CI templates.
