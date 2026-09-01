/**
 * GRO10X DBM Copilot - Side Panel Controller v0.2
 * Supports Relationship-First WhatsApp Outreach & DBM Studio Pipelines.
 */

// Embedded SKU Database for DBMs
const SKU_CATALOG = {
  'PLA-14': {
    brandName: 'PlannerQueenGro',
    title: 'Daily & Weekly Planners #1 — Aesthetic Productivity System',
    palette: ['#8B5A7A', '#FAF3E8', '#7D9B76', '#C4887C', '#2E2E2E'],
    spreads: [
      { id: 1, name: 'Spread 1: Front Cover & Owner Registration', prompt: '3:4 portrait luxury botanical minimalist planner front cover for PlannerQueenGro, #8B5A7A on #FAF3E8 background, Playfair Display typography, "Daily & Weekly Planners #1", ownership card.' },
      { id: 2, name: 'Spread 2: System Quick-Start & Rituals', prompt: '3:4 portrait 3-card morning, timeblock, and evening planning ritual walkthrough, clean vector cards, warm cream aesthetic.' }
    ],
    mockups: []
  }
};

// ── LEADS DATABASE FOR OUTREACH ──
const LEADS_DATABASE = [
  { id: 'ARW_001', name: 'Abu Jafar', phone: '8801322276099', email: 'export.docs1955@gmail.com', designation: 'Commercial Documentation Manager', honorific: 'bhai', status: 'Pending' },
  { id: 'ARW_006', name: 'Himel Sikder', phone: '8801687369350', email: 'himel.himu009@gmail.com', designation: 'Commercial Document Executive', honorific: 'bhai', status: 'Pending' },
  { id: 'ARW_007', name: 'Md. Sanjid Ahmed', phone: '8801716698337', email: 'sanjid5000@gmail.com', designation: 'Commercial Document Executive', honorific: 'bhai', status: 'Sent' },
  { id: 'ARW_008', name: 'Jahanara Sultana', phone: '8801755611170', email: 'jahanara.sultana2202@gmail.com', designation: 'Commercial Document Executive', honorific: 'apu', status: 'Pending' },
  { id: 'ARW_009', name: 'Zakia Ishrat', phone: '8801632122589', email: 'zakiaishrat500@gmail.com', designation: 'Commercial Document Executive', honorific: 'apu', status: 'Pending' },
  { id: 'ARW_010', name: 'Akm Faruque Chowdhury', phone: '8801847355734', email: 'aglfaruque@gmail.com', designation: 'Sr Commercial Document Executive', honorific: 'bhai', status: 'Pending' },
  { id: 'ARW_011', name: 'Md. Didarul Islam', phone: '8801719052685', email: 'didar007@gmail.com', designation: 'Asst Commercial Document Manager', honorific: 'bhai', status: 'Pending' },
  { id: 'ARW_012', name: 'Md. Jahid Newaj Islam', phone: '8801757838717', email: 'jnewaj@gmail.com', designation: 'Commercial Documentation Manager', honorific: 'bhai', status: 'Pending' }
];

// State
let STATE = {
  activeSku: 'PLA-14',
  activeMode: 'spreads',
  delaySeconds: 15,
  isRunning: false,
  isPaused: false,
  currentIndex: 0,
  queue: [],
  harvested: [],
  leads: [...LEADS_DATABASE],
  currentLeadIndex: 0,
  autoSendWhatsApp: true
};

// UI Elements
const skuSelect = document.getElementById('skuSelect');
const promptPreview = document.getElementById('promptPreviewText');
const queueProgressLabel = document.getElementById('queueProgressLabel');
const queueCountLabel = document.getElementById('queueCountLabel');
const progressBar = document.getElementById('progressBar');
const queueList = document.getElementById('queueItemsList');
const queueTotalBadge = document.getElementById('queueTotalBadge');
const harvestGrid = document.getElementById('harvestGrid');
const harvestCountBadge = document.getElementById('harvestCount');
const btnStart = document.getElementById('btnStartBatch');
const btnPause = document.getElementById('btnPauseBatch');
const btnStop = document.getElementById('btnStopBatch');
const btnCopyPrompt = document.getElementById('btnCopyCurrentPrompt');
const btnSyncToStudio = document.getElementById('btnSyncToStudio');
const btnClearHarvest = document.getElementById('btnClearHarvest');

