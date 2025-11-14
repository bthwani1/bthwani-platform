#!/usr/bin/env node
const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');

const schemaReport = path.resolve('dist', 'dsh', 'SCHEMA_REPORT.har');
const readinessUrl = 'http://127.0.0.1:4010/api/dls/orders';
fs.mkdirSync(path.dirname(schemaReport), { recursive: true });

const prismArgs = [
  '@stoplight/prism-cli',
  'mock',
  'oas/master/Master_OpenAPI.yaml',
  '--port',
  '4010',
  '--dynamic',
  '--cors'
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
      'schemathesis.exe'
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
    // Generate a test JWT token for contract tests
    // This is a simple token that Prism will accept (it doesn't validate signatures)
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJyb2xlcyI6WyJ1c2VyIl0sImV4cCI6OTk5OTk5OTk5OX0.test-signature';
    
    const args = [
      'run',
      'oas/master/Master_OpenAPI.yaml',
      '--checks',
      'all',
      '--url',
      'http://127.0.0.1:4010',
      '--max-examples',
      '10',
      '--report',
      'har',
      '--report-har-path',
      schemaReport,
      '--header',
      `Authorization: Bearer ${testToken}`,
      '--header',
      'Idempotency-Key: test-idempotency-key-contract-tests',
      '--auth',
      `Bearer ${testToken}`
    ];
    const childEnv = { ...process.env, PYTHONIOENCODING: 'utf-8', FORCE_COLOR: '0' };
    const child = spawn(schemathesisBinary, args, {
      stdio: 'inherit',
      shell: isWindows,
      env: childEnv
    });
    child.on('close', (code) => resolve(code));
  });
}

(async () => {
  try {
    const exitCode = await runSchemathesis();
    prism.kill('SIGINT');
    if (exitCode !== 0) {
      console.error('Schemathesis exited with code', exitCode);
      process.exit(exitCode);
    }
    console.log(`[wave] Schemathesis completed. Report: ${schemaReport}`);
  } catch (error) {
    console.error('[wave] Contract test runner failed:', error);
    prism.kill('SIGINT');
    process.exit(1);
  }
})();

