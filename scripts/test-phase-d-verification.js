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
  console.log('🧪 Starting Phase D Leadership Intelligence & Broadcast Verification Suite...\n');
  let passed = 0;
  let total = 0;

  // TEST 1: Health check
  total++;
  try {
    const health = await request('GET', '/api/health');
    if (health.status === 200 && health.body.status === 'ok') {
      console.log('✅ Test 1 Passed: System Health OK');
      passed++;
    } else {
      console.error('❌ Test 1 Failed:', health);
    }
  } catch (err) {
    console.error('❌ Test 1 Failed Exception:', err.message);
  }

  // TEST 2: 9:00 AM Morning Executive Briefing (AUT-014)
  total++;
  try {
    const morningRes = await request('POST', '/api/reports/morning');
    if (morningRes.status === 200 && morningRes.body.success) {
      console.log('✅ Test 2 Passed: 9:00 AM Morning Executive Briefing Dispatched (Triggered AUT-014)');
      passed++;
    } else {
      console.error('❌ Test 2 Failed:', morningRes);
    }
  } catch (err) {
    console.error('❌ Test 2 Failed Exception:', err.message);
  }

  // TEST 3: 8:30 PM Evening Executive Digest (AUT-015)
  total++;
  try {
    const eveningRes = await request('POST', '/api/reports/evening');
    if (eveningRes.status === 200 && eveningRes.body.success) {
      console.log('✅ Test 3 Passed: 8:30 PM Evening Executive Digest Dispatched (Triggered AUT-015)');
      passed++;
    } else {
      console.error('❌ Test 3 Failed:', eveningRes);
    }
  } catch (err) {
    console.error('❌ Test 3 Failed Exception:', err.message);
  }

  // TEST 4: Weekly Executive KPI Summary (AUT-016)
  total++;
  try {
    const weeklyRes = await request('POST', '/api/reports/weekly');
    if (weeklyRes.status === 200 && weeklyRes.body.success) {
      console.log('✅ Test 4 Passed: Weekly Executive KPI Summary Dispatched (Triggered AUT-016)');
      passed++;
    } else {
      console.error('❌ Test 4 Failed:', weeklyRes);
    }
  } catch (err) {
    console.error('❌ Test 4 Failed Exception:', err.message);
  }

  // TEST 5: Team Broadcast Announcement Engine (AUT-017)
  total++;
  try {
    const bcRes = await request('POST', '/api/broadcast', {
      title: 'Studio B Shoot Call & Production Schedule Change',
      message: 'All crew please report to Studio B at 3:00 PM for pre-shoot lighting check.',
      targetGroup: 'All Staff & Groups',
      senderName: 'Mahmudul Hasan (Owner)',
      urgent: true
    });
    if (bcRes.status === 200 && bcRes.body.success) {
      console.log('✅ Test 5 Passed: Web Team Broadcast Notice Dispatched to Staff & Telegram Groups (Triggered AUT-017)');
      passed++;
    } else {
      console.error('❌ Test 5 Failed:', bcRes);
    }
  } catch (err) {
    console.error('❌ Test 5 Failed Exception:', err.message);
  }

  // TEST 6: Specialist Personal Daily Task Briefings (AUT-018)
  total++;
  try {
    const specRes = await request('POST', '/api/reports/specialist-briefing');
    if (specRes.status === 200 && specRes.body.success) {
      console.log('✅ Test 6 Passed: 9:00 AM Specialist Daily Task Briefings Dispatched (Triggered AUT-018)');
      passed++;
    } else {
      console.error('❌ Test 6 Failed:', specRes);
    }
  } catch (err) {
    console.error('❌ Test 6 Failed Exception:', err.message);
  }

  console.log(`\n📊 PHASE D TEST RESULTS: ${passed}/${total} PASSED (${Math.round(passed/total*100)}%)`);
  if (passed === total) {
    console.log('🎉 PHASE D LEADERSHIP INTELLIGENCE & BROADCAST ENGINE FULLY VERIFIED AND OPERATIONAL!');
  } else {
    process.exit(1);
  }
}

runTests();
