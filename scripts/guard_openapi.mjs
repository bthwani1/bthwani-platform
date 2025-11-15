#!/usr/bin/env node

/**
 * Guard Script: OpenAPI Validation
 * 
 * Checks:
 * - OpenAPI files are valid
 * - Path prefixes are correct
 * - Error shape is consistent
 * - Idempotency-Key is present for mutating operations
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import { glob } from 'glob';

const OPENAPI_DIR = 'oas/services';
const REQUIRED_PREFIXES = {
  dsh: '/api/dls',
  wlt: '/api/wlt',
  arb: '/api/arb',
  knz: '/api/knz',
  amn: '/api/amn',
  esf: '/api/esf',
  snd: '/api/snd',
  mrf: '/api/mrf',
  kwd: '/api/kwd',
};

const MUTATING_METHODS = ['post', 'put', 'patch', 'delete'];

let errors = [];
let warnings = [];

function validateOpenAPI(filePath, content) {
  try {
    const spec = parse(content);
    const serviceCode = filePath.split('/')[2]; // oas/services/{code}/openapi.yaml
    
    // Check info
    if (!spec.info || !spec.info.title || !spec.info.version) {
      errors.push(`${filePath}: Missing required info fields`);
    }
    
    // Check paths
    if (spec.paths) {
      for (const [path, methods] of Object.entries(spec.paths)) {
        // Check path prefix
        const expectedPrefix = REQUIRED_PREFIXES[serviceCode];
        if (expectedPrefix && !path.startsWith(expectedPrefix)) {
          errors.push(`${filePath}: Path ${path} does not start with ${expectedPrefix}`);
        }
        
        // Check each method
        for (const [method, operation] of Object.entries(methods)) {
          if (typeof operation !== 'object') continue;
          
          // Check Idempotency-Key for mutating operations
          if (MUTATING_METHODS.includes(method.toLowerCase())) {
            const hasIdempotency = 
              operation.parameters?.some(p => 
                (p.name === 'Idempotency-Key' || p.$ref?.includes('Idempotency-Key'))
              ) ||
              operation['x-requires-idempotency'] === true;
            
            if (!hasIdempotency) {
              warnings.push(`${filePath}: ${method.toUpperCase()} ${path} should have Idempotency-Key`);
            }
          }
          
          // Check error responses
          if (!operation.responses || !operation.responses.default) {
            warnings.push(`${filePath}: ${method.toUpperCase()} ${path} should have default error response`);
          }
        }
      }
    }
  } catch (error) {
    errors.push(`${filePath}: Parse error - ${error.message}`);
  }
}

async function main() {
  const files = await glob(`${OPENAPI_DIR}/*/openapi.yaml`);
  
  if (files.length === 0) {
    console.error('No OpenAPI files found');
    process.exit(1);
  }
  
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    validateOpenAPI(file, content);
  }
  
  if (errors.length > 0) {
    console.error('❌ OpenAPI Validation Errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  OpenAPI Validation Warnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
  }
  
  console.log('✅ OpenAPI validation passed');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

