import csv
import json
import time
from pathlib import Path

ROUTES_PATH = Path('/mnt/data/DSH_FULL_CURATED_20251113_225147/DSH_routes_complete.csv')
SCREENS_SRC = Path('C:/Users/b/Downloads/DSH,') / 'COMPILED_SCREEN_CATALOG_20251111_234006.csv'
OUTPUT_BASE = Path('/mnt/data') / f"DSH_FULL_SCREENS_{time.strftime('%Y%m%d_%H%M%S')}"
OUTPUT_BASE.mkdir(parents=True, exist_ok=True)

with ROUTES_PATH.open('r', encoding='utf-8') as f:
    route_reader = csv.DictReader(f)
    operation_ids = {row.get('operation_id', '').strip() for row in route_reader if row.get('operation_id')}

accepted = []
rejected = []

with SCREENS_SRC.open('r', encoding='utf-8', errors='replace') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        surface_id = (row.get('surface_id') or '').strip()
        op_field = (row.get('operation_id') or '').strip()
        if not surface_id or not op_field:
            continue
        ops = [op.strip() for op in op_field.split('|') if op.strip()]
        missing = [op for op in ops if op not in operation_ids]
        if missing:
            rejected.append({
                'surface_id': surface_id,
                'screen_id': row.get('screen_id'),
                'missing_ops': missing
            })
            continue
        accepted.append(row)

screens_csv = OUTPUT_BASE / 'DSH_screens_complete.csv'
with screens_csv.open('w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(accepted)

(OUTPUT_BASE / 'SCREENS_REJECTED.json').write_text(json.dumps(rejected, indent=2, ensure_ascii=False), encoding='utf-8')

summary = {
    'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
    'accepted': len(accepted),
    'rejected': len(rejected),
    'output_dir': str(OUTPUT_BASE)
}

(OUTPUT_BASE / 'SUMMARY.json').write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding='utf-8')

print(json.dumps(summary, indent=2, ensure_ascii=False))
