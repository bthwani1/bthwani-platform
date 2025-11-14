#!/usr/bin/env python3
"""SRV-DSH audit helper.

Generates inventory, parity, and traceability artifacts by reconciling the
DSH OpenAPI slice with front-end and dashboard screen catalogs.
"""

from __future__ import annotations

import csv
import datetime as dt
import json
import re
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent
OPENAPI_PATH = REPO_ROOT / "oas" / "services" / "dsh" / "openapi.yaml"
DSH_PATH_PREFIXES = ("/api/dls", "/api/ops/dls")
APPS_DIR = REPO_ROOT / "apps"
DASHBOARDS_DIR = REPO_ROOT / "dashboards"
DIST_DIR = REPO_ROOT / "dist" / "dsh"

PARITY_HEADER = [
    "ssot_ref",
    "service_code",
    "surface_id",
    "screen_id",
    "action_id",
    "operation_id",
    "method",
    "path",
    "rbac_role",
    "target_BE",
    "target_FE",
    "delta_BE",
    "delta_FE",
    "trace_link_ok",
    "orphan_FE_flag",
    "orphan_BE_flag",
    "idempotency_present",
    "req_schema_ref",
    "res_schema_ref",
    "errors_profile_ref",
    "pagination_present",
    "guards_status",
    "desc_ar",
]

TRACEABILITY_HEADER = [
    "surface_id",
    "screen_id",
    "action_id",
    "operation_id",
    "method",
    "path",
    "rbac_role",
    "trace_link_ok",
    "notes",
]

ROUTES_TABLE_HEADER = [
    "surface_id",
    "operation_id",
    "action_id",
    "method",
    "path",
    "rbac_role",
    "idempotency",
    "pagination",
    "guards_status",
    "tags",
]

TRACE_DRIFT_HEADER = [
    "surface_id",
    "screen_id",
    "operation_id",
    "note",
]

SCREENS_CATALOG_HEADER = [
    "surface_id",
    "screen_id",
    "screen_title",
    "related_service",
    "main_endpoint",
    "role",
    "status",
    "notes",
    "source_file",
]

RUNTIME_BINDINGS: Dict[str, Dict[str, Any]] = {
    "dls_orders_create": {
        "runtime_vars": ["VAR_DSH_DEFAULT_DELIVERY_MODE", "VAR_RUNTIME_TIMEZONE"],
        "notes": "Fallback delivery mode & timezone alignment for order orchestration.",
    },
    "dls_chat_list": {
        "runtime_vars": ["VAR_CHAT_RETENTION_DAYS"],
        "notes": "Ensures chat retention policies are applied to user conversations.",
    },
    "dls_chat_send": {
        "runtime_vars": ["VAR_CHAT_RETENTION_DAYS"],
        "notes": "Outbound chat messages respect retention configuration.",
    },
    "dls_cap_chat_list": {
        "runtime_vars": ["VAR_CHAT_RETENTION_DAYS"],
        "notes": "Captain chat history retention guard.",
    },
    "dls_cap_chat_send": {
        "runtime_vars": ["VAR_CHAT_RETENTION_DAYS"],
        "notes": "Captain outbound chat retention guard.",
    },
    "dls_partner_chat_list": {
        "runtime_vars": ["VAR_CHAT_RETENTION_DAYS"],
        "notes": "Partner chat history retention guard.",
    },
    "dls_partner_chat_send": {
        "runtime_vars": ["VAR_CHAT_RETENTION_DAYS"],
        "notes": "Partner outbound chat retention guard.",
    },
    "dls_partner_notifications_dispatch": {
        "runtime_vars": [
            "VAR_DLS_PARTNER_ACCEPT_SLA_MIN",
            "VAR_NOTIF_DEDUP_WINDOW_MIN",
            "VAR_NOTIF_CHANNEL_PRIORITY",
            "VAR_NOTIF_WA_TEMPLATE",
            "VAR_NOTIF_SMS_TEMPLATE",
            "VAR_NOTIF_PARTNER_RATE_PER_15MIN",
            "VAR_NOTIF_ESCALATE_MIN",
            "VAR_LINK_PARTNER_ORDER_BASE",
            "VAR_DEEPLINK_PARTNER_ORDER_BASE",
        ],
        "notes": "Partner reminder automation (docs/explainar/services/srv-dsh.md §5.1).",
    },
    "ops_dls_partner_notifications_dispatch": {
        "runtime_vars": [
            "VAR_DLS_PARTNER_ACCEPT_SLA_MIN",
            "VAR_NOTIF_DEDUP_WINDOW_MIN",
            "VAR_NOTIF_CHANNEL_PRIORITY",
            "VAR_NOTIF_WA_TEMPLATE",
            "VAR_NOTIF_SMS_TEMPLATE",
            "VAR_NOTIF_PARTNER_RATE_PER_15MIN",
            "VAR_NOTIF_ESCALATE_MIN",
            "VAR_LINK_PARTNER_ORDER_BASE",
            "VAR_DEEPLINK_PARTNER_ORDER_BASE",
        ],
        "notes": "Operational trigger for partner reminders (docs/explainar/services/srv-dsh.md §5.1).",
    },
    "dls_partner_inventory_adjust": {
        "runtime_vars": ["VAR_DSH_CATALOG_SAFETY_STOCK_MIN"],
        "notes": "Inventory guard for minimum safety stock thresholds.",
    },
    "dls_orders_timeline_get": {
        "runtime_vars": ["VAR_RUNTIME_TIMEZONE"],
        "notes": "Timeline rendering uses unified timezone.",
    },
    "dls_partner_orders_timeline_get": {
        "runtime_vars": ["VAR_RUNTIME_TIMEZONE"],
        "notes": "Partner timeline rendering uses unified timezone.",
    },
    "dls_cap_orders_timeline_get": {
        "runtime_vars": ["VAR_RUNTIME_TIMEZONE"],
        "notes": "Captain timeline rendering uses unified timezone.",
    },
}


