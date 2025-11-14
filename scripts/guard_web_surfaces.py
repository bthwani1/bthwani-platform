#!/usr/bin/env python3
"""Validate that web/webapp and web/website docs stay in sync with SSOT and governance rules."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REGISTRY_PATH = ROOT / "registry" / "SSOT_INDEX.json"
WEBAPP_DOC = ROOT / "web" / "webapp" / "SERVICES.md"
WEBSITE_DOC = ROOT / "web" / "website" / "SERVICES.md"

REQUIRED_SNIPPETS = {
    ROOT / "web" / "webapp" / "SERVICES.md": "VAR_WEBAPP_FEATURE_*",
    ROOT / "web" / "website" / "SERVICES.md": "VAR_WEBAPP_FEATURE_*",
    ROOT / "docs" / "Guidancefiles" / "AI GUIDE.mdc": "VAR_WEBAPP_FEATURE_*",
    ROOT / "docs" / "Guidancefiles" / "DASHBOARDS_OVERVIEW.mdc": "web/webapp/SERVICES.md",
    ROOT / "docs" / "Guidancefiles" / "ReposiGOV.mdc": "VAR_WEBAPP_FEATURE_*",
    ROOT / "docs" / "Guidancefiles" / "SER_OVER ai.mdc": "web/webapp/SERVICES.md",
}


def extract_service_codes() -> set[str]:
    data = json.loads(REGISTRY_PATH.read_text(encoding="utf-8-sig"))
    return {entry["code"] for entry in data.get("services", []) if entry.get("status") != "DEPRECATED"}


def parse_table(path: Path) -> set[str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    in_table = False
    codes: set[str] = set()
    for line in lines:
        if line.strip().startswith("| Service"):
            in_table = True
            continue
        if in_table:
            if not line.strip().startswith("|"):
                # table ended
                break
            cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
            if not cells or cells[0] in ("Service", "---"):
                continue
            first_cell = cells[0]
            if not first_cell:
                continue
            code = first_cell.split()[0]
            codes.add(code)
    return codes


def verify_tables(expected: set[str]) -> list[str]:
    errors: list[str] = []
    for doc_path in (WEBAPP_DOC, WEBSITE_DOC):
        found = parse_table(doc_path)
        missing = sorted(expected - found)
        if missing:
            errors.append(
                f"{doc_path.relative_to(ROOT)} is missing services: {', '.join(missing)}"
            )
    return errors


def verify_snippets() -> list[str]:
    errors: list[str] = []
    for path, fragment in REQUIRED_SNIPPETS.items():
        text = path.read_text(encoding="utf-8")
        if fragment not in text:
            errors.append(
                f"{path.relative_to(ROOT)} is missing required snippet '{fragment}'"
            )
    return errors


def main() -> int:
    expected_codes = extract_service_codes()
    issues = []
    issues.extend(verify_tables(expected_codes))
    issues.extend(verify_snippets())

    if issues:
        print("WEB SURFACE GUARD FAILURES:\n" + "\n".join(f"- {msg}" for msg in issues))
        return 1

    print("Web surface documentation guard passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
