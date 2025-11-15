#!/usr/bin/env node
/**
 * KWD Build & Static Checks
 * Runs TypeScript compilation, linting, and formatting checks
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SESSION_ID = process.env.SESSION_ID || 'KWD-WAVE-02';
const DIST_DIR = path.join(__dirname, '../../dist/kwd');

console.log('🔨 KWD Build & Static Checks');
console.log('============================\n');
console.log(`Session: ${SESSION_ID}`);
console.log(`Output: ${DIST_DIR}\n`);

// Ensure output directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

const results = {
  typecheck: { status: 'unknown', output: '' },
  lint: { status: 'unknown', output: '' },
  prettier: { status: 'unknown', output: '' },
  build: { status: 'unknown', output: '' },
};

let overallPass = true;

// 1. TypeScript Type Check
try {
  console.log('1️⃣ TypeScript type-check...\n');
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  results.typecheck.status = 'pass';
  results.typecheck.output = '✅ No type errors';
  console.log('   ✅ PASS\n');
} catch (error) {
  results.typecheck.status = 'fail';
  results.typecheck.output = error.stdout?.toString() || error.message;
  console.log('   ❌ FAIL\n');
  overallPass = false;
}

// 2. ESLint
try {
  console.log('2️⃣ ESLint...\n');
  execSync('npx eslint src/modules/kwd --max-warnings=0 --format json', { stdio: 'pipe' });
  results.lint.status = 'pass';
  results.lint.output = '✅ No linting errors';
  console.log('   ✅ PASS\n');
} catch (error) {
  results.lint.status = 'fail';
  results.lint.output = error.stdout?.toString() || error.message;
  console.log('   ❌ FAIL\n');
  overallPass = false;
}

// 3. Prettier
try {
  console.log('3️⃣ Prettier...\n');
  execSync('npx prettier --check "src/modules/kwd/**/*.ts"', { stdio: 'pipe' });
  results.prettier.status = 'pass';
  results.prettier.output = '✅ All files formatted correctly';
  console.log('   ✅ PASS\n');
} catch (error) {
  results.prettier.status = 'fail';
  results.prettier.output = error.stdout?.toString() || error.message;
  console.log('   ❌ FAIL\n');
  overallPass = false;
}

// 4. Build
try {
  console.log('4️⃣ Build...\n');
  execSync('npm run build', { stdio: 'pipe' });
  results.build.status = 'pass';
  results.build.output = '✅ Build successful';
  console.log('   ✅ PASS\n');
} catch (error) {
  results.build.status = 'fail';
  results.build.output = error.stdout?.toString() || error.message;
  console.log('   ❌ FAIL\n');
  overallPass = false;
}

// Generate summary report
const summaryReport = `# KWD Build & Static Checks Summary

**Session:** ${SESSION_ID}  
**Date:** ${new Date().toISOString()}  
**Status:** ${overallPass ? '✅ PASS' : '❌ FAIL'}

## Type Check
- **Status:** ${results.typecheck.status === 'pass' ? '✅ PASS' : '❌ FAIL'}
- **Output:** ${results.typecheck.output}

## ESLint
- **Status:** ${results.lint.status === 'pass' ? '✅ PASS' : '❌ FAIL'}
- **Max Warnings:** 0
${results.lint.status === 'fail' ? `- **Output:** \`\`\`\n${results.lint.output}\n\`\`\`` : ''}

## Prettier
- **Status:** ${results.prettier.status === 'pass' ? '✅ PASS' : '❌ FAIL'}
${results.prettier.status === 'fail' ? `- **Output:** \`\`\`\n${results.prettier.output}\n\`\`\`` : ''}

## Build
- **Status:** ${results.build.status === 'pass' ? '✅ PASS' : '❌ FAIL'}
${results.build.status === 'fail' ? `- **Output:** \`\`\`\n${results.build.output}\n\`\`\`` : ''}

${
  !overallPass
    ? `
## Required Actions
${results.typecheck.status === 'fail' ? '- Fix TypeScript type errors\n' : ''}${results.lint.status === 'fail' ? '- Fix ESLint errors/warnings\n' : ''}${results.prettier.status === 'fail' ? '- Run \`npm run format\` to fix formatting\n' : ''}${results.build.status === 'fail' ? '- Fix build errors\n' : ''}
## Commands to Fix
\`\`\`bash
# Format code
npm run format

# Fix linting issues
npm run lint

# Re-check types
npx tsc --noEmit

# Rebuild
npm run build
\`\`\`
`
    : ''
}
`;

// Ensure directory exists before writing
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}
fs.writeFileSync(path.join(DIST_DIR, 'STATIC_CHECKS.md'), summaryReport);

if (overallPass) {
  console.log('✅ Build & static checks PASS');
  console.log(`📊 Report: ${path.join(DIST_DIR, 'STATIC_CHECKS.md')}`);
  process.exit(0);
} else {
  console.log('❌ Build & static checks FAILED');
  console.log(`📊 Report: ${path.join(DIST_DIR, 'STATIC_CHECKS.md')}`);
  process.exit(1);
}

