#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const seedRoots = [path.resolve('registry'), path.resolve('seeds')];
const service = process.env.SERVICE || 'dsh';
const reportPath = path.resolve('dist', service, 'DB_SEED_DRY.txt');

function collectJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const acc = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      acc.push(...collectJsonFiles(fullPath));
      continue;
    }
    if (entry.name.endsWith('.json')) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function validateJson(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(data);
    const size = Array.isArray(parsed) ? parsed.length : Object.keys(parsed || {}).length;
    if (size === 0) {
      return { file: filePath, status: 'WARN', detail: 'JSON parsed but empty' };
    }
    return { file: filePath, status: 'PASS' };
  } catch (error) {
    return { file: filePath, status: 'FAIL', detail: error.message };
  }
}

function main() {
  const files = seedRoots.flatMap(collectJsonFiles);
  const results = files.map(validateJson);
  const failures = results.filter((item) => item.status === 'FAIL');
  const warnings = results.filter((item) => item.status === 'WARN');

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const payload = [
    `# Seed Dry-Run`,
    `Roots: ${seedRoots.join(', ')}`,
    `JSON files: ${files.length}`,
    `Failures: ${failures.length}`,
    `Warnings: ${warnings.length}`,
    '',
    ...results.map((item) => {
      const symbol = item.status === 'PASS' ? '✅' : item.status === 'WARN' ? '⚠️' : '❌';
      return `${symbol} ${path.relative(process.cwd(), item.file)}${item.detail ? ` — ${item.detail}` : ''}`;
    })
  ].join('\n');
  fs.writeFileSync(reportPath, payload, 'utf8');
  console.log(payload);
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main();

