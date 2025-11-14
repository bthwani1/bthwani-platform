# Dashboards Directory

Each subfolder (`admin/`, `bi/`, `finance/`, etc.) contains a `SCREENS_CATALOG.csv` describing widgets, tabs, and flows for that board. The `guards/` folder stores YAML guard definitions enforced by CI.

## Screen Catalog Fields

- `surface_id` / `screen_id`: unique identifiers used in traces and explainar outputs.
- `service_code`: ties the dashboard view to backend services and OAS operations.
- `rbac_role`: required role/capability for viewing or acting on the data.
- `kpi`, `notes`, or other custom columns capture metrics and governance context.

## Guard Files

- `dashboards/guards/guards.yml`: declarative guard settings referenced by `.github/workflows/gates.yml`.
- `dashboards/guards/hard_gates.yml`: non-negotiable guard thresholds.

## Workflow

1. Update the relevant `SCREENS_CATALOG.csv` when adding or modifying dashboards.
2. Sync traces (`traces/TRACE_TABLE.csv`) for any new surface actions.
3. Refresh explainar docs (`python scripts/generate_explainar.py`) to keep OAS ↔ dashboard linkage.
4. Adjust guard files when KPIs or enforcement levels change.

For the global view of how dashboards link to services and guards, see `docs/ARCHITECTURE.md` and `docs/Guidancefiles/DASHBOARDS_OVERVIEW.mdc`.

