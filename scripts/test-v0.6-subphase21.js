const http = require('http');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function test() {
  console.log('🧪 Testing Sub-Phase 2.1 Command Center & Multi-Role UI Assets...\n');

  try {
    const cssRes = await makeRequest('/css/command-center.css');
    console.log(`1. Command Center CSS: HTTP ${cssRes.statusCode} (${cssRes.body.length} bytes)`);

    const jsRes = await makeRequest('/js/command-center.js');
    console.log(`2. Command Center JS: HTTP ${jsRes.statusCode} (${jsRes.body.length} bytes)`);

    const indexRes = await makeRequest('/');
    const containsCmdModal = indexRes.body.includes('cmd-backdrop');
    const containsCtrlK = indexRes.body.includes('Ctrl + K');
    console.log(`3. Index HTML Modal Check: ${containsCmdModal && containsCtrlK ? '✅ PASSED' : '❌ FAILED'}`);

    console.log('\n✅ Sub-Phase 2.1 Automated Tests Complete!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

test();
