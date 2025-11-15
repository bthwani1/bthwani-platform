#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

const openApiPath = process.argv[2] || 'oas/services/esf/openapi.yaml';
const redirectStart = process.argv[3] || '2025-12-01T00:00:00+03:00';
const goneAt = process.argv[4] || '2025-12-15T00:00:00+03:00';

if (!fs.existsSync(openApiPath)) {
  console.log(JSON.stringify({ error: 'OpenAPI file not found', path: openApiPath }, null, 2));
  process.exit(1);
}

const doc = YAML.parse(fs.readFileSync(openApiPath, 'utf8'));
const expectedAliases = ['/es3afni', '/blood'];
const foundAliases = [];

for (const [pathItem] of Object.entries(doc.paths || {})) {
  if (expectedAliases.some((alias) => pathItem.startsWith(alias))) {
    foundAliases.push(pathItem);
  }
}

const output = {
  summary: {
    expected_aliases: expectedAliases,
    found_aliases: foundAliases,
    redirect_start: redirectStart,
    gone_at: goneAt,
    pass: foundAliases.length > 0,
  },
  details: {
    note: 'Aliases should redirect 308 starting from redirect_start, then 410 at gone_at',
  },
};

console.log(JSON.stringify(output, null, 2));
process.exit(0);

