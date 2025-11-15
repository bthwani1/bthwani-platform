#!/usr/bin/env node
/**
 * SSOT Approval Logger
 * Appends approval entries to approvals log
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const logPath = args.find((arg) => arg.startsWith('--log'))?.split('=')[1] || 'registry/APPROVALS_LOG.md';
const session = args.find((arg) => arg.startsWith('--session'))?.split('=')[1] || 'UNKNOWN';
const entity = args.find((arg) => arg.startsWith('--entity'))?.split('=')[1] || 'UNKNOWN';
const action = args.find((arg) => arg.startsWith('--action'))?.split('=')[1] || 'UNKNOWN';
const status = args.find((arg) => arg.startsWith('--status'))?.split('=')[1] || 'PENDING';

console.log('📝 Appending Approval Entry...');
console.log(`Log: ${logPath}`);
console.log(`Session: ${session}`);
console.log(`Entity: ${entity}`);
console.log(`Action: ${action}`);
console.log(`Status: ${status}\n`);

let logContent = '';

// Load existing log if it exists
if (fs.existsSync(logPath)) {
  logContent = fs.readFileSync(logPath, 'utf8');
} else {
  logContent = `# SSOT Approvals Log

Generated: ${new Date().toISOString()}

## Entries

`;
}

// Append new entry
const entry = `## ${session}

- **Entity:** ${entity}
- **Action:** ${action}
- **Status:** ${status}
- **Date:** ${new Date().toISOString()}
- **Approver:** WAVE-KWD/02 Automation

---

`;

logContent += entry;

// Ensure directory exists
const logDir = path.dirname(logPath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Write log
fs.writeFileSync(logPath, logContent);
console.log(`✅ Approval entry appended to: ${logPath}`);

