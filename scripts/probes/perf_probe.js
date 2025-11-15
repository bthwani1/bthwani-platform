#!/usr/bin/env node
/**
 * KWD Performance Probe
 * Measures response times for KWD endpoints
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const args = process.argv.slice(2);
const baseUrl = args.find((arg) => arg.startsWith('--base'))?.split('=')[1] || 'http://127.0.0.1:4320';
const endpointsArg = args.find((arg) => arg.startsWith('--endpoints'));
const endpoints = endpointsArg
  ? endpointsArg
      .split('=')[1]
      .split(',')
      .map((e) => e.trim())
  : ['/api/kawader/search?keyword=test&limit=10', '/api/kawader/123456'];

console.log('🔍 KWD Performance Probe');
console.log(`Base URL: ${baseUrl}`);
console.log(`Endpoints: ${endpoints.join(', ')}\n`);

const results = {
  timestamp: new Date().toISOString(),
  base_url: baseUrl,
  endpoints: {},
};

async function probeEndpoint(endpoint) {
  const url = new URL(endpoint, baseUrl);
  const client = url.protocol === 'https:' ? https : http;
  const times = [];

  console.log(`📊 Probing ${endpoint}...`);

  // Run 10 requests
  for (let i = 0; i < 10; i++) {
    const startTime = Date.now();
    try {
      await new Promise((resolve, reject) => {
        const req = client.request(url, { method: 'GET', timeout: 5000 }, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            const duration = Date.now() - startTime;
            times.push(duration);
            resolve();
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });

        req.end();
      });

      await new Promise((resolve) => setTimeout(resolve, 100)); // Small delay between requests
    } catch (error) {
      console.error(`  ⚠️  Request ${i + 1} failed: ${error.message}`);
    }
  }

  if (times.length === 0) {
    return null;
  }

  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)];
  const p75 = times[Math.floor(times.length * 0.75)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const min = times[0];
  const max = times[times.length - 1];

  return {
    endpoint,
    requests: times.length,
    p50,
    p75,
    p95,
    p99,
    avg: Math.round(avg),
    min,
    max,
    all_times: times,
  };
}

async function run() {
  for (const endpoint of endpoints) {
    const result = await probeEndpoint(endpoint);
    if (result) {
      results.endpoints[endpoint] = result;
      console.log(
        `  ✅ P50: ${result.p50}ms, P75: ${result.p75}ms, P95: ${result.p95}ms, Avg: ${result.avg}ms\n`,
      );
    } else {
      console.log(`  ❌ Failed to probe endpoint\n`);
    }
  }

  // Calculate overall stats
  const allP75 = Object.values(results.endpoints)
    .map((r) => r.p75)
    .filter(Boolean);
  const maxP75 = allP75.length > 0 ? Math.max(...allP75) : 0;

  results.overall = {
    max_p75: maxP75,
    threshold: 150,
    status: maxP75 <= 150 ? 'PASS' : 'FAIL',
  };

  // Output JSON
  console.log('\n📊 Results:');
  console.log(JSON.stringify(results, null, 2));

  // Save to file
  const fs = require('fs');
  const path = require('path');
  const outputPath = path.join(__dirname, '../../dist/kwd/RUNTIME_PROBE.json');
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n✅ Results saved to: ${outputPath}`);

  // Exit with appropriate code
  process.exit(results.overall.status === 'PASS' ? 0 : 1);
}

run().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});

