# Applications Directory

Each subfolder (`captain/`, `field/`, `partner/`, `user/`, etc.) represents a client surface and contains a `SCREENS_CATALOG.csv` describing available screens.

## SCREENS_CATALOG contract

Required columns (see headers in each file):

- `screen_id`: stable identifier used in traces and dashboards.
- `screen_name_ar` / `screen_name_en`: localized titles.
- `service_code`: links the screen to a service in `registry/SSOT_INDEX.json` and `oas/services/<code>/openapi.yaml`.
- `flow` / `module` (if present): logical grouping.
- `rbac_role`: expected role when invoking backend operations.
- Any additional notes columns (`ux_notes`, `dependencies`, etc.) document behavior.

## Adding or updating a screen

1. Edit the catalog in the relevant app folder.
2. Ensure `service_code` matches an entry in `registry/SSOT_INDEX.json`.
3. Map API operations via `traces/TRACE_TABLE.csv` if the screen triggers backend calls.
4. Run `python scripts/generate_explainar.py` so explainar docs stay in sync.

See `docs/ARCHITECTURE.md` for how apps connect to services, dashboards, and traces.

