const http = require('http');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const method = options.method || 'GET';
    const payload = options.body ? JSON.stringify(options.body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(options.headers || {})
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runPartnerTests() {
  console.log('🧪 Starting Phase 10 Priority 5 Client/Partner Portal Verification...\n');
  let passed = 0;
  let total = 0;

  const clientHeaders = {
    'x-user-id': 'CLI-0001',
    'x-user-role': 'Client',
    'x-user-name': 'Chillox Fast Food Chain',
    'x-user-linked-type': 'client'
  };

  // 1. GET /partners portal HTML
  total++;
  try {
    const res = await request('/partners');
    if (res.status === 200 && typeof res.raw === 'string' && (res.raw.includes('GRO10X') || res.raw.includes('Partner Workspace'))) {
      console.log('✅ Test 1 Passed: GET /partners returned 200 OK with valid portal HTML');
      passed++;
    } else {
      console.error('❌ Test 1 Failed:', res.status);
    }
  } catch (e) { console.error('❌ Test 1 Exception:', e.message); }

  // 2. POST /api/tasks (Submit Campaign Brief)
  total++;
  try {
    const res = await request('/api/tasks', {
      method: 'POST',
      headers: clientHeaders,
      body: {
        title: '[Brief] Autumn Fast Food TVC Commercial',
        client: 'Chillox Fast Food Chain',
        category: 'TVC & Commercial Video',
        stage: 'Briefing',
        priority: 'High',
        department: 'Client Services',
        description: 'Budget: BDT 2,50,000\nNotes: High tempo commercial reel for TV & YouTube'
      }
    });
    if (res.status === 200 && res.body && res.body.success) {
      console.log(`✅ Test 2 Passed: POST /api/tasks successfully submitted Campaign Brief (Task ID: ${res.body.task?.id || 'Created'})`);
      passed++;
    } else {
      console.error('❌ Test 2 Failed:', res);
    }
  } catch (e) { console.error('❌ Test 2 Exception:', e.message); }

  // 3. POST /api/invoices/INV-2026-001/pay (Payment Verification)
  total++;
  try {
    const res = await request('/api/invoices/INV-2026-001/pay', {
      method: 'POST',
      headers: clientHeaders,
      body: {
        method: 'bKash Direct Merchant (+8801708-459008)',
        trxId: 'TRX98401948',
        payerName: 'Chillox Fast Food Chain'
      }
    });
    if (res.status === 200 && res.body && res.body.success) {
      console.log('✅ Test 3 Passed: POST /api/invoices/INV-2026-001/pay verified payment TrxID');
      passed++;
    } else {
      console.error('❌ Test 3 Failed:', res);
    }
  } catch (e) { console.error('❌ Test 3 Exception:', e.message); }

  console.log(`\n📊 CLIENT PORTAL VERIFICATION RESULTS: ${passed}/${total} PASSED (${Math.round(passed/total*100)}%)`);
}

runPartnerTests();
