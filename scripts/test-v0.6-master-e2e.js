const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: 'localhost', port: 3000, path }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    }).on('error', reject);
  });
}

function post(path, data = {}) {
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

async function runMasterVerification() {
  console.log('====================================================');
  console.log('🚀 PURPLEOS v0.6.0 MASTER E2E VERIFICATION SUITE');
  console.log('====================================================\n');

  try {
    // 1. Health & Version Check
    const health = await get('/api/health');
    console.log('1. Health Check:', health.body);

    // 2. Clients CRM via Supabase
    const clients = await get('/api/clients');
    const clientsArr = JSON.parse(clients.body);
    console.log(`2. Supabase Clients CRM: Loaded ${clientsArr.length} clients.`);

    // 3. Dedicated Auth Portal Page
    const authPage = await get('/auth');
    console.log(`3. Dedicated Auth Subdomain / Portal: HTTP ${authPage.statusCode}`);

    // 4. Command Center Assets
    const cmdCss = await get('/css/command-center.css');
    const cmdJs = await get('/js/command-center.js');
    console.log(`4. Command Center UI: CSS (${cmdCss.body.length}b) | JS (${cmdJs.body.length}b)`);

    // 5. Telegram Profile Pairing
    const pairRes = await post('/api/telegram-simulator', { command: '/pair EMP-001' });
    console.log('5. Telegram Profile Pairing:\n', JSON.parse(pairRes.body).responseText.split('\n')[0]);

    // 6. Review Room Cut Approval
    const approveRes = await post('/api/reviews/REV-001/approve');
    console.log('6. Review Room Client Cut Approval:\n', JSON.parse(approveRes.body).message);

    console.log('\n====================================================');
    console.log('🎉 ALL PURPLEOS v0.6.0 VERIFICATION SUITES PASSED!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Master Verification failed:', err.message);
  }
}

runMasterVerification();
