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
const results = {
  total: 0,
  missing: [],
  present: [],
};

function checkOperation(pathItem, method, operation) {
  if (!operation || typeof operation !== 'object') return;
  
  const operationId = operation.operationId || `${method} ${pathItem}`;
  results.total++;

  if (['POST', 'PATCH', 'PUT'].includes(method.toUpperCase())) {
    const params = operation.parameters || [];
    const hasIdempotency = params.some(
      (p) => (p.name === 'Idempotency-Key' || p.$ref?.includes('Idempotency-Key')) && p.in === 'header'
    );

    if (hasIdempotency) {
      results.present.push(operationId);
    } else {
      results.missing.push(operationId);
    }
  }
}

for (const [pathItem, pathDef] of Object.entries(doc.paths || {})) {
  if (typeof pathDef !== 'object') continue;
  
  for (const [method, operation] of Object.entries(pathDef)) {
    if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
      checkOperation(pathItem, method, operation);
    }
  }
}

const output = {
  summary: {
    total_unsafe_operations: results.total,
    with_idempotency: results.present.length,
    missing_idempotency: results.missing.length,
    pass: results.missing.length === 0,
  },
  missing: results.missing,
  present: results.present,
};

console.log(JSON.stringify(output, null, 2));
process.exit(results.missing.length > 0 ? 1 : 0);

