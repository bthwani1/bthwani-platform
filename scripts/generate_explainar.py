#!/usr/bin/env python3
"""Generate explainar *.generated.md files from repo sources."""

from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path
from typing import Dict, List

import yaml

REPO_ROOT = Path(__file__).resolve().parents[1]
EXPLAINAR_ROOT = REPO_ROOT / "docs" / "explainar"
SERVICES_DIR = REPO_ROOT / "oas" / "services"
APPS_DIR = REPO_ROOT / "apps"
DASH_DIR = REPO_ROOT / "dashboards"
REGISTRY_FILE = REPO_ROOT / "registry" / "SSOT_INDEX.json"

OUTPUT_DIR = EXPLAINAR_ROOT / "generated"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def load_registry() -> Dict:
    with REGISTRY_FILE.open("r", encoding="utf-8-sig") as handle:
        return json.load(handle)


def gather_service_paths(service_code: str) -> List[Dict[str, str]]:
    service_path = SERVICES_DIR / service_code.lower() / "openapi.yaml"
    if not service_path.exists():
        return []
    with service_path.open("r", encoding="utf-8") as handle:
        doc = yaml.safe_load(handle)
    results: List[Dict[str, str]] = []
    for path, methods in doc.get("paths", {}).items():
        if not isinstance(methods, dict):
            continue
        for method, operation in methods.items():
            if not isinstance(operation, dict):
                continue
            results.append({
                "method": method.upper(),
                "path": path,
                "summary": operation.get("summary", "")
            })
    return results


def gather_screens(entity_code: str, root: Path) -> List[Dict[str, str]]:
    results: List[Dict[str, str]] = []
    for csv_file in root.rglob("SCREENS_CATALOG.csv"):
        with csv_file.open("r", encoding="utf-8-sig") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                if row.get("service_code") == entity_code:
                    results.append({
                        "screen_id": row.get("screen_id", ""),
                        "name": row.get("screen_name_ar", row.get("screen_name_en", "")),
                        "file": str(csv_file.relative_to(REPO_ROOT))
                    })
    return results


def write_generated(service_code: str, data: Dict[str, List[Dict[str, str]]]) -> Path:
    output_path = OUTPUT_DIR / f"{service_code.lower()}.generated.md"
    lines: List[str] = []
    lines.append(f"# {service_code} - بيانات مولدة")
    lines.append("")
    paths = data.get("paths", [])
    if paths:
        lines.append("## مسارات OpenAPI")
        lines.append("| method | path | summary |")
        lines.append("| --- | --- | --- |")
        for entry in paths:
            lines.append(f"| {entry['method']} | {entry['path']} | {entry['summary']} |")
        lines.append("")
    screens = data.get("screens", [])
    if screens:
        lines.append("## الشاشات المرتبطة")
        lines.append("| screen_id | الاسم | المصدر |")
        lines.append("| --- | --- | --- |")
        for screen in screens:
            name = screen['name'] or ""
            lines.append(f"| {screen['screen_id']} | {name} | {screen['file']} |")
        lines.append("")
    digest_source = json.dumps(data, ensure_ascii=False, sort_keys=True).encode("utf-8")
    digest = hashlib.sha256(digest_source).hexdigest()
    lines.append(f"_source_sha256: {digest}_")
    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def main() -> None:
    registry = load_registry()
    services = registry.get("services", [])
    for service in services:
        code = service.get("code")
        if not code:
            continue
        data = {
            "paths": gather_service_paths(code),
            "screens": gather_screens(code, APPS_DIR) + gather_screens(code, DASH_DIR)
        }
        write_generated(code, data)


if __name__ == "__main__":
    main()
