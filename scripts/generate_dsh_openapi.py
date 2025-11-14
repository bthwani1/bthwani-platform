#!/usr/bin/env python3
"""Generate the DSH OpenAPI specification from a routes CSV."""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import time
from pathlib import Path
from typing import Dict, List

import yaml

METHOD_ORDER = ["get", "post", "put", "patch", "delete", "head", "options"]
IDEMPOTENCY_METHODS = {"post", "put", "patch", "delete"}
SCHEMA_NAME_PATTERN = re.compile(r"^[A-Za-z0-9_.-]+$")

HOST_POLICY = {
    "https://api.bthwani.com": {
        "scope": "SRV-DSH v2.2 API",
        "allowedOrigins": ["https://app.bthwani.com"],
        "notes": [
            "JWT bearerAuth required; Idempotency-Key mandatory for unsafe methods.",
            "Webhooks enforce HMAC signatures and anti-replay windows <=300 seconds."
        ]
    },
    "https://app.bthwani.com": {
        "purpose": "Customer web app (APP-USER)",
        "policies": [
            "Consumes api.bthwani.com with RBAC=user.",
            "Sessions stored in HttpOnly cookies plus CSRF token for write operations."
        ]
    },
    "https://bthwani.com": {
        "purpose": "Marketing and SEO surface",
        "policies": [
            "Read-only; no POST/PUT/PATCH/DELETE to DSH.",
            "Any DSH data must pass through cache/proxy with explicit TTL."
        ]
    }
}

def extract_schema(ref_value: str) -> str | None:
    value = ref_value.strip()
    if not value or value in {"-", "—"}:
        return None
    if value.startswith("components.schemas."):
        return value.split(".")[-1]
    if value.startswith("#/components/schemas/"):
        return value.rsplit("/", 1)[-1]
    if SCHEMA_NAME_PATTERN.match(value) and "/" not in value and value[0].isupper():
        return value
    return None

