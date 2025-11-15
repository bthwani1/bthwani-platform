#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

const openApiPath = process.argv[2] || 'oas/services/esf/openapi.yaml';

if (!fs.existsSync(openApiPath)) {
  console.log(JSON.stringify({ error: 'OpenAPI file not found', path: openApiPath }, null, 2));
  process.exit(1);
}

const doc = YAML.parse(fs.readFileSync(openApiPath, 'utf8'));
const violations = [];

for (const [pathItem, pathDef] of Object.entries(doc.paths || {})) {
  if (typeof pathDef !== 'object') continue;
  
  const lowerPath = pathItem.toLowerCase();
  if (lowerPath.includes('/wallet') || lowerPath.includes('/pay') || lowerPath.includes('/payment')) {
    violations.push({
      path: pathItem,
      reason: 'Contains wallet/pay/payment path',
    });
  }
}

const output = {
  summary: {
    violations_found: violations.length,
    pass: violations.length === 0,
  },
  violations,
};

console.log(JSON.stringify(output, null, 2));
process.exit(violations.length > 0 ? 1 : 0);