def read_yaml(path: Path) -> Dict[str, Any]:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def list_screen_catalogs() -> Iterable[Path]:
    aggregated = REPO_ROOT / "dashboards" / "screens" / "SCREENS_CATALOG.csv"
    for base in (APPS_DIR, DASHBOARDS_DIR):
        for path in base.rglob("SCREENS_CATALOG.csv"):
            if path == aggregated:
                continue
            yield path


def clean_endpoint(value: str) -> str:
    if not value:
        return ""
    value = value.strip().strip("`").strip('"').strip("'")
    # normalize double slashes
    value = re.sub(r"//+", "/", value)
    return value


def bool_str(flag: bool) -> str:
    return "TRUE" if flag else "FALSE"


def extract_schema_name(schema_ref: Optional[str]) -> str:
    if not schema_ref:
        return ""
    if "#/components/schemas/" in schema_ref:
        return schema_ref.rsplit("/", 1)[-1]
    return schema_ref


def infer_surface_from_screen(screen_id: str, default: str = "") -> str:
    token = (screen_id or "").upper()
    if token.startswith("APP_USER"):
        return "APP-USER"
    if token.startswith("APP_PARTNER"):
        return "APP-PARTNER"
    if token.startswith("APP_CAPTAIN") or token.startswith("CAPTAIN_"):
        return "APP-CAPTAIN"
    if token.startswith("PARTNER_"):
        return "APP-PARTNER"
    if token.startswith("DASH_OPS"):
        return "DASH-OPS"
    if token.startswith("DASH_FLEET"):
        return "DASH-FLEET"
    if token.startswith("DASH_SUPPORT"):
        return "DASH-SUPPORT"
    if token.startswith("DASH_PARTNER"):
        return "DASH-PARTNER"
    if token.startswith("DASH_SSO"):
        return "DASH-SSOT"
    if token.startswith("FIELD."):
        return "APP-FIELD"
    return default


def infer_method_hint(screen_id: str, notes: str) -> Optional[str]:
    marker = f"{screen_id} {notes}".lower()
    if any(keyword in marker for keyword in ("list", "details", "timeline", "track", "عرض", "قائمة", "تفاصيل")):
        return "GET"
    if any(keyword in marker for keyword in ("create", "checkout", "confirm", "issue", "submit", "reorder", "feedback", "upsert", "إصدار", "إرسال", "تأكيد", "بدء", "إضافة")):
        return "POST"
    if any(keyword in marker for keyword in ("update", "patch", "set", "تحديث", "تعديل", "ضبط")):
        return "PATCH"
    if any(keyword in marker for keyword in ("delete", "remove", "إلغاء", "حذف")):
        return "DELETE"
    if any(keyword in marker for keyword in ("accept", "reject", "close", "complete", "verify", "ack", "إقفال", "اعتماد", "تحقق")):
        return "POST"
    return None


