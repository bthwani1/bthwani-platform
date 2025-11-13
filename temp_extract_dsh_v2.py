import csv
import json
import time
from pathlib import Path

RAW_PATH = Path("C:/Users/b/Downloads/DSH,") / "DSH routes_table final.csv"
OUTPUT_BASE = Path("/mnt/data") / f"DSH_FULL_CURATED_{time.strftime('%Y%m%d_%H%M%S')}"
OUTPUT_BASE.mkdir(parents=True, exist_ok=True)

reject_tokens = ["KNZ", "SND", "SRV-WLT", "SRV-KNZ", "SRV-SND", "SRV-CRM", "SRV-PSP", "SRV-KNZ", "SRV-WLT"]

accepted = []
rejected = []
fieldnames_set = []
fieldnames_order = []

with RAW_PATH.open("r", encoding="utf-8", errors="replace") as f:
    reader = csv.reader(f)
    current_header = None
    for row in reader:
        if not any(cell.strip() for cell in row):
            continue
        first = row[0].strip()
        if first.lower() == "ssot_ref":
            current_header = [col.strip() for col in row]
            continue
        if current_header is None:
            continue
        record = {}
        for idx, key in enumerate(current_header):
            record[key] = row[idx].strip() if idx < len(row) else ""
            if key not in fieldnames_set:
                fieldnames_set.append(key)
        ssot = record.get("ssot_ref", "")
        entity_code = record.get("entity_code", "")
        path = record.get("path", "")
        operation_id = record.get("operation_id", "")
        description = record.get("description in english", "")

        combined = " ".join([ssot, entity_code, path, operation_id, description]).upper()
        if any(token in combined for token in reject_tokens):
            rejected.append({"operation_id": operation_id, "path": path, "ssot": ssot, "entity_code": entity_code, "reason": "excluded_token"})
            continue
        if not operation_id:
            rejected.append({"operation_id": operation_id, "path": path, "ssot": ssot, "entity_code": entity_code, "reason": "missing_operation"})
            continue
        accepted.append(record)

if not accepted:
    raise RuntimeError("No accepted rows")

routes_csv = OUTPUT_BASE / "DSH_routes_complete.csv"
with routes_csv.open("w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames_set)
    writer.writeheader()
    for record in accepted:
        writer.writerow({key: record.get(key, "") for key in fieldnames_set})

rejected_json = OUTPUT_BASE / "DSH_routes_excluded.json"
rejected_json.write_text(json.dumps(rejected, indent=2, ensure_ascii=False), encoding="utf-8")

summary = {
    "timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
    "total": len(accepted),
    "excluded": len(rejected),
    "output_dir": str(OUTPUT_BASE)
}

(OUTPUT_BASE / "SUMMARY.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

print(json.dumps(summary, indent=2, ensure_ascii=False))
