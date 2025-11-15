#!/usr/bin/env node
/**
 * SSOT Index Patcher
 * Adds artifacts to SSOT index registry
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const indexPath = args.find((arg) => arg.startsWith('--index'))?.split('=')[1] || 'registry/SSOT_INDEX.json';
const addArgs = args.filter((arg) => arg.startsWith('--add')).map((arg) => arg.split('=')[1]);

console.log('📝 Patching SSOT Index...');
console.log(`Index: ${indexPath}`);
console.log(`Artifacts to add: ${addArgs.length}\n`);

let index = {
  version: '1.0',
  last_updated: new Date().toISOString(),
  services: {},
  artifacts: [],
};

// Ensure artifacts array exists
if (!index.artifacts) {
  index.artifacts = [];
}

// Load existing index if it exists
if (fs.existsSync(indexPath)) {
  try {
    index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (error) {
    console.error('⚠️  Error reading index, creating new one:', error.message);
  }
}

// Ensure services is an array
if (!Array.isArray(index.services)) {
  index.services = [];
}

// Find or create KWD service entry
let kwdService = index.services.find((s) => s.code === 'KWD');
if (!kwdService) {
  kwdService = {
    code: 'KWD',
    name: 'Jobs Platform',
    status: 'DRAFT',
    owner: 'Platform Guild',
    artifacts: {},
  };
  index.services.push(kwdService);
}

// Ensure artifacts object exists
if (!kwdService.artifacts || typeof kwdService.artifacts !== 'object') {
  kwdService.artifacts = {};
}

// Add artifacts
const artifactKeys = {
  'KWD_GUARDS_REPORT.md': 'guards_report',
  'AUDIT_SUMMARY.md': 'audit_summary',
  'PR_SUMMARY.md': 'pr_summary',
  'SBOM.json': 'sbom',
  'PROVENANCE.json': 'provenance',
  'ARTIFACTS_WAVE_KWD_02.zip': 'artifacts_bundle',
};

for (const artifactPath of addArgs) {
  if (!fs.existsSync(artifactPath)) {
    console.log(`⚠️  Artifact not found: ${artifactPath}`);
    continue;
  }

  const stats = fs.statSync(artifactPath);
  const relativePath = path.relative(process.cwd(), artifactPath);
  const fileName = path.basename(artifactPath);
  const key = artifactKeys[fileName] || fileName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

  kwdService.artifacts[key] = relativePath;

  console.log(`✅ Added: ${relativePath} (key: ${key})`);
}

// Update service status
kwdService.status = 'READY';
kwdService.version = '1.0.0';
kwdService.notes = ['SRV-KWD-01 v1.0 (LOCKED) — Free job board platform'];

// Update index metadata
index.updated_at = new Date().toISOString();

index.last_updated = new Date().toISOString();

// Ensure directory exists
const indexDir = path.dirname(indexPath);
if (!fs.existsSync(indexDir)) {
  fs.mkdirSync(indexDir, { recursive: true });
}

// Write index
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
console.log(`\n✅ Index updated: ${indexPath}`);
console.log(`Total services: ${index.services.length}`);
console.log(`KWD artifacts: ${Object.keys(kwdService.artifacts).length}`);