def parse_guards(guards_str: str) -> List[str]:
    if not guards_str:
        return []
    if guards_str.strip().upper() == "PASS":
        return []
    match = re.search(r"\(([^)]*)\)", guards_str)
    if match:
        return [token.strip() for token in match.group(1).split(",") if token.strip()]
    return [guards_str]


def normalise_action_id(value: str | None) -> str:
    if not value:
        return ""
    return str(value).strip()


def load_fe_entries() -> List[Dict[str, Any]]:
    entries: List[Dict[str, Any]] = []
    for csv_path in list_screen_catalogs():
        try:
            rows = list(csv.DictReader(csv_path.read_text(encoding="utf-8-sig").splitlines()))
        except UnicodeDecodeError:
            rows = list(csv.DictReader(csv_path.read_text(encoding="utf-8").splitlines()))
        rel_path = csv_path.relative_to(REPO_ROOT).as_posix()
        for row in rows:
            row = {k: (v or "").strip() for k, v in row.items()}
            if "related_service" in row:
                if row.get("related_service", "").upper() != "DSH":
                    continue
                screen_id = row.get("screen_id", "")
                surface = infer_surface_from_screen(screen_id)
                endpoint = clean_endpoint(row.get("main_endpoint", ""))
                entries.append(
                    {
                        "source_file": rel_path,
                        "screen_id": screen_id,
                        "surface_id": surface or infer_surface_from_screen("", row.get("role", "")),
                        "screen_title": row.get("screen_title", ""),
                        "status": row.get("status", ""),
                        "notes": row.get("notes", ""),
                        "endpoint": endpoint,
                        "operation_id_hint": "",
                        "action_id_hint": "",
                        "role": row.get("role", ""),
                        "method_hint": infer_method_hint(screen_id, row.get("notes", "")),
                        "related_service": row.get("related_service", "DSH"),
                    }
                )
                continue
            if "operation_id" in row:
                operation_id = row.get("operation_id", "")
                if not operation_id.startswith("dls_"):
                    continue
                screen_id = row.get("screen_id", row.get("surface_id", ""))
                surface = row.get("surface_id") or infer_surface_from_screen(screen_id)
                entries.append(
                    {
                        "source_file": rel_path,
                        "screen_id": screen_id,
                        "surface_id": surface or infer_surface_from_screen(screen_id),
                        "screen_title": row.get("screen_title_ar", ""),
                        "status": row.get("status", ""),
                        "notes": "",
                        "endpoint": "",
                        "operation_id_hint": operation_id,
                        "action_id_hint": row.get("action_id", ""),
                        "role": "",
                        "method_hint": None,
                        "related_service": "DSH",
                    }
                )
    return entries


def collect_parameters(path_item: Dict[str, Any], operation: Dict[str, Any]) -> List[Dict[str, Any]]:
    params: List[Dict[str, Any]] = []
    for container in (path_item.get("parameters", []), operation.get("parameters", [])):
        for param in container:
            if isinstance(param, dict):
                params.append(param)
    return params


def has_idempotency(parameters: List[Dict[str, Any]]) -> bool:
    for param in parameters:
        ref = param.get("$ref", "")
        if ref and "Idempotency-Key" in ref:
            return True
        if param.get("in") == "header" and param.get("name") == "Idempotency-Key":
            return True
    return False


def has_pagination(parameters: List[Dict[str, Any]]) -> bool:
    names = {param.get("name") for param in parameters if isinstance(param, dict)}
    return {"cursor", "limit"}.issubset({name for name in names if name})


def first_success_response(operation: Dict[str, Any]) -> Dict[str, Any] | None:
    responses = operation.get("responses", {})
    for status_code in sorted(responses.keys()):
        if str(status_code).startswith("2"):
            return responses[status_code]
    return None


def extract_schema_ref(response: Dict[str, Any]) -> str:
    if not response:
        return ""
    content = response.get("content", {})
    for media_obj in content.values():
        schema = media_obj.get("schema")
        if isinstance(schema, dict):
            ref = schema.get("$ref")
            if ref:
                return extract_schema_name(ref)
    return ""


