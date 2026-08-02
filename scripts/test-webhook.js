const http = require('http');

function sendWebhook(botType, updateData) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(updateData);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: `/api/webhooks/telegram?bot=${botType}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function testWebhooks() {
  console.log('🧪 Testing Telegram Webhook Endpoints...\n');

  try {
    const resTeam = await sendWebhook('team', { update_id: 100001, message: { chat: { id: 12345 }, text: '/help' } });
    console.log('✅ Team Webhook Response:', resTeam);

    const resClient = await sendWebhook('client', { update_id: 100002, message: { chat: { id: 67890 }, text: '/help' } });
    console.log('✅ Client Webhook Response:', resClient);

    if (resTeam.status === 200 && resClient.status === 200) {
      console.log('\n🎉 ALL TELEGRAM WEBHOOK ENDPOINT TESTS PASSED (100%)');
    } else {
      console.error('❌ Webhook test failed');
    }
  } catch (err) {
    console.error('❌ Error during webhook test:', err.message);
  }
}

testWebhooks();
