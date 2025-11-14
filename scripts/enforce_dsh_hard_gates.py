#!/usr/bin/env python3
"""Enforce SRV-DSH Wave 00 hard gates before declaring GO."""

from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

REPO_ROOT = Path(__file__).resolve().parent.parent
PARITY_PATH = REPO_ROOT / "dist" / "dsh" / "PARITY.csv"
TRACE_TABLE_PATH = REPO_ROOT / "traces" / "TRACE_TABLE.csv"
GUARDS_REPORT_PATH = REPO_ROOT / "dist" / "dsh" / "DSH_GUARDS_REPORT.md"
GATES_DEF_PATH = REPO_ROOT / "dashboards" / "guards" / "hard_gates.yml"


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        raise FileNotFoundError(f"Missing required artifact: {path}")
    with path.open("r", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def check_parity(rows: list[dict[str, str]]) -> list[str]:
    issues: list[str] = []
    be_rows = [row for row in rows if row.get("target_BE", "").strip() == "1"]
    fe_only_rows = [row for row in rows if row.get("target_BE", "").strip() == "0"]
    if not be_rows:
        issues.append("Parity check: no backend rows found in PARITY.csv")
        return issues
    unmatched = [row for row in be_rows if row.get("trace_link_ok", "").upper() != "TRUE"]
    orphan_be = [row for row in be_rows if row.get("orphan_BE_flag", "").upper() == "TRUE"]
    orphan_fe = [row for row in fe_only_rows if row.get("orphan_FE_flag", "").upper() == "TRUE"]
    ratio = (len(be_rows) - len(unmatched)) / len(be_rows)
    if ratio < 1.0:
        issues.append(f"Parity ratio {ratio:.2f} < 1.0")
    if orphan_be:
        issues.append(f"Found {len(orphan_be)} backend orphan rows (see PARITY.csv)")
    if orphan_fe:
        issues.append(f"Found {len(orphan_fe)} front-end orphan rows (see PARITY.csv)")
    return issues


def check_trace_table() -> list[str]:
    issues: list[str] = []
    rows = read_csv(TRACE_TABLE_PATH)
    missing = [row for row in rows if row.get("trace_link_ok", "").upper() != "TRUE"]
    if missing:
        issues.append(f"TRACE table contains {len(missing)} missing links (TRACE_TABLE.csv)")
    return issues


def parse_guard_statuses(text: str) -> dict[str, str]:
    guard_status: dict[str, str] = {}
    table_section = False
    for line in text.splitlines():
        if line.strip().startswith("| Guard"):
            table_section = True
            continue
        if table_section:
            if not line.strip() or not line.strip().startswith("|"):
                break
            cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
            if len(cells) < 2 or cells[0] in ("Guard", "---"):
                continue
            guard_status[cells[0]] = cells[1]
    return guard_status


def check_guards() -> list[str]:
    if not GUARDS_REPORT_PATH.exists():
        return ["Guard report missing: dist/dsh/DSH_GUARDS_REPORT.md"]
    text = GUARDS_REPORT_PATH.read_text(encoding="utf-8")
    statuses = parse_guard_statuses(text)
    failing = {name: status for name, status in statuses.items() if "✅" not in status}
    if failing:
        return [
            "Non-pass guard statuses detected: "
            + ", ".join(f"{name} -> {status}" for name, status in failing.items())
        ]
    return []


def main() -> int:
    errors: list[str] = []
    parity_rows = read_csv(PARITY_PATH)
    errors.extend(check_parity(parity_rows))
    errors.extend(check_trace_table())
    errors.extend(check_guards())

    if errors:
        print("HARD GATES FAILED:")
        for issue in errors:
            print(f"- {issue}")
        return 1

    print("All hard gates satisfied (PARITY=1.00, TRACE=1.00, guard statuses PASS).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