def extract_request_schema(operation: Dict[str, Any]) -> str:
    request_body = operation.get("requestBody")
    if not isinstance(request_body, dict):
        return ""
    content = request_body.get("content", {})
    for media_obj in content.values():
        schema = media_obj.get("schema")
        if isinstance(schema, dict):
            ref = schema.get("$ref")
            if ref:
                return extract_schema_name(ref)
    return ""


def load_be_operations() -> List[Dict[str, Any]]:
    doc = read_yaml(OPENAPI_PATH)
    operations: List[Dict[str, Any]] = []
    for path, path_item in (doc.get("paths") or {}).items():
        if not any(path.startswith(prefix) for prefix in DSH_PATH_PREFIXES):
            continue
        if not isinstance(path_item, dict):
            continue
        for method, operation in path_item.items():
            if method.lower() not in {"get", "post", "put", "patch", "delete"}:
                continue
            if not isinstance(operation, dict):
                continue
            operation_id = operation.get("operationId", "")
            params = collect_parameters(path_item, operation)
            success_schema = extract_schema_ref(first_success_response(operation) or {})
            operations.append(
                {
                    "method": method.upper(),
                    "path": path,
                    "operation_id": operation_id,
                    "summary": operation.get("summary", ""),
                    "description": operation.get("description", ""),
                    "tags": operation.get("tags", []) or [],
                    "rbac_role": operation.get("x-rbac-role", ""),
                    "action_id": normalise_action_id(operation.get("x-action-id")),
                    "guards": operation.get("x-guards", ""),
                    "entity_code": normalise_action_id(operation.get("x-entity-code")),
                    "idempotency": has_idempotency(params),
                    "pagination": has_pagination(params),
                    "req_schema": extract_request_schema(operation),
                    "res_schema": success_schema,
                    "errors_profile": "Problem" if "default" in (operation.get("responses") or {}) else "",
                    "parameters": params,
                    "fe_screens": [],
                }
            )
    return operations


def pick_surface(op: Dict[str, Any]) -> str:
    for tag in op.get("tags", []):
        if tag.startswith(("APP-", "DASH-", "OPS", "PARTNER")):
            return tag
    return op.get("tags", [""])[0] if op.get("tags") else ""


def match_fe_to_be(fe_entries: List[Dict[str, Any]], be_operations: List[Dict[str, Any]]) -> None:
    ops_by_operation_id = {op["operation_id"]: op for op in be_operations if op["operation_id"]}
    ops_by_path: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for op in be_operations:
        ops_by_path[op["path"]].append(op)

    for entry in fe_entries:
        matched_op: Optional[Dict[str, Any]] = None
        candidates: List[Dict[str, Any]] = []
        if entry["operation_id_hint"]:
            op = ops_by_operation_id.get(entry["operation_id_hint"])
            if op:
                candidates = [op]
        elif entry["endpoint"]:
            candidates = list(ops_by_path.get(entry["endpoint"], []))
        surface = entry.get("surface_id") or ""
        if len(candidates) > 1 and surface:
            tagged = [op for op in candidates if surface in op.get("tags", [])]
            if tagged:
                candidates = tagged
        method_hint = entry.get("method_hint")
        if len(candidates) > 1 and method_hint:
            filtered = [op for op in candidates if op["method"] == method_hint]
            if filtered:
                candidates = filtered
        if candidates:
            matched_op = candidates[0]
            matched_op.setdefault("fe_screens", []).append(entry)
        entry["matched_op"] = matched_op
        entry["trace_link_ok"] = bool(matched_op)
        if matched_op:
            entry["operation_id"] = matched_op["operation_id"]
            entry["method"] = matched_op["method"]
            entry["path"] = matched_op["path"]
            entry["rbac_role"] = matched_op.get("rbac_role", "")
            entry["action_id_resolved"] = matched_op.get("action_id", "") or entry.get("action_id_hint", "")
        else:
            entry["operation_id"] = entry.get("operation_id_hint", "")
            entry["method"] = method_hint or ""
            entry["path"] = entry.get("endpoint", "")
            entry["rbac_role"] = ""
            entry["action_id_resolved"] = entry.get("action_id_hint", "")


def ensure_dist_dir() -> None:
    DIST_DIR.mkdir(parents=True, exist_ok=True)


def ensure_trace_dir() -> None:
    trace_dir = REPO_ROOT / "traces"
    trace_dir.mkdir(parents=True, exist_ok=True)
    return trace_dir


