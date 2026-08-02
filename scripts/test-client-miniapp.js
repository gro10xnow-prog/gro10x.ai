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

async function runClientMiniAppTests() {
  console.log('🧪 Starting Phase 11 Priority 2 Client Telegram MiniApp Verification...\n');
  let passed = 0;
  let total = 0;

  // 1. Inspect client-miniapp.html file contents directly
  total++;
  const filePath = path.join(__dirname, '../public/client-miniapp.html');
  const fileContent = fs.readFileSync(filePath, 'utf8');

  if (fileContent.includes('window.Telegram') && fileContent.includes('triggerHaptic') && fileContent.includes('tg-dark-theme')) {
    console.log('✅ Test 1 Passed: public/client-miniapp.html contains WebApp theme & haptic feedback handlers');
    passed++;
  } else {
    console.error('❌ Test 1 Failed: Missing WebApp handlers in client-miniapp.html');
  }

  // 2. HTTP GET /client-miniapp
  total++;
  try {
    const res = await request('/client-miniapp');
    if (res.status === 200 && res.raw.includes('Purple Bot')) {
      console.log('✅ Test 2 Passed: GET /client-miniapp returned 200 OK with valid Telegram Mini App HTML');
      passed++;
    } else {
      console.error('❌ Test 2 Failed:', res.status);
    }
  } catch (e) { console.error('❌ Test 2 Exception:', e.message); }

  console.log(`\n📊 CLIENT MINIAPP VERIFICATION RESULTS: ${passed}/${total} PASSED (${Math.round(passed/total*100)}%)`);
}

runClientMiniAppTests();
