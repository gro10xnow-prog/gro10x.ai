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
  console.log('🧪 Starting Phase C HR Operations Suite Verification...\n');
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

  // TEST 2: GET /api/leaves
  total++;
  try {
    const leaves = await request('GET', '/api/leaves');
    if (leaves.status === 200 && Array.isArray(leaves.body) && leaves.body.length > 0) {
      console.log(`✅ Test 2 Passed: Retrieved ${leaves.body.length} Leave Records`);
      passed++;
    } else {
      console.error('❌ Test 2 Failed:', leaves);
    }
  } catch (err) {
    console.error('❌ Test 2 Failed Exception:', err.message);
  }

  // TEST 3: Submit Leave Request & Approve (Triggers AUT-011)
  total++;
  let newLeaveId = null;
  try {
    const createRes = await request('POST', '/api/leaves', {
      staffId: 'EMP-003',
      staffName: 'Raihan Kabir',
      type: 'Casual Leave',
      startDate: '2026-08-05',
      endDate: '2026-08-06',
      totalDays: 2,
      reason: 'Automated test leave request'
    });

    if (createRes.status === 200 && createRes.body.success && createRes.body.leave) {
      newLeaveId = createRes.body.leave.id;
      const approveRes = await request('POST', `/api/leaves/${newLeaveId}/approve`, {
        reviewedBy: 'Mahmudul Hasan (Director)'
      });

      if (approveRes.status === 200 && approveRes.body.success && approveRes.body.leave.status === 'Approved') {
        console.log(`✅ Test 3 Passed: Submitted & Approved Leave ${newLeaveId} (Status: Approved, Triggered AUT-011)`);
        passed++;
      } else {
        console.error('❌ Test 3 Failed Approval:', approveRes);
      }
    } else {
      console.error('❌ Test 3 Failed Create:', createRes);
    }
  } catch (err) {
    console.error('❌ Test 3 Failed Exception:', err.message);
  }

  // TEST 4: Submit Daily EOD Report
  total++;
  try {
    const eodRes = await request('POST', '/api/eod', {
      staffId: 'EMP-002',
      staffName: 'Farhan Ahmed (Lead Director)',
      date: new Date().toISOString().split('T')[0],
      tasksCompleted: 'Completed 4K outdoor shoot for Chillox',
      tasksInProgress: 'Review room cut preparation',
      blockers: 'None'
    });

    if (eodRes.status === 200 && eodRes.body.success && eodRes.body.report) {
      console.log(`✅ Test 4 Passed: Logged Daily EOD Report ${eodRes.body.report.id} for ${eodRes.body.report.staffName}`);
      passed++;
    } else {
      console.error('❌ Test 4 Failed:', eodRes);
    }
  } catch (err) {
    console.error('❌ Test 4 Failed Exception:', err.message);
  }

  // TEST 5: Trigger 7:00 PM Daily EOD Telegram Prompt (AUT-012)
  total++;
  try {
    const promptRes = await request('POST', '/api/eod/trigger-prompt');
    if (promptRes.status === 200 && promptRes.body.success) {
      console.log(`✅ Test 5 Passed: 7:00 PM Daily EOD Telegram Prompt Triggered (AUT-012)`);
      passed++;
    } else {
      console.error('❌ Test 5 Failed:', promptRes);
    }
  } catch (err) {
    console.error('❌ Test 5 Failed Exception:', err.message);
  }

  // TEST 6: Support Ticket Lifecycle (Create & Resolve) (Triggers AUT-013)
  total++;
  try {
    const tktCreate = await request('POST', '/api/tickets', {
      category: 'Equipment Repair',
      title: 'Studio Lighting Softbox Cable Replacement',
      description: 'Secondary softbox cable worn out during shoot',
      urgency: 'Medium',
      loggedBy: 'Farhan Ahmed'
    });

    if (tktCreate.status === 200 && tktCreate.body.success && tktCreate.body.ticket) {
      const ticketId = tktCreate.body.ticket.id;
      const tktResolve = await request('PUT', `/api/tickets/${ticketId}`, {
        status: 'Resolved',
        resolvedBy: 'Maintenance Lead'
      });

      if (tktResolve.status === 200 && tktResolve.body.success && tktResolve.body.ticket.status === 'Resolved') {
        console.log(`✅ Test 6 Passed: Support Ticket ${ticketId} Created & Resolved (Triggered AUT-013 Alert)`);
        passed++;
      } else {
        console.error('❌ Test 6 Failed Resolve:', tktResolve);
      }
    } else {
      console.error('❌ Test 6 Failed Create:', tktCreate);
    }
  } catch (err) {
    console.error('❌ Test 6 Failed Exception:', err.message);
  }

  console.log(`\n📊 PHASE C TEST RESULTS: ${passed}/${total} PASSED (${Math.round(passed/total*100)}%)`);
  if (passed === total) {
    console.log('🎉 PHASE C HR OPERATIONS SUITE FULLY VERIFIED AND OPERATIONAL!');
  } else {
    process.exit(1);
  }
}

runTests();
