/**
 * extension/gro10x-traffic-sentinel/popup.js
 * ─────────────────────────────────────────────────────────────────────────────
 * User interface controller for GRO10X Traffic Sentinel.
 * Manages live monitoring toggle, backend API keys, status checks,
 * and recent post preview.
 * ─────────────────────────────────────────────────────────────────────────────
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await checkActiveTab();
  initEventListeners();
});

async function loadSettings() {
  const data = await chrome.storage.local.get([
    'monitoringActive',
    'backendApiUrl',
    'apiSecretKey',
    'targetChatId',
    'lastCapturedPost',
    'processedPostIds'
  ]);

  const chkMonitoring = document.getElementById('chkMonitoring');
  const txtApiUrl = document.getElementById('txtApiUrl');
  const txtApiKey = document.getElementById('txtApiKey');
  const txtChatId = document.getElementById('txtChatId');
  const cacheCount = document.getElementById('cacheCount');

  chkMonitoring.checked = Boolean(data.monitoringActive);
  txtApiUrl.value = data.backendApiUrl || 'http://localhost:3000/api/traffic';
  txtApiKey.value = data.apiSecretKey || 'traffic_sec_gro10x_2026';
  txtChatId.value = data.targetChatId || '';

  const count = Array.isArray(data.processedPostIds) ? data.processedPostIds.length : 0;
  cacheCount.textContent = count;

  updateStatusPill(chkMonitoring.checked);
  renderLastCapturedPost(data.lastCapturedPost);
}

function updateStatusPill(isActive, customText = null) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  const toggleSubtext = document.getElementById('toggleSubtext');

  if (customText) {
    text.textContent = customText;
    dot.className = 'status-dot warning';
    return;
  }

  if (isActive) {
    dot.className = 'status-dot active';
    text.textContent = 'Monitoring Live';
    toggleSubtext.textContent = 'Actively scanning for new traffic posts';
  } else {
    dot.className = 'status-dot';
    text.textContent = 'Monitoring Paused';
    toggleSubtext.textContent = 'Click switch to enable auto-capture';
  }
}

async function checkActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const banner = document.getElementById('chronologicalBanner');

  if (!tab || !tab.url || !tab.url.includes('facebook.com/groups/')) {
    updateStatusPill(false, 'Not on FB Group');
    banner.style.display = 'none';
    return;
  }

  // Check if URL is sorted chronologically
  if (!tab.url.includes('sorting_setting=CHRONOLOGICAL') && !tab.url.includes('/posts/')) {
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }

  // Ping content script for live stats
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATUS' });
    if (res && res.cachedCount !== undefined) {
      document.getElementById('cacheCount').textContent = res.cachedCount;
    }
  } catch (_) {
    // Content script might not be injected yet
  }
}

function initEventListeners() {
  const chkMonitoring = document.getElementById('chkMonitoring');
  const btnSaveConfig = document.getElementById('btnSaveConfig');
  const btnScanNow = document.getElementById('btnScanNow');
  const btnClearCache = document.getElementById('btnClearCache');
  const btnFixSorting = document.getElementById('btnFixSorting');
  const btnToggleConfig = document.getElementById('btnToggleConfig');
  const configBody = document.getElementById('configBody');

  // Toggle config drawer
  btnToggleConfig.addEventListener('click', () => {
    const isShown = configBody.classList.toggle('open');
    btnToggleConfig.textContent = isShown ? 'Close' : 'Edit';
  });

  // Master monitoring toggle
  chkMonitoring.addEventListener('change', async () => {
    const isActive = chkMonitoring.checked;
    await chrome.storage.local.set({ monitoringActive: isActive });
    updateStatusPill(isActive);

    notifyActiveTabSettings();
  });

  // Save Config
  btnSaveConfig.addEventListener('click', async () => {
    const backendApiUrl = document.getElementById('txtApiUrl').value.trim();
    const apiSecretKey = document.getElementById('txtApiKey').value.trim();
    const targetChatId = document.getElementById('txtChatId').value.trim();

    await chrome.storage.local.set({
      backendApiUrl,
      apiSecretKey,
      targetChatId
    });

    btnSaveConfig.textContent = '✓ Saved!';
    setTimeout(() => {
      btnSaveConfig.textContent = 'Save Settings';
      configBody.classList.remove('open');
      btnToggleConfig.textContent = 'Edit';
    }, 1200);

    notifyActiveTabSettings();
  });

  // Scan Feed Now
  btnScanNow.addEventListener('click', async () => {
    btnScanNow.disabled = true;
    btnScanNow.textContent = 'Scanning...';

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      alert('Please open a Facebook group tab in Chrome.');
      btnScanNow.disabled = false;
      btnScanNow.textContent = '⚡ Scan Feed Now';
      return;
    }

    try {
      const res = await chrome.tabs.sendMessage(tab.id, { type: 'SCAN_FEED_NOW' });
      if (res && res.success) {
        btnScanNow.textContent = `Found ${res.capturedCount} new!`;
      } else {
        btnScanNow.textContent = 'Scan Completed';
      }
    } catch (e) {
      btnScanNow.textContent = 'Tab Not Ready';
    }

    setTimeout(async () => {
      btnScanNow.disabled = false;
      btnScanNow.textContent = '⚡ Scan Feed Now';
      const { lastCapturedPost } = await chrome.storage.local.get('lastCapturedPost');
      renderLastCapturedPost(lastCapturedPost);
    }, 1500);
  });

  // Clear Cache
  btnClearCache.addEventListener('click', async () => {
    if (confirm('Clear processed post memory? Posts already seen may be re-sent if still in feed.')) {
      await chrome.storage.local.set({ processedPostIds: [] });
      document.getElementById('cacheCount').textContent = '0';
      notifyActiveTabSettings();
    }
  });

  // Fix URL sorting
  btnFixSorting.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;

    try {
      const u = new URL(tab.url);
      u.searchParams.set('sorting_setting', 'CHRONOLOGICAL');
      chrome.tabs.update(tab.id, { url: u.toString() });
      document.getElementById('chronologicalBanner').style.display = 'none';
    } catch (err) {
      console.error(err);
    }
  });

  // Listen for real-time post forwarded events from content script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'POST_FORWARDED') {
      renderLastCapturedPost({
        ...message.post,
        apiResult: message.result,
        status: 'Sent'
      });
    }
  });
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

function renderLastCapturedPost(post) {
  const empty = document.getElementById('emptyPreview');
  const card = document.getElementById('postPreview');
  const author = document.getElementById('prevAuthor');
  const time = document.getElementById('prevTime');
  const text = document.getElementById('prevText');
  const status = document.getElementById('prevStatus');
  const link = document.getElementById('prevLink');

  if (!post) {
    empty.style.display = 'block';
    card.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  card.style.display = 'block';

  author.textContent = post.author || 'Facebook User';
  time.textContent = post.capturedAt ? new Date(post.capturedAt).toLocaleTimeString() : 'Recently';
  text.textContent = post.text ? (post.text.slice(0, 180) + (post.text.length > 180 ? '...' : '')) : '';

  if (post.apiResult && post.apiResult.filtered) {
    status.textContent = 'Filtered (Not traffic)';
    status.className = 'post-status filtered';
  } else if (post.status === 'Sent' || post.apiResult?.success) {
    status.textContent = '✓ Forwarded to Telegram';
    status.className = 'post-status sent';
  } else {
    status.textContent = post.status || 'Pending';
    status.className = 'post-status';
  }

  if (post.postUrl) {
    link.href = post.postUrl;
    link.style.display = 'inline';
  } else {
    link.style.display = 'none';
  }
}
