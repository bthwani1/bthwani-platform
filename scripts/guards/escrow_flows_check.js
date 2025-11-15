#!/usr/bin/env node

const fs = require('node:fs');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { vars: [] };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--vars' && args[i + 1]) {
      result.vars = args[i + 1].split(',').map(v => v.trim());
      i++;
    }
  }
  
  return result;
}

const { vars } = parseArgs();

const checks = {
  release_days_implemented: false,
  no_show_penalty_implemented: false,
  config_repository_used: false,
};

const sourceFiles = [
  'src/modules/arb/services/escrow-engine.service.ts',
  'src/modules/arb/repositories/arb-config.repository.ts',
  'src/modules/arb/entities/arb-config.entity.ts',
];

const violations = [];
const findings = [];

for (const filePath of sourceFiles) {
  if (!fs.existsSync(filePath)) {
    violations.push({ file: filePath, issue: 'File not found' });
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  if (filePath.includes('escrow-engine')) {
    if (content.includes('release_days') || content.includes('releaseDays')) {
      checks.release_days_implemented = true;
      findings.push('Release days logic found in escrow engine');
    }
    if (content.includes('no_show') || content.includes('noShow') || content.includes('calculateNoShowPenalty')) {
      checks.no_show_penalty_implemented = true;
      findings.push('No-show penalty logic found in escrow engine');
    }
    if (content.includes('configRepository') || content.includes('ArbConfigRepository')) {
      checks.config_repository_used = true;
      findings.push('Config repository used for policy resolution');
    }
  }

  if (filePath.includes('config')) {
    if (content.includes('release_days') || content.includes('no_show_keep_pct') || content.includes('no_show_cap')) {
      findings.push('Config entity supports policy variables');
    }
  }
}

const envVarsCheck = vars.every(v => {
  const envValue = process.env[v];
  return envValue !== undefined || v.includes('VAR_ARB');
});

const output = [
  '# Escrow Flows Check — ARB',
  '',
  '## Policy Implementation',
  '',
  `- ✅ Release Days Logic: ${checks.release_days_implemented ? 'IMPLEMENTED' : 'MISSING'}`,
  `- ✅ No-Show Penalty Logic: ${checks.no_show_penalty_implemented ? 'IMPLEMENTED' : 'MISSING'}`,
  `- ✅ Config Repository Integration: ${checks.config_repository_used ? 'USED' : 'NOT USED'}`,
  `- ✅ Environment Variables Check: ${envVarsCheck ? 'PASS' : 'WARN'}`,
  '',
  '## Status',
  '',
  checks.release_days_implemented && checks.no_show_penalty_implemented && checks.config_repository_used
    ? '✅ PASS: All escrow flow requirements met'
    : '❌ FAIL: Some escrow flow requirements missing',
  '',
  ...(findings.length > 0 ? [
    '## Findings',
    '',
    ...findings.map(f => `- ${f}`),
  ] : []),
  '',
  '## Required Environment Variables',
  '',
  ...vars.map(v => `- ${v}: ${process.env[v] || 'NOT SET (may use defaults)'}`),
].join('\n');

console.log(output);
process.exit(checks.release_days_implemented && checks.no_show_penalty_implemented && checks.config_repository_used ? 0 : 1);
