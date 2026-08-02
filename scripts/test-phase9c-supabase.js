const http = require('http');

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': 'PBD-001',
        'x-user-role': 'Admin',
        'x-user-name': 'Test Admin',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    }, res => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resData) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Phase 9C Supabase Migration & Endpoint Verification Suite...\n');
  let passed = 0;
  let total = 0;

  // 1. GET /api/tasks
  total++;
  try {
    const res = await request('GET', '/api/tasks');
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`✅ Test 1 Passed: GET /api/tasks returned ${res.body.length} records from Supabase`);
      passed++;
    } else {
      console.error('❌ Test 1 Failed:', res);
    }
  } catch (e) { console.error('❌ Test 1 Failed Exception:', e.message); }

  // 2. GET /api/expenses
  total++;
  try {
    const res = await request('GET', '/api/expenses');
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`✅ Test 2 Passed: GET /api/expenses returned ${res.body.length} records from Supabase`);
      passed++;
    } else {
      console.error('❌ Test 2 Failed:', res);
    }
  } catch (e) { console.error('❌ Test 2 Failed Exception:', e.message); }

  // 3. GET /api/posts
  total++;
  try {
    const res = await request('GET', '/api/posts');
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`✅ Test 3 Passed: GET /api/posts returned ${res.body.length} records from Supabase`);
      passed++;
    } else {
      console.error('❌ Test 3 Failed:', res);
    }
  } catch (e) { console.error('❌ Test 3 Failed Exception:', e.message); }

  // 4. GET /api/team
  total++;
  try {
    const res = await request('GET', '/api/team');
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`✅ Test 4 Passed: GET /api/team returned ${res.body.length} records from Supabase (Profiles)`);
      passed++;
    } else {
      console.error('❌ Test 4 Failed:', res);
    }
  } catch (e) { console.error('❌ Test 4 Failed Exception:', e.message); }

  // 5. GET /api/invoices
  total++;
  try {
    const res = await request('GET', '/api/invoices');
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`✅ Test 5 Passed: GET /api/invoices returned ${res.body.length} records from Supabase`);
      passed++;
    } else {
      console.error('❌ Test 5 Failed:', res);
    }
  } catch (e) { console.error('❌ Test 5 Failed Exception:', e.message); }

  // 6. GET /api/reviews
  total++;
  try {
    const res = await request('GET', '/api/reviews');
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`✅ Test 6 Passed: GET /api/reviews returned ${res.body.length} records from Supabase`);
      passed++;
    } else {
      console.error('❌ Test 6 Failed:', res);
    }
  } catch (e) { console.error('❌ Test 6 Failed Exception:', e.message); }

  // 7. GET /api/assets
  total++;
  try {
    const res = await request('GET', '/api/assets');
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`✅ Test 7 Passed: GET /api/assets returned ${res.body.length} records from Supabase`);
      passed++;
    } else {
      console.error('❌ Test 7 Failed:', res);
    }
  } catch (e) { console.error('❌ Test 7 Failed Exception:', e.message); }

  console.log(`\n📊 PHASE 9C VERIFICATION RESULTS: ${passed}/${total} PASSED (${Math.round(passed/total*100)}%)`);
}

runTests();
