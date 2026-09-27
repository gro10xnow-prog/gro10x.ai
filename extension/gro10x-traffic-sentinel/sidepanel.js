/**
 * extension/gro10x-traffic-sentinel/sidepanel.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Side Panel User Interface Controller for GRO10X Traffic Sentinel.
 * Features:
 * - Tab switching: Control, Alerts, Settings, Logs.
 * - Master Live Monitoring toggle.
 * - Real-time post alert stream with Gemini severity badges.
 * - Activity log console.
 * - Feed chronological sorting helper.
 * ─────────────────────────────────────────────────────────────────────────────
 */

let currentTab = 'control';
let activeGroupTabId = null;

document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  await loadSettings();
  await checkActiveTab();
  initEventListeners();
  listenToBackgroundEvents();
});

// ─────────────────────────────────────────────────────────────────────────────
// TAB SWITCHING
// ─────────────────────────────────────────────────────────────────────────────

function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      switchTab(target);
    });
  });
}

function switchTab(tabName) {
  currentTab = tabName;
  document.querySelectorAll('.nav-tab').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
  });
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === `pane-${tabName}`);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS & STATE LOADING
// ─────────────────────────────────────────────────────────────────────────────

async function loadSettings() {
  const data = await chrome.storage.local.get([
    'monitoringActive',
    'backendApiUrl',
    'apiSecretKey',
    'targetChatId',
    'lastCapturedPost',
    'processedPostIds',
    'recentAlerts',
    'trafficLogs'
  ]);

  const chkMonitoring = document.getElementById('chkMonitoring');
  const txtApiUrl = document.getElementById('txtApiUrl');
  const txtApiKey = document.getElementById('txtApiKey');
  const txtChatId = document.getElementById('txtChatId');

  chkMonitoring.checked = Boolean(data.monitoringActive);
  const finalApiUrl = data.backendApiUrl || 'http://localhost:3000/api/traffic';
  const finalApiKey = data.apiSecretKey || 'traffic_sec_gro10x_2026';
  const finalChatId = data.targetChatId || '7754769807';

  txtApiUrl.value = finalApiUrl;
  txtApiKey.value = finalApiKey;
  txtChatId.value = finalChatId;

  // Auto-persist defaults if missing
  if (!data.apiSecretKey || !data.targetChatId || !data.backendApiUrl) {
    await chrome.storage.local.set({
      backendApiUrl: finalApiUrl,
      apiSecretKey: finalApiKey,
      targetChatId: finalChatId
    });
  }

  updateStatusPill(chkMonitoring.checked);
  renderKPIs(data);
  renderLastCapturedPost(data.lastCapturedPost);
  renderAlertsStream(data.recentAlerts || []);
  renderLogs(data.trafficLogs || []);
}

function updateStatusPill(isActive, customLabel = null) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  const toggleSubtext = document.getElementById('toggleSubtext');
  const beacon = document.getElementById('beaconDot');
  const ticker = document.getElementById('activityTicker');

  if (customLabel) {
    text.textContent = customLabel;
    dot.className = 'status-dot warning';
    if (beacon) beacon.className = 'pulse-beacon paused';
    if (ticker) ticker.textContent = customLabel;
    return;
  }

  if (isActive) {
    dot.className = 'status-dot active';
    text.textContent = 'Monitoring Live';
    if (toggleSubtext) toggleSubtext.textContent = 'Actively scanning for new traffic posts';
    if (beacon) beacon.className = 'pulse-beacon';
    if (ticker && ticker.textContent === 'Monitoring paused') ticker.textContent = 'Watching feed...';
  } else {
    dot.className = 'status-dot';
    text.textContent = 'Monitoring Paused';
    if (toggleSubtext) toggleSubtext.textContent = 'Click switch to enable auto-capture';
    if (beacon) beacon.className = 'pulse-beacon paused';
    if (ticker) ticker.textContent = 'Monitoring paused';
  }
}

