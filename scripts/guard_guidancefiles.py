#!/usr/bin/env python3
"""Guard to ensure Guidancefiles stay in sync when key areas change."""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

MONITORED_PREFIXES = [
    "apps/",
    "dashboards/",
    "runtime/",
    "registry/",
    "docs/explainar/",
    "oas/services/",
    "web/",
]
GUIDANCE_PATH = Path("docs/Guidancefiles")


def run(cmd: list[str]) -> str:
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return result.stdout.strip()


def guidance_guard() -> int:
    if not GUIDANCE_PATH.exists():
        print("Guidance directory not present; skipping check.")
        return 0

    base_ref = os.environ.get("GUIDANCE_BASE_REF") or os.environ.get("GITHUB_BASE_REF")
    if base_ref:
        if not base_ref.startswith("origin/"):
            base_ref = f"origin/{base_ref}"
    else:
        base_ref = "origin/main"

    try:
        subprocess.run(["git", "fetch", "origin", base_ref], check=True)
    except subprocess.CalledProcessError as exc:
        print(f"::warning::Unable to fetch {base_ref}: {exc}. Proceeding with local reference.")

    changed_files = run(["git", "diff", "--name-only", base_ref, "HEAD"]).splitlines()
    if not changed_files:
        print("No changes detected relative to base; guidance guard passing.")
        return 0

    monitored_changed = [f for f in changed_files if any(f.startswith(prefix) for prefix in MONITORED_PREFIXES)]
    if not monitored_changed:
        print("No monitored areas changed; guidance guard passing.")
        return 0

    guidance_changed = [f for f in changed_files if f.startswith("docs/Guidancefiles/")]
    if guidance_changed:
        print("Guidance files updated: \n - " + "\n - ".join(guidance_changed))
        return 0

    print("::error::Detected changes in monitored areas without corresponding updates in docs/Guidancefiles/. \n"
          "Please review the guidance documents and update them if necessary (or confirm no changes required)."
          )
    print("Changed monitored files:")
    for path in monitored_changed:
        print(f" - {path}")
    return 1


if __name__ == "__main__":
    try:
        sys.exit(guidance_guard())
    except subprocess.CalledProcessError as exc:
        print(exc.stderr or exc.stdout)
        sys.exit(1)
