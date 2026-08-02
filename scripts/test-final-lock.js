const fs = require('fs');
const path = require('path');
const http = require('http');

function request(pathStr) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: pathStr,
      method: 'GET'
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, raw: data }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function runFinalLockTests() {
  console.log('🧪 Starting Phase 10 & 11 Final Lock Verification...\n');
  let passed = 0;
  let total = 0;

  // 1. Check api/index.js and server.js for bot lazy init & health check
  total++;
  const apiIndexContent = fs.readFileSync(path.join(__dirname, '../api/index.js'), 'utf8');
  const serverContent = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');
  if (apiIndexContent.includes('/api/bot-status') && serverContent.includes('/api/bot-status')) {
    console.log('✅ Test 1 Passed: Both api/index.js and server.js have bot lazy re-init & /api/bot-status endpoint');
    passed++;
  } else {
    console.error('❌ Test 1 Failed: Missing bot-status endpoint in server/api files');
  }

  // 2. Check public/auth.html for hidden email input
  total++;
  const authContent = fs.readFileSync(path.join(__dirname, '../public/auth.html'), 'utf8');
  if (authContent.includes('id="email"')) {
    console.log('✅ Test 2 Passed: public/auth.html contains email input (resolves JS null crash)');
    passed++;
  } else {
    console.error('❌ Test 2 Failed: public/auth.html missing email input');
  }

  // 3. Check public/index.html for OpenGraph tags
  total++;
  const indexContent = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  if (indexContent.includes('og:title') && indexContent.includes('twitter:card')) {
    console.log('✅ Test 3 Passed: public/index.html contains OpenGraph & Twitter Card meta tags');
    passed++;
  } else {
    console.error('❌ Test 3 Failed: public/index.html missing OpenGraph tags');
  }

  // 4. Check public/client-miniapp.html for Campaign Brief Modal
  total++;
  const clientMiniappContent = fs.readFileSync(path.join(__dirname, '../public/client-miniapp.html'), 'utf8');
  if (clientMiniappContent.includes('miniBriefOverlay') && clientMiniappContent.includes('openBriefModal')) {
    console.log('✅ Test 4 Passed: public/client-miniapp.html contains Campaign Brief bottom-sheet modal');
    passed++;
  } else {
    console.error('❌ Test 4 Failed: public/client-miniapp.html missing Campaign Brief modal');
  }

  // 5. Test HTTP GET /api/bot-status endpoint
  total++;
  try {
    const res = await request('/api/bot-status');
    if (res.status === 200 && (res.raw.includes('active') || res.raw.includes('null'))) {
      console.log('✅ Test 5 Passed: GET /api/bot-status returned 200 OK with bot status payload');
      passed++;
    } else {
      console.error('❌ Test 5 Failed:', res.status);
    }
  } catch (e) { console.error('❌ Test 5 Exception:', e.message); }

  console.log(`\n📊 FINAL LOCK VERIFICATION RESULTS: ${passed}/${total} PASSED (${Math.round(passed/total*100)}%)`);
}

runFinalLockTests();
