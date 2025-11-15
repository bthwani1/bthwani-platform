#!/usr/bin/env node

const http = require('node:http');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { base: 'http://127.0.0.1:4420', endpoints: [] };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base' && args[i + 1]) {
      result.base = args[i + 1];
      i++;
    } else if (args[i] === '--endpoints' && args[i + 1]) {
      result.endpoints.push(args[i + 1]);
      i++;
    }
  }
  
  return result;
}

const { base, endpoints } = parseArgs();
const results = {
  timestamp: new Date().toISOString(),
  service: 'arb',
  base_url: base,
  probes: [],
};

function probe(endpoint, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve) => {
    const url = new URL(endpoint, base);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      timeout: 5000,
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
          success: res.statusCode >= 200 && res.statusCode < 500,
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

    req.on('timeout', () => {
      req.destroy();
      resolve({
        endpoint,
        method,
        error: 'Request timeout',
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
  const defaultEndpoints = [
    '/api/arb/offers?limit=10',
    '/api/arb/bookings',
    '/api/arb/bookings/TEST123',
    '/api/arb/bookings/TEST123/chat/messages',
  ];

  const endpointsToTest = endpoints.length > 0 ? endpoints : defaultEndpoints;

  for (const endpoint of endpointsToTest) {
    results.probes.push(await probe(endpoint));
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const durations = results.probes
    .filter((p) => p.duration_ms)
    .map((p) => p.duration_ms)
    .sort((a, b) => a - b);

  if (durations.length > 0) {
    const p50Index = Math.floor(durations.length * 0.5);
    const p75Index = Math.floor(durations.length * 0.75);
    const p90Index = Math.floor(durations.length * 0.9);
    
    results.summary = {
      total_probes: results.probes.length,
      successful: results.probes.filter((p) => p.success).length,
      failed: results.probes.filter((p) => !p.success).length,
      p50_duration_ms: durations[p50Index] || durations[durations.length - 1],
      p75_duration_ms: durations[p75Index] || durations[durations.length - 1],
      p90_duration_ms: durations[p90Index] || durations[durations.length - 1],
      max_duration_ms: durations[durations.length - 1],
      min_duration_ms: durations[0],
      p75_threshold_ms: 150,
      p75_pass: (durations[p75Index] || durations[durations.length - 1]) <= 150,
    };
  }

  console.log(JSON.stringify(results, null, 2));
}

runProbes().catch((error) => {
  console.log(JSON.stringify({ error: error.message }, null, 2));
  process.exit(1);
});
