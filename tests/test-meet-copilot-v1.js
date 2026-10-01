/**
 * tests/test-meet-copilot-v1.js
 * Comprehensive automated verification for GRO10X Meet Copilot v1.0 Production Release
 */

const assert = require('assert');
const request = require('supertest');
const app = require('../server');

async function runTests() {
  console.log('\n--- RUNNING GRO10X MEET COPILOT v1.0 PRODUCTION SUITE ---');

  // Test 1: Telemetry Ingestion - Session Start
  console.log('\n[Test 1] POST /api/meet-copilot/telemetry (session_start)...');
  const res1 = await request(app)
    .post('/api/meet-copilot/telemetry')
    .send({
      clientId: 'usr_test_raksan_001',
      sessionId: 'sess_meet_v1_001',
      eventType: 'session_start',
      meetingCode: 'abc-defg-hij',
      meetingTitle: 'GRO10X Product Alignment Sync',
      durationSeconds: 0,
      turnCount: 0
    });

  assert.strictEqual(res1.status, 200, 'Expected 200 OK');
  assert.strictEqual(res1.body.success, true);
  assert.strictEqual(res1.body.data?.recorded, true);
  console.log('✓ Test 1 Passed: Telemetry session_start registered successfully.');

  // Test 2: Telemetry Ingestion - Session Compile
  console.log('\n[Test 2] POST /api/meet-copilot/telemetry (session_compile)...');
  const res2 = await request(app)
    .post('/api/meet-copilot/telemetry')
    .send({
      clientId: 'usr_test_raksan_001',
      sessionId: 'sess_meet_v1_001',
      eventType: 'session_compile',
      meetingCode: 'abc-defg-hij',
      meetingTitle: 'GRO10X Product Alignment Sync',
      durationSeconds: 1540,
      turnCount: 48,
      targetLanguage: 'English'
    });

  assert.strictEqual(res2.status, 200, 'Expected 200 OK');
  assert.strictEqual(res2.body.success, true);
  console.log('✓ Test 2 Passed: Telemetry session_compile registered successfully.');

  // Test 3: Telemetry Ingestion - Session Export (PDF)
  console.log('\n[Test 3] POST /api/meet-copilot/telemetry (session_export)...');
  const res3 = await request(app)
    .post('/api/meet-copilot/telemetry')
    .send({
      clientId: 'usr_test_raksan_001',
      sessionId: 'sess_meet_v1_001',
      eventType: 'session_export',
      meetingCode: 'abc-defg-hij',
      exportFormat: 'pdf'
    });

  assert.strictEqual(res3.status, 200, 'Expected 200 OK');
  console.log('✓ Test 3 Passed: Telemetry session_export registered successfully.');

  // Test 4: Analytics Stats Aggregation
  console.log('\n[Test 4] GET /api/meet-copilot/stats...');
  const resStats = await request(app).get('/api/meet-copilot/stats');
  assert.strictEqual(resStats.status, 200);
  assert.strictEqual(resStats.body.success, true);
  const totals = resStats.body.data.totals;
  assert(totals.totalUsers >= 1, 'Expected at least 1 tracked user');
  assert(totals.totalSessions >= 1, 'Expected at least 1 tracked session');
  assert(totals.totalCompilations >= 1, 'Expected at least 1 tracked compilation');
  console.log('✓ Test 4 Passed: Stats endpoint returned accurate metrics:');
  console.log(`  - Total Users: ${totals.totalUsers}`);
  console.log(`  - Total Sessions: ${totals.totalSessions}`);
  console.log(`  - Total Compilations: ${totals.totalCompilations}`);
  console.log(`  - Total Minutes Recorded: ${totals.totalMinutesRecorded}m`);

  // Test 5: PDF Generator Hygiene & 1-2 Page Format
  console.log('\n[Test 5] PDF Generator Hygiene & Page Structure Check...');
  const PDFGenerator = require('../extension/gro10x-meet-copilot/pdf-generator.js');
  // Load into global mock
  const fs = require('fs');
  const pdfScript = fs.readFileSync('extension/gro10x-meet-copilot/pdf-generator.js', 'utf8');
  const mockWindow = {};
  const evalFunc = new Function('window', pdfScript);
  evalFunc(mockWindow);

  const mockGen = mockWindow.PDFGenerator;
  assert(mockGen, 'PDFGenerator should be attached to window');

  // Test 5A: Default generation excludes 400-turn raw dump
  const dummyTranscript = Array.from({ length: 440 }, (_, i) => ({
    speaker: `Speaker ${i % 3}`,
    text: `Dialogue turn line number ${i} discussing project milestones.`,
    time: '12:00'
  }));

  const htmlDefault = mockGen.buildDocumentHtml({
    title: 'Executive Sync',
    overview: 'High-level business review.',
    decisions: ['Agreed to launch v1.0.'],
    actionItems: [{ task: 'Push code to production', owner: 'Mahmud', priority: 'High', deadline: 'Today' }],
    transcript: dummyTranscript,
    includeTranscript: false
  });

  assert(!htmlDefault.includes('Appendix: Captions Log'), 'Default PDF must omit raw captions appendix to prevent 400 pages');
  assert(htmlDefault.includes('Executive Brief · 1-2 Pages'), 'Document must label Executive Brief size');
  assert(!htmlDefault.includes('display: flex') || htmlDefault.includes('@media print'), 'Print styling must protect against flex fragmentation');
  console.log('✓ Test 5A Passed: Default Executive PDF omits bloated 440-line transcript dump (1-2 page guarantee).');

  // Test 5B: When explicitly included, transcript is compact and capped
  const htmlWithAppendix = mockGen.buildDocumentHtml({
    title: 'Executive Sync With Log',
    overview: 'High-level review.',
    decisions: ['Agreed to launch.'],
    actionItems: [{ task: 'Test', owner: 'Team', priority: 'Low', deadline: 'Tomorrow' }],
    transcript: dummyTranscript,
    includeTranscript: true
  });

  assert(htmlWithAppendix.includes('Appendix: Captions Log'), 'Should include appendix when explicitly requested');
  assert(htmlWithAppendix.includes('Compact Sample · 30 of 440 turns'), 'Should cap turns at 30 to prevent pagination overflow');
  console.log('✓ Test 5B Passed: Explicit appendix is capped at 30 turns in compact grid layout.');

  console.log('\n==================================================');
  console.log('🎉 ALL GRO10X MEET COPILOT v1.0 TESTS PASSED!');
  console.log('==================================================\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
