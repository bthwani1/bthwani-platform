#!/usr/bin/env node
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function safeExec(command) {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'unavailable';
  }
}

const payload = {
  generatedAt: new Date().toISOString(),
  generator: 'scripts/wave/provenance-stub.js',
  rationale: 'Fallback provenance stub because scripts/ci/slsa_provenance.sh is unavailable on Windows runner.',
  git: {
    commit: safeExec('git rev-parse HEAD'),
    branch: safeExec('git rev-parse --abbrev-ref HEAD'),
    status: safeExec('git status -sb')
  },
  node: process.version,
  npm: safeExec('npm --version'),
  workspace: path.resolve('.'),
  inputs: {
    dockerfile: 'docker/DshService.Dockerfile',
    buildCommand: 'npx nx build srv-dsh --configuration=production'
  }
};

const reportPath = path.resolve('dist', 'dsh', 'PROVENANCE.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(payload, null, 2));
console.log(JSON.stringify(payload, null, 2));

