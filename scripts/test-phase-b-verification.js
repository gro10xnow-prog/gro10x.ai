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
  console.log('🧪 Starting Phase B 3-Tier Expense Approval Verification Suite...\n');
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

  // TEST 2: GET /api/expenses
  total++;
  try {
    const expenses = await request('GET', '/api/expenses');
    if (expenses.status === 200 && Array.isArray(expenses.body) && expenses.body.length > 0) {
      console.log(`✅ Test 2 Passed: Retrieved ${expenses.body.length} Expense Records`);
      passed++;
    } else {
      console.error('❌ Test 2 Failed:', expenses);
    }
  } catch (err) {
    console.error('❌ Test 2 Failed Exception:', err.message);
  }

  // TEST 3: Submit New Ground Expense Claim
  total++;
  let newExpId = null;
  try {
    const createRes = await request('POST', '/api/expenses', {
      submittedBy: 'Test Crew Member (Assistant Photographer)',
      submittedById: 'EMP-007',
      category: 'Fuel / Transport',
      amount: 2500,
      description: 'Highway toll & taxi fare for outdoor brand shoot',
      receiptUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80'
    });

    if (createRes.status === 200 && createRes.body.success && createRes.body.expense) {
      newExpId = createRes.body.expense.id;
      const status = createRes.body.expense.status;
      console.log(`✅ Test 3 Passed: Logged Expense Claim ${newExpId} (Status: ${status})`);
      passed++;
    } else {
      console.error('❌ Test 3 Failed:', createRes);
    }
  } catch (err) {
    console.error('❌ Test 3 Failed Exception:', err.message);
  }

  // TEST 4: Tier 1 Line Manager Approval (Triggers AUT-008)
  total++;
  if (newExpId) {
    try {
      const t1Res = await request('POST', `/api/expenses/${newExpId}/approve-tier1`, {
        approvedBy: 'Farhan Ahmed (Lead Director)'
      });
      if (t1Res.status === 200 && t1Res.body.success && t1Res.body.expense.status === 'Tier 2 Pending') {
        console.log(`✅ Test 4 Passed: Tier 1 Manager Approval Complete for ${newExpId} (Next: Tier 2 Pending, Triggered AUT-008)`);
        passed++;
      } else {
        console.error('❌ Test 4 Failed:', t1Res);
      }
    } catch (err) {
      console.error('❌ Test 4 Failed Exception:', err.message);
    }
  }

  // TEST 5: Tier 2 Finance Lead Verification (Triggers AUT-009)
  total++;
  if (newExpId) {
    try {
      const t2Res = await request('POST', `/api/expenses/${newExpId}/approve-tier2`, {
        approvedBy: 'Accounts Lead'
      });
      if (t2Res.status === 200 && t2Res.body.success && t2Res.body.expense.status === 'Tier 3 Pending') {
        console.log(`✅ Test 5 Passed: Tier 2 Finance Verification Complete for ${newExpId} (Next: Tier 3 Pending, Triggered AUT-009)`);
        passed++;
      } else {
        console.error('❌ Test 5 Failed:', t2Res);
      }
    } catch (err) {
      console.error('❌ Test 5 Failed Exception:', err.message);
    }
  }

  // TEST 6: Tier 3 Owner Final Disbursement Release (Triggers AUT-010)
  total++;
  if (newExpId) {
    try {
      const t3Res = await request('POST', `/api/expenses/${newExpId}/approve-tier3`, {
        approvedBy: 'Mahmudul Hasan (Owner)'
      });
      if (t3Res.status === 200 && t3Res.body.success && t3Res.body.expense.status === 'Disbursed') {
        console.log(`✅ Test 6 Passed: Tier 3 Owner Disbursement Released for ${newExpId} (Final Status: Disbursed, Triggered AUT-010)`);
        passed++;
      } else {
        console.error('❌ Test 6 Failed:', t3Res);
      }
    } catch (err) {
      console.error('❌ Test 6 Failed Exception:', err.message);
    }
  }

  console.log(`\n📊 PHASE B TEST RESULTS: ${passed}/${total} PASSED (${Math.round(passed/total*100)}%)`);
  if (passed === total) {
    console.log('🎉 PHASE B 3-TIER EXPENSE ENGINE FULLY VERIFIED AND OPERATIONAL!');
  } else {
    process.exit(1);
  }
}

runTests();
