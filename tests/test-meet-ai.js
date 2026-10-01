/**
 * Automated Test for GRO10X Meet Copilot AI Endpoint
 */

require('dotenv').config();
const express = require('express');
const request = require('supertest');
const aiRouter = require('../src/routes/ai');

const app = express();
app.use(express.json());
app.use('/api/ai', aiRouter);

async function runTests() {
  console.log('--- RUNNING GRO10X MEET COPILOT AI TESTS ---');

  // Test 1: Reject empty requests
  console.log('Test 1: Empty request validation...');
  const res1 = await request(app)
    .post('/api/ai/meeting-summary')
    .send({});
  
  if (res1.status === 400 && res1.body.success === false) {
    console.log('✓ Test 1 Passed: Empty request correctly rejected with 400.');
  } else {
    console.error('✗ Test 1 Failed:', res1.status, res1.body);
    process.exit(1);
  }

  // Test 2: Process structured notes and transcript with fallback rule-based or AI
  console.log('Test 2: Process transcript & notes compilation...');
  const sampleMeeting = {
    title: 'GRO10X Strategy & Product Launch Sync',
    participants: ['Firoz Ahmed', 'Sarah Chen', 'Alex Rivera'],
    notes: '[10:00:15] Discussed Q4 sprint goals.\n[DECISION]: Launch Beta testing next Tuesday.\n[ACTION ITEM]: @Sarah - finalize landing page copy by Monday.\n[ACTION ITEM]: @Alex - setup analytics dashboards.',
    transcript: [
      { speaker: 'Firoz Ahmed', time: '10:00:20', text: 'Welcome everyone to our strategy sync today.' },
      { speaker: 'Sarah Chen', time: '10:00:35', text: 'I have the designs ready and we just need copy review.' },
      { speaker: 'Alex Rivera', time: '10:01:00', text: 'Tracking events are mapped out and ready to deploy.' }
    ]
  };

  const res2 = await request(app)
    .post('/api/ai/meeting-summary')
    .send(sampleMeeting);

  if (res2.status === 200 && res2.body.success === true && res2.body.summary) {
    const summary = res2.body.summary;
    console.log('✓ Test 2 Passed: 200 OK received with summary.');
    console.log('  - Title:', summary.title);
    console.log('  - Overview exists:', !!summary.overview);
    console.log('  - Action Items count:', summary.actionItems?.length);
    console.log('  - Decisions count:', summary.decisions?.length);
    console.log('  - Email HTML generated:', !!summary.emailHtml);
    console.log('  - Email Subject:', summary.emailSubject);

    if (!summary.overview || !summary.actionItems || !summary.emailHtml) {
      console.error('✗ Test 2 Failed: Incomplete summary fields');
      process.exit(1);
    }
  } else {
    console.error('✗ Test 2 Failed:', res2.status, res2.body);
    process.exit(1);
  }

  console.log('\n===========================================');
  console.log('🎉 ALL GRO10X MEET COPILOT TESTS PASSED!');
  console.log('===========================================\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Unexpected error running tests:', err);
  process.exit(1);
});