function renderKPIs(data) {
  const scanned = Array.isArray(data.processedPostIds) ? data.processedPostIds.length : 0;
  const alerts = Array.isArray(data.recentAlerts) ? data.recentAlerts.filter(a => !a.filtered).length : 0;
  const filtered = Array.isArray(data.recentAlerts) ? data.recentAlerts.filter(a => a.filtered).length : 0;

  document.getElementById('kpiSeenCount').textContent = scanned;
  document.getElementById('kpiAlertsCount').textContent = alerts;
  document.getElementById('kpiFilteredCount').textContent = filtered;
  document.getElementById('alertsCountBadge').textContent = alerts;
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVE TAB CHECK & CHRONOLOGICAL URL HELPER
// ─────────────────────────────────────────────────────────────────────────────

async function checkActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const banner = document.getElementById('chronologicalBanner');

  if (!tab || !tab.url || !tab.url.includes('facebook.com/groups/')) {
    updateStatusPill(false, 'Not on FB Group');
    banner.style.display = 'none';
    return;
  }

  activeGroupTabId = tab.id;

  // Check if URL is sorted chronologically
  if (!tab.url.includes('sorting_setting=CHRONOLOGICAL') && !tab.url.includes('/posts/')) {
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }

  // Ping content script
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATUS' });
    if (res && res.cachedCount !== undefined) {
      document.getElementById('kpiSeenCount').textContent = res.cachedCount;
    }
  } catch (_) {}
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────────────────────────────────────

