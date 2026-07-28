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
  console.log('🧪 Starting Phase A Social Dispatch Verification Suite...\n');
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

  // TEST 2: GET /api/posts
  total++;
  try {
    const posts = await request('GET', '/api/posts');
    if (posts.status === 200 && Array.isArray(posts.body) && posts.body.length > 0) {
      console.log(`✅ Test 2 Passed: Retrieved ${posts.body.length} Social Posts`);
      passed++;
    } else {
      console.error('❌ Test 2 Failed:', posts);
    }
  } catch (err) {
    console.error('❌ Test 2 Failed Exception:', err.message);
  }

  // TEST 3: Create New Social Post with CRM Link Auto-Population
  total++;
  let newPostId = null;
  try {
    const createRes = await request('POST', '/api/posts', {
      clientId: 'CLT-001',
      clientName: 'Chillox Fast Food Chain',
      platform: 'Facebook',
      title: 'Automated Test Burger Promo',
      caption: 'Delicious burgers hot off the grill! 🔥 #ChilloxTest',
      scheduledDate: '2026-07-30',
      scheduledTime: '18:00',
      assignedPublisher: 'Sabrin Akhtar',
      status: 'Pending Client Approval'
    });

    if (createRes.status === 200 && createRes.body.success && createRes.body.post) {
      newPostId = createRes.body.post.id;
      const targetUrl = createRes.body.post.targetUrl;
      console.log(`✅ Test 3 Passed: Created Post ${newPostId} with Auto CRM Target URL: "${targetUrl}"`);
      passed++;
    } else {
      console.error('❌ Test 3 Failed:', createRes);
    }
  } catch (err) {
    console.error('❌ Test 3 Failed Exception:', err.message);
  }

  // TEST 4: Client Approves Post (Triggers AUT-006)
  total++;
  if (newPostId) {
    try {
      const approveRes = await request('POST', `/api/posts/${newPostId}/approve`, {
        approvedBy: 'Chillox Brand Director'
      });
      if (approveRes.status === 200 && approveRes.body.success && approveRes.body.post.status === 'Approved') {
        console.log(`✅ Test 4 Passed: Client Approved Post ${newPostId} (Status: Approved, Triggered AUT-006)`);
        passed++;
      } else {
        console.error('❌ Test 4 Failed:', approveRes);
      }
    } catch (err) {
      console.error('❌ Test 4 Failed Exception:', err.message);
    }
  }

  // TEST 5: Trigger 1-Click Dispatch Alert (Triggers AUT-007)
  total++;
  if (newPostId) {
    try {
      const alertRes = await request('POST', `/api/posts/${newPostId}/dispatch-alert`);
      if (alertRes.status === 200 && alertRes.body.success) {
        console.log(`✅ Test 5 Passed: 1-Click Dispatch Telegram Push Triggered (AUT-007)`);
        passed++;
      } else {
        console.error('❌ Test 5 Failed:', alertRes);
      }
    } catch (err) {
      console.error('❌ Test 5 Failed Exception:', err.message);
    }
  }

  // TEST 6: Mark Post as Published
  total++;
  if (newPostId) {
    try {
      const pubRes = await request('POST', `/api/posts/${newPostId}/publish`, {
        publishedBy: 'Sabrin Akhtar'
      });
      if (pubRes.status === 200 && pubRes.body.success && pubRes.body.post.status === 'Published') {
        console.log(`✅ Test 6 Passed: Marked Post ${newPostId} as PUBLISHED`);
        passed++;
      } else {
        console.error('❌ Test 6 Failed:', pubRes);
      }
    } catch (err) {
      console.error('❌ Test 6 Failed Exception:', err.message);
    }
  }

  console.log(`\n📊 PHASE A TEST RESULTS: ${passed}/${total} PASSED (${Math.round(passed/total*100)}%)`);
  if (passed === total) {
    console.log('🎉 PHASE A SOCIAL DISPATCH HUB FULLY VERIFIED AND OPERATIONAL!');
  } else {
    process.exit(1);
  }
}

runTests();
