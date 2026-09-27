/**
 * extension/gro10x-traffic-sentinel/service-worker.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Background service worker for GRO10X Traffic Sentinel
 * - Configures Side Panel behavior on extension icon click.
 * - Sets up a 60-second chrome.alarm to prevent background tab hibernation.
 * - Pings active Facebook group tabs to trigger feed polling.
 * - Manages default extension settings.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ALARM_NAME = 'traffic_sentinel_heartbeat';

// Configure Side Panel behavior upon installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[GRO10X Traffic Sentinel] Service worker installed.');

  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.warn('[Traffic Sentinel] setPanelBehavior error:', err);
    });
  }

  // Set default storage values if not already present
  const data = await chrome.storage.local.get([
    'monitoringActive',
    'backendApiUrl',
    'apiSecretKey',
    'targetChatId',
    'processedPostIds',
    'recentAlerts',
    'trafficLogs'
  ]);

  if (data.monitoringActive === undefined) {
    await chrome.storage.local.set({
      monitoringActive: false,
      backendApiUrl: 'http://localhost:3000/api/traffic',
      apiSecretKey: 'traffic_sec_gro10x_2026',
      targetChatId: '7754769807',
      processedPostIds: [],
      recentAlerts: [],
      trafficLogs: [
        { time: new Date().toLocaleTimeString(), message: 'Traffic Sentinel installed & ready.', type: 'info' }
      ]
    });
  }

  // Create periodic alarm (every 1 minute)
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: 1
  });
});

// Fallback action click listener to open side panel
chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open && tab && tab.id) {
    try {
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (err) {
      console.warn('[Traffic Sentinel] Failed to open side panel:', err);
    }
  }
});

async function handleLogEntry(entry) {
  try {
    const { trafficLogs = [] } = await chrome.storage.local.get('trafficLogs');
    trafficLogs.unshift(entry);
    if (trafficLogs.length > 60) trafficLogs.pop();
    await chrome.storage.local.set({ trafficLogs });

    chrome.runtime.sendMessage({
      type: 'LOG_APPENDED',
      log: entry
    }).catch(() => {});
  } catch (e) {
    console.warn('[Traffic Sentinel Service Worker] Error logging:', e);
  }
}

// Periodic heartbeat alarm to wake up Facebook tabs
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  const { monitoringActive } = await chrome.storage.local.get('monitoringActive');
  if (!monitoringActive) return;

  try {
    handleLogEntry({
      time: new Date().toLocaleTimeString(),
      message: '💓 Background heartbeat: Pinging Facebook tabs to refresh scan...',
      type: 'info'
    });

    const fbTabs = await chrome.tabs.query({ url: 'https://www.facebook.com/groups/*' });
    for (const tab of fbTabs) {
      chrome.tabs.sendMessage(tab.id, { type: 'SCAN_FEED_NOW' }).catch(() => {});
    }
  } catch (err) {
    console.warn('[Traffic Sentinel] Heartbeat check error:', err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// NETWORK PROXY: DISPATCH POSTS THROUGH BACKGROUND WORKER (BYPASSES WEBPAGE CSP)
// ─────────────────────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ADD_LOG_ENTRY') {
    handleLogEntry(message.log);
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'DISPATCH_POST_TO_BACKEND') {
    handleBackendDispatch(message.postData)
      .then(res => sendResponse(res))
      .catch(err => {
        console.error('[Traffic Sentinel Service Worker] Dispatch error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // Keep message channel open for async response
  }

  if (message.type === 'PING_TELEGRAM_BOT') {
    handleTelegramPing()
      .then(res => sendResponse(res))
      .catch(err => {
        console.error('[Traffic Sentinel Service Worker] Ping error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
});

async function handleTelegramPing() {
  const data = await chrome.storage.local.get([
    'backendApiUrl',
    'targetChatId',
    'apiSecretKey'
  ]);

  const rawUrl = data.backendApiUrl || 'http://localhost:3000/api/traffic';
  const pingUrl = rawUrl.replace(/\/+$/, '') + '/test-ping';
  const chatId = data.targetChatId || '7754769807';

  const res = await fetch(pingUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId })
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Server returned ${res.status}: ${txt}`);
  }

  const result = await res.json();
  return result;
}

const activeDispatches = new Set();

async function handleBackendDispatch(postData) {
  if (postData?.postId && activeDispatches.has(postData.postId)) {
    console.log('[Traffic Sentinel Background] Post already being dispatched, skipping duplicate trigger:', postData.postId);
    return { success: true, duplicate: true };
  }

  if (postData?.postId) {
    activeDispatches.add(postData.postId);
  }

  try {
    const data = await chrome.storage.local.get([
      'backendApiUrl',
      'apiSecretKey',
      'targetChatId'
    ]);

    const url = data.backendApiUrl || 'http://localhost:3000/api/traffic';
    const apiKey = data.apiSecretKey || 'traffic_sec_gro10x_2026';
    const chatId = data.targetChatId || '7754769807';

  const payload = {
    postId: postData.postId,
    text: postData.text,
    postUrl: postData.postUrl,
    author: postData.author,
    timestamp: postData.timestamp,
    groupUrl: postData.groupUrl,
    chatId: chatId
  };

  const headers = {
    'Content-Type': 'application/json'
  };
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }

  console.log('[Traffic Sentinel Background] Forwarding to backend:', url, payload.postId);

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Server returned ${response.status}: ${errorText || response.statusText}`);
  }

  const result = await response.json();

  // Save last captured post
  const lastCaptured = {
    ...postData,
    apiResult: result,
    analysis: result.analysis,
    filtered: result.filtered,
    status: result.filtered ? 'Filtered' : (result.telegramDelivered ? 'Delivered' : 'Sent')
  };
  await chrome.storage.local.set({ lastCapturedPost: lastCaptured });

  // Add to recent alerts list
  const { recentAlerts = [] } = await chrome.storage.local.get('recentAlerts');
  recentAlerts.unshift({
    ...lastCaptured,
    time: new Date().toLocaleTimeString()
  });
  if (recentAlerts.length > 30) recentAlerts.pop();
  await chrome.storage.local.set({ recentAlerts });

  // Broadcast to side panel and open tabs
  chrome.runtime.sendMessage({
    type: 'POST_FORWARDED',
    post: postData,
    result
  }).catch(() => {});

  if (result.filtered) {
    handleLogEntry({
      time: new Date().toLocaleTimeString(),
      message: `🛑 Gemini: Post by "${postData.author}" filtered (non-traffic content).`,
      type: 'warn'
    });
  } else if (result.telegramDelivered) {
    handleLogEntry({
      time: new Date().toLocaleTimeString(),
      message: `🚨 Telegram Alert Sent! [${result.analysis?.severity || 'ALERT'}] ${result.analysis?.location || 'Traffic Incident'}`,
      type: 'success'
    });
  } else {
    handleLogEntry({
      time: new Date().toLocaleTimeString(),
      message: `✓ Post from "${postData.author}" analyzed by AI.`,
      type: 'info'
    });
  }

  return { success: true, result };
  } finally {
    if (postData?.postId) {
      setTimeout(() => {
        activeDispatches.delete(postData.postId);
      }, 15000);
    }
  }
}