def write_inventory(fe_entries: List[Dict[str, Any]], be_operations: List[Dict[str, Any]]) -> None:
    ensure_dist_dir()
    total_fe = len(fe_entries)
    matched_fe = sum(1 for entry in fe_entries if entry["trace_link_ok"])
    total_be = len(be_operations)
    matched_be = sum(1 for op in be_operations if op.get("fe_screens"))
    surface_counter_fe = Counter(entry.get("surface_id", "") for entry in fe_entries)
    surface_counter_be = Counter(pick_surface(op) for op in be_operations)
    lines = [
        "# SRV-DSH Inventory",
        "",
        f"*Generated at:* {dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%d %H:%M:%SZ')}",
        "",
        "## Summary",
        "",
        f"- Total BE operations (DSH namespace): **{total_be}**",
        f"- Total FE/Dashboard screens mapped to DSH: **{total_fe}**",
        f"- Matched FE↔BE pairs: **{matched_fe}**",
        f"- Orphan BE operations: **{total_be - matched_be}**",
        f"- Orphan FE screens: **{total_fe - matched_fe}**",
        f"- TRACE ratio (matched FE / total FE): **{matched_fe / total_fe:.2f}**" if total_fe else "- TRACE ratio: N/A",
        f"- PARITY ratio (matched BE / total BE): **{matched_be / total_be:.2f}**" if total_be else "- PARITY ratio: N/A",
        "",
        "## Coverage by Surface",
        "",
        "| Surface | BE Operations | FE Screens |",
        "| --- | --- | --- |",
    ]
    all_surfaces = sorted(set(surface_counter_be) | set(surface_counter_fe))
    for surface in all_surfaces:
        lines.append(
            f"| {surface or '-'} | {surface_counter_be.get(surface, 0)} | {surface_counter_fe.get(surface, 0)} |"
        )
    lines.append("")
    lines.append("## Notes")
    lines.append("")
    lines.append("- Data derived from `oas/services/dsh/openapi.yaml` and screen catalogs under `apps/` and `dashboards/`.")
    lines.append("- TRACE ratio requires 1.00 for compliance; investigate orphans listed in parity output below.")
    DIST_DIR.joinpath("DSH_INVENTORY.md").write_text("\n".join(lines), encoding="utf-8")


