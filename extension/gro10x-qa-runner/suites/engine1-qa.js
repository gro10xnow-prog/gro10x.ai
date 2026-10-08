/**
 * Engine 1 Desk (AI Agent Ecosystems & Platforms) QA Automation Suite (12 Steps)
 * Tests Telemetry, Inbox, Takeover, Studio, and Developer Settings
 */

const ENGINE1_QA_SUITE = {
  id: 'engine1',
  platform: 'admin',
  title: 'Engine 1 Desk (AI Agent Ecosystems) QA Suite',
  targetHash: '#engine1',
  steps: [
    {
      id: 'step-1',
      title: '1. Navigate to Engine 1 Desk',
      action: 'navigate_hash',
      target: '#engine1',
      assertion: { type: 'wait_selector', selector: '.e1-container', timeout: 5000 }
    },
    {
      id: 'step-2',
      title: '2. Verify 5 Top KPI Telemetry Cards Rendered',
      action: 'assert_visible',
      selector: '.e1-kpi-grid',
      assertion: { type: 'wait_selector', selector: '.e1-kpi-card', timeout: 3000 }
    },
    {
      id: 'step-3',
      title: '3. Switch to Team Inbox Tab',
      action: 'click',
      selector: 'button[onclick*="switchTab(\'inbox\')"]',
      assertion: { type: 'wait_selector', selector: '.e1-inbox-grid', timeout: 3000 }
    },
    {
      id: 'step-4',
      title: '4. Select Conversation Thread in Stream',
      action: 'click',
      selector: '.e1-thread-item',
      assertion: { type: 'wait_selector', selector: '.e1-thread-topbar', timeout: 3000 }
    },
    {
      id: 'step-5',
      title: '5. Filter Threads by Search Query',
      action: 'input',
      selector: '#e1-thread-search',
      value: 'PurpleBot',
      assertion: { type: 'wait_selector', selector: '.e1-thread-item', timeout: 2000 }
    },
    {
      id: 'step-6',
      title: '6. Clear Filter and Reset to All',
      action: 'click',
      selector: '.e1-pill:first-child',
      assertion: { type: 'wait_selector', selector: '.e1-thread-item', timeout: 2000 }
    },
    {
      id: 'step-7',
      title: '7. Verify Human Takeover Toggle Action Available',
      action: 'assert_visible',
      selector: '.e1-thread-topbar button',
      assertion: { type: 'wait_selector', selector: '.e1-reply-bar', timeout: 2000 }
    },
    {
      id: 'step-8',
      title: '8. Switch to The 5 Verticals Studio Tab',
      action: 'click',
      selector: 'button[onclick*="switchTab(\'studio\')"]',
      assertion: { type: 'wait_selector', selector: '.card-glass', timeout: 3000 }
    },
    {
      id: 'step-9',
      title: '9. Verify Vector Knowledge Base Table Rendered',
      action: 'assert_visible',
      selector: 'table',
      assertion: { type: 'wait_selector', selector: 'table tbody tr', timeout: 3000 }
    },
    {
      id: 'step-10',
      title: '10. Switch to Developer Control Settings Tab',
      action: 'click',
      selector: 'button[onclick*="switchTab(\'settings\')"]',
      assertion: { type: 'wait_selector', selector: '.card-glass', timeout: 3000 }
    },
    {
      id: 'step-11',
      title: '11. Verify Multi-Model Routing Ladder Tiers',
      action: 'assert_visible',
      selector: '.e1-badge-emerald',
      assertion: { type: 'custom_check', check: 'assert_exists' }
    },
    {
      id: 'step-12',
      title: '12. Verify Hard Spending Ceilings & Safety Controls',
      action: 'assert_visible',
      selector: 'button[onclick*="updateSpendingCap"]',
      assertion: { type: 'wait_selector', selector: 'button[onclick*="toggleSafetyKillSwitch"]', timeout: 2000 }
    }
  ]
};

if (typeof window !== 'undefined') {
  window.ENGINE1_QA_SUITE = ENGINE1_QA_SUITE;
}
