#!/usr/bin/env node

const http = require('node:http');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const results = {
  timestamp: new Date().toISOString(),
  probes: [],
};

function probe(endpoint, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL(endpoint, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const start = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const duration = Date.now() - start;
        resolve({
          endpoint,
          method,
          status: res.statusCode,
          duration_ms: duration,
          success: res.statusCode >= 200 && res.statusCode < 300,
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        endpoint,
        method,
        error: error.message,
        success: false,
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runProbes() {
  results.probes.push(await probe('/esf/health/live'));
  results.probes.push(await probe('/esf/health/ready'));
  results.probes.push(await probe('/esf/requests?limit=10'));

  const durations = results.probes
    .filter((p) => p.duration_ms)
    .map((p) => p.duration_ms)
    .sort((a, b) => a - b);

  if (durations.length > 0) {
    const p75Index = Math.floor(durations.length * 0.75);
    results.summary = {
      total_probes: results.probes.length,
      successful: results.probes.filter((p) => p.success).length,
      p75_duration_ms: durations[p75Index] || durations[durations.length - 1],
      max_duration_ms: durations[durations.length - 1],
      min_duration_ms: durations[0],
    };
  }

  console.log(JSON.stringify(results, null, 2));
}

runProbes().catch((error) => {
  console.log(JSON.stringify({ error: error.message }, null, 2));
  process.exit(1);
});