def write_parity_csv(fe_entries: List[Dict[str, Any]], be_operations: List[Dict[str, Any]]) -> None:
    ensure_dist_dir()
    with DIST_DIR.joinpath("PARITY.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=PARITY_HEADER)
        writer.writeheader()
        for op in sorted(be_operations, key=lambda item: (item["path"], item["method"])):
            fe_screens = op.get("fe_screens", [])
            primary_screen = fe_screens[0] if fe_screens else None
            row = {
                "ssot_ref": op.get("entity_code") or "SRV-DSH",
                "service_code": "SRV-DSH",
                "surface_id": pick_surface(op),
                "screen_id": primary_screen.get("screen_id") if primary_screen else "",
                "action_id": op.get("action_id", ""),
                "operation_id": op.get("operation_id", ""),
                "method": op.get("method", ""),
                "path": op.get("path", ""),
                "rbac_role": op.get("rbac_role", ""),
                "target_BE": 1,
                "target_FE": len(fe_screens),
                "delta_BE": 0 if fe_screens else 1,
                "delta_FE": max(0, len(fe_screens) - 1),
                "trace_link_ok": bool_str(bool(fe_screens)),
                "orphan_FE_flag": bool_str(False),
                "orphan_BE_flag": bool_str(not fe_screens),
                "idempotency_present": bool_str(op.get("idempotency", False)),
                "req_schema_ref": op.get("req_schema", ""),
                "res_schema_ref": op.get("res_schema", ""),
                "errors_profile_ref": op.get("errors_profile", ""),
                "pagination_present": bool_str(op.get("pagination", False)),
                "guards_status": op.get("guards", ""),
                "desc_ar": primary_screen.get("screen_title") or primary_screen.get("notes") if primary_screen else "",
            }
            writer.writerow(row)
        # record FE orphans (no BE mapping)
        for entry in fe_entries:
            if entry["trace_link_ok"]:
                continue
            writer.writerow(
                {
                    "ssot_ref": "SRV-DSH",
                    "service_code": "SRV-DSH",
                    "surface_id": entry.get("surface_id", ""),
                    "screen_id": entry.get("screen_id", ""),
                    "action_id": entry.get("action_id_hint", ""),
                    "operation_id": entry.get("operation_id", ""),
                    "method": entry.get("method", ""),
                    "path": entry.get("path", entry.get("endpoint", "")),
                    "rbac_role": entry.get("rbac_role", ""),
                    "target_BE": 0,
                    "target_FE": 1,
                    "delta_BE": 1,
                    "delta_FE": 0,
                    "trace_link_ok": bool_str(False),
                    "orphan_FE_flag": bool_str(True),
                    "orphan_BE_flag": bool_str(False),
                    "idempotency_present": "",
                    "req_schema_ref": "",
                    "res_schema_ref": "",
                    "errors_profile_ref": "",
                    "pagination_present": "",
                    "guards_status": "",
                    "desc_ar": entry.get("screen_title") or entry.get("notes", ""),
                }
            )


def write_traceability(fe_entries: List[Dict[str, Any]]) -> None:
    ensure_dist_dir()
    ensure_trace_dir()
    with DIST_DIR.joinpath("TRACEABILITY.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=TRACEABILITY_HEADER)
        writer.writeheader()
        for entry in sorted(fe_entries, key=lambda item: (item.get("surface_id", ""), item.get("screen_id", ""))):
            writer.writerow(
                {
                    "surface_id": entry.get("surface_id", ""),
                    "screen_id": entry.get("screen_id", ""),
                    "action_id": entry.get("action_id_resolved", entry.get("action_id_hint", "")),
                    "operation_id": entry.get("operation_id", ""),
                    "method": entry.get("method", ""),
                    "path": entry.get("path", entry.get("endpoint", "")),
                    "rbac_role": entry.get("rbac_role", ""),
                    "trace_link_ok": bool_str(entry.get("trace_link_ok", False)),
                    "notes": entry.get("notes", "") or (entry["source_file"] if not entry.get("trace_link_ok") else ""),
                }
            )
    trace_table_path = ensure_trace_dir() / "TRACE_TABLE.csv"
    with trace_table_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=TRACEABILITY_HEADER)
        writer.writeheader()
        for entry in sorted(fe_entries, key=lambda item: (item.get("surface_id", ""), item.get("screen_id", ""))):
            writer.writerow(
                {
                    "surface_id": entry.get("surface_id", ""),
                    "screen_id": entry.get("screen_id", ""),
                    "action_id": entry.get("action_id_resolved", entry.get("action_id_hint", "")),
                    "operation_id": entry.get("operation_id", ""),
                    "method": entry.get("method", ""),
                    "path": entry.get("path", entry.get("endpoint", "")),
                    "rbac_role": entry.get("rbac_role", ""),
                    "trace_link_ok": bool_str(entry.get("trace_link_ok", False)),
                    "notes": entry.get("notes", ""),
                }
            )


def write_screens_catalog(fe_entries: List[Dict[str, Any]]) -> None:
    catalog_dir = REPO_ROOT / "dashboards" / "screens"
    catalog_dir.mkdir(parents=True, exist_ok=True)
    catalog_path = catalog_dir / "SCREENS_CATALOG.csv"
    with catalog_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=SCREENS_CATALOG_HEADER)
        writer.writeheader()
        for entry in sorted(fe_entries, key=lambda item: (item.get("surface_id", ""), item.get("screen_id", ""))):
            writer.writerow(
                {
                    "surface_id": entry.get("surface_id", ""),
                    "screen_id": entry.get("screen_id", ""),
                    "screen_title": entry.get("screen_title", ""),
                    "related_service": entry.get("related_service", "DSH"),
                    "main_endpoint": entry.get("endpoint") or entry.get("path", ""),
                    "role": entry.get("role", "") or entry.get("rbac_role", ""),
                    "status": entry.get("status", "") or "DRAFT",
                    "notes": entry.get("notes", ""),
                    "source_file": entry.get("source_file", ""),
                }
            )


