#!/usr/bin/env node
/**
 * Temporary placeholder build for app-user and app-partner.
 * Generates a lightweight artifact so Wave build guard can proceed
 * until the real frontend bundles are integrated.
 */
const fs = require('node:fs');
const path = require('node:path');

const projectName = process.argv[2] ?? 'app';
const distRoot = path.resolve('dist', 'wave', projectName);

fs.mkdirSync(distRoot, { recursive: true });

const artifact = {
  project: projectName,
  status: 'PASS',
  generatedAt: new Date().toISOString(),
  note: 'Placeholder build executed (no frontend bundle defined yet).'
};

const artifactPath = path.join(distRoot, 'build-summary.json');
fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));

console.log(`[wave] ${projectName} placeholder build completed -> ${artifactPath}`);

