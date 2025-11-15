#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const migrationPath = 'migrations/Migration20250115000001_CreateEsfTables.ts';

if (!fs.existsSync(migrationPath)) {
  console.log(JSON.stringify({ error: 'Migration file not found', path: migrationPath }, null, 2));
  process.exit(1);
}

const migrationContent = fs.readFileSync(migrationPath, 'utf8');

const checks = {
  abo_rh_strict: {
    pass: /CHECK.*abo_type.*IN.*\(.*'A'.*'B'.*'AB'.*'O'\)/i.test(migrationContent) &&
          /CHECK.*rh_factor.*IN.*\(.*'\+'.*'-'\)/i.test(migrationContent),
    detail: 'ABO/Rh strict enum constraints',
  },
  cooldown: {
    pass: /cooldown/i.test(migrationContent),
    detail: 'Cooldown period support',
  },
  radius: {
    pass: /location.*jsonb/i.test(migrationContent),
    detail: 'Location/radius support',
  },
  indexes: {
    pass: /CREATE INDEX.*esf_requests/i.test(migrationContent) &&
          /CREATE INDEX.*esf_donor_profiles/i.test(migrationContent),
    detail: 'Performance indexes',
  },
};

const allPass = Object.values(checks).every((c) => c.pass);

const output = {
  summary: {
    all_checks_pass: allPass,
    checks_count: Object.keys(checks).length,
    passed_count: Object.values(checks).filter((c) => c.pass).length,
  },
  checks,
};

console.log(JSON.stringify(output, null, 2));
process.exit(allPass ? 0 : 1);

