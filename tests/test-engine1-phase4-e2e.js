/**
 * tests/test-engine1-phase4-e2e.js
 * End-to-End Sanity & Phase 4 Verification for Engine 1 Desk
 */

const assert = require('assert');
const chatTakeover = require('../src/services/chat-takeover');
const kbService = require('../src/services/knowledge-base');

async function runEndToEndVerification() {
  console.log('🚀 Running Complete Phase 4 End-to-End Verification for Engine 1 Desk...');

  // 1. Verify Multi-Model & Routing Config
  const assistants = kbService.getAssistants();
  assert(assistants.length === 5, 'All 5 verticals must exist');
  assistants.forEach(a => {
    assert(a.primaryModel.includes('gemini'), `${a.name} must use fast Gemini primary model`);
    assert(a.reasoningModel, `${a.name} must specify heavy reasoning model`);
    console.log(`🤖 ${a.name} (${a.vertical}) -> Fast: ${a.primaryModel} | Heavy: ${a.reasoningModel}`);
  });
  console.log('✅ Step 1: Multi-model tier configurations validated');

  // 2. Verify Spending Limits & Safety Kill Switch API
  const initialSpend = chatTakeover.getSpendingLimits();
  assert(initialSpend.monthlyBudgetUSD > 0, 'Monthly budget must be positive');
  assert(initialSpend.safetyKillSwitchActive === false, 'Default kill switch should be inactive');
  console.log(`💰 Current spend: $${initialSpend.currentSpendUSD} / Cap: $${initialSpend.monthlyBudgetUSD}`);

  const updatedSpend = chatTakeover.updateSpendingLimits({ monthlyBudgetUSD: 250, safetyKillSwitchActive: true });
  assert(updatedSpend.monthlyBudgetUSD === 250, 'Budget must update to 250');
  assert(updatedSpend.safetyKillSwitchActive === true, 'Kill switch must engage');
  console.log('🛑 Kill switch engaged successfully');

  // Restore back to safe operational state
  chatTakeover.updateSpendingLimits({ monthlyBudgetUSD: 150, safetyKillSwitchActive: false });
  assert(chatTakeover.getSpendingLimits().safetyKillSwitchActive === false, 'Kill switch reset');
  console.log('✅ Step 2: Spending limits & Kill Switch logic verified');

  // 3. Verify Live Omnichannel Telemetry
  const telemetry = chatTakeover.getTelemetry();
  assert(telemetry.kpis.activeConversations >= 4, 'Must report active conversations');
  assert(telemetry.channels.web >= 1, 'Web channel count valid');
  assert(telemetry.channels.telegram >= 1, 'Telegram channel count valid');
  assert(telemetry.channels.whatsapp >= 1, 'WhatsApp channel count valid');
  console.log('📊 Telemetry Snapshot:', telemetry.kpis);
  console.log('📡 Channels:', telemetry.channels);
  console.log('✅ Step 3: Omnichannel telemetry verified');

  // 4. Verify Live 1-Click Human Takeover & AI Bypass Loop
  const convList = chatTakeover.listConversations();
  const testConv = convList[0];
  
  // Takeover as human
  chatTakeover.setTakeover(testConv.id, true, 'Firoz Ahmed (Founder)');
  const takenConv = chatTakeover.getConversation(testConv.id);
  assert(takenConv.isHumanTakeover === true, 'Thread must be locked to human');
  assert(takenConv.takenOverBy === 'Firoz Ahmed (Founder)', 'Operator tag must match');

  // Operator direct message delivery
  const directReply = chatTakeover.recordOperatorReply(testConv.id, 'I am handling your query directly as founder.', 'Firoz Ahmed (Founder)');
  assert(directReply.message.sender === 'operator', 'Message sender must be operator');
  console.log('💬 Direct human message delivered:', directReply.message.text);

  // Return to AI
  chatTakeover.setTakeover(testConv.id, false);
  assert(chatTakeover.getConversation(testConv.id).isHumanTakeover === false, 'Thread must return to AI');
  console.log('🤖 AI control returned successfully');
  console.log('✅ Step 4: 1-Click Human takeover cycle verified');

  // 5. Verify Knowledge Base Vector Registry
  const docs = kbService.listKnowledge();
  assert(docs.length >= 3, 'Must have active knowledge sources');
  console.log(`📚 Vector Knowledge Base active with ${docs.length} indexed documents`);
  console.log('✅ Step 5: Vector Knowledge Base registry verified');

  console.log('\n🎉 ALL PHASE 4 & END-TO-END VERIFICATIONS PASSED WITH ZERO ERRORS!');
}

runEndToEndVerification().catch(err => {
  console.error('❌ E2E verification failed:', err);
  process.exit(1);
});
