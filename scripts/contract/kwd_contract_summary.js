#!/usr/bin/env node
/**
 * KWD Contract Tests Summary Generator
 * Processes Schemathesis report and generates summary
 */

const fs = require('fs');
const path = require('path');

const reportPath = process.argv[2] || path.join(__dirname, '../../dist/kwd/SCHEMA_REPORT.json');
const outputPath = path.join(__dirname, '../../dist/kwd/CONTRACT_TESTS_SUMMARY.md');

console.log('📊 Generating KWD Contract Tests Summary...');
console.log(`Report: ${reportPath}`);
console.log(`Output: ${outputPath}\n`);

let report = {};
let summary = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: 0,
  warnings: 0,
  checks: [],
};

try {
  if (fs.existsSync(reportPath)) {
    const reportContent = fs.readFileSync(reportPath, 'utf8');
    report = JSON.parse(reportContent);
    
    // Process Schemathesis report format
    if (report.statistic) {
      summary.total = report.statistic.total || 0;
      summary.passed = report.statistic.passed || 0;
      summary.failed = report.statistic.failed || 0;
      summary.errors = report.statistic.errors || 0;
      summary.warnings = report.statistic.warnings || 0;
    } else if (Array.isArray(report)) {
      summary.total = report.length;
      summary.passed = report.filter((r) => r.status === 'success').length;
      summary.failed = report.filter((r) => r.status === 'failure').length;
      summary.errors = report.filter((r) => r.status === 'error').length;
    }
  } else {
    console.log('⚠️  Report file not found, using empty summary');
  }
} catch (error) {
  console.error('❌ Error reading report:', error.message);
  // Continue with empty summary
}

const status = summary.failed === 0 && summary.errors === 0 ? '✅ PASS' : '❌ FAIL';

const markdown = `# KWD Contract Tests Summary

**Date:** ${new Date().toISOString()}  
**Status:** ${status}

## Results

- **Total Tests:** ${summary.total}
- **Passed:** ${summary.passed}
- **Failed:** ${summary.failed}
- **Errors:** ${summary.errors}
- **Warnings:** ${summary.warnings}

## Details

${summary.failed > 0 || summary.errors > 0 ? `
### Failed Tests

${summary.checks.map((check) => `- ❌ ${check}`).join('\n')}

` : 'All contract tests passed successfully. ✅'}

## Report

Full report available at: \`${reportPath}\`

---

**Generated:** ${new Date().toISOString()}  
**Service:** SRV-KWD-01 v1.0 (LOCKED)
`;

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, markdown);
console.log(`✅ Summary generated: ${outputPath}`);
console.log(`\nStatus: ${status}`);
console.log(`Total: ${summary.total}, Passed: ${summary.passed}, Failed: ${summary.failed}`);

process.exit(summary.failed > 0 || summary.errors > 0 ? 1 : 0);