// Outreach Elements
const leadsListContainer = document.getElementById('leadsListContainer');
const outreachCountLabel = document.getElementById('outreachCountLabel');
const outreachProgressBar = document.getElementById('outreachProgressBar');
const outreachTemplate = document.getElementById('outreachTemplate');
const btnStartOutreachQueue = document.getElementById('btnStartOutreachQueue');
const btnSendNextLead = document.getElementById('btnSendNextLead');
const btnResetTemplate = document.getElementById('btnResetTemplate');
const chkAutoSendWhatsApp = document.getElementById('chkAutoSendWhatsApp');

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupEventListeners();
  await loadSavedState();
  updateQueueState();
  renderQueueList();
  renderHarvestGrid();
  renderLeadsList();
});

// Tab Switcher
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(`tab-${btn.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });
}

// Event Listeners
function setupEventListeners() {
  if (skuSelect) {
    skuSelect.addEventListener('change', (e) => {
      STATE.activeSku = e.target.value;
      STATE.currentIndex = 0;
      updateQueueState();
      renderQueueList();
      saveState();
    });
  }

  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.activeMode = btn.dataset.mode;
      STATE.currentIndex = 0;
      updateQueueState();
      renderQueueList();
      saveState();
    });
  });

  if (btnCopyPrompt) {
    btnCopyPrompt.addEventListener('click', () => {
      navigator.clipboard.writeText(promptPreview.value);
      showToast('📋 Copied prompt to clipboard!');
    });
  }

  if (btnStart) btnStart.addEventListener('click', startBatchExecution);
  if (btnPause) btnPause.addEventListener('click', togglePause);
  if (btnStop) btnStop.addEventListener('click', stopBatchExecution);

  if (btnClearHarvest) {
    btnClearHarvest.addEventListener('click', () => {
      STATE.harvested = [];
      renderHarvestGrid();
      saveState();
      showToast('Harvested cache cleared');
    });
  }

  if (btnSyncToStudio) btnSyncToStudio.addEventListener('click', syncToStudio);

  // Outreach Handlers
  if (chkAutoSendWhatsApp) {
    chkAutoSendWhatsApp.checked = STATE.autoSendWhatsApp;
    chkAutoSendWhatsApp.addEventListener('change', (e) => {
      STATE.autoSendWhatsApp = e.target.checked;
      saveState();
      showToast(STATE.autoSendWhatsApp ? '⚡ Auto-Click Send: Enabled' : '⏸ Auto-Click Send: Disabled (Manual Review)');
    });
  }

  const outreachDelaySlider = document.getElementById('outreachDelaySlider');
  const pacingLabel = document.getElementById('pacingLabel');
  if (outreachDelaySlider && pacingLabel) {
    outreachDelaySlider.value = STATE.delaySeconds || 18;
    pacingLabel.textContent = `${outreachDelaySlider.value}s Delay`;
    outreachDelaySlider.addEventListener('input', (e) => {
      STATE.delaySeconds = parseInt(e.target.value, 10);
      pacingLabel.textContent = `${STATE.delaySeconds}s Delay`;
      saveState();
    });
  }

  if (btnSendNextLead) {
    btnSendNextLead.addEventListener('click', () => {
      sendNextLeadWhatsApp();
    });
  }

  if (btnStartOutreachQueue) {
    btnStartOutreachQueue.addEventListener('click', () => {
      startAutomatedOutreachQueue();
    });
  }

  if (btnResetTemplate) {
    btnResetTemplate.addEventListener('click', () => {
      outreachTemplate.value = `Assalamu Alaikum {{Name}} {{Honorific}},

This is Firoz. I hope you and your family are doing great.

I've been working with the Google AI ecosystem for the last 1.5 years and recently secured a special partnership access. I have a very limited number of 18-month Gemini Pro subscriptions available at a massive discount.

Knowing you work as {{Designation}}, I thought this could be incredibly useful for drafting commercial documents, managing international emails, data verification, and your overall daily workflow. I also help professionals and teams integrate Google AI into their daily tasks to save hours of manual paperwork.

If you or your team might be interested in the Gemini subscription or AI integration, just let me know! I'd love to share the details with you.

Warm regards,
Firoz`;
      showToast('Template reset to friendly default');
    });
  }

  const btnResetLeads = document.getElementById('btnResetLeadStatuses');
  if (btnResetLeads) {
    btnResetLeads.addEventListener('click', () => {
      stopOutreachQueue();
      STATE.leads.forEach(l => l.status = 'Pending');
      renderLeadsList();
      saveState();
      showToast('🔄 All lead statuses reset to Pending!');
    });
  }
}

// ── WHATSAPP OUTREACH CONTROLLER ──
function buildPersonalizedMessage(lead) {
  let text = outreachTemplate.value || '';
  const honorific = lead.honorific || (lead.name.toLowerCase().includes('jahanara') || lead.name.toLowerCase().includes('zakia') ? 'apu' : 'bhai');
  text = text.replace(/\{\{Name\}\}/g, lead.name);
  text = text.replace(/\{\{Honorific\}\}/g, honorific);
  text = text.replace(/\{\{Designation\}\}/g, lead.designation);
  text = text.replace(/\{\{Phone\}\}/g, lead.phone);
  return text;
}

function getWhatsAppUrl(lead) {
  const message = buildPersonalizedMessage(lead);
  const encoded = encodeURIComponent(message);
  return `https://web.whatsapp.com/send?phone=${lead.phone}&text=${encoded}`;
}

