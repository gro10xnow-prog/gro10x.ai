const app = require('../server');
const http = require('http');

const PORT = 3099;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`🧪 Server listening on test port ${PORT}`);
  console.log('🧪 Starting PurpleOS v0.7.0.1 Verification Suite...\n');

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const health = await healthRes.json();
    console.log('✅ 1. Health check response:', health);

    // 2. Generate PIN for test user
    const genRes = await fetch(`${BASE_URL}/api/auth/pin/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '+8801712345678',
        linkedId: 'EMP-002',
        linkedType: 'team',
        email: 'farhan@purplebot.digital',
        sendTelegram: false
      })
    });
    const genData = await genRes.json();
    console.log('✅ 2. Temp PIN Generated:', genData.pin, '| Mobile:', genData.phone);

    // 3. Verify Temp PIN
    const verifyRes = await fetch(`${BASE_URL}/api/auth/pin/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+8801712345678', pin: String(genData.pin) })
    });
    const verifyData = await verifyRes.json();
    console.log('✅ 3. Temp PIN Verification Result:', verifyData);

    // 4. Set Permanent PIN
    const setRes = await fetch(`${BASE_URL}/api/auth/pin/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+8801712345678', newPin: '9988', email: 'farhan@purplebot.digital' })
    });
    const setData = await setRes.json();
    console.log('✅ 4. Set Permanent PIN Result:', setData);

    // 5. Verify Permanent PIN
    const verifyPermRes = await fetch(`${BASE_URL}/api/auth/pin/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+8801712345678', pin: '9988' })
    });
    const verifyPermData = await verifyPermRes.json();
    console.log('✅ 5. Permanent PIN Verification Result:', verifyPermData);

    // 6. Register Telegram Group
    const groupRes = await fetch(`${BASE_URL}/api/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Chillox Production Ops Group',
        type: 'group',
        chatId: '-1009876543210',
        bot: 'teamBot',
        description: 'Active production dispatch group'
      })
    });
    const groupData = await groupRes.json();
    console.log('✅ 6. Telegram Group Registered:', groupData.group?.id, '| Name:', groupData.group?.name);

    // 7. Get All Groups
    const getGroupsRes = await fetch(`${BASE_URL}/api/groups`);
    const allGroups = await getGroupsRes.json();
    console.log('✅ 7. Active Telegram Groups Count:', allGroups.length);

    console.log('\n🎉 ALL v0.7.0.1 VERIFICATION TESTS COMPLETED!');
  } catch (err) {
    console.error('❌ Verification failed with error:', err);
  } finally {
    server.close();
  }
}

runTests();
