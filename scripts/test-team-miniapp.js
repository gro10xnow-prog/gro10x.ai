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

async function runTeamMiniAppTests() {
  console.log('🧪 Starting Phase 11 Priority 1 Team Telegram MiniApp Verification...\n');
  let passed = 0;
  let total = 0;

  // 1. Inspect team-miniapp.html file contents directly
  total++;
  const filePath = path.join(__dirname, '../public/team-miniapp.html');
  const fileContent = fs.readFileSync(filePath, 'utf8');

  if (fileContent.includes('window.Telegram') && fileContent.includes('triggerHaptic') && fileContent.includes('tg-dark-theme')) {
    console.log('✅ Test 1 Passed: public/team-miniapp.html contains WebApp theme & haptic feedback handlers');
    passed++;
  } else {
    console.error('❌ Test 1 Failed: Missing WebApp handlers in team-miniapp.html');
  }

  // 2. HTTP GET /team-miniapp
  total++;
  try {
    const res = await request('/team-miniapp');
    if (res.status === 200 && res.raw.includes('Purple Man')) {
      console.log('✅ Test 2 Passed: GET /team-miniapp returned 200 OK with valid Telegram Mini App HTML');
      passed++;
    } else {
      console.error('❌ Test 2 Failed:', res.status);
    }
  } catch (e) { console.error('❌ Test 2 Exception:', e.message); }

  console.log(`\n📊 TEAM MINIAPP VERIFICATION RESULTS: ${passed}/${total} PASSED (${Math.round(passed/total*100)}%)`);
}

runTeamMiniAppTests();
