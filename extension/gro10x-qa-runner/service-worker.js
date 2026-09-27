/**
 * GRO10X QA Automation Runner - Service Worker (Manifest V3)
 * Coordinates side panel lifecycle, active tab inspection, and cross-context messaging.
 */

chrome.runtime.onInstalled.addListener(async () => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(err => {
      console.warn('[GRO10X QA] SidePanel behavior error:', err);
    });
  }
  console.log('[GRO10X QA] Service Worker Installed.');
});

// Fallback action click handler if setPanelBehavior is not supported
chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open) {
    try {
      await chrome.sidePanel.open({ windowId: tab.windowId });
    } catch (e) {
      console.warn('[GRO10X QA] Could not open side panel:', e);
    }
  }
});

// Message Bus
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
    return true;
  }

  if (type === 'NAVIGATE_TAB') {
    (async () => {
      try {
        const tabId = payload.tabId;
        const url = payload.url;
        await chrome.tabs.update(tabId, { url });
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (type === 'INJECT_CONTENT_SCRIPT') {
    (async () => {
      try {
        const tabId = payload.tabId;
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content-script.js']
        });
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  if (type === 'SEND_TO_TAB') {
    (async () => {
      try {
        const tabId = payload.tabId;
        const data = payload.data;
        const res = await chrome.tabs.sendMessage(tabId, data);
        sendResponse({ success: true, response: res });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }
});