function renderLeadsList() {
  if (!leadsListContainer) return;
  leadsListContainer.innerHTML = '';

  const sentCount = STATE.leads.filter(l => l.status === 'Sent').length;
  outreachCountLabel.textContent = `${sentCount} / ${STATE.leads.length} Sent`;
  const pct = Math.round((sentCount / STATE.leads.length) * 100);
  outreachProgressBar.style.width = `${pct}%`;

  STATE.leads.forEach((lead, idx) => {
    const isSent = lead.status === 'Sent';
    const isNext = !isSent && STATE.leads.findIndex(l => l.status !== 'Sent') === idx;

    const item = document.createElement('div');
    item.className = `queue-item ${isNext ? 'active' : ''} ${isSent ? 'done' : ''}`;
    
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = 'flex: 1; min-width: 0; padding-right: 6px;';
    infoDiv.innerHTML = `
      <strong style="color: ${isSent ? '#94a3b8' : isNext ? 'var(--color-primary)' : 'var(--text-primary)'}; font-size: 11px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        ${lead.name} (${lead.honorific || 'bhai'})
      </strong>
      <div style="color: var(--text-muted); font-size: 10px;">
        ${lead.designation} · <span style="color: var(--color-cyan); font-family: monospace;">+${lead.phone}</span>
      </div>
    `;
    
    const actionDiv = document.createElement('div');
    actionDiv.style.cssText = 'display: flex; gap: 4px; align-items: center;';
    
    const badge = document.createElement('span');
    badge.className = 'badge';
    if (isSent) {
      badge.style.cssText = 'background:rgba(0,223,137,0.15); color:#00df89;';
    } else if (isNext) {
      badge.style.cssText = 'background:rgba(6,182,212,0.15); color:#06b6d4;';
    }
    badge.textContent = lead.status;
    
    const btnSend = document.createElement('button');
    btnSend.className = 'btn-primary';
    btnSend.style.cssText = 'padding: 4px 8px; font-size: 10px; border-radius: 4px; background: #25D366; color: #fff; cursor: pointer;';
    btnSend.textContent = '💬 Send';
    btnSend.addEventListener('click', () => {
      sendIndividualLead(lead.id);
    });
    
    actionDiv.appendChild(badge);
    actionDiv.appendChild(btnSend);
    
    item.appendChild(infoDiv);
    item.appendChild(actionDiv);
    leadsListContainer.appendChild(item);
  });
}

function sendIndividualLead(leadId) {
  const lead = STATE.leads.find(l => l.id === leadId);
  if (!lead) return;

  const url = getWhatsAppUrl(lead);
  chrome.tabs.create({ url: url });
  lead.status = 'Sent';
  renderLeadsList();
  saveState();
  showToast(`💬 Opened WhatsApp chat for ${lead.name}`);
}

function sendNextLeadWhatsApp() {
  const nextLead = STATE.leads.find(l => l.status !== 'Sent');
  if (!nextLead) {
    showToast('🎉 All leads have been sent!', 'success');
    return;
  }
  sendIndividualLead(nextLead.id);
}

