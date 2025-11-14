# Documentation Overview

This folder contains human-readable references that complement runtime code, contracts, and generated explainers. Keep all documentation assets inside `docs/` (per @docs guidance).

## Structure

| Subfolder        | Purpose                                                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `Guidancefiles/` | Governance, playbooks, and execution guides (AI GUIDE, ReposiGOV, dashboards primer, etc.).                                      |
| `explainar/`     | Auto-generated references that connect OpenAPI specs with app/dashboards screens. Generated via `scripts/generate_explainar.py`. |

## Key References

- `ARCHITECTURE.md`: canonical map of directories, ownership, and traceability rules.
- `Guidancefiles/ReposiGOV.mdc`: branch protection, guard descriptions, change lifecycle.
- `Guidancefiles/AI GUIDE.mdc`: execution waves and priorities.
- `Guidancefiles/DASHBOARDS_OVERVIEW.mdc`: dashboards taxonomy and KPIs.
- `explainar/generated/*.generated.md`: per-service explainers (do not hand-edit).

## Workflow

1. Author or update guidance in `Guidancefiles/`.
2. Run automation (`scripts/generate_explainar.py`) whenever OAS or screen catalogs change.
3. Keep `ARCHITECTURE.md` synced whenever directories or ownership change.

All documentation updates should stay within this folder; do **not** move it elsewhere. Refer contributors here when onboarding or planning structural changes.
