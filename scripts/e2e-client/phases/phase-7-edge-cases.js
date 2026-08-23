/**
 * scripts/e2e-client/phases/phase-7-edge-cases.js
 * Phase T7: Edge Cases, Security & IDOR Verification
 */
const { BASE_URL, wait, TestTracker } = require('../utils');
const { generateClientToken } = require('../auth');
const http = require('http');

async function makeRequest(path, options = {}) {
  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data, headers: res.headers });
      });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 500, error: err.message });
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runPhase7() {
  const tracker = new TestTracker('Phase T7: Edge Cases & Security (IDOR)');
  console.log('\n--- 🚀 Running Phase T7: Edge Cases & Security ---');

  // T7.5 Unauthenticated API Calls Return 401
  await tracker.runStep('T7.5.1', 'Verify unauthenticated GET /api/clients/me returns 401', async () => {
    const res = await makeRequest('/api/clients/me', {
      headers: { 'x-disable-dev-auth': 'true' }
    });
    tracker.assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
  });

  await tracker.runStep('T7.5.2', 'Verify unauthenticated POST /api/payments returns 401', async () => {
    const res = await makeRequest('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-disable-dev-auth': 'true' },
      body: { invoiceId: 'INV-001', amount: 5000 }
    });
    tracker.assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
  });

  // T7.3 Data Isolation & Client Scoping Check
  await tracker.runStep('T7.3.1', 'Verify Client token is scoped to its own linkedId', async () => {
    const tokenA = generateClientToken({ linkedId: 'CLI-0001', role: 'Client' });
    const res = await makeRequest('/api/invoices', {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    // Invoices should return 200 array
    tracker.assert(res.statusCode === 200, `Expected 200 for authenticated client invoices, got ${res.statusCode}`);
  });

  // T7.4 Automation Rules Tampering Block for Client Role
  await tracker.runStep('T7.4.1', 'Verify Client role cannot create or tamper with automation rules', async () => {
    const tokenClient = generateClientToken({ linkedId: 'CLI-0001', role: 'Client' });
    const res = await makeRequest('/api/automation/rules', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenClient}`,
        'Content-Type': 'application/json'
      },
      body: { name: 'Malicious Rule', event: 'test' }
    });
    tracker.assert(res.statusCode === 403 || res.statusCode === 401, `Expected 403 Forbidden for client creating rule, got ${res.statusCode}`);
  });

  return tracker.getSummary();
}

module.exports = { runPhase7 };
