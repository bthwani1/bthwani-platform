#!/usr/bin/env node
const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');

const service = process.env.SERVICE || 'arb';
const port = process.env.PRISM_PORT || '4022';
const schemaReport = path.resolve('dist', service, 'SCHEMA_REPORT.json');
const oasFile = process.env.OAS_FILE || `oas/services/${service}/openapi.yaml`;
const readinessUrl = `http://127.0.0.1:${port}/openapi.json`;

fs.mkdirSync(path.dirname(schemaReport), { recursive: true });

const prismArgs = [
  '@stoplight/prism-cli',
  'mock',
  oasFile,
  '--port',
  port,
  '--dynamic',
  '--cors',
];

const isWindows = process.platform === 'win32';
const npxCommand = isWindows ? 'npx' : 'npx';
const schemathesisBinary = (() => {
  if (isWindows) {
    const candidate = path.join(
      process.env.USERPROFILE ?? '',
      'AppData',
      'Roaming',
      'Python',
      'Python314',
      'Scripts',
      'schemathesis.exe',
    );
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return 'schemathesis';
})();

const prism = spawn(npxCommand, prismArgs, { stdio: 'inherit', shell: isWindows });

function waitForServer(url, attempts = 30) {
  return new Promise((resolve, reject) => {
    let count = 0;
    const ping = () => {
      count += 1;
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
          resolve();
        } else if (count >= attempts) {
          reject(new Error(`Server responded with status ${res.statusCode}`));
        } else {
          setTimeout(ping, 1000);
        }
      });
      req.on('error', (err) => {
        if (count >= attempts) {
          reject(err);
        } else {
          setTimeout(ping, 1000);
        }
      });
    };
    ping();
  });
}

async function runSchemathesis() {
  await waitForServer(readinessUrl);
  return new Promise((resolve) => {
    const testToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJyb2xlcyI6WyJjdXN0b21lciIsInBhcnRuZXIiXSwiaWF0IjoxNjE2MjM5MDIyfQ.test-signature';

    const args = [
      'run',
      oasFile,
      '--checks',
      'all',
      '--stateful=links',
      '--url',
      `http://127.0.0.1:${port}`,
      '--max-examples',
      '10',
      '--report',
      'json',
      '--report-json-path',
      schemaReport,
      '--header',
      `Authorization: Bearer ${testToken}`,
      '--header',
      'Idempotency-Key: test-idempotency-key-contract-tests',
      '--auth',
      `Bearer ${testToken}`,
    ];
    const childEnv = { ...process.env, PYTHONIOENCODING: 'utf-8', FORCE_COLOR: '0' };
    const child = spawn(schemathesisBinary, args, {
      stdio: 'inherit',
      shell: isWindows,
      env: childEnv,
    });
    child.on('close', (code) => resolve(code || 0));
  });
}

(async () => {
  try {
    console.log(`[wave] Starting Prism mock server on port ${port}...`);
    console.log(`[wave] Waiting for server to be ready...`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log(`[wave] Running Schemathesis...`);
    const exitCode = await runSchemathesis();
    prism.kill('SIGINT');
    if (exitCode !== 0) {
      console.error(`[wave] Schemathesis exited with code ${exitCode}`);
      process.exit(exitCode);
    }
    console.log(`[wave] Schemathesis completed. Report: ${schemaReport}`);
  } catch (error) {
    console.error('[wave] Contract test runner failed:', error);
    prism.kill('SIGINT');
    process.exit(1);
  }
})();
