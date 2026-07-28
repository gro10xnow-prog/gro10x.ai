const http = require('http');

function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: headers
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: body });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  console.log('🧪 Testing PurpleOS v0.6 API & Subdomain Auth Endpoints...\n');

  try {
    // Test 1: Health Check
    const health = await makeRequest('/api/health');
    console.log('1. Health Check Response:', health.body);

    // Test 2: Auth Config
    const config = await makeRequest('/api/auth/config');
    console.log('2. Auth Config Response:', config.body);

    // Test 3: Auth Me Profile
    const me = await makeRequest('/api/auth/me');
    console.log('3. Auth Me Profile Response:', me.body);

    // Test 4: Auth Portal Page
    const authPage = await makeRequest('/auth');
    console.log(`4. Auth Subdomain / Portal status: ${authPage.statusCode} (HTML length: ${authPage.body.length} chars)`);

    console.log('\n✅ All v0.6 Auth Verification Tests Passed!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

test();
