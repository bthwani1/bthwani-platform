#!/usr/bin/env python3
"""Package DSH artifact files into a timestamped directory and zip archive."""

from __future__ import annotations

import argparse
import hashlib
import shutil
import time
import zipfile
from pathlib import Path
from typing import Iterable


def compute_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8192), b""):
            digest.update(chunk)
    return digest.hexdigest()


def copy_artifacts(files: dict[str, Path], destination: Path) -> dict[str, Path]:
    destination.mkdir(parents=True, exist_ok=True)
    copied: dict[str, Path] = {}
    for label, src in files.items():
        if not src:
            continue
        if not src.exists():
            raise FileNotFoundError(f"Missing artifact: {src}")
        target = destination / src.name
        shutil.copy(src, target)
        copied[label] = target
    return copied


def create_zip(base_dir: Path, output_name: str = "ARTIFACTS.zip") -> Path:
    zip_path = base_dir / output_name
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as archive:
        for file in base_dir.iterdir():
            if file.is_file() and file.name != output_name:
                archive.write(file, arcname=file.name)
    return zip_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Bundle DSH artifacts into a build directory")
    parser.add_argument("--routes-csv", required=True, type=Path, help="Path to DSH_routes_complete.csv")
    parser.add_argument("--screens-csv", required=True, type=Path, help="Path to DSH_screens_complete.csv")
    parser.add_argument("--routes-summary", required=True, type=Path, help="Path to routes SUMMARY.json")
    parser.add_argument("--routes-excluded", required=True, type=Path, help="Path to DSH_routes_excluded.json")
    parser.add_argument("--screens-summary", required=True, type=Path, help="Path to screens SUMMARY.json")
    parser.add_argument("--screens-rejected", required=True, type=Path, help="Path to SCREENS_REJECTED.json")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("build") / f"DSH_FULL_BUILD_{time.strftime('%Y%m%d_%H%M%S')}",
        help="Destination directory (default build/DSH_FULL_BUILD_<timestamp>)"
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    files = {
        "routes_csv": args.routes_csv,
        "screens_csv": args.screens_csv,
        "routes_summary": args.routes_summary,
        "routes_excluded": args.routes_excluded,
        "screens_summary": args.screens_summary,
        "screens_rejected": args.screens_rejected,
    }

    copied = copy_artifacts(files, args.output_dir)
    zip_path = create_zip(args.output_dir)

    hashes = {name: compute_sha256(path) for name, path in copied.items()}
    hashes["zip"] = compute_sha256(zip_path)

    print(f"Artifacts bundled in {args.output_dir}")
    for name, value in hashes.items():
        print(f"  {name}: {value}")
    print(f"Zip file: {zip_path}")


if __name__ == "__main__":
    main()
