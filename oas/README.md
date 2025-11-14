# OpenAPI Specifications

This folder stores per-service contracts and the aggregated master spec.

## Layout

- `services/<code>/openapi.yaml`: contract for each backend service (`dsh`, `wlt`, `arb`, etc.). File names are lowercase service codes.
- `master/Master_OpenAPI.yaml`: combined specification built from service files (see `npm run build:openapi`).

## Requirements

Every service spec **must** include:

1. `info.description` — narrative summary of the service.
2. `info.contact` with at least `email`.
3. `servers` list with `https://api-dev.bthwani.com`, `https://api-stage.bthwani.com`, and `https://api.bthwani.com`.

CI enforces these via:

- `scripts/verify-oas-metadata.ps1`
- `.github/workflows/contracts.yml`
- `.github/workflows/explainar.yml` (generation step)

## Workflow

1. Update the relevant `services/<code>/openapi.yaml`.
2. Rebuild explainar docs (`python scripts/generate_explainar.py`) and master spec (`npm run build:openapi`).
3. Commit any regenerated files under `docs/explainar/generated/` and `oas/master/`.

Refer to `docs/ARCHITECTURE.md` for how OAS files align with runtime modules, apps, dashboards, and trace tables.
