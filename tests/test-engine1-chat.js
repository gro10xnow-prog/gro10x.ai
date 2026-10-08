/**
 * tests/test-engine1-chat.js
 * Verification test for Phase 1 Engine 1 backend endpoints & human takeover
 */

const assert = require('assert');
const chatTakeover = require('../src/services/chat-takeover');

async function runTests() {
  console.log('🧪 Starting Engine 1 Phase 1 Backend Verification...');

  // Test 1: Telemetry
  const telemetry = chatTakeover.getTelemetry();
  console.log('📊 Telemetry KPIs:', telemetry.kpis);
  assert(typeof telemetry.kpis.activeConversations === 'number', 'activeConversations must be number');
  assert(typeof telemetry.kpis.waitingHumanTriage === 'number', 'waitingHumanTriage must be number');
  assert(typeof telemetry.kpis.resolvedByAiPercent === 'number', 'resolvedByAiPercent must be number');
  assert(typeof telemetry.kpis.handoffsToday === 'number', 'handoffsToday must be number');
  assert(typeof telemetry.kpis.avgCsat === 'number', 'avgCsat must be number');
  console.log('✅ Test 1 Passed: Telemetry KPIs are valid');

  // Test 2: List conversations
  const convs = chatTakeover.listConversations();
  assert(convs.length >= 4, 'Must have seeded initial conversations');
  const targetConv = convs[0];
  console.log(`📋 Found ${convs.length} conversations. Testing on: ${targetConv.id}`);
  console.log('✅ Test 2 Passed: Conversations listed correctly');

  // Test 3: Takeover toggle
  const takeoverRes = chatTakeover.setTakeover(targetConv.id, true, 'PM-1 Lead');
  assert(takeoverRes.isHumanTakeover === true, 'Takeover must be true');
  assert(takeoverRes.takenOverBy === 'PM-1 Lead', 'Taken over by must be PM-1 Lead');
  console.log(`👤 Takeover activated on ${targetConv.id} by ${takeoverRes.takenOverBy}`);
  console.log('✅ Test 3 Passed: Human Takeover successfully engaged');

  // Test 4: Operator Direct Reply
  const replyRes = chatTakeover.recordOperatorReply(targetConv.id, 'Hello from PM-1 direct takeover desk!', 'PM-1 Lead');
  assert(replyRes && replyRes.message, 'Reply message must exist');
  assert(replyRes.message.sender === 'operator', 'Sender must be operator');
  assert(replyRes.message.text.includes('direct takeover desk'), 'Text must match');
  console.log('💬 Operator message posted:', replyRes.message.text);
  console.log('✅ Test 4 Passed: Operator direct reply bypassed AI');

  // Test 5: Release takeover back to AI
  const releaseRes = chatTakeover.setTakeover(targetConv.id, false);
  assert(releaseRes.isHumanTakeover === false, 'Takeover must be false');
  assert(releaseRes.takenOverBy === null, 'Taken over by must be cleared');
  console.log(`🤖 Takeover released on ${targetConv.id}, AI co-pilot resumed`);
  console.log('✅ Test 5 Passed: AI control resumed seamlessly');

  console.log('\n🎉 ALL PHASE 1 BACKEND TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