let outreachTimerId = null;
let outreachCountdownInterval = null;
let isOutreachRunning = false;
let currentOutreachTabId = null;

const liveCountdownBox = document.getElementById('liveCountdownBox');
const countdownSecondsText = document.getElementById('countdownSecondsText');

async function startAutomatedOutreachQueue() {
  if (isOutreachRunning) {
    stopOutreachQueue();
    return;
  }

  const pendingLeads = STATE.leads.filter(l => l.status !== 'Sent');
  if (!pendingLeads.length) {
    showToast('All leads already sent. Click "Reset All" to restart.');
    return;
  }

  isOutreachRunning = true;
  btnStartOutreachQueue.innerHTML = '<span>⏹</span> Stop Auto-Queue';
  btnStartOutreachQueue.style.background = '#ef4444';
  showToast(`🚀 Auto-Queue started! (${pendingLeads.length} leads pending)`);

  runOutreachLoop();
}

function stopOutreachQueue() {
  isOutreachRunning = false;
  clearTimeout(outreachTimerId);
  clearInterval(outreachCountdownInterval);
  if (liveCountdownBox) liveCountdownBox.style.display = 'none';
  btnStartOutreachQueue.innerHTML = '<span>▶</span> Start Auto-Queue';
  btnStartOutreachQueue.style.background = '';
  showToast('⏸ Auto-Queue Stopped');
}

async function runOutreachLoop() {
  if (!isOutreachRunning) return;

  const nextLead = STATE.leads.find(l => l.status !== 'Sent');
  if (!nextLead) {
    stopOutreachQueue();
    showToast('🎉 All leads in campaign sent successfully!', 'success');
    return;
  }

  // 1. Close previous tab if opened
  if (currentOutreachTabId) {
    try {
      await chrome.tabs.remove(currentOutreachTabId);
    } catch(e) {}
    currentOutreachTabId = null;
  }

  // 2. Open next lead chat
  const url = getWhatsAppUrl(nextLead);
  const tab = await chrome.tabs.create({ url: url });
  currentOutreachTabId = tab ? tab.id : null;

  nextLead.status = 'Sent';
  renderLeadsList();
  saveState();

  const pacingSeconds = STATE.delaySeconds || 18;
  showToast(`💬 Opened ${nextLead.name}! Auto-sending...`);

  // Start live countdown visual ticker
  let remaining = pacingSeconds;
  if (liveCountdownBox) liveCountdownBox.style.display = 'block';
  if (countdownSecondsText) countdownSecondsText.textContent = remaining;

  clearInterval(outreachCountdownInterval);
  outreachCountdownInterval = setInterval(() => {
    remaining--;
    if (countdownSecondsText) countdownSecondsText.textContent = remaining;
    if (remaining <= 0) {
      clearInterval(outreachCountdownInterval);
      if (liveCountdownBox) liveCountdownBox.style.display = 'none';
      if (isOutreachRunning) runOutreachLoop();
    }
  }, 1000);
}

// ── DBM STUDIO GENERATOR CONTROLLER ──
function updateQueueState() {
  const currentSku = SKU_CATALOG[STATE.activeSku] || SKU_CATALOG['PLA-14'];
  const items = STATE.activeMode === 'mockups' ? currentSku.mockups : currentSku.spreads;
  STATE.queue = items || [];
  
  if (queueTotalBadge) queueTotalBadge.textContent = `${STATE.queue.length} Prompts`;
  if (queueCountLabel) queueCountLabel.textContent = `${STATE.currentIndex} / ${STATE.queue.length}`;
  
  const currentItem = STATE.queue[STATE.currentIndex] || STATE.queue[0];
  if (promptPreview) promptPreview.value = currentItem ? currentItem.prompt : 'No prompts in current queue.';
  
  const pct = STATE.queue.length ? Math.round((STATE.currentIndex / STATE.queue.length) * 100) : 0;
  if (progressBar) progressBar.style.width = `${pct}%`;
}