function initEventListeners() {
  const chkMonitoring = document.getElementById('chkMonitoring');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const btnScanNow = document.getElementById('btnScanNow');
  const btnClearCache = document.getElementById('btnClearCache');
  const btnFixSorting = document.getElementById('btnFixSorting');
  const btnClearAlerts = document.getElementById('btnClearAlerts');
  const btnClearLogs = document.getElementById('btnClearLogs');

  // Master monitoring toggle
  chkMonitoring.addEventListener('change', async () => {
    const isActive = chkMonitoring.checked;
    await chrome.storage.local.set({ monitoringActive: isActive });
    updateStatusPill(isActive);

    addLog(isActive ? 'Live feed monitoring turned ON.' : 'Live feed monitoring PAUSED.', isActive ? 'success' : 'warn');
    notifyActiveTabSettings();
  });

  // Save Settings
  btnSaveSettings.addEventListener('click', async () => {
    const backendApiUrl = document.getElementById('txtApiUrl').value.trim();
    const apiSecretKey = document.getElementById('txtApiKey').value.trim();
    const targetChatId = document.getElementById('txtChatId').value.trim();

    await chrome.storage.local.set({
      backendApiUrl,
      apiSecretKey,
      targetChatId
    });

    btnSaveSettings.textContent = '✓ Saved Successfully!';
    addLog('Settings updated and persisted.', 'success');

    setTimeout(() => {
      btnSaveSettings.textContent = 'Save All Settings';
    }, 1200);

    notifyActiveTabSettings();
  });

  // Scan Feed Now
  btnScanNow.addEventListener('click', async () => {
    btnScanNow.disabled = true;
    btnScanNow.querySelector('span').textContent = 'Scanning...';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id || !tab.url || !tab.url.includes('facebook.com')) {
      alert('Please make sure you have the Facebook group tab open and active.');
      btnScanNow.disabled = false;
      btnScanNow.querySelector('span').textContent = '⚡ Scan Feed Now';
      return;
    }

    try {
      addLog('Initiating manual feed scan...', 'info');
      const res = await chrome.tabs.sendMessage(tab.id, { type: 'SCAN_FEED_NOW' });
      if (res && res.success) {
        addLog(`Scan complete. Found ${res.capturedCount} new posts.`, res.capturedCount > 0 ? 'success' : 'info');
      }
    } catch (e) {
      addLog('Could not communicate with tab. Try refreshing the Facebook page.', 'error');
    }

    setTimeout(async () => {
      btnScanNow.disabled = false;
      btnScanNow.querySelector('span').textContent = '⚡ Scan Feed Now';
      const data = await chrome.storage.local.get(['lastCapturedPost', 'recentAlerts', 'processedPostIds']);
      renderLastCapturedPost(data.lastCapturedPost);
      renderKPIs(data);
      renderAlertsStream(data.recentAlerts || []);
    }, 1200);
  });

  // Reset Memory
  btnClearCache.addEventListener('click', async () => {
    if (confirm('Clear processed post memory? Posts currently visible in the feed will be scanned again.')) {
      await chrome.storage.local.set({ processedPostIds: [] });
      document.getElementById('kpiSeenCount').textContent = '0';
      addLog('Processed post cache cleared. Feed is ready for re-scan.', 'warn');
      notifyActiveTabSettings();
    }
  });

  // Test Bot Ping
  const btnTestPing = document.getElementById('btnTestPing');
  if (btnTestPing) {
    btnTestPing.addEventListener('click', async () => {
      btnTestPing.disabled = true;
      btnTestPing.innerHTML = '<span>⏳ Pinging...</span>';
      try {
        const res = await new Promise((resolve) => {
          chrome.runtime.sendMessage({ type: 'PING_TELEGRAM_BOT' }, (response) => {
            if (chrome.runtime.lastError) {
              resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
              resolve(response || { success: true });
            }
          });
        });

        if (res && res.success) {
          btnTestPing.innerHTML = '<span>✅ Sent to Telegram!</span>';
          addLog('Test ping delivered to Telegram bot (@jonosarthebangladeshbot)', 'success');
        } else {
          btnTestPing.innerHTML = '<span>❌ Ping Failed</span>';
          addLog('Ping failed: ' + (res?.error || 'Unknown error'), 'error');
        }
      } catch (err) {
        btnTestPing.innerHTML = '<span>❌ Ping Error</span>';
        addLog('Ping error: ' + err.message, 'error');
      }

      setTimeout(() => {
        btnTestPing.disabled = false;
        btnTestPing.innerHTML = '<span>🔔 Test Bot Ping</span>';
      }, 2500);
    });
  }

  // Test Sample Real Traffic Alert through Gemini
  const btnTestAlert = document.getElementById('btnTestAlert');
  if (btnTestAlert) {
    btnTestAlert.addEventListener('click', async () => {
      btnTestAlert.disabled = true;
      btnTestAlert.innerHTML = '<span>🤖 Analyzing...</span>';
      addLog('Dispatching simulated traffic report to Gemini AI...', 'info');

      try {
        const samplePost = {
          postId: 'simulated_alert_' + Date.now(),
          text: 'কুড়িল বিশ্বরোড থেকে বনানী যাওয়ার ফ্লাইওভারে ভয়াবহ যানজট। দুটি বাসের সংঘর্ষে রাস্তা পুরোপুরি বন্ধ।',
          author: 'Traffic Test Reporter',
          postUrl: 'https://www.facebook.com/groups/TrafficAlert.BD/',
          timestamp: new Date().toISOString(),
          groupUrl: 'https://www.facebook.com/groups/608459192604436'
        };

        const res = await new Promise((resolve) => {
          chrome.runtime.sendMessage({
            type: 'DISPATCH_POST_TO_BACKEND',
            postData: samplePost
          }, (response) => {
            if (chrome.runtime.lastError) {
              resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
              resolve(response || { success: true });
            }
          });
        });

        if (res && res.success) {
          btnTestAlert.innerHTML = '<span>🚨 Alert Delivered!</span>';
          addLog('Sample alert analyzed by Gemini & delivered to Telegram!', 'success');
        } else {
          btnTestAlert.innerHTML = '<span>❌ Alert Failed</span>';
          addLog('Sample alert failed: ' + (res?.error || 'Unknown error'), 'error');
        }
      } catch (err) {
        btnTestAlert.innerHTML = '<span>❌ Alert Error</span>';
        addLog('Sample alert error: ' + err.message, 'error');
      }

      setTimeout(() => {
        btnTestAlert.disabled = false;
        btnTestAlert.innerHTML = '<span>🧪 Test Sample Alert</span>';
      }, 2500);
    });
  }

  // Fix URL Sorting
  btnFixSorting.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;

    try {
      const u = new URL(tab.url);
      u.searchParams.set('sorting_setting', 'CHRONOLOGICAL');
      chrome.tabs.update(tab.id, { url: u.toString() });
      document.getElementById('chronologicalBanner').style.display = 'none';
      addLog('Group URL updated to chronological sorting (?sorting_setting=CHRONOLOGICAL).', 'info');
    } catch (err) {
      console.error(err);
    }
  });

  // Clear Alerts
  btnClearAlerts.addEventListener('click', async () => {
    await chrome.storage.local.set({ recentAlerts: [] });
    renderAlertsStream([]);
    document.getElementById('alertsCountBadge').textContent = '0';
  });

  // Clear Logs
  btnClearLogs.addEventListener('click', async () => {
    await chrome.storage.local.set({ trafficLogs: [] });
    renderLogs([]);
  });

  const btnClearLogsControl = document.getElementById('btnClearLogsControl');
  if (btnClearLogsControl) {
    btnClearLogsControl.addEventListener('click', async () => {
      await chrome.storage.local.set({ trafficLogs: [] });
      renderLogs([]);
    });
  }

  // Copy Full Diagnostic Report to Clipboard
  const btnCopyReport = document.getElementById('btnCopyReport');
  if (btnCopyReport) {
    btnCopyReport.addEventListener('click', async () => {
      const data = await chrome.storage.local.get([
        'monitoringActive',
        'backendApiUrl',
        'apiSecretKey',
        'targetChatId',
        'processedPostIds',
        'recentAlerts',
        'lastCapturedPost',
        'trafficLogs'
      ]);

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      const effectiveChatId = data.targetChatId || '7754769807';
      const effectiveApiKey = data.apiSecretKey || 'traffic_sec_gro10x_2026';
      const effectiveApiUrl = data.backendApiUrl || 'http://localhost:3000/api/traffic';

      const reportLines = [
        '### 🚦 GRO10X Traffic Sentinel — Diagnostic Report',
        `- **Extension Version:** v1.5.0`,
        `- **Monitoring State:** ${data.monitoringActive ? '🟢 ACTIVE (Live Monitoring)' : '⏸️ PAUSED'}`,
        `- **Active Tab URL:** ${tab?.url || 'N/A'}`,
        `- **Backend Route:** ${effectiveApiUrl}`,
        `- **Telegram Chat ID:** ${effectiveChatId}`,
        `- **API Key Configured:** ${data.apiSecretKey ? 'Yes (custom configured)' : 'Yes (default active)'}`,
        `- **Stats:** Scanned: ${data.processedPostIds?.length || 0} | Alerts: ${data.recentAlerts?.length || 0}`,
        '',
        '#### 📡 Latest Captured Post:',
        data.lastCapturedPost ? [
          `- **Author:** ${data.lastCapturedPost.author || 'N/A'}`,
          `- **Post ID:** ${data.lastCapturedPost.postId || 'N/A'}`,
          `- **Captured Time:** ${data.lastCapturedPost.capturedAt ? new Date(data.lastCapturedPost.capturedAt).toLocaleTimeString() : 'N/A'}`,
          `- **Status:** ${data.lastCapturedPost.status || 'N/A'}`,
          `- **Content:** "${(data.lastCapturedPost.text || '').replace(/\n/g, ' ')}"`,
          `- **Post URL:** ${data.lastCapturedPost.postUrl || 'N/A'}`,
          `- **Gemini / API Result:** ${JSON.stringify(data.lastCapturedPost.apiResult || {})}`
        ].join('\n') : '_None captured yet._',
        '',
        '#### 📋 Recent Activity Logs:',
        Array.isArray(data.trafficLogs) && data.trafficLogs.length > 0
          ? data.trafficLogs.slice(0, 8).map(l => `[${l.time}] (${l.type}) ${l.message}`).join('\n')
          : '_No logs recorded yet._'
      ];

      const reportText = reportLines.join('\n');
      try {
        await navigator.clipboard.writeText(reportText);
        btnCopyReport.textContent = '✓ Copied Report to Clipboard!';
        btnCopyReport.classList.add('copied');
        addLog('Diagnostic report copied to clipboard.', 'success');
        setTimeout(() => {
          btnCopyReport.textContent = '📋 Copy Diagnostic Report to Clipboard';
          btnCopyReport.classList.remove('copied');
        }, 2200);
      } catch (err) {
        console.error('Clipboard write error:', err);
      }
    });
  }

  // Copy Single Post info
  const btnCopySingle = document.getElementById('btnCopySinglePost');
  if (btnCopySingle) {
    btnCopySingle.addEventListener('click', async () => {
      const { lastCapturedPost } = await chrome.storage.local.get('lastCapturedPost');
      if (!lastCapturedPost) return;

      const snippet = `[Traffic Post] Author: ${lastCapturedPost.author} | Status: ${lastCapturedPost.status}\nText: "${lastCapturedPost.text}"\nURL: ${lastCapturedPost.postUrl}`;
      await navigator.clipboard.writeText(snippet);

      btnCopySingle.textContent = '✓ Copied';
      setTimeout(() => { btnCopySingle.textContent = '📋 Copy'; }, 1500);
    });
  }

  // Copy Logs to Clipboard
  const btnCopyLogs = document.getElementById('btnCopyLogs');
  if (btnCopyLogs) {
    btnCopyLogs.addEventListener('click', async () => {
      const { trafficLogs = [] } = await chrome.storage.local.get('trafficLogs');
      const logText = trafficLogs.map(l => `[${l.time}] (${l.type}) ${l.message}`).join('\n');
      await navigator.clipboard.writeText(logText || 'No logs');

      btnCopyLogs.textContent = '✓ Copied!';
      setTimeout(() => { btnCopyLogs.textContent = '📋 Copy Logs'; }, 1500);
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGS & ALERTS RENDERING
// ─────────────────────────────────────────────────────────────────────────────

async function addLog(message, type = 'info') {
  const time = new Date().toLocaleTimeString();
  const entry = { time, message, type };

  const { trafficLogs = [] } = await chrome.storage.local.get('trafficLogs');
  trafficLogs.unshift(entry);
  if (trafficLogs.length > 50) trafficLogs.pop();
  await chrome.storage.local.set({ trafficLogs });

  renderLogs(trafficLogs);
}

function renderLogs(logs) {
  const consoleEl = document.getElementById('logsConsole');
  const controlConsoleEl = document.getElementById('logsConsoleControl');
  const tickerEl = document.getElementById('activityTicker');

  const html = (!logs || logs.length === 0)
    ? '<div class="empty-logs">No activity logs recorded yet.</div>'
    : logs.map(l => `
      <div class="log-entry ${l.type || 'info'}">
        <span class="log-time">[${l.time}]</span>
        <span class="log-msg">${escapeHtml(l.message)}</span>
      </div>
    `).join('');

  if (consoleEl) {
    consoleEl.innerHTML = html;
  }
  if (controlConsoleEl) {
    controlConsoleEl.innerHTML = html;
  }

  if (tickerEl && logs && logs.length > 0) {
    const latest = logs[0];
    const cleanMsg = latest.message.replace(/^[🟢⏸️⚡⏱️🚨🛑✓⚠️💓]\s*/, '');
    tickerEl.textContent = cleanMsg.length > 25 ? cleanMsg.slice(0, 25) + '...' : cleanMsg;
    tickerEl.title = latest.message;
  }
}

function renderAlertsStream(alerts) {
  const streamEl = document.getElementById('alertsStream');
  const emptyEl = document.getElementById('emptyAlertsMsg');

  if (!alerts || alerts.length === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';

  streamEl.innerHTML = alerts.map(a => {
    const isFiltered = a.filtered || a.apiResult?.filtered;
    const severity = a.analysis?.severity || 'MODERATE';
    const location = a.analysis?.location || 'Unknown Road';
    const summary = a.analysis?.summary || a.text?.slice(0, 100);

    const badgeClass = isFiltered ? 'badge-filtered' : (severity === 'HIGH' ? 'badge-high' : 'badge-mod');
    const badgeLabel = isFiltered ? 'Filtered (Chatter)' : `${severity} SEVERITY`;

    return `
      <div class="alert-item ${isFiltered ? 'filtered' : ''}">
        <div class="alert-item-header">
          <span class="alert-severity ${badgeClass}">${badgeLabel}</span>
          <span class="alert-time">${a.time || 'Recently'}</span>
        </div>
        <div class="alert-location">📍 ${escapeHtml(location)}</div>
        <div class="alert-summary">${escapeHtml(summary)}</div>
        <div class="alert-footer">
          <span class="alert-author">By: ${escapeHtml(a.author || 'User')}</span>
          ${a.postUrl ? `<a href="${a.postUrl}" target="_blank" class="alert-link">FB Post ↗</a>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderLastCapturedPost(post) {
  const empty = document.getElementById('emptyPreview');
  const card = document.getElementById('postPreview');
  const author = document.getElementById('prevAuthor');
  const time = document.getElementById('prevTime');
  const text = document.getElementById('prevText');
  const status = document.getElementById('prevStatus');
  const link = document.getElementById('prevLink');
  const tag = document.getElementById('lastCapturedTag');
  const aiBox = document.getElementById('prevAiSummary');
  const aiText = document.getElementById('prevAiSummaryText');

  if (!post) {
    empty.style.display = 'block';
    card.style.display = 'none';
    tag.textContent = 'Idle';
    return;
  }

  empty.style.display = 'none';
  card.style.display = 'block';

  author.textContent = post.author || 'Facebook User';
  time.textContent = post.capturedAt ? new Date(post.capturedAt).toLocaleTimeString() : 'Just now';
  text.textContent = post.text ? (post.text.slice(0, 200) + (post.text.length > 200 ? '...' : '')) : '';

  if (post.analysis?.summary) {
    aiBox.style.display = 'block';
    aiText.textContent = post.analysis.summary;
  } else {
    aiBox.style.display = 'none';
  }

  if (post.apiResult?.filtered) {
    status.textContent = 'Filtered by Gemini (Non-traffic)';
    status.className = 'badge-status filtered';
    tag.textContent = 'Filtered';
  } else if (post.apiResult?.telegramDelivered || post.status === 'Sent') {
    status.textContent = '✓ Delivered to Telegram';
    status.className = 'badge-status delivered';
    tag.textContent = 'Delivered';
  } else {
    status.textContent = post.status || 'Processed';
    status.className = 'badge-status';
    tag.textContent = 'Active';
  }

  if (post.postUrl) {
    link.href = post.postUrl;
    link.style.display = 'inline';
  } else {
    link.style.display = 'none';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REAL-TIME BACKGROUND LISTENER
// ─────────────────────────────────────────────────────────────────────────────

function listenToBackgroundEvents() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'POST_FORWARDED') {
      handlePostForwarded(message.post, message.result);
    } else if (message.type === 'LOG_APPENDED') {
      chrome.storage.local.get('trafficLogs').then(({ trafficLogs = [] }) => {
        renderLogs(trafficLogs);
      });
    }
    return false; // Do not hold message port
  });
}

async function handlePostForwarded(post, result) {
  const alertEntry = {
    ...post,
    apiResult: result,
    analysis: result?.analysis,
    filtered: result?.filtered,
    time: new Date().toLocaleTimeString()
  };

  // Add to recentAlerts
  const { recentAlerts = [] } = await chrome.storage.local.get('recentAlerts');
  recentAlerts.unshift(alertEntry);
  if (recentAlerts.length > 30) recentAlerts.pop();
  await chrome.storage.local.set({ recentAlerts });

  renderLastCapturedPost(alertEntry);
  renderAlertsStream(recentAlerts);

  const kpiData = await chrome.storage.local.get(['processedPostIds', 'recentAlerts']);
  renderKPIs(kpiData);

  if (result?.filtered) {
    addLog(`Post by "${post.author}" filtered out (non-traffic content).`, 'info');
  } else if (result?.telegramDelivered) {
    addLog(`🚨 Alert dispatched to Telegram! (${result.analysis?.location || 'Road incident'})`, 'success');
  }
}

async function notifyActiveTabSettings() {
  const data = await chrome.storage.local.get([
    'monitoringActive',
    'backendApiUrl',
    'apiSecretKey',
    'targetChatId'
  ]);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id && tab.url && tab.url.includes('facebook.com')) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'SETTINGS_UPDATED',
      monitoringActive: data.monitoringActive,
      backendApiUrl: data.backendApiUrl,
      apiSecretKey: data.apiSecretKey,
      targetChatId: data.targetChatId
    }).catch(() => {});
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
