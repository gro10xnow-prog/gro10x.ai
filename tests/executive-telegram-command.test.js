const { handlePendingApprovals } = require('../src/services/bot/handlers/approvals');
const { handleMorningBriefing } = require('../src/services/bot/handlers/briefing');

describe('Phase 2: Executive Telegram Command Layer & One-Tap Approvals', () => {
  // 1. Interactive Pending Approvals Keyboard
  test('handlePendingApprovals: builds interactive inline keyboard with action buttons', async () => {
    let capturedChatId = null;
    let capturedText = null;
    let capturedOptions = null;

    const mockTeamBot = {
      sendMessage: jest.fn().mockImplementation((chatId, text, options) => {
        capturedChatId = chatId;
        capturedText = text;
        capturedOptions = options;
        return Promise.resolve({ message_id: 1001 });
      })
    };

    const mockMsg = {
      chat: { id: 7754769807 }
    };

    await handlePendingApprovals(mockTeamBot, mockMsg);

    expect(mockTeamBot.sendMessage).toHaveBeenCalled();
    expect(capturedChatId).toBe(7754769807);
    expect(capturedText).toContain('EXECUTIVE PENDING APPROVALS DASHBOARD');
    expect(capturedOptions).toHaveProperty('reply_markup');
    expect(capturedOptions.reply_markup).toHaveProperty('inline_keyboard');
    expect(Array.isArray(capturedOptions.reply_markup.inline_keyboard)).toBe(true);

    // Verify presence of deep-link button
    const hasAdminLink = capturedOptions.reply_markup.inline_keyboard.some(row =>
      row.some(btn => btn.url && btn.url.includes('/app'))
    );
    expect(hasAdminLink).toBe(true);
  });

  // 2. Executive Morning Briefing Navigation Shortcuts
  test('handleMorningBriefing: attaches navigation shortcuts to Command Dashboard and Approvals', async () => {
    let capturedText = null;
    let capturedOptions = null;

    const mockTeamBot = {
      sendMessage: jest.fn().mockImplementation((chatId, text, options) => {
        capturedText = text;
        capturedOptions = options;
        return Promise.resolve({ message_id: 1002 });
      })
    };

    const mockMsg = {
      chat: { id: 7754769807 }
    };

    await handleMorningBriefing(mockTeamBot, mockMsg);

    expect(mockTeamBot.sendMessage).toHaveBeenCalled();
    expect(capturedText).toContain('EXECUTIVE MORNING BRIEFING');
    expect(capturedText).toContain('Live Studio Headcount');
    expect(capturedOptions.reply_markup.inline_keyboard).toBeDefined();

    const flatButtons = capturedOptions.reply_markup.inline_keyboard.flat();
    const hasApprovalsBtn = flatButtons.some(b => b.callback_data === 'cmd_approvals');
    const hasDashboardBtn = flatButtons.some(b => b.url && b.url.includes('/app'));

    expect(hasApprovalsBtn).toBe(true);
    expect(hasDashboardBtn).toBe(true);
  });
});
