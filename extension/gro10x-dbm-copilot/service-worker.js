/**
 * GRO10X DBM Copilot - Service Worker (Manifest V3)
 * Handles Side Panel behavior and tab messaging coordinator.
 */

// Enable side panel on extension icon click
chrome.runtime.onInstalled.addListener(async () => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(err => {
      console.warn('[GRO10X Copilot] SidePanel behavior error:', err);
    });
  }
  console.log('[GRO10X Copilot] Service Worker Installed.');
});

// Fallback action click handler if setPanelBehavior is not available
chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open) {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (e) {
      console.warn('[GRO10X Copilot] Could not open side panel:', e);
    }
  }
});

// Runtime Message Router
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { type, payload } = message || {};

  if (type === 'GET_ACTIVE_TAB') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        sendResponse({ success: true, tab });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true; // Keep channel open for async response
  }

  if (type === 'SEND_TO_ACTIVE_TAB') {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.id) {
          sendResponse({ success: false, error: 'No active tab found' });
          return;
        }
        const response = await chrome.tabs.sendMessage(tab.id, payload);
        sendResponse({ success: true, data: response });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (type === 'BROADCAST_STATUS') {
    // Forward state updates to any open sidepanel
    chrome.runtime.sendMessage(message).catch(() => {});
    sendResponse({ received: true });
  }
});