def load_routes(csv_path: Path) -> List[Dict[str, str]]:
    with csv_path.open("r", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        return [row for row in reader]

def build_openapi(rows: List[Dict[str, str]], description_extra: str | None) -> tuple[Dict, int]:
    paths: Dict[str, Dict[str, Dict]] = {}
    schema_names: set[str] = set()
    tag_set: set[str] = set()

    for row in rows:
        path = (row.get("path") or "").strip()
        method = (row.get("method") or "").strip().lower()
        operation_id = (row.get("operation_id") or "").strip()
        if not path or method not in METHOD_ORDER or not operation_id:
            continue

        summary = (row.get("description in english") or "").strip()
        rbac_role = (row.get("rbac_role") or "").strip()
        surface_id = (row.get("surface_id") or "").strip()
        guards = (row.get("guards_status") or "").strip()
        action_id = (row.get("action_id") or "").strip()
        entity_code = (row.get("entity_code") or "").strip()
        idempotency_flag = (row.get("idempotency_present") or "").strip().upper() == "TRUE"
        pagination_flag = (row.get("pagination_present") or "").strip().upper() == "TRUE"
        req_ref = (row.get("req_schema_ref") or "").strip()
        res_ref = (row.get("res_schema_ref") or "").strip()
        error_ref = (row.get("errors_profile_ref") or "").strip()

        for candidate in (req_ref, res_ref, error_ref):
            schema = extract_schema(candidate)
            if schema:
                schema_names.add(schema)

        path_entry = paths.setdefault(path, {})

        parameters: List[Dict] = []
        for param in re.findall(r"{([^}]+)}", path):
            parameters.append({
                "name": param,
                "in": "path",
                "required": True,
                "schema": {"type": "string"}
            })
        if pagination_flag:
            parameters.append({
                "name": "cursor",
                "in": "query",
                "required": False,
                "schema": {"type": "string"}
            })
            parameters.append({
                "name": "limit",
                "in": "query",
                "required": False,
                "schema": {"type": "integer", "minimum": 1, "maximum": 200}
            })
        if idempotency_flag and method in IDEMPOTENCY_METHODS:
            parameters.append({"$ref": "#/components/parameters/Idempotency-Key"})

        security = [] if "system" in rbac_role.lower() else [{"bearerAuth": []}]

        def schema_obj(ref_string: str) -> Dict | None:
            schema = extract_schema(ref_string)
            if not schema:
                return None
            return {"$ref": f"#/components/schemas/{schema}"}

        request_body = None
        if method in {"post", "put", "patch"}:
            req_schema = schema_obj(req_ref)
            if req_schema:
                request_body = {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": req_schema
                        }
                    }
                }

        success_code = "200"
        lower_op = operation_id.lower()
        if method == "post" and any(token in lower_op for token in ["create", "start", "generate", "build", "issue", "import", "export", "queue"]):
            success_code = "201"
        elif method == "post" and any(token in lower_op for token in ["run", "scan", "trigger"]):
            success_code = "202"
        elif method == "delete":
            success_code = "204"

        responses = {
            success_code: {"description": summary or "Success"},
            "default": {
                "description": "Error response",
                "content": {
                    "application/json": {
                        "schema": {"$ref": "#/components/schemas/Problem"}
                    }
                }
            }
        }
        res_schema = schema_obj(res_ref)
        if success_code != "204" and res_schema:
            responses[success_code]["content"] = {
                "application/json": {
                    "schema": res_schema
                }
            }

        base_operation = {
            "operationId": operation_id,
            "responses": responses,
            "security": security
        }
        if surface_id:
            base_operation["tags"] = [surface_id]
            tag_set.add(surface_id)
        if summary:
            base_operation["summary"] = summary
            base_operation["description"] = summary
        if action_id:
            base_operation["x-action-id"] = action_id
        if entity_code:
            base_operation["x-entity-code"] = entity_code
        if guards:
            base_operation["x-guards"] = guards
        if rbac_role:
            base_operation["x-rbac-role"] = rbac_role
        if parameters:
            base_operation["parameters"] = parameters
        if request_body:
            base_operation["requestBody"] = request_body

        existing = path_entry.get(method)
        if not existing:
            path_entry[method] = base_operation
            continue

        if existing.get("operationId") == operation_id:
            tags = existing.setdefault("tags", [])
            if surface_id and surface_id not in tags:
                tags.append(surface_id)
                tag_set.add(surface_id)
            if guards and guards not in (existing.get("x-guards") or ""):
                merged = {existing.get("x-guards"), guards}
                existing["x-guards"] = " | ".join(sorted(filter(None, merged)))
            if rbac_role:
                existing_roles = set(filter(None, (existing.get("x-rbac-role") or "").split(",")))
                if rbac_role not in existing_roles:
                    existing_roles.add(rbac_role)
                    existing["x-rbac-role"] = ",".join(sorted(existing_roles))
            continue

        alias_entry = {
            "operationId": operation_id,
            "summary": summary,
            "surface": surface_id,
            "rbac_role": rbac_role,
            "guards": guards,
            "action_id": action_id,
            "entity_code": entity_code
        }
        aliases = existing.setdefault("x-alternate-operations", [])
        aliases.append(alias_entry)

    ordered_paths = {}
    for path_key, method_map in sorted(paths.items(), key=lambda item: item[0]):
        ordered_paths[path_key] = {meth: method_map[meth] for meth in METHOD_ORDER if meth in method_map}

    schema_names.add("Problem")
    components_schemas: Dict[str, Dict] = {}
    for name in sorted(schema_names):
        if name == "Problem":
            components_schemas[name] = {
                "type": "object",
                "required": ["type", "title", "status"],
                "properties": {
                    "type": {"type": "string", "format": "uri"},
                    "title": {"type": "string"},
                    "status": {"type": "integer"},
                    "detail": {"type": "string"},
                    "instance": {"type": "string"}
                }
            }
        elif name == "Empty":
            components_schemas[name] = {"type": "object", "description": "Empty response body"}
        else:
            components_schemas[name] = {"type": "object", "description": f"Placeholder schema for {name}."}

    info_description = "Aggregated OpenAPI specification generated from DSH routes catalog."
    if description_extra:
        info_description = info_description + "\n\n" + description_extra

    openapi_doc = {
        "openapi": "3.0.3",
        "info": {
            "title": "BThwani — DSH Service API",
            "version": time.strftime("%Y-%m-%d"),
            "description": info_description
        },
        "servers": [
            {"url": "https://api-dev.bthwani.com"},
            {"url": "https://api-stage.bthwani.com"},
            {"url": "https://api.bthwani.com"}
        ],
        "tags": [{"name": tag} for tag in sorted(tag_set)],
        "paths": ordered_paths,
        "components": {
            "securitySchemes": {
                "bearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT"
                }
            },
            "parameters": {
                "Idempotency-Key": {
                    "name": "Idempotency-Key",
                    "in": "header",
                    "required": False,
                    "schema": {"type": "string"},
                    "description": "Idempotency key for safely retrying requests."
                }
            },
            "schemas": components_schemas
        }
    }

    openapi_doc["x-host-policy"] = HOST_POLICY

    serializable_doc = json.loads(json.dumps(openapi_doc))
    operation_total = sum(len(method_map) for method_map in serializable_doc["paths"].values())
    return serializable_doc, operation_total

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate DSH OpenAPI from a routes CSV")
    parser.add_argument("--routes", required=True, type=Path, help="Path to DSH_routes_complete.csv")
    parser.add_argument("--output", required=True, type=Path, help="Destination OpenAPI YAML path")
    parser.add_argument(
        "--baseline",
        type=Path,
        default=None,
        help="Optional baseline OpenAPI file whose component schemas should be reused when present."
    )
    parser.add_argument(
        "--description-extra",
        default="Hosts:\\n- api.bthwani.com -- DSH API (consumed by app.bthwani.com).\\n- app.bthwani.com -- customer web app (APP-USER).\\n- bthwani.com -- marketing site (read-only via cached GET).",
        help="Extra text appended to the info.description"
    )
    return parser.parse_args()


def apply_baseline(doc: Dict, baseline: Dict | None) -> Dict:
    if not baseline:
        return doc
    baseline_components = baseline.get("components", {}).get("schemas", {})
    if not baseline_components:
        return doc
    target_components = doc.setdefault("components", {}).setdefault("schemas", {})
    for name, definition in baseline_components.items():
        if name in target_components and isinstance(definition, dict) and definition:
            target_components[name] = definition
    return doc

def main() -> None:
    args = parse_args()
    rows = load_routes(args.routes)
    if not rows:
        print(f"No rows read from {args.routes}", file=sys.stderr)
        sys.exit(1)

    baseline_doc = None
    if args.baseline and args.baseline.exists():
        with args.baseline.open("r", encoding="utf-8") as handle:
            baseline_doc = yaml.safe_load(handle) or {}

    doc, op_count = build_openapi(rows, args.description_extra)
    doc = apply_baseline(doc, baseline_doc)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as handle:
        yaml.safe_dump(doc, handle, sort_keys=False, allow_unicode=True)

    print(f"OpenAPI written to {args.output} (paths={len(doc['paths'])}, operations={op_count})")

if __name__ == "__main__":
    main()
