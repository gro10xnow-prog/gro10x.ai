const http = require('http');

function makePostRequest(path, data = {}) {
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
  console.log('🧪 Testing Sub-Phase 3.2 Review Room Comments & Approval API...\n');

  try {
    // Test 1: Submit new comment
    const commentRes = await makePostRequest('/api/reviews/REV-001/comments', {
      author: 'Arman Hossain (Chillox)',
      authorRole: 'Client POC',
      timestamp: '00:18',
      timeSeconds: 18,
      text: 'Final audio balance verified. Ready for approval.'
    });
    console.log('1. New Comment Response:\n', commentRes.body);

    // Test 2: Client Approval
    const approveRes = await makePostRequest('/api/reviews/REV-001/approve');
    console.log('\n2. Cut Approval Response:\n', approveRes.body);

    console.log('\n✅ Sub-Phase 3.2 Automated Tests Complete!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

test();
