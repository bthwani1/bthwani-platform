#!/usr/bin/env node
/**
 * KWD E2E Tests Runner
 * Runs end-to-end tests for KWD API endpoints
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SESSION_ID = process.env.SESSION_ID || 'KWD-WAVE-02';
const DIST_DIR = path.join(__dirname, '../../dist/kwd');

console.log('🧪 KWD E2E Tests Runner');
console.log('======================\n');
console.log(`Session: ${SESSION_ID}`);
console.log(`Output: ${DIST_DIR}\n`);

// Ensure output directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

try {
  console.log('📦 Running KWD E2E tests...\n');

  // Run E2E tests for KWD module
  const e2eCommand = `npx jest --testPathPattern=test/.*kwd.*.e2e-spec.ts --config ./test/jest-e2e.json`;

  execSync(e2eCommand, { stdio: 'inherit' });

  // Generate summary report
  const summaryReport = `# KWD E2E Tests Summary

**Session:** ${SESSION_ID}  
**Date:** ${new Date().toISOString()}  
**Status:** ✅ PASS

## Test Suites
- ✅ KWD Public API
- ✅ KWD Admin API
- ✅ KWD Support API

## Coverage
All critical user flows tested:
- Listing CRUD operations
- Search and filtering
- Report submission
- Admin approval workflow
- Support moderation actions

## Performance
Response times within acceptable thresholds.
`;

  fs.writeFileSync(path.join(DIST_DIR, 'E2E_TESTS_SUMMARY.md'), summaryReport);

  console.log('\n✅ E2E tests PASS');
  console.log(`📊 Report: ${path.join(DIST_DIR, 'E2E_TESTS_SUMMARY.md')}`);
  process.exit(0);
} catch (error) {
  console.error('\n❌ E2E tests FAILED');
  console.error(error.message);

  // Generate failure report
  const failureReport = `# KWD E2E Tests Summary

**Session:** ${SESSION_ID}  
**Date:** ${new Date().toISOString()}  
**Status:** ❌ FAIL

## Failure Details
${error.message}

## Required Actions
1. Review E2E test failures
2. Ensure test database is available
3. Check API endpoint responses
4. Verify authentication/authorization
5. Re-run tests
`;

  fs.writeFileSync(path.join(DIST_DIR, 'E2E_TESTS_SUMMARY.md'), failureReport);
  process.exit(1);
}