function renderQueueList() {
  if (!queueList) return;
  queueList.innerHTML = '';
  STATE.queue.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = `queue-item ${idx === STATE.currentIndex ? 'active' : ''} ${idx < STATE.currentIndex ? 'done' : ''}`;
    el.innerHTML = `
      <div>
        <strong style="color: ${idx === STATE.currentIndex ? 'var(--color-primary)' : 'var(--text-primary)'};">
          #${idx + 1} · ${item.name || 'Item'}
        </strong>
        <div style="color: var(--text-muted); font-size: 10px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 200px;">
          ${item.prompt.substring(0, 45)}...
        </div>
      </div>
      <span class="badge" style="${idx < STATE.currentIndex ? 'background:rgba(0,223,137,0.2); color:#00df89;' : ''}">
        ${idx < STATE.currentIndex ? '✓ Done' : idx === STATE.currentIndex ? '⚡ Active' : 'Waiting'}
      </span>
    `;
    queueList.appendChild(el);
  });
}

function renderHarvestGrid() {
  if (!harvestCountBadge || !harvestGrid) return;
  harvestCountBadge.textContent = STATE.harvested.length;
  if (!STATE.harvested.length) {
    harvestGrid.innerHTML = '<div class="empty-state">No assets harvested yet.</div>';
    return;
  }
  harvestGrid.innerHTML = '';
  STATE.harvested.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'harvest-card';
    card.innerHTML = `
      <img src="${item.url}" alt="${item.title || 'Render'}" />
      <span class="tag">Slot ${item.slot || idx + 1}</span>
    `;
    harvestGrid.appendChild(card);
  });
}

async function startBatchExecution() {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab || !activeTab.id) {
    showToast('⚠️ No active browser tab found', 'error');
    return;
  }

  if (STATE.currentIndex >= STATE.queue.length) {
    STATE.currentIndex = 0;
    updateQueueState();
  }

  STATE.isRunning = true;
  STATE.isPaused = false;
  btnStart.disabled = true;
  btnPause.disabled = false;
  btnStop.disabled = false;
  queueProgressLabel.textContent = `Dispatching on: ${activeTab.title?.substring(0, 16)}...`;

  try {
    const response = await chrome.tabs.sendMessage(activeTab.id, {
      type: 'START_BATCH_INJECTION',
      payload: {
        sku: STATE.activeSku,
        mode: STATE.activeMode,
        queue: STATE.queue,
        startIndex: STATE.currentIndex,
        delaySeconds: STATE.delaySeconds
      }
    });

    if (response && response.received) {
      showToast('🚀 Batch automation dispatched!');
    }
  } catch (err) {
    showToast('⚠️ Tab script not ready. Refresh tab and try again.', 'error');
    stopBatchExecution();
  }
}

function togglePause() {
  STATE.isPaused = !STATE.isPaused;
  btnPause.innerHTML = STATE.isPaused ? '<span class="icon">▶</span> Resume' : '<span class="icon">⏸</span> Pause';
  queueProgressLabel.textContent = STATE.isPaused ? '⏸ Paused' : '▶ Running...';
}

function stopBatchExecution() {
  STATE.isRunning = false;
  STATE.isPaused = false;
  btnStart.disabled = false;
  btnPause.disabled = true;
  btnStop.disabled = true;
  queueProgressLabel.textContent = 'Stopped.';
}

async function syncToStudio() {
  if (!STATE.harvested.length) {
    showToast('⚠️ No harvested assets to sync.', 'error');
    return;
  }
  showToast(`✅ Synced ${STATE.harvested.length} assets to GRO10X Studio!`);
}

async function saveState() {
  await chrome.storage.local.set({ GRO10X_COPILOT_STATE: STATE });
}

async function loadSavedState() {
  try {
    const data = await chrome.storage.local.get('GRO10X_COPILOT_STATE');
    if (data && data.GRO10X_COPILOT_STATE) {
      const saved = data.GRO10X_COPILOT_STATE;
      STATE.activeSku = saved.activeSku || 'PLA-14';
      if (saved.leads) STATE.leads = saved.leads;
      if (typeof saved.autoSendWhatsApp === 'boolean') STATE.autoSendWhatsApp = saved.autoSendWhatsApp;
    }
  } catch(e) {}
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('copilotToast');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  t.style.background = type === 'error' ? 'var(--color-danger)' : 'var(--color-primary)';
  t.style.color = type === 'error' ? '#fff' : '#070b12';
  setTimeout(() => { t.style.display = 'none'; }, 3000);
}
