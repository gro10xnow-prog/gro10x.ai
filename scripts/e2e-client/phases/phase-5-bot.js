/**
 * scripts/e2e-client/phases/phase-5-bot.js
 * Phase T5: Telegram Client Bot Handlers & Workflow Verification
 */
const { wait, TestTracker } = require('../utils');
const clientBotHandlers = require('../../../src/services/bot/handlers/client');
const { getClientKeyboard } = require('../../../src/services/bot/keyboards');

async function runPhase5() {
  const tracker = new TestTracker('Phase T5: Telegram Client Bot');
  console.log('\n--- 🚀 Running Phase T5: Telegram Client Bot Handlers ---');

  // T5.1 Canonical Client Keyboard Layout
  await tracker.runStep('T5.1.1', 'Verify Canonical getClientKeyboard() structure', async () => {
    const keyboard = getClientKeyboard();
    tracker.assert(keyboard && keyboard.keyboard, 'Keyboard markup must exist');
    const rows = keyboard.keyboard;
    tracker.assert(rows.length >= 4, `Expected at least 4 keyboard rows, got ${rows.length}`);

    const flatButtons = rows.flat().map(b => b.text);
    tracker.assert(flatButtons.some(b => b.includes('Review Room')), 'Missing Review Room button');
    tracker.assert(flatButtons.some(b => b.includes('Campaign Status')), 'Missing Campaign Status button');
    tracker.assert(flatButtons.some(b => b.includes('Monthly Digest')), 'Missing Monthly Digest button');
    tracker.assert(flatButtons.some(b => b.includes('Submit Brief')), 'Missing Submit Brief button');
    tracker.assert(flatButtons.some(b => b.includes('My Invoices')), 'Missing My Invoices button');
    tracker.assert(flatButtons.some(b => b.includes('Contact AM')), 'Missing Contact AM button');
    tracker.assert(flatButtons.some(b => b.includes('Client Portal')), 'Missing Open Client Portal button');
  });

  // Mock bot factory to capture message responses
  function createMockBot() {
    const sentMessages = [];
    return {
      sentMessages,
      sendMessage: async (chatId, text, options) => {
        sentMessages.push({ chatId, text, options });
        return { message_id: 1001, text };
      }
    };
  }

  // T5.3 handleReviewRoom
  await tracker.runStep('T5.3.1', 'Execute handleReviewRoom() handler', async () => {
    const mockBot = createMockBot();
    const msg = { chat: { id: 123456 }, from: { id: 123456, first_name: 'Test Client' } };
    await clientBotHandlers.handleReviewRoom(mockBot, msg);
    tracker.assert(mockBot.sentMessages.length > 0, 'Bot should send a response for Review Room');
  });

  // T5.4 handleCampaignStatus
  await tracker.runStep('T5.4.1', 'Execute handleCampaignStatus() handler', async () => {
    const mockBot = createMockBot();
    const msg = { chat: { id: 123456 }, from: { id: 123456, first_name: 'Test Client' } };
    await clientBotHandlers.handleCampaignStatus(mockBot, msg);
    tracker.assert(mockBot.sentMessages.length > 0, 'Bot should send a response for Campaign Status');
  });

  // T5.5 handleClientDigest
  await tracker.runStep('T5.5.1', 'Execute handleClientDigest() handler (/digest)', async () => {
    const mockBot = createMockBot();
    const msg = { chat: { id: 123456 }, from: { id: 123456, first_name: 'Test Client' } };
    await clientBotHandlers.handleClientDigest(mockBot, msg);
    tracker.assert(mockBot.sentMessages.length > 0, 'Bot should send a monthly digest response');
  });

  // T5.6 handleSubmitBrief
  await tracker.runStep('T5.6.1', 'Execute handleSubmitBrief() handler', async () => {
    const mockBot = createMockBot();
    const msg = { chat: { id: 123456 }, from: { id: 123456, first_name: 'Test Client' } };
    await clientBotHandlers.handleSubmitBrief(mockBot, msg);
    tracker.assert(mockBot.sentMessages.length > 0, 'Bot should send brief intake instructions');
  });

  // T5.7 handleInvoices
  await tracker.runStep('T5.7.1', 'Execute handleInvoices() handler (/invoices)', async () => {
    const mockBot = createMockBot();
    const msg = { chat: { id: 123456 }, from: { id: 123456, first_name: 'Test Client' } };
    await clientBotHandlers.handleInvoices(mockBot, msg);
    tracker.assert(mockBot.sentMessages.length > 0, 'Bot should send invoices list');
  });

  // T5.8 handleContactAM
  await tracker.runStep('T5.8.1', 'Execute handleContactAM() handler', async () => {
    const mockBot = createMockBot();
    const msg = { chat: { id: 123456 }, from: { id: 123456, first_name: 'Test Client' } };
    await clientBotHandlers.handleContactAM(mockBot, msg);
    tracker.assert(mockBot.sentMessages.length > 0, 'Bot should send Account Manager contact details');
  });

  // T5.10 handleServices & handlePortfolio
  await tracker.runStep('T5.10.1', 'Execute handleServices() and handlePortfolio() handlers', async () => {
    const mockBot = createMockBot();
    const msg = { chat: { id: 123456 }, from: { id: 123456, first_name: 'Test Client' } };
    await clientBotHandlers.handleServices(mockBot, msg);
    await clientBotHandlers.handlePortfolio(mockBot, msg);
    tracker.assert(mockBot.sentMessages.length >= 2, 'Bot should send services and portfolio catalog');
  });

  return tracker.getSummary();
}

module.exports = { runPhase5 };
