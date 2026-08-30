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

async function runTeamTests() {
  console.log('🧪 Starting Phase 10 Priority 4 Team Portal Verification...\n');
  let passed = 0;
  let total = 0;

  const crewHeaders = {
    'x-user-id': 'EMP-002',
    'x-user-role': 'Lead Director & Cinematographer',
    'x-user-access': 'Specialist / Crew',
    'x-user-name': 'Farhan Ahmed'
  };

  // 1. GET /team portal HTML
  total++;
  try {
    const res = await request('/team');
    if (res.status === 200 && typeof res.raw === 'string' && (res.raw.includes('GRO10X') || res.raw.includes('Crew Operations'))) {
      console.log('✅ Test 1 Passed: GET /team returned 200 OK with valid portal HTML');
      passed++;
    } else {
      console.error('❌ Test 1 Failed:', res.status);
    }
  } catch (e) { console.error('❌ Test 1 Exception:', e.message); }

  // 2. GET /api/team for salary & commission rendering
  total++;
  try {
    const res = await request('/api/team', crewHeaders);
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`✅ Test 2 Passed: GET /api/team returned ${res.body.length} employee records for pay binding`);
      passed++;
    } else {
      console.error('❌ Test 2 Failed:', res);
    }
  } catch (e) { console.error('❌ Test 2 Exception:', e.message); }

  // 3. GET /api/tasks for assigned crew task list
  total++;
  try {
    const res = await request('/api/tasks', crewHeaders);
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`✅ Test 3 Passed: GET /api/tasks returned ${res.body.length} task objects for crew assignment filtering`);
      passed++;
    } else {
      console.error('❌ Test 3 Failed:', res);
    }
  } catch (e) { console.error('❌ Test 3 Exception:', e.message); }

  // 4. GET /api/team/attendance for clock-in status
  total++;
  try {
    const res = await request('/api/team/attendance', crewHeaders);
    if (res.status === 200 && Array.isArray(res.body)) {
      console.log(`✅ Test 4 Passed: GET /api/team/attendance returned ${res.body.length} attendance logs`);
      passed++;
    } else {
      console.error('❌ Test 4 Failed:', res);
    }
  } catch (e) { console.error('❌ Test 4 Exception:', e.message); }

  console.log(`\n📊 TEAM PORTAL VERIFICATION RESULTS: ${passed}/${total} PASSED (${Math.round(passed/total*100)}%)`);
}

runTeamTests();
