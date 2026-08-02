const http = require('http');

function request(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
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
    req.end();
  });
}

async function runManagerTests() {
  console.log('🧪 Starting Phase 10 Priority 3 Manager Portal Verification...\n');
  let passed = 0;
  let total = 0;

  const managerHeaders = {
    'x-user-id': 'EMP-002',
    'x-user-role': 'Lead Director & Cinematographer',
    'x-user-access': 'Manager / Director',
    'x-user-name': 'Farhan Ahmed'
  };

  // 1. GET /manager portal HTML
  total++;
  try {
    const res = await request('/manager');
    if (res.status === 200 && typeof res.raw === 'string' && res.raw.includes('PurpleOS — Department Manager Portal')) {
      console.log('✅ Test 1 Passed: GET /manager returned 200 OK with valid portal HTML');
      passed++;
    } else {
      console.error('❌ Test 1 Failed:', res.status);
    }
  } catch (e) { console.error('❌ Test 1 Exception:', e.message); }

  // 2. GET /api/clients for dropdown population
  total++;
  try {
    const res = await request('/api/clients', managerHeaders);
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`✅ Test 2 Passed: GET /api/clients returned ${res.body.length} records for dynamic dropdown binding`);
      passed++;
    } else {
      console.error('❌ Test 2 Failed:', res);
    }
  } catch (e) { console.error('❌ Test 2 Exception:', e.message); }

  // 3. GET /api/team for assignee dropdown population
  total++;
  try {
    const res = await request('/api/team', managerHeaders);
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`✅ Test 3 Passed: GET /api/team returned ${res.body.length} staff records for assignee select`);
      passed++;
    } else {
      console.error('❌ Test 3 Failed:', res);
    }
  } catch (e) { console.error('❌ Test 3 Exception:', e.message); }

  // 4. GET /api/tasks for Kanban board
  total++;
  try {
    const res = await request('/api/tasks', managerHeaders);
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`✅ Test 4 Passed: GET /api/tasks returned ${res.body.length} tasks for Kanban board rendering`);
      passed++;
    } else {
      console.error('❌ Test 4 Failed:', res);
    }
  } catch (e) { console.error('❌ Test 4 Exception:', e.message); }

  console.log(`\n📊 MANAGER PORTAL VERIFICATION RESULTS: ${passed}/${total} PASSED (${Math.round(passed/total*100)}%)`);
}

runManagerTests();
