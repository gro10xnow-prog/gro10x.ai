/**
 * GRO10X Meet Copilot - Service Worker (Background Script)
 * Manages Side Panel lifecycle, badge indicators, and message routing.
 */

// Allow side panel to open upon clicking the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.warn('[ServiceWorker] setPanelBehavior error:', err));

// Track meeting tabs and recording state
const activeMeetingTabs = new Map();

// Enable side panel specifically when navigating to Google Meet
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  const url = new URL(tab.url);
  if (url.origin === 'https://meet.google.com') {
    try {
      await chrome.sidePanel.setOptions({
        tabId,
        path: 'sidepanel.html',
        enabled: true
      });
      // Set badge indicator indicating ready state
      if (!activeMeetingTabs.has(tabId)) {
        chrome.action.setBadgeText({ tabId, text: 'MEET' });
        chrome.action.setBadgeBackgroundColor({ tabId, color: '#6366F1' });
      }

      // Ensure content script is actively injected
      if (info.status === 'complete') {
        chrome.scripting.executeScript({
          target: { tabId },
          files: ['content.js']
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('[ServiceWorker] Failed to configure sidepanel for tab:', err);
    }
  }
});

// Auto-inject into any open Google Meet tabs on worker startup
chrome.tabs.query({ url: '*://meet.google.com/*' }, (tabs) => {
  if (tabs) {
    for (const t of tabs) {
      if (t.id) {
        chrome.scripting.executeScript({
          target: { tabId: t.id },
          files: ['content.js']
        }).catch(() => {});
      }
    }
  }
});

// Clean up state when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  activeMeetingTabs.delete(tabId);
});

// Handle messages from content script or side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab ? sender.tab.id : message.tabId;

  switch (message.type) {
    case 'MEET_RECORDING_STATUS': {
      if (tabId) {
        if (message.status === 'RECORDING') {
          activeMeetingTabs.set(tabId, 'RECORDING');
          chrome.action.setBadgeText({ tabId, text: 'REC' });
          chrome.action.setBadgeBackgroundColor({ tabId, color: '#EF4444' });
        } else if (message.status === 'PAUSED') {
          activeMeetingTabs.set(tabId, 'PAUSED');
          chrome.action.setBadgeText({ tabId, text: 'PAUSE' });
          chrome.action.setBadgeBackgroundColor({ tabId, color: '#F59E0B' });
        } else {
          activeMeetingTabs.delete(tabId);
          chrome.action.setBadgeText({ tabId, text: '' });
        }
      }
      sendResponse({ ok: true });
      break;
    }

    case 'GET_ACTIVE_MEET_TAB': {
      // Find current or most recent Google Meet tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.url && activeTab.url.includes('meet.google.com')) {
          sendResponse({ tab: activeTab });
        } else {
          // Fallback to any meet tab in any window
          chrome.tabs.query({ url: 'https://meet.google.com/*' }, (meetTabs) => {
            sendResponse({ tab: meetTabs && meetTabs.length > 0 ? meetTabs[0] : null });
          });
        }
      });
      return true; // async sendResponse
    }

    case 'RELAY_TO_SIDEPANEL':
    case 'MEET_CAPTION_LINE':
    case 'MEET_METADATA_UPDATE':
    case 'MEET_CAPTIONS_DISABLED_ALERT': {
      // Forward directly to any open extension views (sidepanel)
      chrome.runtime.sendMessage(message).catch(() => {
        // Sidepanel may not be open yet - ignore quiet failure
      });
      sendResponse({ received: true });
      break;
    }

    default:
      break;
  }
});
