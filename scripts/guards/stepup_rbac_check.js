#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { paths: [] };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--paths' && args[i + 1]) {
      result.paths = args[i + 1].split(',').map(p => p.trim());
      i++;
    }
  }
  
  return result;
}

const { paths } = parseArgs();

const checks = {
  stepup_guard_used: false,
  rbac_enforced: false,
  admin_paths_protected: false,
  support_paths_protected: false,
};

const sourceFiles = [
  'src/modules/arb/controllers/arb-admin.controller.ts',
  'src/modules/arb/controllers/arb-support.controller.ts',
  'src/core/guards/step-up.guard.ts',
  'src/core/guards/rbac.guard.ts',
];

const findings = [];

for (const filePath of sourceFiles) {
  if (!fs.existsSync(filePath)) {
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  if (filePath.includes('admin.controller') || filePath.includes('support.controller')) {
    if (content.includes('StepUpGuard') || content.includes('@UseGuards(.*StepUp')) {
      checks.stepup_guard_used = true;
      findings.push(`${path.basename(filePath)}: StepUpGuard found`);
    }
    if (content.includes('JwtAuthGuard')) {
      checks.rbac_enforced = true;
      findings.push(`${path.basename(filePath)}: JWT authentication enforced`);
    }
    if (filePath.includes('admin.controller')) {
      checks.admin_paths_protected = true;
    }
    if (filePath.includes('support.controller')) {
      checks.support_paths_protected = true;
    }
  }
}

const output = [
  '# Step-Up / RBAC Check — ARB',
  '',
  `Paths Checked: ${paths.length > 0 ? paths.join(', ') : 'All admin/support paths'}`,
  '',
  '## Security Checks',
  '',
  `- ✅ Step-Up Guard Used: ${checks.stepup_guard_used ? 'YES' : 'NO'}`,
  `- ✅ RBAC Enforced: ${checks.rbac_enforced ? 'YES' : 'NO'}`,
  `- ✅ Admin Paths Protected: ${checks.admin_paths_protected ? 'YES' : 'NO'}`,
  `- ✅ Support Paths Protected: ${checks.support_paths_protected ? 'YES' : 'NO'}`,
  '',
  '## Status',
  '',
  checks.stepup_guard_used && checks.rbac_enforced && checks.admin_paths_protected && checks.support_paths_protected
    ? '✅ PASS: All sensitive operations protected with Step-Up and RBAC'
    : '❌ FAIL: Some sensitive operations not properly protected',
  '',
  ...(findings.length > 0 ? [
    '## Findings',
    '',
    ...findings.map(f => `- ${f}`),
  ] : []),
].join('\n');

console.log(output);
process.exit(checks.stepup_guard_used && checks.rbac_enforced && checks.admin_paths_protected && checks.support_paths_protected ? 0 : 1);
