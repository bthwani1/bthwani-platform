#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const DIST_DIR = path.resolve('dist/esf');
const ARTIFACTS_ZIP = path.join(DIST_DIR, 'ARTIFACTS_WAVE_ESF_02.zip');

function collectArtifacts() {
  const artifacts = [];
  
  if (!fs.existsSync(DIST_DIR)) {
    console.error('Dist directory not found:', DIST_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(DIST_DIR, { recursive: true, withFileTypes: true });
  
  for (const file of files) {
    if (file.isFile()) {
      const fullPath = path.join(DIST_DIR, file.name);
      artifacts.push(fullPath);
    }
  }

  return artifacts;
}

function createZip(artifacts) {
  if (artifacts.length === 0) {
    console.error('No artifacts found');
    process.exit(1);
  }

  try {
    const zipCommand = process.platform === 'win32'
      ? `powershell Compress-Archive -Path "${artifacts.join('","')}" -DestinationPath "${ARTIFACTS_ZIP}" -Force`
      : `zip -r "${ARTIFACTS_ZIP}" ${artifacts.map((a) => `"${a}"`).join(' ')}`;

    execSync(zipCommand, { stdio: 'inherit', cwd: DIST_DIR });
    console.log(`✅ Created artifacts bundle: ${ARTIFACTS_ZIP}`);
  } catch (error) {
    console.error('Failed to create zip:', error.message);
    process.exit(1);
  }
}

function main() {
  console.log('Collecting ESF artifacts...');
  const artifacts = collectArtifacts();
  console.log(`Found ${artifacts.length} artifacts`);
  
  console.log('Creating artifacts bundle...');
  createZip(artifacts);
  
  console.log('✅ Artifacts bundle created successfully');
}

main();

