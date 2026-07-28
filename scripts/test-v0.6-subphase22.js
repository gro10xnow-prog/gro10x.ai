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
  console.log('🧪 Testing Sub-Phase 2.2 Task Workflow & Creation API...\n');

  try {
    const newTaskPayload = {
      title: 'UCB One App - Motion Reel Promo',
      client: 'United Commercial Bank (UCB)',
      priority: 'Urgent',
      assignee: 'Farhan Ahmed',
      dueDate: '2026-08-05'
    };

    const res = await makePostRequest('/api/tasks', newTaskPayload);
    console.log('1. POST /api/tasks Response:', res.body);

    const json = JSON.parse(res.body);
    if (json.success && json.task) {
      console.log(`✅ Task created cleanly with ID: ${json.task.id}`);
    } else {
      console.error('❌ Task creation returned non-success:', res.body);
    }

    console.log('\n✅ Sub-Phase 2.2 Automated Tests Complete!');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

test();
