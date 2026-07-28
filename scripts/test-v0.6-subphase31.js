const http = require('http');

function makePostRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function test() {
  console.log('🧪 Testing Sub-Phase 3.1 Telegram Engine & Profile Pairing...\n');

  try {
    // Test 1: Pair command
    const pairRes = await makePostRequest('/api/telegram-simulator', { command: '/pair EMP-002' });
    console.log('1. /pair EMP-002 Response:\n', JSON.parse(pairRes.body).responseText);

    // Test 2: My Earnings
    const earnRes = await makePostRequest('/api/telegram-simulator', { command: '/myearnings' });
    console.log('\n2. /myearnings Response:\n', JSON.parse(earnRes.body).responseText);

    // Test 3: My Bookings
    const bookRes = await makePostRequest('/api/telegram-simulator', { command: '/mybookings' });
    const bookJson = JSON.parse(bookRes.body);
    console.log('\n3. /mybookings Response:\n', bookJson.responseText);
    console.log('   Inline Buttons:', JSON.stringify(bookJson.inlineButtons));

    // Test 4: Clock In
    const clockinRes = await makePostRequest('/api/telegram-simulator', { command: '/clockin' });
    console.log('\n4. /clockin Response:\n', JSON.parse(clockinRes.body).responseText);

    console.log('\n✅ Sub-Phase 3.1 Automated Tests Complete!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

test();
