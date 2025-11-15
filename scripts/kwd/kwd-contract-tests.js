#!/usr/bin/env node
/**
 * KWD Contract Tests
 * Validates KWD OpenAPI spec against contract requirements
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SESSION_ID = process.env.SESSION_ID || 'KWD-WAVE-02';
const DIST_DIR = path.join(__dirname, '../../dist/kwd');
const OAS_FILE = path.join(__dirname, '../../oas/services/kwd/openapi.yaml');

console.log('📜 KWD Contract Tests');
console.log('====================\n');
console.log(`Session: ${SESSION_ID}`);
console.log(`OAS File: ${OAS_FILE}`);
console.log(`Output: ${DIST_DIR}\n`);

// Ensure output directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Check if OAS file exists
if (!fs.existsSync(OAS_FILE)) {
  console.error(`❌ OAS file not found: ${OAS_FILE}`);
  process.exit(1);
}

const results = {
  spectral: { status: 'unknown', errors: 0, warnings: 0 },
  structure: { status: 'unknown', checks: [] },
};

try {
  console.log('1️⃣ Running Spectral linting...\n');

  try {
    execSync(`npx @stoplight/spectral-cli lint "${OAS_FILE}" --format json > "${DIST_DIR}/spectral-report.json"`, {
      stdio: 'pipe',
    });
    results.spectral.status = 'pass';
  } catch (error) {
    // Spectral exits with non-zero on warnings/errors
    const report = JSON.parse(fs.readFileSync(path.join(DIST_DIR, 'spectral-report.json'), 'utf8'));
    results.spectral.errors = report.filter((r) => r.severity === 0).length;
    results.spectral.warnings = report.filter((r) => r.severity === 1).length;
    results.spectral.status = results.spectral.errors > 0 ? 'fail' : 'pass';
  }

  console.log(`   Errors: ${results.spectral.errors}`);
  console.log(`   Warnings: ${results.spectral.warnings}`);
  console.log(`   Status: ${results.spectral.status}\n`);

  console.log('2️⃣ Validating structure...\n');

  const oasContent = fs.readFileSync(OAS_FILE, 'utf8');

  // Check required sections
  const checks = [
    { name: 'Has info section', pass: oasContent.includes('info:') },
    { name: 'Has version', pass: oasContent.includes('version:') },
    { name: 'Has contact email', pass: oasContent.includes('support@bthwani.com') },
    { name: 'Has servers', pass: oasContent.includes('servers:') },
    { name: 'Has API dev server', pass: oasContent.includes('api-dev.bthwani.com') },
    { name: 'Has API stage server', pass: oasContent.includes('api-stage.bthwani.com') },
    { name: 'Has API prod server', pass: oasContent.includes('api.bthwani.com') },
    { name: 'Has paths', pass: oasContent.includes('paths:') },
    { name: 'Has components', pass: oasContent.includes('components:') },
    { name: 'Has security schemes', pass: oasContent.includes('securitySchemes:') },
    { name: 'No web surfaces in servers', pass: !oasContent.match(/servers:[\s\S]{0,500}?(app\.|admin\.|fin\.|partner\.)bthwani\.com/i) },
  ];

  results.structure.checks = checks;
  results.structure.status = checks.every((c) => c.pass) ? 'pass' : 'fail';

  checks.forEach((check) => {
    console.log(`   ${check.pass ? '✅' : '❌'} ${check.name}`);
  });

  console.log(`\n   Status: ${results.structure.status}\n`);

  // Determine overall status
  const overallPass = results.spectral.status === 'pass' && results.structure.status === 'pass';

  // Generate summary report
  const summaryReport = `# KWD Contract Tests Summary

**Session:** ${SESSION_ID}  
**Date:** ${new Date().toISOString()}  
**Status:** ${overallPass ? '✅ PASS' : '❌ FAIL'}

## Spectral Linting
- **Status:** ${results.spectral.status === 'pass' ? '✅ PASS' : '❌ FAIL'}
- **Errors:** ${results.spectral.errors}
- **Warnings:** ${results.spectral.warnings}

## Structure Validation
- **Status:** ${results.structure.status === 'pass' ? '✅ PASS' : '❌ FAIL'}

${results.structure.checks.map((c) => `- ${c.pass ? '✅' : '❌'} ${c.name}`).join('\n')}

## OpenAPI Spec
- **File:** \`oas/services/kwd/openapi.yaml\`
- **Version:** 1.0.0
- **Service:** SRV-KWD-01

## Detailed Reports
- Spectral: \`dist/kwd/spectral-report.json\`

${
  !overallPass
    ? `
## Required Actions
1. Fix Spectral linting errors
2. Ensure all structure checks pass
3. Review OpenAPI spec compliance
4. Re-run contract tests
`
    : ''
}
`;

  fs.writeFileSync(path.join(DIST_DIR, 'CONTRACT_TESTS_SUMMARY.md'), summaryReport);

  if (overallPass) {
    console.log('✅ Contract tests PASS');
    console.log(`📊 Report: ${path.join(DIST_DIR, 'CONTRACT_TESTS_SUMMARY.md')}`);
    process.exit(0);
  } else {
    console.log('❌ Contract tests FAILED');
    console.log(`📊 Report: ${path.join(DIST_DIR, 'CONTRACT_TESTS_SUMMARY.md')}`);
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ Contract tests ERROR');
  console.error(error.message);
  process.exit(1);
}

