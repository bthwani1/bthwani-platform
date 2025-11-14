# BThwani Platform Architecture

This document connects code, contracts, runtime configuration, and experience surfaces so contributors know _where_ to work for each change.

## 1. Directory Map

| Directory             | Purpose                                                        | Owner docs                         |
| --------------------- | -------------------------------------------------------------- | ---------------------------------- |
| `src/`                | NestJS runtime (core + shared modules + per-service modules)   | `README.md` inside `src/`          |
| `oas/`                | OpenAPI contracts per service + `master` aggregate             | `oas/README.md`                    |
| `apps/`               | Mobile/web application screen catalogs (`SCREENS_CATALOG.csv`) | `apps/README.md`                   |
| `dashboards/`         | Analytics/ops surface catalogs + guard configs                 | `dashboards/README.md`             |
| `docs/Guidancefiles/` | Governance + playbooks                                         | `docs/README.md`                   |
| `docs/explainar/`     | Generated explainers that link OAS ↔ apps/dashboards          | `docs/README.md`                   |
| `registry/`           | SSOT registry + approvals log                                  | `registry/SSOT_INDEX.json`         |
| `runtime/`            | Runtime VAR\_\* catalog and guard parameters                   | `runtime/RUNTIME_VARS_CATALOG.csv` |
| `.github/workflows/`  | CI gates, guards, explainar sync, contracts                    | workflow YAML files                |
| `scripts/`            | Automation (OAS generation, explainar, guards)                 | script-level docstrings            |

## 2. Relationship Model

```
registry/SSOT_INDEX.json  ---> defines service/app/dashboard lifecycle status
        |
        +--> oas/services/<code>/openapi.yaml   # contract, servers, metadata
        |
        +--> src/modules/<code>/...             # runtime implementation (when READY)
        |
        +--> apps/**/SCREENS_CATALOG.csv        # UI screens tied via service_code
        +--> dashboards/**/SCREENS_CATALOG.csv  # BI/ops screens tied via service_code
```

- `docs/explainar/generated/*.generated.md` are built from OAS + screen catalogs so every endpoint has a traceable UI footprint.
- Guards inside `.github/workflows/gates.yml` rely on the runtime + registry data, so changes must keep SSOT files in sync.

## 3. Adding or Updating a Service

1. **Registry**: add a record in `registry/SSOT_INDEX.json` with lifecycle status (DRAFT/READY/LOCKED) and link to spec + runtime.
2. **OAS**: edit `oas/services/<service-code>/openapi.yaml`; ensure `info.description`, `info.contact`, and `servers` exist. Use `scripts/verify-oas-metadata.ps1`.
3. **Runtime**: create/update `src/modules/<service-code>/` (controllers, services, entities, DTOs). Follow NestJS guidelines (`docs/Guidancefiles/ReposiGOV.mdc`).
4. **Surfaces**: connect to apps/dashboards by adding rows to the relevant `SCREENS_CATALOG.csv` files (`service_code` column must match registry/OAS).
5. **Explainar**: run `python scripts/generate_explainar.py` so `docs/explainar/generated/<service>.generated.md` refreshes.
6. **CI**: confirm contracts, explainar, and gates pipelines pass (`npm run check:openapi`, `npm run lint`, etc.).

## 4. Adding or Updating a Screen

1. Choose the target surface (`apps/<app>/SCREENS_CATALOG.csv` or `dashboards/<board>/SCREENS_CATALOG.csv`).
2. Add/update the row with:
   - `service_code` (ties screen to service contract)
   - `screen_id`, `screen_name_[ar|en]`
   - Optional `ux_notes`, `rbac_role`, etc. (see catalog headers)
3. Re-run `scripts/generate_explainar.py` to refresh explainar files.
4. If surface requires runtime action, add traces in `traces/TRACE_TABLE.csv` linking `surface_id` + `operation_id`.

## 5. Documentation Taxonomy (@docs)

- `docs/Guidancefiles/AI GUIDE.mdc`: execution waves and priorities.
- `docs/Guidancefiles/ReposiGOV.mdc`: governance, branch protections, guards.
- `docs/Guidancefiles/DASHBOARDS_OVERVIEW.mdc`: BI/ops surface definitions.
- `docs/explainar/`: machine-generated alignment between OAS and UI assets.
- `docs/ARCHITECTURE.md` (this file): quick orientation map; do **not** move it outside `docs/`.

## 6. Cross-Surface Traceability

- **Trace table** (`traces/TRACE_TABLE.csv`) links endpoints (`operation_id`) to actions in screens.
- **Explainar generated docs** ensure each service exposes a contract summary linked to UI assets. CI fails if generated files drift.
- **Guards** in `dashboards/guards/*.yml` enforce policy thresholds; they are referenced by workflows and should be updated alongside runtime changes.

## 7. Quick Reference Commands

```powershell
# Verify OAS metadata
pwsh scripts/verify-oas-metadata.ps1

# Regenerate explainar docs
python scripts/generate_explainar.py

# Build master OpenAPI
npm run build:openapi
```

Use this document whenever you need to find the right place for a change across services, apps, dashboards, and governance assets. Updates to structure should be reflected here so @docs stays the single source of truth for repository layout.
