/**
 * tools/gro10x-lead-harvester/popup.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X LeadHarvester Popup Controller
 * Manages UI state, WhatsApp DOM extraction, AI profiling, CSV/JSON export & CRM sync.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const connStatus = document.getElementById('connStatus');
  const connText = document.getElementById('connText');
  const groupTitle = document.getElementById('groupTitle');
  const groupDescription = document.getElementById('groupDescription');
  const btnRefreshGroup = document.getElementById('btnRefreshGroup');
  const targetOfferSelect = document.getElementById('targetOfferSelect');

  const btnScan = document.getElementById('btnScan');
  const btnScanLabel = document.getElementById('btnScanLabel');
  const btnEnrich = document.getElementById('btnEnrich');

  const progressContainer = document.getElementById('progressContainer');
  const progressStatusText = document.getElementById('progressStatusText');
  const progressCountText = document.getElementById('progressCountText');
  const progressBar = document.getElementById('progressBar');

  const outputRail = document.getElementById('outputRail');
  const leadCountBadge = document.getElementById('leadCountBadge');
  const tier1Counter = document.getElementById('tier1Counter');
  const btnExportCsv = document.getElementById('btnExportCsv');
  const btnExportJson = document.getElementById('btnExportJson');
  const btnSyncCrm = document.getElementById('btnSyncCrm');
  const syncFeedback = document.getElementById('syncFeedback');

  const leadList = document.getElementById('leadList');
  const terminalStatus = document.getElementById('terminalStatus');

  const btnSettingsToggle = document.getElementById('btnSettingsToggle');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const settingsDrawer = document.getElementById('settingsDrawer');
  const apiUrlInput = document.getElementById('apiUrlInput');
  const scrollSpeedSelect = document.getElementById('scrollSpeedSelect');

  // State
  let activeTabId = null;
  let isWhatsAppTab = false;
  let isScanning = false;
  let extractedMembers = [];
  let currentGroup = { title: '', description: '', memberCountText: '' };

  // Load Saved Settings
  const savedSettings = await getStorage(['apiUrl', 'scrollSpeed', 'cachedGroup', 'cachedMembers']);
  if (savedSettings.apiUrl) apiUrlInput.value = savedSettings.apiUrl;
  if (savedSettings.scrollSpeed) scrollSpeedSelect.value = savedSettings.scrollSpeed;
  if (savedSettings.cachedGroup && savedSettings.cachedGroup.title) {
    currentGroup = savedSettings.cachedGroup;
    renderGroupInfo(currentGroup);
  }
  if (Array.isArray(savedSettings.cachedMembers) && savedSettings.cachedMembers.length > 0) {
    extractedMembers = savedSettings.cachedMembers;
    renderLeads(extractedMembers);
    outputRail.classList.remove('hidden');
    btnEnrich.removeAttribute('disabled');
    leadCountBadge.textContent = `${extractedMembers.length} Leads`;
  }

  // 1. WhatsApp Tab Handshake
  await checkActiveTab();

  // Preset API pills
  document.querySelectorAll('.preset-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      apiUrlInput.value = pill.getAttribute('data-url');
      saveSettings();
      logTerminal(`API URL switched to: ${apiUrlInput.value}`);
    });
  });

  apiUrlInput.addEventListener('change', saveSettings);
  scrollSpeedSelect.addEventListener('change', saveSettings);

  btnSettingsToggle.addEventListener('click', () => {
    settingsDrawer.classList.toggle('hidden');
  });
  btnCloseSettings.addEventListener('click', () => {
    settingsDrawer.classList.add('hidden');
  });

  btnRefreshGroup.addEventListener('click', async () => {
    await refreshGroupContext();
  });

  // 2. Scan & Auto-Scroll Trigger
  btnScan.addEventListener('click', async () => {
    if (!isWhatsAppTab) {
      alert('Please navigate to web.whatsapp.com and open any group chat first.');
      return;
    }

    if (!isScanning) {
      // Start Scan
      isScanning = true;
      btnScanLabel.textContent = '⏹️ Stop Auto-Scroll';
      btnScan.style.background = 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)';
      progressContainer.classList.remove('hidden');
      progressBar.style.width = '15%';
      progressStatusText.textContent = 'Scanning WhatsApp member list...';
      logTerminal('SYS: Scanning & virtual scroll loop initiated...');

      const speed = parseInt(scrollSpeedSelect.value, 10) || 350;
      chrome.tabs.sendMessage(activeTabId, { type: 'START_SCAN', scrollDelay: speed }, (res) => {
        if (chrome.runtime.lastError) {
          logTerminal(`ERR: ${chrome.runtime.lastError.message}`);
          resetScanButton();
        }
      });
    } else {
      // Stop Scan
      chrome.tabs.sendMessage(activeTabId, { type: 'STOP_SCAN' });
      resetScanButton();
      logTerminal('SYS: Stop signal sent to content script.');
    }
  });

  // 3. AI Enrich Ingress Trigger
  btnEnrich.addEventListener('click', async () => {
    if (extractedMembers.length === 0) return;

    btnEnrich.setAttribute('disabled', 'true');
    btnEnrich.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-label">Profiling via AI...</span>';
    progressContainer.classList.remove('hidden');
    progressBar.style.width = '40%';
    progressStatusText.textContent = 'AI Profiler generating lead tiers & icebreakers...';
    logTerminal(`AI: Packaging ${extractedMembers.length} leads for Mother OS Ingress...`);

    const apiUrl = apiUrlInput.value.trim().replace(/\/+$/, '');
    const targetOffer = targetOfferSelect.value;

    try {
      const response = await fetch(`${apiUrl}/api/leads/ai-enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_name: currentGroup.title || 'WhatsApp Community',
          group_description: currentGroup.description || '',
          target_offer: targetOffer,
          members: extractedMembers
        })
      });

      const data = await response.json();
      if (data.ok && Array.isArray(data.members)) {
        extractedMembers = data.members;
        setStorage({ cachedMembers: extractedMembers });
        renderLeads(extractedMembers);
        progressBar.style.width = '100%';
        progressStatusText.textContent = `✅ Successfully enriched ${data.count} members!`;
        logTerminal(`AI: Enrichment complete. Tier 1 leads highlighted.`);
        outputRail.classList.remove('hidden');
        leadCountBadge.textContent = `${extractedMembers.length} Leads`;
      } else {
        throw new Error(data.error || 'Failed to enrich leads');
      }
    } catch (err) {
      logTerminal(`AI ERR: ${err.message}. Retrying via background worker...`);
      // Fallback via background proxy in case of CORS restriction
      chrome.runtime.sendMessage({
        type: 'PROXY_FETCH',
        url: `${apiUrl}/api/leads/ai-enrich`,
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            group_name: currentGroup.title || 'WhatsApp Community',
            group_description: currentGroup.description || '',
            target_offer: targetOffer,
            members: extractedMembers
          })
        }
      }, (proxyRes) => {
        if (proxyRes && proxyRes.ok && proxyRes.data?.members) {
          extractedMembers = proxyRes.data.members;
          setStorage({ cachedMembers: extractedMembers });
          renderLeads(extractedMembers);
          progressBar.style.width = '100%';
          progressStatusText.textContent = `✅ Successfully enriched ${extractedMembers.length} members!`;
          outputRail.classList.remove('hidden');
        } else {
          logTerminal(`ERR: ${proxyRes?.error || 'Could not connect to Mother OS API at ' + apiUrl}`);
          alert(`Could not connect to Mother OS at ${apiUrl}.\nPlease verify that Mother OS is running ('npm run dev') or switch to Production URL in settings.`);
        }
      });
    } finally {
      btnEnrich.removeAttribute('disabled');
      btnEnrich.innerHTML = '<span class="btn-icon">🤖</span><span class="btn-label">AI Lead Profile & Enrich</span>';
    }
  });

  // 4. Export CSV Rail (UTF-8 BOM for flawless Excel display)
  btnExportCsv.addEventListener('click', () => {
    if (extractedMembers.length === 0) return;
    const csvContent = generateCsv(extractedMembers, currentGroup.title);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const filename = `gro10x_leads_${sanitize(currentGroup.title || 'whatsapp')}_${Date.now()}.csv`;

    downloadFile(url, filename);
    logTerminal(`EXPORT: Downloaded ${extractedMembers.length} leads as CSV.`);
  });

  // 5. Export JSON Rail
  btnExportJson.addEventListener('click', () => {
    if (extractedMembers.length === 0) return;
    const jsonObj = {
      gro10x_export_version: '1.0.0',
      exported_at: new Date().toISOString(),
      group_name: currentGroup.title || 'WhatsApp Community',
      group_description: currentGroup.description || '',
      target_offer: targetOfferSelect.value,
      total_members: extractedMembers.length,
      members: extractedMembers
    };
    const blob = new Blob([JSON.stringify(jsonObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const filename = `gro10x_leads_${sanitize(currentGroup.title || 'whatsapp')}_${Date.now()}.json`;

    downloadFile(url, filename);
    logTerminal(`EXPORT: Downloaded ${extractedMembers.length} leads as JSON.`);
  });

  // 6. 1-Click Sync to Mother OS CRM
  btnSyncCrm.addEventListener('click', async () => {
    if (extractedMembers.length === 0) return;

    btnSyncCrm.innerHTML = '<span>⏳ Syncing...</span>';
    btnSyncCrm.setAttribute('disabled', 'true');
    logTerminal(`CRM: Syncing ${extractedMembers.length} leads to Mother OS database...`);

    const apiUrl = apiUrlInput.value.trim().replace(/\/+$/, '');
    const targetOffer = targetOfferSelect.value;

    try {
      const response = await fetch(`${apiUrl}/api/leads/harvester-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_name: currentGroup.title || 'WhatsApp Community',
          target_offer: targetOffer,
          leads: extractedMembers
        })
      });

      const resData = await response.json();
      if (resData.ok && resData.success) {
        showSyncSuccess(resData.count, apiUrl);
      } else {
        throw new Error(resData.error || 'Sync request failed');
      }
    } catch (err) {
      // Fallback via background proxy
      chrome.runtime.sendMessage({
        type: 'PROXY_FETCH',
        url: `${apiUrl}/api/leads/harvester-sync`,
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            group_name: currentGroup.title || 'WhatsApp Community',
            target_offer: targetOffer,
            leads: extractedMembers
          })
        }
      }, (proxyRes) => {
        if (proxyRes && proxyRes.ok && proxyRes.data?.success) {
          showSyncSuccess(proxyRes.data.count, apiUrl);
        } else {
          syncFeedback.classList.remove('hidden');
          syncFeedback.style.background = 'rgba(239, 68, 68, 0.15)';
          syncFeedback.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          syncFeedback.style.color = '#f87171';
          syncFeedback.innerHTML = `❌ Sync Failed: ${proxyRes?.error || err.message}`;
          logTerminal(`CRM ERR: ${proxyRes?.error || err.message}`);
        }
      });
    } finally {
      btnSyncCrm.removeAttribute('disabled');
      btnSyncCrm.innerHTML = '<span>☁️ Sync to CRM</span>';
    }
  });

  // 7. Background / Content Script Message Listener
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SCAN_PROGRESS') {
      progressCountText.textContent = `${message.count} members`;
      progressBar.style.width = `${Math.min(95, 20 + message.count * 0.4)}%`;
      logTerminal(`SCAN: Captured ${message.count} members...`);
    }

    if (message.type === 'SCAN_COMPLETE') {
      isScanning = false;
      resetScanButton();
      extractedMembers = message.members || [];
      setStorage({ cachedMembers: extractedMembers });

      progressBar.style.width = '100%';
      progressStatusText.textContent = `✅ Scan Finished! ${extractedMembers.length} members captured.`;
      progressCountText.textContent = `${extractedMembers.length} members`;
      outputRail.classList.remove('hidden');
      btnEnrich.removeAttribute('disabled');
      leadCountBadge.textContent = `${extractedMembers.length} Leads`;

      renderLeads(extractedMembers);
      logTerminal(`SYS: Scan complete. ${extractedMembers.length} unique members in buffer.`);
      chrome.runtime.sendMessage({ type: 'UPDATE_BADGE', count: extractedMembers.length });
    }

    if (message.type === 'SCAN_ERROR') {
      resetScanButton();
      progressStatusText.textContent = `❌ Error during extraction`;
      logTerminal(`ERR: ${message.error}`);
      alert(`WhatsApp Extraction Notice:\n${message.error}`);
    }
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Helper Functions
  // ───────────────────────────────────────────────────────────────────────────

  async function checkActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && tab.url.includes('web.whatsapp.com')) {
        activeTabId = tab.id;
        isWhatsAppTab = true;
        connStatus.className = 'status-pill status-connected';
        connText.textContent = 'WhatsApp Web Connected';
        logTerminal('SYS: Active WhatsApp Web tab attached.');
        await refreshGroupContext();
      } else {
        connStatus.className = 'status-pill status-disconnected';
        connText.textContent = 'Not on WhatsApp Web';
        logTerminal('SYS: Please open web.whatsapp.com to scan.');
      }
    } catch (e) {
      logTerminal(`SYS: Tab query warning: ${e.message}`);
    }
  }

  async function refreshGroupContext() {
    if (!activeTabId) return;
    chrome.tabs.sendMessage(activeTabId, { type: 'GET_GROUP_INFO' }, (info) => {
      if (chrome.runtime.lastError) {
        logTerminal(`SYS: ${chrome.runtime.lastError.message}`);
        return;
      }
      if (info && info.title) {
        currentGroup = info;
        setStorage({ cachedGroup: currentGroup });
        renderGroupInfo(currentGroup);
        logTerminal(`GROUP: Detected "${info.title}" (${info.memberCountText || 'active chat'})`);
      }
    });
  }

  function renderGroupInfo(group) {
    groupTitle.textContent = group.title || 'Active WhatsApp Group';
    groupDescription.textContent = group.description || group.memberCountText || 'No group description preview detected.';
  }

  function renderLeads(leads) {
    leadList.innerHTML = '';
    if (!leads || leads.length === 0) {
      leadList.innerHTML = `
        <div class="empty-feed-placeholder">
          <div class="placeholder-icon">📡</div>
          <p>No members scanned yet.</p>
          <small>Open a WhatsApp group in the active tab and click <b>[Scan & Auto-Scroll Members]</b>.</small>
        </div>`;
      return;
    }

    let tier1Count = 0;

    leads.forEach((l, i) => {
      const card = document.createElement('div');
      const isT1 = l.lead_tier?.includes('Tier 1');
      const isT2 = l.lead_tier?.includes('Tier 2');
      const isT3 = l.lead_tier?.includes('Tier 3');

      if (isT1) tier1Count++;

      card.className = `lead-card ${isT1 ? 'tier-1' : (isT2 ? 'tier-2' : (isT3 ? 'tier-3' : ''))}`;

      const tierBadgeClass = isT1 ? 't1' : (isT2 ? 't2' : 't3');
      const tierShort = isT1 ? 'TIER 1 (ENTERPRISE)' : (isT2 ? 'TIER 2 (GROWTH)' : 'TIER 3');

      card.innerHTML = `
        <div class="lead-primary-row">
          <div class="lead-name-group">
            <span class="lead-name" title="${escapeHtml(l.name)}">${escapeHtml(l.name)}</span>
            ${l.is_admin ? '<span class="badge-admin">👑 Admin</span>' : ''}
          </div>
          <span class="badge-tier ${tierBadgeClass}">${l.lead_tier ? tierShort : (l.is_admin ? 'ADMIN' : 'MEMBER')}</span>
        </div>
        <div class="lead-meta-row">
          <span>📞 ${escapeHtml(l.phone || 'No Phone')}</span>
          <span>${escapeHtml(l.seniority || (l.is_admin ? 'Admin' : 'Member'))}</span>
        </div>
        ${l.about ? `<div class="lead-about" title="${escapeHtml(l.about)}">“${escapeHtml(l.about)}”</div>` : ''}
        <div class="lead-actions-row">
          <span class="match-offer-tag" title="${escapeHtml(l.match_offer || '')}">🎯 ${escapeHtml(l.match_offer ? l.match_offer.split(':')[0] : 'Engine 2')}</span>
          <div class="icebreaker-buttons">
            <button class="copy-mini-btn" data-copy="${escapeHtml(l.icebreaker_en || l.name)}" title="Copy English WhatsApp Icebreaker">EN</button>
            <button class="copy-mini-btn" data-copy="${escapeHtml(l.icebreaker_bn || l.name)}" title="Copy Bangla WhatsApp Icebreaker">বাংলা</button>
          </div>
        </div>
      `;

      leadList.appendChild(card);
    });

    tier1Counter.textContent = `Tier 1: ${tier1Count}`;

    // Attach copy button handlers
    leadList.querySelectorAll('.copy-mini-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const textToCopy = e.target.getAttribute('data-copy');
        navigator.clipboard.writeText(textToCopy);
        const original = e.target.textContent;
        e.target.textContent = '✓ Copied';
        setTimeout(() => { e.target.textContent = original; }, 1400);
      });
    });
  }

  function resetScanButton() {
    isScanning = false;
    btnScanLabel.textContent = 'Scan & Auto-Scroll Members';
    btnScan.style.background = 'linear-gradient(135deg, #00f2fe 0%, #00a8ff 100%)';
  }

  function showSyncSuccess(count, apiUrl) {
    syncFeedback.classList.remove('hidden');
    syncFeedback.style.background = 'rgba(0, 223, 137, 0.15)';
    syncFeedback.style.borderColor = 'rgba(0, 223, 137, 0.4)';
    syncFeedback.style.color = '#00df89';
    syncFeedback.innerHTML = `
      ✅ <b>Synced ${count} Leads to GRO10X OS CRM!</b><br>
      <a href="${apiUrl}/app#leads" target="_blank" style="color: #00f2fe; text-decoration: underline; font-weight: bold; margin-top: 3px; display: inline-block;">👉 Open CRM Board (/app#leads)</a>
    `;
    logTerminal(`CRM: Successfully inserted ${count} leads into GRO10X CRM.`);
  }

  function logTerminal(msg) {
    const time = new Date().toTimeString().split(' ')[0];
    terminalStatus.textContent = `[${time}] ${msg}`;
  }

  function generateCsv(leads, groupName = 'WhatsApp Group') {
    // Prepend UTF-8 BOM (\uFEFF) for Microsoft Excel compatibility
    const headers = [
      'ID',
      'Name',
      'Phone',
      'WhatsApp Number',
      'Seniority',
      'Lead Tier',
      'Match Offer',
      'Is Admin',
      'Score',
      'About / Status',
      'Icebreaker (EN)',
      'Icebreaker (BN)',
      'Group Name',
      'Harvest Date'
    ];

    const rows = leads.map((l, i) => [
      `"${l.id || 'WH-' + (i + 1)}"`,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.seniority || '').replace(/"/g, '""')}"`,
      `"${(l.lead_tier || '').replace(/"/g, '""')}"`,
      `"${(l.match_offer || '').replace(/"/g, '""')}"`,
      `"${l.is_admin ? 'Yes' : 'No'}"`,
      `"${l.score || 50}"`,
      `"${(l.about || '').replace(/"/g, '""')}"`,
      `"${(l.icebreaker_en || '').replace(/"/g, '""')}"`,
      `"${(l.icebreaker_bn || '').replace(/"/g, '""')}"`,
      `"${(l.group_name || groupName).replace(/"/g, '""')}"`,
      `"${new Date().toISOString()}"`
    ]);

    return '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  }

  function downloadFile(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function sanitize(str) {
    return str.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function saveSettings() {
    setStorage({
      apiUrl: apiUrlInput.value.trim(),
      scrollSpeed: scrollSpeedSelect.value
    });
  }

  function getStorage(keys) {
    return new Promise(resolve => chrome.storage.local.get(keys, resolve));
  }

  function setStorage(obj) {
    return new Promise(resolve => chrome.storage.local.set(obj, resolve));
  }
});
