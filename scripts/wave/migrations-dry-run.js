#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

require('ts-node').register({
  transpileOnly: true,
  project: path.resolve('tsconfig.json')
});

const migrationsRoot = path.resolve('migrations');
const reportPath = path.resolve('dist', 'dsh', 'DB_MIGRATE_DRY.txt');

function collectFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const acc = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      acc.push(...collectFiles(fullPath));
      continue;
    }
    if (/\.(ts|js)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function inspectMigration(filePath) {
  try {
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const mod = require(filePath);
    const candidates = [mod.default, ...Object.values(mod)];
    const MigrationClass = candidates.find((candidate) => typeof candidate === 'function');
    if (!MigrationClass) {
      return { file: filePath, status: 'FAIL', detail: 'No exportable class found' };
    }
    const instance = new MigrationClass();
    if (typeof instance.up !== 'function' || typeof instance.down !== 'function') {
      return { file: filePath, status: 'FAIL', detail: 'Missing up/down methods' };
    }
    return { file: filePath, status: 'PASS' };
  } catch (error) {
    return { file: filePath, status: 'FAIL', detail: error.message };
  }
}

function main() {
  const files = collectFiles(migrationsRoot);
  const results = files.map(inspectMigration);
  const failures = results.filter((item) => item.status === 'FAIL');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const payload = [
    `# MikroORM Migration Dry-Run`,
    `Source: ${migrationsRoot}`,
    `Files checked: ${files.length}`,
    `Failures: ${failures.length}`,
    '',
    ...results.map((item) =>
      `${item.status === 'PASS' ? '✅' : '❌'} ${path.relative(process.cwd(), item.file)}${item.detail ? ` — ${item.detail}` : ''}`
    )
  ].join('\n');
  fs.writeFileSync(reportPath, payload, 'utf8');
  console.log(payload);
  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main();