def write_param_spec(be_operations: List[Dict[str, Any]]) -> None:
    ensure_dist_dir()
    spec: Dict[str, Any] = {}
    for op in be_operations:
        operation_id = op.get("operation_id")
        if not operation_id:
            continue
        bindings = RUNTIME_BINDINGS.get(operation_id, {})
        spec[operation_id] = {
            "operationId": operation_id,
            "method": op.get("method", ""),
            "path": op.get("path", ""),
            "surface": pick_surface(op),
            "rbac_role": op.get("rbac_role", ""),
            "runtime_vars": bindings.get("runtime_vars", []),
            "policies": parse_guards(op.get("guards", "")),
            "notes": bindings.get("notes", ""),
        }
    output_path = DIST_DIR / "PARAM_SPEC.json"
    output_path.write_text(json.dumps(spec, indent=2, ensure_ascii=False), encoding="utf-8")


def write_routes_table(be_operations: List[Dict[str, Any]]) -> None:
    ensure_dist_dir()
    target_path = DIST_DIR / "ROUTES_TABLE.csv"
    with target_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=ROUTES_TABLE_HEADER)
        writer.writeheader()
        for op in sorted(be_operations, key=lambda item: (item.get("path", ""), item.get("method", ""))):
            tags = op.get("tags", []) or []
            writer.writerow(
                {
                    "surface_id": pick_surface(op),
                    "operation_id": op.get("operation_id", ""),
                    "action_id": op.get("action_id", ""),
                    "method": op.get("method", ""),
                    "path": op.get("path", ""),
                    "rbac_role": op.get("rbac_role", ""),
                    "idempotency": bool_str(op.get("idempotency", False)),
                    "pagination": bool_str(op.get("pagination", False)),
                    "guards_status": op.get("guards", ""),
                    "tags": ",".join(tags),
                }
            )


def write_trace_drift(fe_entries: List[Dict[str, Any]]) -> None:
    ensure_dist_dir()
    drift_rows: List[Dict[str, str]] = []

    stopwords = {"dls", "dl", "orders", "order", "partner", "partners", "user", "app", "captain", "cap", "list", "get", "post", "patch", "put", "timeline", "chat", "read", "ack", "notes", "receipt", "policy", "policies", "zones", "slots", "pickup", "close", "feedback", "create", "intake", "store", "identity", "documents"}

    def tokens(value: str) -> set[str]:
        raw = re.split(r"[^a-z0-9]+", value.lower())
        return {token for token in raw if len(token) >= 3 and token not in stopwords}

    for entry in fe_entries:
        if not entry.get("trace_link_ok"):
            continue
        screen = (entry.get("screen_id") or "").strip()
        operation = (entry.get("operation_id") or "").strip()
        if not screen or not operation:
            continue
        if not tokens(screen):
            continue
        if tokens(screen) & tokens(operation):
            continue
        drift_rows.append(
            {
                "surface_id": entry.get("surface_id", ""),
                "screen_id": screen,
                "operation_id": operation,
                "note": "screen_id naming drift vs operation_id",
            }
        )

    target_path = DIST_DIR / "TRACE_DRIFT.csv"
    with target_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=TRACE_DRIFT_HEADER)
        writer.writeheader()
        for row in drift_rows:
            writer.writerow(row)


def write_rbac_matrix(be_operations: List[Dict[str, Any]]) -> None:
    ensure_dist_dir()
    matrix: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    roles_set: set[str] = set()
    for op in be_operations:
        surface = pick_surface(op) or "UNSPECIFIED"
        role = (op.get("rbac_role") or "unspecified").strip() or "unspecified"
        roles_set.add(role)
        matrix[surface][role] += 1
        matrix[surface]["TOTAL"] += 1
    roles = sorted(role for role in roles_set)
    header = ["surface_id", "TOTAL", *roles]
    target_path = DIST_DIR / "RBAC_MATRIX.csv"
    with target_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=header)
        writer.writeheader()
        for surface in sorted(matrix.keys()):
            row = {"surface_id": surface, "TOTAL": matrix[surface].get("TOTAL", 0)}
            for role in roles:
                row[role] = matrix[surface].get(role, 0)
            writer.writerow(row)


def main() -> None:
    be_operations = load_be_operations()
    fe_entries = load_fe_entries()
    match_fe_to_be(fe_entries, be_operations)
    write_inventory(fe_entries, be_operations)
    write_parity_csv(fe_entries, be_operations)
    write_traceability(fe_entries)
    write_screens_catalog(fe_entries)
    write_param_spec(be_operations)
    write_routes_table(be_operations)
    write_trace_drift(fe_entries)
    write_rbac_matrix(be_operations)
    print(f"Generated inventory artifacts in {DIST_DIR}")


if __name__ == "__main__":
    main()

