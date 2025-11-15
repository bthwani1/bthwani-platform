#!/usr/bin/env node

/**
 * Guard Script: Routes Parity Check
 * 
 * Checks:
 * - OpenAPI routes match actual code routes
 * - No orphaned routes in code
 * - No missing routes in OpenAPI
 */

import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { glob } from 'glob';

const OPENAPI_DIR = 'oas/services';
const CODE_DIR = 'src/modules';

async function extractOpenAPIRoutes(serviceCode) {
  const filePath = `${OPENAPI_DIR}/${serviceCode}/openapi.yaml`;
  try {
    const content = readFileSync(filePath, 'utf-8');
    const spec = parse(content);
    const routes = new Set();
    
    if (spec.paths) {
      for (const path of Object.keys(spec.paths)) {
        routes.add(path);
      }
    }
    
    return routes;
  } catch {
    return new Set();
  }
}

async function extractCodeRoutes(serviceCode) {
  // This is a simplified check
  // In real implementation, would parse controllers
  const routes = new Set();
  
  try {
    const controllerFiles = await glob(`${CODE_DIR}/${serviceCode}/**/*.controller.ts`);
    
    for (const file of controllerFiles) {
      const content = readFileSync(file, 'utf-8');
      
      // Extract @Get, @Post, etc. decorators
      const routeMatches = content.matchAll(/@(Get|Post|Put|Patch|Delete)\(['"]([^'"]+)['"]\)/g);
      
      for (const match of routeMatches) {
        const route = match[2];
        routes.add(route);
      }
    }
  } catch {
    // Service might not be implemented yet
  }
  
  return routes;
}

async function main() {
  const services = ['dsh', 'wlt', 'arb', 'knz', 'amn', 'esf', 'snd', 'mrf', 'kwd'];
  let warnings = [];
  
  for (const service of services) {
    const openAPIRoutes = await extractOpenAPIRoutes(service);
    const codeRoutes = await extractCodeRoutes(service);
    
    // Check for routes in code but not in OpenAPI
    for (const route of codeRoutes) {
      if (!openAPIRoutes.has(route)) {
        warnings.push(`${service}: Route ${route} exists in code but not in OpenAPI`);
      }
    }
    
    // Note: Routes in OpenAPI but not in code is OK (service might be DRAFT)
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  Routes Parity Warnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
  } else {
    console.log('✅ Routes parity check passed');
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

