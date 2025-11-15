#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { paths: [], oas: null };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--paths' && args[i + 1]) {
      result.paths = args[i + 1].split(',').map(p => p.trim());
      i++;
    } else if (args[i] === '--oas' && args[i + 1]) {
      result.oas = args[i + 1];
      i++;
    }
  }
  
  return result;
}

const { paths, oas } = parseArgs();
const openApiPath = oas || 'oas/services/arb/openapi.yaml';

if (!fs.existsSync(openApiPath)) {
  console.log(`# Idempotency Header Check\n\nError: OpenAPI file not found: ${openApiPath}`);
  process.exit(1);
}

const doc = YAML.parse(fs.readFileSync(openApiPath, 'utf8'));
const results = {
  total: 0,
  missing: [],
  present: [],
};

function matchesPath(pathItem, patterns) {
  if (!patterns || patterns.length === 0) return true;
  return patterns.some(pattern => {
    const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
    return regex.test(pathItem);
  });
}

function checkOperation(pathItem, method, operation) {
  if (!operation || typeof operation !== 'object') return;
  
  if (!matchesPath(pathItem, paths)) return;
  
  const operationId = operation.operationId || `${method.toUpperCase()} ${pathItem}`;
  
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method.toUpperCase())) {
    results.total++;
    const params = operation.parameters || [];
    const hasIdempotency = params.some(
      (p) => {
        if (typeof p === 'string') return false;
        const name = p.name || (p.$ref ? p.$ref.split('/').pop() : '');
        return (name === 'Idempotency-Key' || name === 'idempotency-key') && p.in === 'header';
      }
    );

    if (hasIdempotency) {
      results.present.push({ operation: operationId, path: pathItem, method: method.toUpperCase() });
    } else {
      results.missing.push({ operation: operationId, path: pathItem, method: method.toUpperCase() });
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

const output = [
  '# Idempotency Header Audit — ARB',
  '',
  `Total unsafe operations (POST/PATCH/PUT/DELETE): ${results.total}`,
  `With Idempotency-Key header: ${results.present.length}`,
  `Missing Idempotency-Key header: ${results.missing.length}`,
  `Status: ${results.missing.length === 0 ? '✅ PASS' : '❌ FAIL'}`,
  '',
  '## Operations WITH Idempotency-Key',
  '',
  ...results.present.map(item => `- ✅ ${item.method} ${item.path} (${item.operation})`),
  '',
  '## Operations MISSING Idempotency-Key',
  '',
  ...(results.missing.length > 0 
    ? results.missing.map(item => `- ❌ ${item.method} ${item.path} (${item.operation})`)
    : ['- None (all operations properly require Idempotency-Key)']
  ),
].join('\n');

console.log(output);
process.exit(results.missing.length > 0 ? 1 : 0);
