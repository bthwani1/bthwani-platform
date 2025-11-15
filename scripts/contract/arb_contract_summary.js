#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const reportPath = process.argv[2] || 'dist/arb/SCHEMA_REPORT.json';
const outputPath = process.argv[3] || 'dist/arb/CONTRACT_TESTS_SUMMARY.md';

if (!fs.existsSync(reportPath)) {
  console.log(`# Contract Tests Summary\n\nError: Report file not found: ${reportPath}`);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const summary = {
  total: report.statistic?.total || 0,
  passed: report.statistic?.passed || 0,
  failed: report.statistic?.failed || 0,
  errored: report.statistic?.errored || 0,
  skipped: report.statistic?.skipped || 0,
  duration: report.statistic?.duration || 0,
};

const checks = report.statistic?.checks || {};
const checkSummary = Object.entries(checks).map(([check, count]) => ({
  check,
  count,
}));

const failures = (report.results || [])
  .filter((r) => r.status === 'failure' || r.status === 'error')
  .map((r) => ({
    path: r.path,
    method: r.method,
    status: r.status,
    message: r.message,
  }));

const output = [
  '# Contract Tests Summary — ARB',
  '',
  `Report: ${reportPath}`,
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Summary',
  '',
  `- Total: ${summary.total}`,
  `- Passed: ${summary.passed}`,
  `- Failed: ${summary.failed}`,
  `- Errored: ${summary.errored}`,
  `- Skipped: ${summary.skipped}`,
  `- Duration: ${summary.duration}ms`,
  '',
  '## Status',
  '',
  summary.failed === 0 && summary.errored === 0
    ? '✅ PASS: All contract tests passed'
    : '❌ FAIL: Some contract tests failed',
  '',
  ...(checkSummary.length > 0
    ? [
        '## Checks',
        '',
        ...checkSummary.map((c) => `- ${c.check}: ${c.count}`),
        '',
      ]
    : []),
  ...(failures.length > 0
    ? [
        '## Failures',
        '',
        ...failures.map(
          (f) =>
            `- ❌ ${f.method.toUpperCase()} ${f.path}: ${f.status} - ${f.message || 'No message'}`,
        ),
        '',
      ]
    : []),
].join('\n');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output, 'utf8');

console.log(output);
process.exit(summary.failed > 0 || summary.errored > 0 ? 1 : 0);
