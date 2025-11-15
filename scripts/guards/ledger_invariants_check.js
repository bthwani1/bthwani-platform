#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { service: 'SRV-ARB-01' };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--service' && args[i + 1]) {
      result.service = args[i + 1];
      i++;
    }
  }
  
  return result;
}

const { service } = parseArgs();

const checks = {
  wallet_adapter_used: false,
  no_direct_bank_payout: true,
  hold_on_dispute_active: false,
};

const sourceFiles = [
  'src/modules/arb/services/escrow-engine.service.ts',
  'src/modules/arb/adapters/wallet.adapter.ts',
  'src/modules/arb/entities/booking.entity.ts',
];

const violations = [];

for (const filePath of sourceFiles) {
  if (!fs.existsSync(filePath)) {
    violations.push({ file: filePath, issue: 'File not found' });
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  if (filePath.includes('escrow-engine') || filePath.includes('wallet.adapter')) {
    if (content.includes('ArbWalletAdapter') || content.includes('WalletAdapter')) {
      checks.wallet_adapter_used = true;
    }
    if (content.includes('bank') || content.includes('Bank') || content.includes('transfer')) {
      if (!content.includes('// Wallet=Ledger') && !content.includes('// Internal ledger only')) {
        violations.push({ file: filePath, issue: 'Potential bank transfer reference found' });
      }
    }
  }

  if (filePath.includes('booking.entity')) {
    if (content.includes('ON_DISPUTE') || content.includes('on_dispute')) {
      checks.hold_on_dispute_active = true;
    }
  }
}

const output = [
  '# Ledger Invariants Check — ARB',
  '',
  `Service: ${service}`,
  '',
  '## Checks',
  '',
  `- ✅ Wallet Adapter Used: ${checks.wallet_adapter_used ? 'YES' : 'NO'}`,
  `- ✅ No Direct Bank Payout: ${violations.length === 0 ? 'YES' : 'NO'}`,
  `- ✅ Hold on Dispute Active: ${checks.hold_on_dispute_active ? 'YES' : 'NO'}`,
  '',
  '## Status',
  '',
  checks.wallet_adapter_used && violations.length === 0 && checks.hold_on_dispute_active
    ? '✅ PASS: All invariants satisfied'
    : '❌ FAIL: Some invariants violated',
  '',
  ...(violations.length > 0 ? [
    '## Violations',
    '',
    ...violations.map(v => `- ❌ ${v.file}: ${v.issue}`),
  ] : []),
].join('\n');

console.log(output);
process.exit(checks.wallet_adapter_used && violations.length === 0 && checks.hold_on_dispute_active ? 0 : 1);
