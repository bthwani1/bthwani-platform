#!/usr/bin/env node
/**
 * KWD Unit Tests Runner
 * Runs unit tests for KWD module with coverage thresholds
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SESSION_ID = process.env.SESSION_ID || 'KWD-WAVE-02';
const DIST_DIR = path.join(__dirname, '../../dist/kwd');

console.log('🧪 KWD Unit Tests Runner');
console.log('========================\n');
console.log(`Session: ${SESSION_ID}`);
console.log(`Output: ${DIST_DIR}\n`);

// Ensure output directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

try {
  console.log('📦 Running KWD unit tests...\n');

  // Run Jest with coverage for KWD module only
  const jestCommand = `npx jest --testPathPattern=src/modules/kwd --coverage --coverageDirectory=${DIST_DIR}/coverage --coverageReporters=json --coverageReporters=lcov --coverageReporters=text --coverageThreshold="{\\\"global\\\":{\\\"branches\\\":85,\\\"functions\\\":90,\\\"lines\\\":90,\\\"statements\\\":90}}"`;

  execSync(jestCommand, { stdio: 'inherit', shell: true });

  // Generate summary report
  const summaryReport = `# KWD Unit Tests Summary

**Session:** ${SESSION_ID}  
**Date:** ${new Date().toISOString()}  
**Status:** ✅ PASS

## Coverage Thresholds
- **Lines:** ≥90% ✅
- **Branches:** ≥85% ✅
- **Functions:** ≥90% ✅
- **Statements:** ≥90% ✅

## Test Results
All unit tests passed successfully.

Coverage reports available at:
- \`dist/kwd/coverage/lcov-report/index.html\`
- \`dist/kwd/coverage/coverage-final.json\`
`;

  fs.writeFileSync(path.join(DIST_DIR, 'UNIT_TESTS_SUMMARY.md'), summaryReport);

  console.log('\n✅ Unit tests PASS');
  console.log(`📊 Report: ${path.join(DIST_DIR, 'UNIT_TESTS_SUMMARY.md')}`);
  process.exit(0);
} catch (error) {
  console.error('\n❌ Unit tests FAILED');
  console.error(error.message);

  // Generate failure report
  const failureReport = `# KWD Unit Tests Summary

**Session:** ${SESSION_ID}  
**Date:** ${new Date().toISOString()}  
**Status:** ❌ FAIL

## Failure Details
${error.message}

## Required Actions
1. Review test failures
2. Fix failing tests
3. Ensure coverage thresholds are met
4. Re-run tests

## Coverage Thresholds (Required)
- **Lines:** ≥90%
- **Branches:** ≥85%
- **Functions:** ≥90%
- **Statements:** ≥90%
`;

  fs.writeFileSync(path.join(DIST_DIR, 'UNIT_TESTS_SUMMARY.md'), failureReport);
  process.exit(1);
}

