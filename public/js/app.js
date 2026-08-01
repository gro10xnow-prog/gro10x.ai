// Global Application State
let appData = {
  clients: [],
  services: [],
  team: [],
  tasks: [],
  reviews: [],
  invoices: [],
  expenses: [],
  assets: [],
  attendance: [],
  leads: [],
  quotes: [],
  posts: [],
  chats: [],
  botConfig: {}
};

let currentTab = 'dashboard';
let currentRole = 'admin';
let activeDrawingTool = 'circle';
let currentDrawings = [];
let isDrawing = false;
let startX = 0, startY = 0;

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthSession();
  fetchInitialData();
  setupSSE();
  setupCanvas();
});

async function checkAuthSession() {
  try {
    const token = localStorage.getItem('sb-access-token') || localStorage.getItem('purpleos_pin_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch('/api/auth/me', { headers });
    if (res.status === 401) {
      console.warn('⚠️ Unauthenticated access attempt. Redirecting to login...');
      window.location.href = '/auth?redirect=/admin';
      return;
    }
    const data = await res.json();
    if (data.success && data.user) {
      console.log('👤 Authenticated Profile:', data.user.profile);
      window.currentUser = data.user;
      updateUserProfileUI();
    } else {
      window.location.href = '/auth?redirect=/admin';
    }
  } catch (err) {
    console.warn('Auth session check error:', err);
    window.location.href = '/auth?redirect=/admin';
  }
}

function updateUserProfileUI() {
  const avatarEl = document.getElementById('userAvatar');
  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRoleTag');

  const storedName = localStorage.getItem('purple_user_name');
  const storedRole = localStorage.getItem('purple_user_role');
  const storedAccess = localStorage.getItem('purple_user_access');

  const name = storedName || (window.currentUser && window.currentUser.profile ? window.currentUser.profile.name : null) || 'Firoz Uddin Ahmed';
  const role = storedRole || (window.currentUser && window.currentUser.profile ? window.currentUser.profile.role : null) || 'Technology Admin';

  if (nameEl) nameEl.innerText = name;
  if (roleEl) roleEl.innerText = `${role} • ${storedAccess || 'Owner / Admin'}`;
  if (avatarEl) {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    avatarEl.innerText = initials;
  }
}

// Role Portal Switcher Logic
function switchRolePortal(roleKey) {
  currentRole = roleKey;
  console.log('🔄 Switched portal mode view to:', roleKey);

  const roleEl = document.getElementById('userRoleTag');
  if (roleEl) {
    if (roleKey === 'admin') roleEl.innerText = 'Agency Director (Admin)';
    else if (roleKey === 'lead') roleEl.innerText = 'Project & Account Lead';
    else if (roleKey === 'specialist') roleEl.innerText = 'Specialist / Crew';
  }

  const roleSelect = document.getElementById('roleSelect');
  if (roleSelect) roleSelect.value = roleKey;

  renderAllViews();
}

// Tab Router
function switchTab(tabId) {
  currentTab = tabId;

  // Toggle active nav class
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(el => el.getAttribute('onclick')?.includes(tabId));
  if (activeNav) activeNav.classList.add('active');

  // Toggle tab pages
  document.querySelectorAll('.tab-page').forEach(page => page.style.display = 'none');
  const targetPage = document.getElementById(`tab-${tabId}`);
  if (targetPage) targetPage.style.display = 'block';

  if (tabId === 'reviewroom') {
    setTimeout(resizeCanvas, 100);
  }
}

// Render All Dashboard Components
function renderAllViews() {
  renderDashboard();
  renderCRM();
  renderLeads();
  renderServices();
  renderKanban();
  renderTeam();
  renderFinancials();
  renderAssets();
  renderReviewRoom();
  renderSocialCalendar();
  renderChatHub();
  renderBotConfig();
  renderPLWidget();
  renderAnalytics();
  renderClientHealthScores();
  renderHrOps();
  renderExecutiveIntelligence();
}

// ──────────────────────────────────────────────────────────────
// Core Data Fetch & Real-Time SSE Engine
// ──────────────────────────────────────────────────────────────
async function fetchInitialData() {
  try {
    const res = await fetch('/api/db');
    const db = await res.json();

    appData.clients    = db.clients    || [];
    appData.services   = db.services   || [];
    appData.team       = db.team       || [];
    appData.tasks      = db.tasks      || [];
    appData.reviews    = db.reviews    || [];
    appData.invoices   = db.invoices   || [];
    appData.expenses   = db.expenses   || [];
    appData.assets     = db.assets     || [];
    appData.attendance = db.attendance || [];
    appData.leads      = db.leads      || [];
    appData.quotes     = db.quotes     || [];
    appData.posts      = db.posts      || [];
    appData.chats      = db.chats      || [];
    appData.leaves     = db.leaves     || [];
    appData.eod_reports = db.eod_reports || [];
    appData.tickets    = db.tickets    || [];
    appData.botConfig     = db.botConfig     || {};
    appData.webhookLogs   = db.webhookLogs   || [];
    appData.attendanceLog = db.attendanceLog || [];
    appData.checkoutLog   = db.checkoutLog   || [];

    renderAllViews();
  } catch (err) {
    console.error('fetchInitialData error:', err);
  }
}

function setupSSE() {
  try {
    const es = new EventSource('/api/events');

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);

        if (msg.type === 'db_updated') {
          fetchInitialData();
        } else if (msg.type === 'task_update' && msg.data) {
          const idx = appData.tasks.findIndex(t => t.id === msg.data.id);
          if (idx !== -1) appData.tasks[idx] = { ...appData.tasks[idx], ...msg.data };
          else appData.tasks.push(msg.data);
          renderKanban();
        } else if (msg.type === 'attendance_update' && msg.data) {
          const idx = appData.attendance.findIndex(a => a.name === msg.data.name);
          if (idx !== -1) appData.attendance[idx] = msg.data;
          else appData.attendance.push(msg.data);
          renderTeam();
        } else if (msg.type === 'telegram_inbound' && msg.data) {
          if (appData.webhookLogs) appData.webhookLogs.unshift(msg.data.log);
          renderWebhookLogs();
        } else if (msg.type === 'whatsapp_inbound' && msg.data) {
          if (appData.webhookLogs) appData.webhookLogs.unshift(msg.data.log);
          renderWebhookLogs();
        }
      } catch (parseErr) {
        // Heartbeat or non-JSON message — ignore
      }
    };

    es.onerror = () => {
      // Connection dropped — SSE will auto-reconnect
    };
  } catch (err) {
    console.warn('SSE not available:', err);
  }
}



async function renderDashboard() {
  const tbody = document.getElementById('dashboardTableBody');
  if (!tbody) return;

  // Fetch live BI Analytics overview
  try {
    const res = await fetch('/api/analytics');
    const analytics = await res.json();
    if (analytics.success && analytics.financials) {
      const kpiRev = document.getElementById('kpiMonthlyRevenue');
      const kpiMargin = document.getElementById('kpiMarginSubtitle');
      if (kpiRev) kpiRev.innerText = `$${analytics.financials.paidRevenue.toLocaleString()} USD`;
      if (kpiMargin) kpiMargin.innerText = `Net Margin: ${analytics.financials.marginPercent}% ($${analytics.financials.netProfit.toLocaleString()})`;
    }
  } catch (err) {
    console.warn('Dashboard analytics fetch error:', err);
  }

  const clients = appData.clients || [];
  if (clients.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
          No active retainers on record.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = clients.map(c => `
    <tr style="cursor: pointer;" onclick="openClientProfile('${c.id}')">
      <td><strong>${c.name}</strong></td>
      <td><span class="badge badge-purple">${c.category}</span></td>
      <td>${(c.activeCampaigns && c.activeCampaigns[0]) || 'Full Digital Retainer'}</td>
      <td>${c.contactPerson || 'Account Lead'}</td>
      <td><span class="badge badge-emerald">${c.status}</span></td>
    </tr>
  `).join('');
}

// Render P&L Financial Health Analysis Widget & KPI Cards
function renderPLWidget() {
  // 1. KPI Cards Computation
  const clients = appData.clients || [];
  const activeRetainers = clients.filter(c => (c.status || '').toLowerCase().includes('active') || (c.status || '').toLowerCase().includes('retainer'));
  const retainerNames = activeRetainers.map(c => c.name.split(' ')[0]).join(', ');

  const kpiRetainersEl = document.getElementById('kpiActiveRetainers');
  const kpiSubEl = document.getElementById('kpiRetainersSubtitle');
  if (kpiRetainersEl) kpiRetainersEl.innerText = `${activeRetainers.length} Retainers`;
  if (kpiSubEl) kpiSubEl.innerText = retainerNames ? `${retainerNames}...` : 'Active client roster';

  // Invoices computation
  const invoices = appData.invoices || [];
  const paidInvoices = invoices.filter(i => i.status === 'Paid');
  const pendingInvoices = invoices.filter(i => i.status === 'Pending' || i.status === 'Sent');
  const draftInvoices = invoices.filter(i => i.status === 'Draft');

  const paidRevenue = paidInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const pendingRevenue = pendingInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const draftRevenue = draftInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalBilled = paidRevenue + pendingRevenue;

  // Expenses computation
  const expenses = appData.expenses || [];
  const totalOverhead = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Payroll computation
  const team = appData.team || [];
  const totalBaseSalary = team.reduce((sum, t) => sum + (Number(t.baseSalary) || 0), 0);
  const totalCommissions = team.reduce((sum, t) => sum + (Number(t.earnedCommissions) || 0), 0);
  const totalPayrollBDT = totalBaseSalary + totalCommissions;

  // Margin & Collection
  const netMarginUSD = paidRevenue - totalOverhead;
  const marginPct = paidRevenue > 0 ? Math.round((netMarginUSD / paidRevenue) * 100) : 0;
  const collectionRate = totalBilled > 0 ? Math.round((paidRevenue / totalBilled) * 100) : 0;

  // Update Revenue KPI Card
  const kpiRevEl = document.getElementById('kpiMonthlyRevenue');
  const kpiMarginSub = document.getElementById('kpiMarginSubtitle');
  if (kpiRevEl) kpiRevEl.innerText = `$${paidRevenue.toLocaleString()} USD`;
  if (kpiMarginSub) kpiMarginSub.innerText = `Net Margin: ${marginPct}% ($${netMarginUSD.toLocaleString()})`;

  // Update Attendance KPI Card
  const inStudioCount = team.filter(t => t.status === 'In Studio').length;
  const onFieldCount = team.filter(t => t.status === 'On Field Shoot').length;
  const attSummary = document.getElementById('attendanceSummary');
  const attSub = document.getElementById('kpiAttendanceSubtitle');
  if (attSummary) attSummary.innerText = `${inStudioCount} In Studio`;
  if (attSub) attSub.innerText = `${onFieldCount} On Field Shoot`;

  // Render P&L Financial Health Panel
  const plContainer = document.getElementById('plWidget');
  if (!plContainer) return;

  const monthYearStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  plContainer.innerHTML = `
    <div class="panel-header">
      <div>
        <h2 class="panel-title">💰 Financial Health & P&L Analysis</h2>
        <div style="font-size:0.8rem; color:var(--text-muted);">Real-time revenue, studio overhead, and payroll margin breakdown</div>
      </div>
      <span class="badge badge-purple" style="font-size:0.8rem; padding:0.4rem 0.8rem;">${monthYearStr}</span>
    </div>

    <!-- 3 Core P&L Metric Cards -->
    <div class="pl-grid">
      <div class="pl-box">
        <div class="pl-label">
          <span>Paid Revenue</span>
          <span class="badge badge-emerald" style="font-size:0.65rem;">PAID</span>
        </div>
        <div class="pl-value" style="color:var(--emerald-accent);">$${paidRevenue.toLocaleString()} <span style="font-size:0.8rem; color:var(--text-dim);">USD</span></div>
        <div class="pl-sublabel">From ${paidInvoices.length} paid invoice${paidInvoices.length === 1 ? '' : 's'}</div>
      </div>

      <div class="pl-box">
        <div class="pl-label">
          <span>Pending Revenue</span>
          <span class="badge badge-amber" style="font-size:0.65rem;">DUE</span>
        </div>
        <div class="pl-value" style="color:var(--amber-accent);">$${pendingRevenue.toLocaleString()} <span style="font-size:0.8rem; color:var(--text-dim);">USD</span></div>
        <div class="pl-sublabel">From ${pendingInvoices.length} pending invoice${pendingInvoices.length === 1 ? '' : 's'}</div>
      </div>

      <div class="pl-box">
        <div class="pl-label">
          <span>Net Margin (USD Ops)</span>
          <span class="badge badge-purple" style="font-size:0.65rem;">${marginPct}% MARGIN</span>
        </div>
        <div class="pl-value" style="color:var(--purple-light);">$${netMarginUSD.toLocaleString()} <span style="font-size:0.8rem; color:var(--text-dim);">USD</span></div>
        <div class="pl-sublabel">Revenue minus studio overhead ($${totalOverhead.toLocaleString()})</div>
      </div>
    </div>

    <!-- Visual Progress & Collection Bars -->
    <div class="pl-bars-container">
      <div class="pl-bar-group">
        <div class="pl-bar-header">
          <span>Invoice Collection Progress</span>
          <span>${collectionRate}% Collected ($${paidRevenue.toLocaleString()} of $${totalBilled.toLocaleString()} Billed)</span>
        </div>
        <div class="pl-bar-track">
          <div class="pl-bar-fill emerald" style="width: ${collectionRate}%;"></div>
        </div>
      </div>

      <div class="pl-bar-group">
        <div class="pl-bar-header">
          <span>Net Margin Efficiency (Paid Revenue vs Studio Expenses)</span>
          <span>${marginPct}% Profit Keep Rate</span>
        </div>
        <div class="pl-bar-track">
          <div class="pl-bar-fill" style="width: ${Math.min(100, Math.max(0, marginPct))}%;"></div>
        </div>
      </div>
    </div>

    <!-- Footer Summary Row -->
    <div class="pl-footer-row">
      <div>
        <span>Studio Overhead Expenses: </span>
        <strong style="color:var(--pink-accent);">$${totalOverhead.toLocaleString()} USD</strong>
        <span class="pl-currency-tag" style="margin-left:0.4rem;">USD</span>
      </div>
      <div>
        <span>Monthly Payroll (5 Crew): </span>
        <strong style="color:var(--purple-light);">৳${totalPayrollBDT.toLocaleString()} BDT</strong>
        <span class="pl-currency-tag" style="margin-left:0.4rem;">BDT</span>
      </div>
      ${draftRevenue > 0 ? `
        <div>
          <span>Draft Invoices Unsent: </span>
          <strong style="color:var(--amber-accent);">$${draftRevenue.toLocaleString()} USD</strong>
        </div>
      ` : ''}
    </div>
  `;
}


let currentDrawerClient = null;
let activeDrawerTab = 'overview';

// BC-4: CRM Filter & Live Search State
let crmFilter = 'all';

function setCRMFilter(status) {
  crmFilter = status;
  ['all', 'Active Retainer', 'Project-Based', 'Inactive'].forEach(s => {
    const chipId = s === 'all' ? 'chipCrmAll' : s === 'Active Retainer' ? 'chipCrmActive' : s === 'Project-Based' ? 'chipCrmProject' : 'chipCrmInactive';
    const chip = document.getElementById(chipId);
    if (chip) {
      if (s === status) chip.classList.add('active');
      else chip.classList.remove('active');
    }
  });
  filterCRM();
}

function filterCRM() {
  const tbody = document.getElementById('crmTableBody');
  if (!tbody) return;

  const searchQuery = (document.getElementById('crmSearchInput')?.value || '').trim().toLowerCase();
  const categoryFilter = (document.getElementById('crmCategoryFilter')?.value || '').trim();

  let filtered = (appData.clients || []).filter(c => {
    // 1. Status Filter
    if (crmFilter !== 'all') {
      const cStatus = (c.status || '').toLowerCase();
      if (!cStatus.includes(crmFilter.toLowerCase())) return false;
    }

    // 2. Category Filter
    if (categoryFilter && c.category !== categoryFilter) {
      return false;
    }

    // 3. Search Query
    if (searchQuery) {
      const matchName = (c.name || '').toLowerCase().includes(searchQuery);
      const matchContact = (c.contactPerson || '').toLowerCase().includes(searchQuery);
      const matchId = (c.id || '').toLowerCase().includes(searchQuery);
      const matchEmail = (c.email || '').toLowerCase().includes(searchQuery);
      const matchPhone = (c.phone || '').toLowerCase().includes(searchQuery);
      if (!matchName && !matchContact && !matchId && !matchEmail && !matchPhone) return false;
    }

    return true;
  });

  const countBadge = document.getElementById('crmCountBadge');
  if (countBadge) countBadge.innerText = `${filtered.length} Client${filtered.length === 1 ? '' : 's'}`;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          🔍 No clients match your search filter criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    const healthBadge = c.healthScore ? `<span class="badge ${c.badgeClass || 'badge-emerald'}" style="font-size:0.7rem;">${c.status || 'Excellent'}</span>` : `<span class="badge badge-emerald" style="font-size:0.7rem;">${c.status}</span>`;
    return `
    <tr style="cursor: pointer;" onclick="openClientProfile('${c.id}')">
      <td><code>${c.id}</code></td>
      <td><strong>${c.name}</strong></td>
      <td><span class="badge badge-purple">${c.category}</span></td>
      <td>${c.contactPerson}</td>
      <td>${c.email}<br><small style="color:var(--text-muted)">${c.phone}</small></td>
      <td><strong>${c.totalSpent}</strong></td>
      <td>${healthBadge}</td>
      <td style="text-align: right;">
        <div style="display: flex; justify-content: flex-end; gap: 0.4rem;" onclick="event.stopPropagation();">
          <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.78rem; color: #38bdf8;" onclick="generateUserAccessCard('${c.phone}', '${c.id}', 'client', '${c.email}')">🔑 Access Card</button>
          <button class="btn-secondary" style="padding: 0.25rem 0.65rem; font-size: 0.78rem;" onclick="openClientProfile('${c.id}')">👤 Profile</button>
        </div>
      </td>
    </tr>
  `;
  }).join('');
}

async function renderClientHealthScores() {
  try {
    const res = await fetch('/api/clients/health');
    const data = await res.json();
    if (data.success && data.clientsHealth) {
      data.clientsHealth.forEach(h => {
        const client = (appData.clients || []).find(c => c.id === h.clientId);
        if (client) {
          client.healthScore = h.healthScore;
          client.badgeClass = h.badgeClass;
          client.healthStatus = h.status;
        }
      });
      filterCRM();
    }
  } catch (err) {
    console.warn('Error fetching client health scores:', err);
  }
}

function mockImportCSV() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      let added = 0;
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts[0]) {
          await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: parts[0],
              contactPerson: parts[1] || 'Brand Manager',
              email: parts[2] || '',
              phone: parts[3] || '',
              category: parts[4] || 'General',
              status: 'Active Retainer'
            })
          });
          added++;
        }
      }
      alert(`✅ CSV Import Successful: Imported ${added} client record(s).`);
      fetchInitialData();
    };
    reader.readAsText(file);
  };
  input.click();
}

function renderCRM() {
  filterCRM();
}

function openClientProfile(clientId) {
  const client = (appData.clients || []).find(c => c.id === clientId);
  if (!client) return;

  currentDrawerClient = client;
  activeDrawerTab = 'overview';
  toggleDeleteConfirm(false);

  renderClientDrawer();

  document.getElementById('clientDrawerOverlay')?.classList.remove('hidden');
  document.getElementById('clientDrawer')?.classList.remove('hidden');
}

function closeClientDrawer() {
  document.getElementById('clientDrawerOverlay')?.classList.add('hidden');
  document.getElementById('clientDrawer')?.classList.add('hidden');
  currentDrawerClient = null;
  toggleDeleteConfirm(false);
}

function switchDrawerTab(tabId) {
  activeDrawerTab = tabId;
  renderClientDrawer();
}

function renderClientDrawer() {
  const drawer = document.getElementById('clientDrawer');
  if (!drawer || !currentDrawerClient) return;

  const client = currentDrawerClient;
  const clientNameLower = (client.name || '').trim().toLowerCase();

  // Filter invoices for this client accurately
  const clientInvoices = (appData.invoices || []).filter(i => {
    if (i.clientId && i.clientId === client.id) return true;
    if (!clientNameLower) return false;
    const invClientLower = (i.clientName || '').trim().toLowerCase();
    return invClientLower === clientNameLower || (clientNameLower.length > 3 && invClientLower.includes(clientNameLower));
  });

  // Filter tasks for this client accurately
  const clientTasks = (appData.tasks || []).filter(t => {
    if (!clientNameLower) return false;
    const taskClientLower = (t.client || '').trim().toLowerCase();
    return taskClientLower === clientNameLower || (clientNameLower.length > 3 && taskClientLower.includes(clientNameLower));
  });

  // Mini KPI stats
  const totalInvoiced = clientInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalPaid = clientInvoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const activeTasksCount = clientTasks.filter(t => t.stage !== 'Approved').length;

  const cleanPhone = (client.phone || '').replace(/[^0-9]/g, '');
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : '#';

  drawer.innerHTML = `
    <!-- Drawer Header -->
    <div class="drawer-header-block">
      <div>
        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.3rem;">
          <span class="badge badge-purple">${client.id}</span>
          <span class="badge badge-emerald">${client.status}</span>
        </div>
        <div class="drawer-client-name">${client.name}</div>
        <div style="font-size:0.85rem; color:var(--text-muted); margin-top:0.2rem;">Category: ${client.category}</div>
      </div>
      <button class="tg-close" onclick="closeClientDrawer()" style="font-size:1.5rem;">✕</button>
    </div>

    <!-- Mini KPI Stat Bar -->
    <div class="drawer-kpi-row">
      <div class="drawer-kpi-box">
        <div class="drawer-kpi-val" style="color:var(--purple-light);">৳${totalInvoiced.toLocaleString()}</div>
        <div class="drawer-kpi-lbl">Invoiced</div>
      </div>
      <div class="drawer-kpi-box">
        <div class="drawer-kpi-val" style="color:var(--emerald-accent);">৳${totalPaid.toLocaleString()}</div>
        <div class="drawer-kpi-lbl">Paid</div>
      </div>
      <div class="drawer-kpi-box">
        <div class="drawer-kpi-val" style="color:var(--amber-accent);">${activeTasksCount}</div>
        <div class="drawer-kpi-lbl">Tasks</div>
      </div>
      <div class="drawer-kpi-box">
        <div class="drawer-kpi-val" style="color:#fff;">${clientInvoices.length}</div>
        <div class="drawer-kpi-lbl">Invoices</div>
      </div>
    </div>

    <!-- Drawer Sub-Nav Tabs -->
    <div class="drawer-tabs-nav">
      <button class="drawer-tab-btn ${activeDrawerTab === 'overview' ? 'active' : ''}" onclick="switchDrawerTab('overview')">Overview</button>
      <button class="drawer-tab-btn ${activeDrawerTab === 'onboarding' ? 'active' : ''}" onclick="switchDrawerTab('onboarding')">🚀 Onboarding</button>
      <button class="drawer-tab-btn ${activeDrawerTab === 'invoices' ? 'active' : ''}" onclick="switchDrawerTab('invoices')">Invoices (${clientInvoices.length})</button>
      <button class="drawer-tab-btn ${activeDrawerTab === 'tasks' ? 'active' : ''}" onclick="switchDrawerTab('tasks')">Tasks (${clientTasks.length})</button>
    </div>

    <!-- Tab 1: Overview & Contact Info -->
    <div class="drawer-tab-content" style="display: ${activeDrawerTab === 'overview' ? 'flex' : 'none'};">
      <div class="glass-panel" style="margin-bottom:0; padding:1.2rem;">
        <div style="font-weight:700; color:#fff; margin-bottom:0.8rem; font-size:0.95rem;">Contact Information</div>
        <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.88rem; color:var(--text-muted);">
          <div><strong style="color:#fff;">Contact Person:</strong> ${client.contactPerson || 'N/A'}</div>
          <div><strong style="color:#fff;">Email Address:</strong> ${client.email || 'N/A'}</div>
          <div><strong style="color:#fff;">Phone Number:</strong> ${client.phone || 'N/A'}</div>
          <div><strong style="color:#fff;">Account Category:</strong> ${client.category}</div>
          <div><strong style="color:#fff;">Account Status:</strong> <span class="badge badge-emerald">${client.status}</span></div>
          <div><strong style="color:#fff;">Total Lifetime Spent:</strong> <span style="color:var(--emerald-accent); font-weight:700;">${client.totalSpent}</span></div>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.8rem; margin-top:0.8rem;">
        <a href="${waUrl}" target="_blank" class="wa-btn">
          <span>💬 Open WhatsApp</span>
        </a>
        <a href="tel:${client.phone}" class="btn-secondary" style="display:flex; align-items:center; justify-content:center; gap:0.5rem; text-decoration:none; padding:0.6rem;">
          <span>📞 Call Phone</span>
        </a>
      </div>

      <!-- Account Management Section (Edit & Delete) -->
      <div class="glass-panel" style="margin-top:1.2rem; padding:1.2rem; border:1px solid rgba(239, 68, 68, 0.2);">
        <div style="font-weight:700; color:#fff; margin-bottom:0.6rem; font-size:0.9rem;">Account Management</div>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.8rem;">Modify account parameters or remove client entry from directory.</div>

        ${showDeleteConfirm ? `
          <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 0.9rem; margin-bottom: 0.8rem;">
            <div style="font-size: 0.85rem; font-weight: 700; color: #fca5a5; margin-bottom: 0.3rem;">⚠️ Delete "${client.name}"?</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.8rem;">This permanently removes the CRM record. Linked invoices and tasks will remain.</div>
            <div style="display: flex; gap: 0.6rem;">
              <button class="btn-secondary" style="padding: 0.3rem 0.7rem; font-size: 0.8rem;" onclick="toggleDeleteConfirm(false)">Cancel</button>
              <button class="btn-purple" style="background: var(--pink-accent); padding: 0.3rem 0.7rem; font-size: 0.8rem;" onclick="executeDeleteClient('${client.id}')">⛔ Confirm Delete</button>
            </div>
          </div>
        ` : `
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.8rem;">
            <button class="btn-secondary" style="padding: 0.5rem;" onclick="openEditClientModal('${client.id}')">✏️ Edit Details</button>
            <button class="btn-secondary" style="padding: 0.5rem; color: var(--pink-accent); border-color: rgba(239, 68, 68, 0.3);" onclick="toggleDeleteConfirm(true)">🗑️ Delete Client</button>
          </div>
        `}
      </div>
    </div>

    <!-- Tab 4: Onboarding Sequence (B7) -->
    <div class="drawer-tab-content" style="display: ${activeDrawerTab === 'onboarding' ? 'flex' : 'none'};">
      <div class="glass-panel" style="margin-bottom:0.8rem; padding:1rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
          <div style="font-weight:700; color:#fff; font-size:0.92rem;">🚀 Client Onboarding Checklist</div>
          <button class="btn-purple" style="padding:0.25rem 0.65rem; font-size:0.75rem;" onclick="openWelcomeEmailModal('${client.id}')">✉️ Generate Welcome Email</button>
        </div>
        <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.8rem;">Track progress for contract execution, invoice creation, and kickoff alignment.</div>
        
        <!-- Onboarding Progress Bar -->
        ${(() => {
          const defaultSteps = [
            { key: 'welcomeSent', title: 'Welcome Kit & Portal Access Link Sent', done: true },
            { key: 'contractSigned', title: 'Service Agreement / Retainer Contract Executed', done: true },
            { key: 'invoiceCreated', title: 'Initial Retainer Invoice Created', done: true },
            { key: 'kickoffCall', title: 'Kick-off Alignment Call Scheduled', done: true },
            { key: 'briefCollected', title: 'Creative Brief & Brand Assets Collected', done: false },
            { key: 'milestoneCreated', title: 'First Project Milestone Created in Kanban Board', done: false }
          ];
          const ob = client.onboarding || { steps: defaultSteps };
          const steps = ob.steps || defaultSteps;
          const completedCount = steps.filter(s => s.done).length;
          const pct = Math.round((completedCount / steps.length) * 100);

          return `
            <div style="margin-bottom:1rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:700; color:#fff; margin-bottom:0.3rem;">
                <span>Onboarding Progress</span>
                <span style="color:var(--emerald-accent);">${completedCount} / ${steps.length} Completed (${pct}%)</span>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.08); border-radius:10px; overflow:hidden;">
                <div style="width:${pct}%; height:100%; background:linear-gradient(90deg, #a855f7, #22c55e); transition:width 0.3s;"></div>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.5rem;">
              ${steps.map(s => `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:0.6rem 0.8rem; background:${s.done ? 'rgba(34, 197, 94, 0.1)' : 'rgba(9,9,11,0.4)'}; border:1px solid ${s.done ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.06)'}; border-radius:8px;">
                  <label style="display:flex; align-items:center; gap:0.6rem; cursor:pointer; font-size:0.83rem; color:${s.done ? '#fff' : 'var(--text-muted)'}; margin:0; flex:1;">
                    <input type="checkbox" ${s.done ? 'checked' : ''} onchange="toggleOnboardingStep('${client.id}', '${s.key}')" style="accent-color:var(--emerald-accent); width:16px; height:16px;">
                    <span style="${s.done ? 'text-decoration:line-through; opacity:0.8;' : ''}">${s.title}</span>
                  </label>
                  ${s.done ? `<span class="badge badge-emerald" style="font-size:0.65rem;">✓ Completed</span>` : `<span class="badge badge-amber" style="font-size:0.65rem;">Pending</span>`}
                </div>
              `).join('')}
            </div>
          `;
        })()}
      </div>
    </div>

    <!-- Tab 2: Invoice History -->
    <div class="drawer-tab-content" style="display: ${activeDrawerTab === 'invoices' ? 'flex' : 'none'};">
      ${clientInvoices.length === 0 ? `
        <div class="glass-panel" style="text-align:center; padding:2rem; color:var(--text-muted);">
          📄 No invoices generated for this client yet.
        </div>
      ` : clientInvoices.map(inv => `
        <div class="glass-panel" style="margin-bottom:0.8rem; padding:1rem; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:700; color:#fff; font-size:0.9rem;"><code>${inv.id}</code></div>
            <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">Date: ${inv.date || 'N/A'} · Due: ${inv.dueDate || 'N/A'}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:800; color:var(--purple-light); font-size:0.95rem;">৳${(Number(inv.amount) || 0).toLocaleString()}</div>
            <div style="display:flex; align-items:center; gap:0.4rem; justify-content:flex-end; margin-top:0.3rem;">
              <span class="badge ${inv.status === 'Paid' ? 'badge-emerald' : 'badge-amber'}" style="font-size:0.68rem;">${inv.status}</span>
              <button class="btn-secondary" style="padding:0.15rem 0.5rem; font-size:0.75rem;" onclick="generateInvoicePDF('${inv.id}')">⬇️ PDF</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Tab 3: Production Tasks -->
    <div class="drawer-tab-content" style="display: ${activeDrawerTab === 'tasks' ? 'flex' : 'none'};">
      ${clientTasks.length === 0 ? `
        <div class="glass-panel" style="text-align:center; padding:2rem; color:var(--text-muted);">
          📌 No active production tasks assigned for this client.
        </div>
      ` : clientTasks.map(tsk => `
        <div class="glass-panel" style="margin-bottom:0.8rem; padding:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.4rem;">
            <div style="font-weight:700; color:#fff; font-size:0.9rem;">${tsk.title}</div>
            <span class="badge badge-purple" style="font-size:0.7rem;">${tsk.stage}</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; color:var(--text-muted);">
            <div>Assignee: <strong style="color:var(--text-main);">${tsk.assignee || 'Unassigned'}</strong></div>
            <div>Due: <span style="color:var(--pink-accent); font-weight:600;">${tsk.dueDate || 'N/A'}</span></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Client CRUD Modal & Handler Functions
let _editingClientId = null;
let showDeleteConfirm = false;

function openAddClientModal() {
  _editingClientId = null;
  document.getElementById('clientModalTitle').innerText = 'Add New Client';
  document.getElementById('clientModalSubtitle').innerText = 'Enter client details to register in CRM directory';
  document.getElementById('clientFormName').value = '';
  document.getElementById('clientFormCategory').value = 'Banking & Finance';
  document.getElementById('clientFormContact').value = '';
  document.getElementById('clientFormPhone').value = '';
  document.getElementById('clientFormEmail').value = '';
  document.getElementById('clientFormStatus').value = 'Active Retainer';
  document.getElementById('clientFormSubmitBtn').innerText = '💾 Save Client Account';
  document.getElementById('clientFormModal')?.classList.remove('hidden');
}

function openEditClientModal(clientId) {
  const client = (appData.clients || []).find(c => c.id === clientId);
  if (!client) return;

  _editingClientId = clientId;
  document.getElementById('clientModalTitle').innerText = `Edit: ${client.name}`;
  document.getElementById('clientModalSubtitle').innerText = `Updating client record (${client.id})`;
  document.getElementById('clientFormName').value = client.name || '';
  document.getElementById('clientFormCategory').value = client.category || 'General Agency Client';
  document.getElementById('clientFormContact').value = client.contactPerson || '';
  document.getElementById('clientFormPhone').value = client.phone || '';
  document.getElementById('clientFormEmail').value = client.email || '';
  document.getElementById('clientFormStatus').value = client.status || 'Active Retainer';
  document.getElementById('clientFormSubmitBtn').innerText = '💾 Save Changes';
  document.getElementById('clientFormModal')?.classList.remove('hidden');
}

function closeClientFormModal() {
  document.getElementById('clientFormModal')?.classList.add('hidden');
  _editingClientId = null;
}

async function submitClientForm(event) {
  event.preventDefault();

  const payload = {
    name: document.getElementById('clientFormName').value,
    category: document.getElementById('clientFormCategory').value,
    contactPerson: document.getElementById('clientFormContact').value,
    phone: document.getElementById('clientFormPhone').value,
    email: document.getElementById('clientFormEmail').value,
    status: document.getElementById('clientFormStatus').value
  };

  const isEdit = !!_editingClientId;
  const url = isEdit ? `/api/clients/${_editingClientId}` : '/api/clients';
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      closeClientFormModal();
      await fetchInitialData();
      if (isEdit && currentDrawerClient && currentDrawerClient.id === _editingClientId) {
        currentDrawerClient = (appData.clients || []).find(c => c.id === _editingClientId);
        renderClientDrawer();
      }
    } else {
      alert('Failed to save client: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error saving client:', err);
    alert('Network error while saving client.');
  }
}

function toggleDeleteConfirm(show) {
  showDeleteConfirm = show;
  renderClientDrawer();
}

async function executeDeleteClient(clientId) {
  try {
    const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showDeleteConfirm = false;
      closeClientDrawer();
      fetchInitialData();
    } else {
      alert('Failed to delete client: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error deleting client:', err);
    alert('Network error while deleting client.');
  }
}



// Render Services Catalog Cards
function renderServices() {
  const container = document.getElementById('servicesGrid');
  if (!container) return;

  container.innerHTML = appData.services.map(s => `
    <div class="metric-card">
      <div class="metric-header">
        <span class="badge badge-purple">${s.category}</span>
        <span style="color:var(--emerald-accent); font-weight:700;">${s.price}</span>
      </div>
      <div style="font-weight:700; color:#fff; font-size:1.1rem; margin-top:0.4rem;">${s.title}</div>
      <div style="font-size:0.85rem; color:var(--text-muted); line-height:1.4;">${s.description}</div>
      <div style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-top:0.6rem;">
        ${s.includedFeatures.map(f => `<span class="badge badge-purple" style="font-size:0.7rem;">✓ ${f}</span>`).join('')}
      </div>
      <div style="margin-top: 1rem; padding-top: 0.6rem; border-top: 1px dashed rgba(255,255,255,0.08); display: flex; justify-content: flex-end;">
        <button class="btn-purple" style="width: 100%; justify-content: center; font-size: 0.85rem;" onclick="openServiceBookingModal('${s.id}')">
          📋 Book This Service
        </button>
      </div>
    </div>
  `).join('');
}

// Smart AI Spec Generator Trigger
async function generateAISpec() {
  const title = document.getElementById('aiServiceTitle').value || 'Corporate AV Production';
  const category = document.getElementById('aiServiceCategory').value;

  try {
    const res = await fetch('/api/services/aispec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category })
    });
    const data = await res.json();

    document.getElementById('aiResultBox').style.display = 'block';
    document.getElementById('aiResultTitle').innerText = `✨ AI Specification: ${data.title} (${data.category})`;
    document.getElementById('aiResultDesc').innerText = data.generatedDescription;
    document.getElementById('aiResultBadges').innerHTML = data.generatedFeatures.map(f => `<span class="badge badge-purple">✓ ${f}</span>`).join('');
  } catch (err) {
    console.error('Error generating AI spec:', err);
  }
}

// BC-2 Kanban View Switcher
let activeKanbanView = 'board';

function switchKanbanView(mode) {
  activeKanbanView = mode;
  const boardEl = document.getElementById('kanbanBoard');
  const calEl = document.getElementById('kanbanCalendar');
  const btnBoard = document.getElementById('btnKanbanViewBoard');
  const btnCal = document.getElementById('btnKanbanViewCalendar');

  if (mode === 'calendar') {
    if (boardEl) boardEl.style.display = 'none';
    if (calEl) calEl.style.display = 'block';
    if (btnBoard) btnBoard.classList.remove('active');
    if (btnCal) btnCal.classList.add('active');
    renderKanbanCalendar();
  } else {
    if (boardEl) boardEl.style.display = 'grid';
    if (calEl) calEl.style.display = 'none';
    if (btnBoard) btnBoard.classList.add('active');
    if (btnCal) btnCal.classList.remove('active');
  }
}

// Render Kanban Board & Workload Meter
function renderKanban() {
  const board = document.getElementById('kanbanBoard');
  if (!board) return;

  renderWorkloadMeter();

  const stages = ['Strategy', 'Scripting', 'Shooting', 'Editing', 'Client Review', 'Approved'];

  board.innerHTML = stages.map(stage => {
    const stageTasks = appData.tasks.filter(t => t.stage === stage);
    return `
      <div class="kanban-col" data-stage="${stage}">
        <div class="kanban-col-header">
          <span>${stage}</span>
          <span style="background:rgba(255,255,255,0.1); padding:0.1rem 0.5rem; border-radius:10px; font-size:0.78rem;">${stageTasks.length}</span>
        </div>
        ${stageTasks.map(t => {
          const priorityClass = t.priority === 'Urgent' ? 'badge-pink' : (t.priority === 'High' ? 'badge-amber' : 'badge-purple');
          const assignees = t.assignees || (t.assignee ? [t.assignee] : ['Unassigned']);

          // Render stacked avatar circles
          const avatarsHtml = assignees.map(name => {
            const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            return `<span class="crew-avatar" title="${name}">${initials}</span>`;
          }).join('');

          return `
            <div class="kanban-card" draggable="true" data-task-id="${t.id}">
              <div class="kanban-card-title">${t.title}</div>
              <div class="kanban-card-client">🏢 ${t.client}</div>
              <div style="font-size:0.75rem; color:#94a3b8; margin: 0.3rem 0;">📅 Due: ${t.dueDate || '2026-07-30'}</div>
              
              <div class="kanban-card-footer" style="margin-top: 0.5rem; display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:0.4rem;">
                  <div class="crew-avatar-stack">${avatarsHtml}</div>
                  <button class="btn-assign-crew" onclick="openAssignCrewModal('${t.id}')">+ Crew</button>
                </div>
                <span class="badge ${priorityClass}">${t.priority}</span>
              </div>

              <div style="margin-top: 0.6rem; display:flex; gap:0.4rem;">
                <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.725rem; flex:1;" onclick="advanceTaskStage('${t.id}', '${stage}')">▶️ Next Stage</button>
                <button class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.725rem;" onclick="toggleTaskTimer('${t.id}')" id="timerBtn-${t.id}">⏱️ Log Time</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }).join('');

  initKanbanDragAndDrop();

  if (activeKanbanView === 'calendar') {
    renderKanbanCalendar();
  }
}

// BC-12: Multi-Crew Assignment Modal Logic
function openAssignCrewModal(taskId) {
  const task = (appData.tasks || []).find(t => t.id === taskId);
  if (!task) return;

  document.getElementById('assignCrewTaskId').value = taskId;
  document.getElementById('assignCrewModalTaskTitle').innerText = `Campaign: "${task.title}" (${task.client})`;

  const currentAssignees = task.assignees || (task.assignee ? [task.assignee] : []);
  const team = appData.team || [];

  const listContainer = document.getElementById('assignCrewListContainer');
  if (listContainer) {
    listContainer.innerHTML = team.map(emp => {
      const isChecked = currentAssignees.some(a => a.toLowerCase().includes(emp.name.toLowerCase()));
      return `
        <label style="display:flex; align-items:center; gap:0.75rem; background:rgba(255,255,255,0.04); padding:0.6rem 0.8rem; border-radius:8px; cursor:pointer; border:1px solid rgba(255,255,255,0.08);">
          <input type="checkbox" name="crewMember" value="${emp.name}" ${isChecked ? 'checked' : ''} style="accent-color:var(--purple-accent); transform:scale(1.2);">
          <div>
            <strong style="color:#fff; font-size:0.9rem;">${emp.name}</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">${emp.role} • Dept: ${emp.department}</div>
          </div>
        </label>
      `;
    }).join('');
  }

  document.getElementById('assignCrewModal')?.classList.remove('hidden');
}

function closeAssignCrewModal() {
  document.getElementById('assignCrewModal')?.classList.add('hidden');
}

async function submitAssignCrewForm(event) {
  event.preventDefault();

  const taskId = document.getElementById('assignCrewTaskId').value;
  const checkboxes = document.querySelectorAll('#assignCrewListContainer input[name="crewMember"]:checked');
  const selectedCrew = Array.from(checkboxes).map(cb => cb.value);

  if (selectedCrew.length === 0) {
    alert('Please select at least one crew member.');
    return;
  }

  try {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignees: selectedCrew })
    });
    const data = await res.json();
    if (data.success) {
      closeAssignCrewModal();
      await fetchInitialData();
      alert(`👥 Task crew assigned: ${selectedCrew.join(', ')}`);
    }
  } catch (err) {
    console.error('Error assigning crew to task:', err);
  }
}

// BC-1: HTML5 Drag & Drop Logic
function initKanbanDragAndDrop() {
  const cards = document.querySelectorAll('.kanban-card[draggable="true"]');
  const cols = document.querySelectorAll('.kanban-col[data-stage]');

  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      card.classList.add('dragging');
      e.dataTransfer.setData('text/plain', card.getAttribute('data-task-id'));
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      cols.forEach(col => col.classList.remove('drag-over'));
    });
  });

  cols.forEach(col => {
    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      col.classList.add('drag-over');
    });

    col.addEventListener('dragleave', (e) => {
      // Only remove highlight if we're actually leaving the column (not just entering a child)
      if (!col.contains(e.relatedTarget)) {
        col.classList.remove('drag-over');
      }
    });

    col.addEventListener('drop', async (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const taskId = e.dataTransfer.getData('text/plain');
      const targetStage = col.getAttribute('data-stage');

      if (taskId && targetStage) {
        await advanceTaskToStage(taskId, targetStage);
      }
    });
  });
}

async function advanceTaskToStage(taskId, targetStage) {
  try {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: targetStage })
    });
    const data = await res.json();
    if (data.success) {
      await fetchInitialData();
    }
  } catch (err) {
    console.error('Error moving task via drag-and-drop:', err);
  }
}

// BC-2: Shoot & Deliverables 31-Day Calendar Renderer
function renderKanbanCalendar() {
  const grid = document.getElementById('kanbanCalendarGrid');
  if (!grid) return;

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let headersHtml = daysOfWeek.map(d => `<div class="cal-day-header">${d}</div>`).join('');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // July = 6

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthBadge = document.getElementById('kanbanCalMonthBadge');
  if (monthBadge) monthBadge.innerText = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  let daysHtml = '';

  // Blank cells for alignment
  for (let i = 0; i < firstDay; i++) {
    daysHtml += `<div class="cal-day-cell" style="opacity:0.3; background:transparent;"></div>`;
  }

  // Day cells
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = (appData.tasks || []).filter(t => (t.dueDate || '').startsWith(dateStr) || (!t.dueDate && day === 30));
    const isToday = day === now.getDate();

    let tasksMarkup = dayTasks.map(t => {
      let stageBg = '#64748b'; // default gray
      if (t.stage === 'Strategy') stageBg = '#3b82f6';
      else if (t.stage === 'Scripting') stageBg = '#06b6d4';
      else if (t.stage === 'Shooting') stageBg = '#f59e0b';
      else if (t.stage === 'Editing') stageBg = '#a855f7';
      else if (t.stage === 'Client Review') stageBg = '#ec4899';
      else if (t.stage === 'Approved') stageBg = '#10b981';

      return `
        <div class="cal-task-item" style="background:${stageBg};" title="${t.title} (${t.stage})" onclick="advanceTaskStage('${t.id}', '${t.stage}')">
          <strong>${t.stage}</strong>: ${t.title}
        </div>
      `;
    }).join('');

    daysHtml += `
      <div class="cal-day-cell ${isToday ? 'today' : ''}">
        <div class="cal-day-num">${day}</div>
        ${tasksMarkup}
      </div>
    `;
  }

  grid.innerHTML = headersHtml + daysHtml;
}

// Workload Capacity Meter Rendering
function renderWorkloadMeter() {
  const container = document.getElementById('workloadMeterContainer');
  if (!container || !appData.team) return;

  const html = appData.team.map(emp => {
    const assignedTasks = appData.tasks.filter(t => t.assignee && t.assignee.toLowerCase().includes(emp.name.split(' ')[0].toLowerCase()));
    const capacityPct = Math.min(100, Math.round((assignedTasks.length / 5) * 100));
    const meterColor = capacityPct > 80 ? '#ec4899' : (capacityPct > 50 ? '#a855f7' : '#22c55e');

    return `
      <div style="flex:1; min-width:180px; padding:0.75rem; background:rgba(9,9,11,0.6); border:1px solid rgba(255,255,255,0.08); border-radius:12px;">
        <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; margin-bottom:0.3rem;">
          <span>${emp.name}</span>
          <span style="color:${meterColor};">${assignedTasks.length} / 5 Tasks</span>
        </div>
        <div style="font-size:0.72rem; color:#94a3b8; margin-bottom:0.4rem;">${emp.role}</div>
        <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden;">
          <div style="width:${capacityPct}%; height:100%; background:${meterColor}; transition:width 0.3s ease;"></div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

// Live Task Timer Handler
let activeTimers = {};
function toggleTaskTimer(taskId) {
  const btn = document.getElementById(`timerBtn-${taskId}`);
  if (activeTimers[taskId]) {
    clearInterval(activeTimers[taskId].interval);
    delete activeTimers[taskId];
    if (btn) btn.innerText = '⏱️ Log Time';
    alert(`⏱️ Time logging completed for task ${taskId}.`);
  } else {
    let seconds = 0;
    activeTimers[taskId] = {
      interval: setInterval(() => {
        seconds++;
        if (btn) btn.innerText = `⏱️ ${Math.floor(seconds / 60)}m ${seconds % 60}s`;
      }, 1000)
    };
  }
}

// Add Task Modal Controls
function openAddTaskModal() {
  const modal = document.getElementById('addTaskModal');
  const clientSelect = document.getElementById('newTaskClient');
  if (clientSelect && appData.clients) {
    clientSelect.innerHTML = appData.clients.map(c => `<option value="${c.name}">${c.name} (${c.category})</option>`).join('');
  }
  const assigneeSelect = document.getElementById('newTaskAssignee');
  if (assigneeSelect && appData.team) {
    assigneeSelect.innerHTML = appData.team.map(t => `<option value="${t.name}">${t.name} — ${t.role}</option>`).join('');
  }
  if (modal) modal.classList.remove('hidden');
}

function closeAddTaskModal() {
  const modal = document.getElementById('addTaskModal');
  if (modal) modal.classList.add('hidden');
}

// Module C7: AI Creative Brief Generator Logic
async function generateTaskAIBrief() {
  const title = document.getElementById('newTaskTitle').value || 'Commercial Video Reel';
  const client = document.getElementById('newTaskClient').value || 'Chillox';

  try {
    const res = await fetch('/api/tasks/ai-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client, title, goal: 'Drive viral commercial brand engagement' })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('newTaskDescription').value = data.generatedBrief;
      alert(`✨ AI Creative Brief generated for "${title}"!\nShot list, concept hook, and timeline auto-built.`);
    }
  } catch (err) {
    console.error('Error generating AI brief:', err);
  }
}

// Module C6: Magic Link Onboarding Email Generator Trigger
async function triggerLeadOnboardingEmail(leadId) {
  try {
    const res = await fetch(`/api/leads/${leadId}/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      navigator.clipboard.writeText(data.magicLink);
      alert(`✉️ Client Portal Magic Link Generated for ${data.clientName}!\n\nMagic URL:\n${data.magicLink}\n\nCopied to clipboard!`);
    }
  } catch (err) {
    console.error('Error generating onboarding email:', err);
  }
}

async function submitNewTask(event) {
  event.preventDefault();
  const title = document.getElementById('newTaskTitle').value.trim();
  const client = document.getElementById('newTaskClient').value;
  const priority = document.getElementById('newTaskPriority').value;
  const assignee = document.getElementById('newTaskAssignee').value;
  const dueDate = document.getElementById('newTaskDueDate').value;

  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, client, priority, assignee, dueDate })
    });
    const data = await res.json();
    if (data.success) {
      closeAddTaskModal();
      fetchInitialData();
      alert(`📌 Task "${title}" created successfully and notified crew member on Telegram!`);
    }
  } catch (err) {
    console.error('Error creating task:', err);
  }
}

async function advanceTaskStage(taskId, currentStage) {
  if (currentStage === 'Approved') {
    alert('✅ Task is already in "Approved" final stage!');
    return;
  }
  const stages = ['Strategy', 'Scripting', 'Shooting', 'Editing', 'Client Review', 'Approved'];
  const currentIdx = stages.indexOf(currentStage);
  if (currentIdx === -1 || currentIdx >= stages.length - 1) return;
  const nextStage = stages[currentIdx + 1];

  try {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: nextStage })
    });
    const data = await res.json();
    if (data.success) {
      if (nextStage === 'Editing') {
        alert(`🎬 Task advanced to "Editing"!\nAssigned editor notified via Telegram (AUT-001).`);
      } else if (nextStage === 'Client Review') {
        alert(`📩 Task advanced to "Client Review"!\nClient representative sent Review Room link via Telegram (AUT-004).`);
      }
      fetchInitialData();
    }
  } catch (err) {
    console.error('Error advancing task:', err);
  }
}

async function openAddExpenseModal() {
  const title = prompt('Enter Expense Description (e.g., Studio Internet Bill):');
  if (!title) return;
  const category = prompt('Enter Category (e.g., Internet, Software, Utilities, Gear):', 'Utilities') || 'Utilities';
  const amountStr = prompt('Enter Amount in USD ($):', '150');
  if (!amountStr) return;
  const amount = Number(amountStr) || 0;

  try {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        category,
        amount,
        loggedBy: (window.currentUser?.profile?.name || 'Mahmudul Hasan')
      })
    });
    const data = await res.json();
    if (data.success) {
      alert(`✅ Expense logged: ${title} (-$${amount})`);
      fetchInitialData();
    }
  } catch (err) {
    console.error('Error logging expense:', err);
  }
}

// Render Team & Attendance Table
let _editingEmployeeId = null;

function renderTeam() {
  const tbody = document.getElementById('teamTableBody');
  if (!tbody) return;

  tbody.innerHTML = (appData.team || []).map(t => {
    const att = (appData.attendance || []).find(a => a.name === t.name);
    const status = att ? att.status : (t.status || 'In Studio');
    const isStudio = status.includes('Studio');
    const displaySalary = currentRole === 'admin' ? `BDT ${(Number(t.baseSalary) || 0).toLocaleString()}` : '🔒 Protected';
    
    return `
      <tr>
        <td><strong>${t.name}</strong><br><small style="color:var(--text-dim);">${t.id}</small></td>
        <td>${t.role}</td>
        <td><span class="badge badge-purple">${t.department}</span></td>
        <td><code style="color:var(--cyan-accent);">${t.telegramId || 'N/A'}</code></td>
        <td>${displaySalary}</td>
        <td><strong style="color:var(--emerald-accent);">+BDT ${(Number(t.earnedCommissions) || 0).toLocaleString()}</strong></td>
        <td><span class="badge ${isStudio ? 'badge-emerald' : 'badge-amber'}">${status}</span></td>
        <td style="text-align: right;">
          <div style="display: flex; justify-content: flex-end; gap: 0.4rem;">
            <button class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.78rem; color: #38bdf8;" onclick="generateUserAccessCard('${t.phone}', '${t.id}', 'team', '${t.email}')">🔑 Access Card</button>
            <button class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.78rem;" onclick="openEditEmployeeModal('${t.id}')">✏️ Edit</button>
            <button class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.78rem; color: var(--pink-accent); border-color: rgba(239, 68, 68, 0.3);" onclick="executeDeleteEmployee('${t.id}')">🗑️ Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderPayrollCalculator();
  renderAttendanceLog();
}

// BC-7: Attendance History Log Renderer
function renderAttendanceLog() {
  const panel = document.getElementById('attendanceLogPanel');
  if (!panel) return;

  const logs = appData.attendanceLog || [];

  if (logs.length === 0) {
    panel.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">⏱️ Telegram Crew Attendance History Log</h2>
      </div>
      <div style="text-align:center; padding:2rem; color:var(--text-muted);">
        No clocking events recorded yet. Use <code>/clockin</code> & <code>/clockout</code> on Telegram to generate log history.
      </div>
    `;
    return;
  }

  panel.innerHTML = `
    <div class="panel-header" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h2 class="panel-title">⏱️ Telegram Crew Attendance History Log</h2>
        <div style="font-size:0.8rem; color:var(--text-muted);">Audit trail of clock-in & clock-out events synced from Telegram bot</div>
      </div>
      <span class="badge badge-purple">${logs.length} Audit Records</span>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Log ID</th>
          <th>Employee Name</th>
          <th>Action</th>
          <th>Timestamp</th>
          <th>Location</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${logs.map(l => {
          const isClockIn = (l.action || '').includes('In');
          return `
            <tr>
              <td><code>${l.id}</code></td>
              <td><strong>${l.name}</strong> (${l.employeeId || 'N/A'})</td>
              <td><span class="badge ${isClockIn ? 'badge-emerald' : 'badge-amber'}">${isClockIn ? '🟢' : '🔴'} ${l.action}</span></td>
              <td><strong style="color:#fff;">${l.timestamp}</strong></td>
              <td><small style="color:var(--text-muted);">${l.location || 'Studio'}</small></td>
              <td>${l.date || '2026-07-28'}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// BC-3: Monthly Payroll Calculator Renderer
function renderPayrollCalculator() {
  const panel = document.getElementById('payrollPanel');
  if (!panel || !appData.team) return;

  const monthYearStr = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  let totalBase = 0;
  let totalCommissions = 0;

  const cardRows = appData.team.map(t => {
    const base = Number(t.baseSalary) || 0;
    const comm = Number(t.earnedCommissions) || 0;
    const rate = Number(t.commissionRate) || 0;
    const totalPayable = base + comm;

    totalBase += base;
    totalCommissions += comm;

    return `
      <div class="payroll-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
          <strong style="font-size:0.95rem; color:#fff;">${t.name}</strong>
          <span class="badge badge-purple" style="font-size:0.7rem;">${t.role.split('/')[0]}</span>
        </div>
        <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.75rem;">
          Dept: ${t.department} | Comm Rate: ${rate}%
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.82rem; padding:0.3rem 0; border-top:1px dashed rgba(255,255,255,0.08);">
          <span style="color:var(--text-muted);">Base Salary:</span>
          <span>৳${base.toLocaleString()} BDT</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.82rem; padding:0.3rem 0;">
          <span style="color:var(--text-muted);">Earned Commissions:</span>
          <span style="color:var(--emerald-accent);">+৳${comm.toLocaleString()} BDT</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.9rem; font-weight:700; padding-top:0.5rem; margin-top:0.3rem; border-top:1px solid rgba(255,255,255,0.12);">
          <span>Total Payable:</span>
          <span style="color:var(--purple-light);">৳${totalPayable.toLocaleString()} BDT</span>
        </div>
      </div>
    `;
  }).join('');

  const grandTotalBDT = totalBase + totalCommissions;
  const approxUSD = Math.round(grandTotalBDT / 110);

  panel.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
      <div>
        <h3 style="font-size:1.1rem; font-weight:700; color:#fff; margin:0;">🧮 ${monthYearStr} Monthly Payroll Calculator</h3>
        <div style="font-size:0.8rem; color:var(--text-muted);">Automated base salary + campaign commission calculations</div>
      </div>
      <span class="badge badge-emerald" style="font-size:0.82rem; padding:0.4rem 0.8rem;">Ready for Disbursement</span>
    </div>

    <div class="payroll-card-grid">
      ${cardRows}
    </div>

    <div class="payroll-total-bar">
      <div>
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Agency Base Payroll</div>
        <div style="font-size:1.2rem; font-weight:700; color:#fff;">৳${totalBase.toLocaleString()} BDT</div>
      </div>
      <div>
        <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">Total Crew Commissions</div>
        <div style="font-size:1.2rem; font-weight:700; color:var(--emerald-accent);">+৳${totalCommissions.toLocaleString()} BDT</div>
      </div>
      <div style="border-left:1px solid rgba(255,255,255,0.15); padding-left:1.5rem;">
        <div style="font-size:0.8rem; color:var(--purple-light); text-transform:uppercase; letter-spacing:0.5px; font-weight:700;">Grand Total Payroll Expense</div>
        <div style="font-size:1.4rem; font-weight:800; color:var(--purple-light);">৳${grandTotalBDT.toLocaleString()} BDT <small style="font-size:0.8rem; color:var(--text-muted); font-weight:normal;">(~ $${approxUSD.toLocaleString()} USD)</small></div>
      </div>
    </div>
  `;
}

function exportPayrollReport() {
  if (!appData.team || appData.team.length === 0) {
    alert('No crew members on record to export.');
    return;
  }

  let text = `======================================\n`;
  text += `PURPLEBOT DIGITAL AGENCY - PAYROLL SUMMARY\n`;
  text += `Period: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}\n`;
  text += `======================================\n\n`;

  let grandTotal = 0;
  appData.team.forEach(t => {
    const base = Number(t.baseSalary) || 0;
    const comm = Number(t.earnedCommissions) || 0;
    const total = base + comm;
    grandTotal += total;
    text += `${t.name} (${t.role})\n`;
    text += `  Base Salary:        BDT ${base.toLocaleString()}\n`;
    text += `  Earned Commissions: BDT ${comm.toLocaleString()}\n`;
    text += `  Total Disbursement: BDT ${total.toLocaleString()}\n`;
    text += `--------------------------------------\n`;
  });

  text += `\nGRAND TOTAL PAYROLL: BDT ${grandTotal.toLocaleString()} (~ $${Math.round(grandTotal / 110).toLocaleString()} USD)\n`;

  navigator.clipboard.writeText(text).then(() => {
    alert('📄 Monthly Payroll Summary copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy payroll report:', err);
    alert(text);
  });
}

function openAddEmployeeModal() {
  _editingEmployeeId = null;
  document.getElementById('empModalTitle').innerText = 'Add Crew Member';
  document.getElementById('empModalSubtitle').innerText = 'Enter employee profile and payroll specifications';
  document.getElementById('empFormName').value = '';
  document.getElementById('empFormRole').value = '';
  document.getElementById('empFormDept').value = 'AV Production';
  document.getElementById('empFormTelegram').value = '';
  document.getElementById('empFormSalary').value = '';
  document.getElementById('empFormCommission').value = '0';
  document.getElementById('empFormPhone').value = '';
  document.getElementById('empFormStatus').value = 'In Studio';
  document.getElementById('empFormSubmitBtn').innerText = '💾 Save Crew Member';
  document.getElementById('employeeFormModal')?.classList.remove('hidden');
}

function openEditEmployeeModal(empId) {
  const member = (appData.team || []).find(t => t.id === empId);
  if (!member) return;

  _editingEmployeeId = empId;
  document.getElementById('empModalTitle').innerText = `Edit: ${member.name}`;
  document.getElementById('empModalSubtitle').innerText = `Updating profile & payroll (${member.id})`;
  document.getElementById('empFormName').value = member.name || '';
  document.getElementById('empFormRole').value = member.role || '';
  document.getElementById('empFormDept').value = member.department || 'AV Production';
  document.getElementById('empFormTelegram').value = member.telegramId || '';
  document.getElementById('empFormSalary').value = member.baseSalary || 0;
  document.getElementById('empFormCommission').value = member.commissionRate || 0;
  document.getElementById('empFormPhone').value = member.phone || '';
  document.getElementById('empFormStatus').value = member.status || 'In Studio';
  document.getElementById('empFormSubmitBtn').innerText = '💾 Save Changes';
  document.getElementById('employeeFormModal')?.classList.remove('hidden');
}

function closeEmployeeFormModal() {
  document.getElementById('employeeFormModal')?.classList.add('hidden');
  _editingEmployeeId = null;
}

async function submitEmployeeForm(event) {
  event.preventDefault();

  const payload = {
    name: document.getElementById('empFormName').value,
    role: document.getElementById('empFormRole').value,
    department: document.getElementById('empFormDept').value,
    telegramId: document.getElementById('empFormTelegram').value,
    baseSalary: Number(document.getElementById('empFormSalary').value) || 0,
    commissionRate: Number(document.getElementById('empFormCommission').value) || 0,
    phone: document.getElementById('empFormPhone').value,
    status: document.getElementById('empFormStatus').value
  };

  const isEdit = !!_editingEmployeeId;
  const url = isEdit ? `/api/team/${_editingEmployeeId}` : '/api/team';
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      closeEmployeeFormModal();
      await fetchInitialData();
    } else {
      alert('Failed to save team member: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error saving team member:', err);
    alert('Network error while saving team member.');
  }
}

async function executeDeleteEmployee(empId) {
  const member = (appData.team || []).find(t => t.id === empId);
  if (!confirm(`Are you sure you want to remove "${member?.name || empId}" from the crew directory?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/team/${empId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      fetchInitialData();
    } else {
      alert('Failed to delete team member: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error deleting team member:', err);
    alert('Network error while deleting team member.');
  }
}


// Render Financials & Invoices with Sub-Tabs & Filtering
let activeFinSubtab = 'invoices';
let openInvoiceActionId = null;
let expenseStatusFilter = 'ALL';

function switchFinancialsTab(subtabId) {
  activeFinSubtab = subtabId;
  const tabs = ['invoices', 'quotations', 'expenses', 'verifications'];
  tabs.forEach(t => {
    const btn = document.getElementById(`subtab-btn-${t}`);
    const view = document.getElementById(`fin-subtab-${t}`);
    if (btn) btn.classList.toggle('active', t === subtabId);
    if (view) view.style.display = (t === subtabId) ? 'block' : 'none';
  });
}

function renderFinancials() {
  filterInvoices();
  renderQuotations();
  filterExpenses();
  renderFinancialChart();
  renderPaymentLogs();
}

function renderPaymentLogs() {
  const tbody = document.getElementById('paymentLogsTableBody');
  const badge = document.getElementById('paymentLogsCountBadge');
  if (!tbody) return;

  const logs = appData.paymentLogs || [];
  if (badge) badge.innerText = `${logs.length} Payment${logs.length === 1 ? '' : 's'} Verified`;

  if (logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
          💳 No payment verifications logged yet. Click "✅ Mark Paid" on invoices to log verified transactions.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td><code>${l.id}</code></td>
      <td><strong>${l.invoiceId}</strong></td>
      <td><strong>${l.clientName || l.payerName}</strong></td>
      <td><strong style="color:var(--emerald-accent);">$${(Number(l.amount) || 0).toLocaleString()} USD</strong></td>
      <td><span class="badge badge-purple">${l.method || 'Bkash / Nagad'}</span></td>
      <td><code style="color:var(--cyan-accent);">${l.reference || 'N/A'}</code></td>
      <td><small style="color:var(--text-muted);">${(l.timestamp || '').split('T')[0] || new Date().toISOString().split('T')[0]}</small></td>
    </tr>
  `).join('');
}

async function updateInvoiceStatus(invoiceId, newStatus) {
  openInvoiceActionId = null;

  if (newStatus === 'Paid') {
    const inv = (appData.invoices || []).find(i => i.id === invoiceId);
    const method = prompt(`💳 Payment Verification for Invoice ${invoiceId}\nEnter Payment Method (e.g. Bkash, Nagad, Bank Wire, Credit Card):`, 'Bkash / Nagad Direct');
    if (!method) return;
    const trxId = prompt(`Enter Transaction Reference / TRX ID / Bank Ref:`, `TRX-${Date.now().toString().slice(-6)}`);
    if (!trxId) return;

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          trxId,
          payerName: inv?.clientName || 'Client'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Payment of $${inv?.amount || 0} USD verified for invoice ${invoiceId}!\nClient notified via Telegram (AUT-005).`);
        await fetchInitialData();
        return;
      }
    } catch (err) {
      console.error('Error processing payment verification:', err);
    }
  }

  try {
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      fetchInitialData();
    }
  } catch (err) {
    console.error('Error updating invoice status:', err);
  }
}

// BC-5: Financial Revenue / Expense / Salary Bar Chart Renderer
function renderFinancialChart() {
  const container = document.getElementById('financialChartPanel');
  if (!container) return;

  const invoices = appData.invoices || [];
  const expenses = appData.expenses || [];
  const team = appData.team || [];

  const paidRevenueUSD = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const pendingRevenueUSD = invoices.filter(i => i.status === 'Pending' || i.status === 'Sent' || i.status === 'Due').reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalExpensesUSD = expenses.filter(e => e.status !== 'Rejected').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const totalBaseBDT = team.reduce((sum, t) => sum + (Number(t.baseSalary) || 0), 0);
  const totalCommBDT = team.reduce((sum, t) => sum + (Number(t.earnedCommissions) || 0), 0);
  const payrollUSD = Math.round((totalBaseBDT + totalCommBDT) / 110);

  const maxVal = Math.max(paidRevenueUSD, pendingRevenueUSD, totalExpensesUSD, payrollUSD, 100);

  const getPct = (val) => Math.max(12, Math.round((val / maxVal) * 100));

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h3 style="font-size:1.1rem; font-weight:700; color:#fff; margin:0;">📊 Financial Revenue, Expenses & Payroll Bar Chart</h3>
        <div style="font-size:0.8rem; color:var(--text-muted);">Real-time cashflow comparison across active billing cycles (in USD equiv.)</div>
      </div>
      <span class="badge badge-purple" style="font-size:0.78rem;">July 2026 Fiscal Overview</span>
    </div>

    <div class="fin-chart-container">
      <!-- Bar 1: Paid Revenue -->
      <div class="fin-bar-col">
        <div class="fin-bar-value" style="color:var(--emerald-accent);">$${paidRevenueUSD.toLocaleString()}</div>
        <div class="fin-bar" style="height:${getPct(paidRevenueUSD)}%; background:linear-gradient(180deg, #22c55e, #15803d);"></div>
        <div class="fin-bar-label">Paid Revenue</div>
      </div>

      <!-- Bar 2: Pending Revenue -->
      <div class="fin-bar-col">
        <div class="fin-bar-value" style="color:var(--amber-accent);">$${pendingRevenueUSD.toLocaleString()}</div>
        <div class="fin-bar" style="height:${getPct(pendingRevenueUSD)}%; background:linear-gradient(180deg, #f59e0b, #b45309);"></div>
        <div class="fin-bar-label">Pending Revenue</div>
      </div>

      <!-- Bar 3: Studio Expenses -->
      <div class="fin-bar-col">
        <div class="fin-bar-value" style="color:var(--pink-accent);">$${totalExpensesUSD.toLocaleString()}</div>
        <div class="fin-bar" style="height:${getPct(totalExpensesUSD)}%; background:linear-gradient(180deg, #ec4899, #be185d);"></div>
        <div class="fin-bar-label">Studio Expenses</div>
      </div>

      <!-- Bar 4: Crew Payroll -->
      <div class="fin-bar-col">
        <div class="fin-bar-value" style="color:var(--purple-light);">$${payrollUSD.toLocaleString()}</div>
        <div class="fin-bar" style="height:${getPct(payrollUSD)}%; background:linear-gradient(180deg, #a855f7, #6b21a8);"></div>
        <div class="fin-bar-label">Crew Payroll</div>
      </div>
    </div>
  `;
}

// ==========================================
// 💰 3-TIER EXPENSE APPROVAL CHAIN (Phase B)
// ==========================================

let expenseStatusFilter = 'ALL';
let _inspectorExpId = null;

function setExpenseFilter(status) {
  expenseStatusFilter = status;

  const chips = [
    { id: 'chipExpAll', key: 'ALL' },
    { id: 'chipExpT1', key: 'Tier 1 Pending' },
    { id: 'chipExpT2', key: 'Tier 2 Pending' },
    { id: 'chipExpT3', key: 'Tier 3 Pending' },
    { id: 'chipExpDisbursed', key: 'Disbursed' }
  ];

  chips.forEach(c => {
    const el = document.getElementById(c.id);
    if (el) el.classList.toggle('active', c.key === status);
  });

  filterExpenses();
}

function filterExpenses() {
  const expBody = document.getElementById('expensesTableBody');
  if (!expBody) return;

  const expenses = appData.expenses || [];

  // Compute KPI Metrics
  const t1Count = expenses.filter(e => e.status === 'Tier 1 Pending').length;
  const t2Count = expenses.filter(e => e.status === 'Tier 2 Pending').length;
  const t3Count = expenses.filter(e => e.status === 'Tier 3 Pending').length;
  const disbursedTotal = expenses.filter(e => e.status === 'Disbursed').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const kpiT1 = document.getElementById('kpiExpTier1');
  const kpiT2 = document.getElementById('kpiExpTier2');
  const kpiT3 = document.getElementById('kpiExpTier3');
  const kpiDis = document.getElementById('kpiExpDisbursed');

  if (kpiT1) kpiT1.innerText = t1Count;
  if (kpiT2) kpiT2.innerText = t2Count;
  if (kpiT3) kpiT3.innerText = t3Count;
  if (kpiDis) kpiDis.innerText = `BDT ${disbursedTotal.toLocaleString()}`;

  let filtered = expenses;
  if (expenseStatusFilter !== 'ALL') {
    filtered = expenses.filter(e => (e.status || 'Disbursed') === expenseStatusFilter);
  }

  if (filtered.length === 0) {
    expBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          💳 No expense claims match the selected filter.
        </td>
      </tr>
    `;
    return;
  }

  expBody.innerHTML = filtered.map(e => {
    const status = e.status || 'Tier 1 Pending';
    let badgeClass = 'badge-purple';
    if (status === 'Tier 1 Pending') badgeClass = 'badge-amber';
    else if (status === 'Tier 2 Pending') badgeClass = 'badge-cyan';
    else if (status === 'Tier 3 Pending') badgeClass = 'badge-pink';
    else if (status === 'Disbursed') badgeClass = 'badge-emerald';
    else if (status === 'Rejected') badgeClass = 'badge-pink';

    const amountBdt = (Number(e.amount) || 0).toLocaleString();
    const receiptPhoto = e.receiptUrl || 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80';

    // Build 3-Tier Stepper HTML
    const t1Icon = e.tier1?.approved ? '✅' : (status === 'Tier 1 Pending' ? '⏳' : '⚪');
    const t2Icon = e.tier2?.approved ? '✅' : (status === 'Tier 2 Pending' ? '⏳' : '⚪');
    const t3Icon = e.tier3?.approved ? '✅' : (status === 'Tier 3 Pending' ? '⏳' : '⚪');

    const stepperHtml = `
      <div style="display:flex; align-items:center; gap:0.3rem; font-size:0.75rem; color:var(--text-muted);">
        <span title="Tier 1: Line Manager">${t1Icon} T1</span> ➔
        <span title="Tier 2: Finance">${t2Icon} T2</span> ➔
        <span title="Tier 3: Owner Release">${t3Icon} T3</span>
      </div>
    `;

    return `
      <tr>
        <td><code>${e.id}</code></td>
        <td><strong>${e.submittedBy || e.loggedBy || 'Ground Staff'}</strong></td>
        <td><span class="badge badge-purple">${e.category || 'Miscellaneous'}</span></td>
        <td style="color:#fbbf24; font-weight:700;">BDT ${amountBdt}</td>
        <td>${e.date || '2026-07-28'}</td>
        <td>
          <a href="${receiptPhoto}" target="_blank" style="color:#38bdf8; font-size:0.78rem; text-decoration:underline;">📷 View Photo</a>
        </td>
        <td>
          <div style="display:flex; flex-direction:column; gap:0.2rem;">
            <span class="badge ${badgeClass}" style="width:fit-content;">${status}</span>
            ${stepperHtml}
          </div>
        </td>
        <td style="text-align: right;">
          <button class="btn-purple" style="padding:0.25rem 0.65rem; font-size:0.78rem;" onclick="openReceiptInspectorModal('${e.id}')">🔍 Inspect & Approve</button>
        </td>
      </tr>
    `;
  }).join('');

  // Check if URL has expenseId param to open inspector automatically
  const urlParams = new URLSearchParams(window.location.search);
  const expParam = urlParams.get('expenseId');
  if (expParam && !window._expenseModalOpened) {
    window._expenseModalOpened = true;
    openReceiptInspectorModal(expParam);
  }
}

function openReceiptInspectorModal(expId) {
  const exp = (appData.expenses || []).find(e => e.id === expId);
  if (!exp) return;

  _inspectorExpId = expId;

  document.getElementById('riClaimId').innerText = `${exp.id} (${exp.date || '2026-07-28'})`;
  document.getElementById('riSubmittedBy').innerText = exp.submittedBy || exp.loggedBy || 'Ground Staff';
  document.getElementById('riCategory').innerText = exp.category || 'Miscellaneous';
  document.getElementById('riAmount').innerText = `BDT ${(Number(exp.amount) || 0).toLocaleString()}`;
  document.getElementById('riDescription').innerText = exp.description || 'Field operational expense claim.';

  const receiptUrl = exp.receiptUrl || 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80';
  document.getElementById('riReceiptImg').src = receiptUrl;
  document.getElementById('riReceiptFullLink').href = receiptUrl;

  // Update Stepper Boxes
  const s1Box = document.getElementById('stepT1Box');
  const s1Text = document.getElementById('stepT1Text');
  if (exp.tier1?.approved) {
    s1Box.style.background = 'rgba(34,197,94,0.2)';
    s1Box.style.borderColor = 'rgba(34,197,94,0.4)';
    s1Text.innerText = `✅ ${exp.tier1.approvedBy || 'Approved'}`;
  } else {
    s1Box.style.background = 'rgba(234,179,8,0.15)';
    s1Box.style.borderColor = 'rgba(234,179,8,0.3)';
    s1Text.innerText = exp.status === 'Tier 1 Pending' ? '⏳ Pending Review' : '⚪ Awaiting';
  }

  const s2Box = document.getElementById('stepT2Box');
  const s2Text = document.getElementById('stepT2Text');
  if (exp.tier2?.approved) {
    s2Box.style.background = 'rgba(34,197,94,0.2)';
    s2Box.style.borderColor = 'rgba(34,197,94,0.4)';
    s2Text.innerText = `✅ ${exp.tier2.approvedBy || 'Verified'}`;
  } else {
    s2Box.style.background = 'rgba(6,182,212,0.15)';
    s2Box.style.borderColor = 'rgba(6,182,212,0.3)';
    s2Text.innerText = exp.status === 'Tier 2 Pending' ? '⏳ Pending Verification' : '⚪ Awaiting';
  }

  const s3Box = document.getElementById('stepT3Box');
  const s3Text = document.getElementById('stepT3Text');
  if (exp.tier3?.approved || exp.status === 'Disbursed') {
    s3Box.style.background = 'rgba(34,197,94,0.2)';
    s3Box.style.borderColor = 'rgba(34,197,94,0.4)';
    s3Text.innerText = `🎉 Disbursed (${exp.tier3?.approvedBy || 'Owner'})`;
  } else {
    s3Box.style.background = 'rgba(168,85,247,0.15)';
    s3Box.style.borderColor = 'rgba(168,85,247,0.3)';
    s3Text.innerText = exp.status === 'Tier 3 Pending' ? '⏳ Pending Release' : '⚪ Awaiting';
  }

  // Update Action Buttons Visibility
  const t1Btn = document.getElementById('riApproveT1Btn');
  const t2Btn = document.getElementById('riApproveT2Btn');
  const t3Btn = document.getElementById('riApproveT3Btn');

  if (t1Btn) t1Btn.style.display = exp.status === 'Tier 1 Pending' ? 'inline-block' : 'none';
  if (t2Btn) t2Btn.style.display = exp.status === 'Tier 2 Pending' ? 'inline-block' : 'none';
  if (t3Btn) t3Btn.style.display = exp.status === 'Tier 3 Pending' ? 'inline-block' : 'none';

  document.getElementById('receiptInspectorModal')?.classList.remove('hidden');
}

function closeReceiptInspectorModal() {
  document.getElementById('receiptInspectorModal')?.classList.add('hidden');
  _inspectorExpId = null;
}

async function approveExpenseTier(tier) {
  if (!_inspectorExpId) return;

  const endpointMap = {
    1: `/api/expenses/${_inspectorExpId}/approve-tier1`,
    2: `/api/expenses/${_inspectorExpId}/approve-tier2`,
    3: `/api/expenses/${_inspectorExpId}/approve-tier3`
  };

  const approverRoleMap = {
    1: 'Line Manager / Lead',
    2: 'Finance & Accounts Lead',
    3: 'Agency Owner / Director'
  };

  try {
    const res = await fetch(endpointMap[tier], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy: approverRoleMap[tier] })
    });
    const data = await res.json();
    if (data.success) {
      alert(`✅ Tier ${tier} approval registered for claim ${_inspectorExpId}!\nNew Status: ${data.expense.status}`);
      closeReceiptInspectorModal();
      await fetchInitialData();
    }
  } catch (err) {
    console.error(`Error approving Tier ${tier} expense:`, err);
  }
}

async function rejectExpenseClaim() {
  if (!_inspectorExpId) return;

  const note = prompt('Enter rejection reason for this expense claim:', 'Receipt illegible / unapproved budget category.');
  if (!note) return;

  try {
    const res = await fetch(`/api/expenses/${_inspectorExpId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectionNote: note })
    });
    const data = await res.json();
    if (data.success) {
      alert(`❌ Expense claim ${_inspectorExpId} has been REJECTED.`);
      closeReceiptInspectorModal();
      await fetchInitialData();
    }
  } catch (err) {
    console.error('Error rejecting expense claim:', err);
  }
}
      fetchInitialData();
    }
  } catch (err) {
    console.error('Error approving expense:', err);
  }
}

async function rejectExpense(expId) {
  try {
    const res = await fetch(`/api/expenses/${expId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Rejected' })
    });
    const data = await res.json();
    if (data.success) {
      fetchInitialData();
    }
  } catch (err) {
    console.error('Error rejecting expense:', err);
  }
}

function filterInvoices() {
  const invBody = document.getElementById('invoicesTableBody');
  if (!invBody) return;

  const searchQuery = (document.getElementById('invoiceSearchInput')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('invoiceStatusFilter')?.value || 'ALL';

  const filtered = (appData.invoices || []).filter(inv => {
    const matchesSearch = (inv.id || '').toLowerCase().includes(searchQuery) ||
                          (inv.clientName || '').toLowerCase().includes(searchQuery);
    const matchesStatus = (statusFilter === 'ALL') || (inv.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  if (filtered.length === 0) {
    invBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
          <div>📄 No invoices match your search or filter.</div>
        </td>
      </tr>
    `;
    return;
  }

  invBody.innerHTML = filtered.map(i => {
    let badgeClass = 'badge-purple';
    if (i.status === 'Paid') badgeClass = 'badge-emerald';
    else if (i.status === 'Pending') badgeClass = 'badge-amber';
    else if (i.status === 'Draft') badgeClass = 'badge-amber';
    else if (i.status === 'Sent') badgeClass = 'badge-purple';
    else if (i.status === 'Overdue') badgeClass = 'badge-pink';

    const clientObj = (appData.clients || []).find(c => c.name === i.clientName || c.id === i.clientId);
    const clientBadge = clientObj ? `<span class="badge badge-purple" style="font-size:0.68rem; margin-left:0.4rem;">${clientObj.id}</span>` : '';

    return `
      <tr>
        <td><code>${i.id}</code></td>
        <td><strong>${i.clientName}</strong>${clientBadge}</td>
        <td>${i.date || 'N/A'}</td>
        <td>${i.dueDate || 'N/A'}</td>
        <td><strong>৳${(Number(i.amount) || 0).toLocaleString()}</strong></td>
        <td><span class="badge ${badgeClass}">${i.status}</span></td>
        <td style="text-align: right;">
          <div class="action-menu-container">
            <button class="btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.8rem;" onclick="toggleInvoiceActions('${i.id}', event)">···</button>
            ${openInvoiceActionId === i.id ? `
              <div class="action-menu-dropdown">
                <button class="action-menu-item download" onclick="generateInvoicePDF('${i.id}')">⬇️ Download PDF</button>
                <button class="action-menu-item" onclick="updateInvoiceStatus('${i.id}', 'Paid')">✅ Mark Paid</button>
                <button class="action-menu-item" onclick="updateInvoiceStatus('${i.id}', 'Sent')">📩 Mark Sent</button>
                <button class="action-menu-item" onclick="updateInvoiceStatus('${i.id}', 'Draft')">📝 Mark Draft</button>
              </div>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function generateInvoicePDF(invoiceId) {
  openInvoiceActionId = null;
  filterInvoices();

  const invoice = (appData.invoices || []).find(i => i.id === invoiceId);
  if (!invoice) {
    alert('Invoice record not found.');
    return;
  }

  const client = (appData.clients || []).find(c => c.name === invoice.clientName || c.id === invoice.clientId) || {};

  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    alert('PDF generator library is initializing... Please try again in a moment.');
    return;
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Color Palette
  const PURPLE_BAR = [147, 51, 234];
  const TEXT_MAIN = [24, 18, 43];
  const TEXT_MUTED = [100, 100, 120];

  // Header Banner
  doc.setFillColor(...PURPLE_BAR);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('PURPLEBOT DIGITAL', 14, 18);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 196, 18, { align: 'right' });

  // Agency Sub-header Details
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Digital Marketing & AV Production Agency | Gulshan, Dhaka | hello@purplebot.co', 14, 35);

  // Line Separator
  doc.setDrawColor(220, 220, 230);
  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  // Bill To & Invoice Info Blocks
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 14, 46);

  doc.setTextColor(...TEXT_MAIN);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.clientName || 'Client Name', 14, 52);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  let clientY = 57;
  if (client.contactPerson) {
    doc.text(`Attn: ${client.contactPerson}`, 14, clientY);
    clientY += 5;
  }
  if (client.email) {
    doc.text(`Email: ${client.email}`, 14, clientY);
    clientY += 5;
  }
  if (client.phone) {
    doc.text(`Phone: ${client.phone}`, 14, clientY);
    clientY += 5;
  }

  // Right: Invoice Metadata
  const rightX = 135;
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE DETAILS:', rightX, 46);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MAIN);
  doc.text(`Invoice Number: ${invoice.id}`, rightX, 52);
  doc.text(`Invoice Date: ${invoice.date || 'N/A'}`, rightX, 57);
  doc.text(`Payment Due: ${invoice.dueDate || 'N/A'}`, rightX, 62);
  doc.text(`Status: ${(invoice.status || 'Draft').toUpperCase()}`, rightX, 67);

  // Build Line Items for Table
  let items = invoice.items || [];
  if (items.length === 0) {
    items = [{ description: 'Agency Services & Deliverables', qty: 1, rate: Number(invoice.amount) || 0 }];
  }

  const tableBody = items.map((item, index) => [
    index + 1,
    item.description || 'Service Deliverable',
    item.qty || 1,
    `BDT ${(Number(item.rate) || 0).toLocaleString()}`,
    `BDT ${((Number(item.qty) || 1) * (Number(item.rate) || 0)).toLocaleString()}`
  ]);

  // Compute Financial Summary
  const subtotal = items.reduce((sum, item) => sum + ((Number(item.qty) || 1) * (Number(item.rate) || 0)), 0);
  const discountVal = Number(invoice.discount) || 0;
  let discountAmount = 0;
  if (invoice.discountType === 'fixed') {
    discountAmount = discountVal;
  } else {
    discountAmount = subtotal * (discountVal / 100);
  }
  const taxBase = Math.max(0, subtotal - discountAmount);
  const taxRate = Number(invoice.taxRate) || 0;
  const taxAmount = taxBase * (taxRate / 100);
  const totalAmount = Number(invoice.amount) || Math.round(taxBase + taxAmount);

  // AutoTable Render
  const startTableY = Math.max(clientY, 73) + 4;
  doc.autoTable({
    startY: startTableY,
    head: [['#', 'Deliverable Description', 'Qty', 'Unit Rate', 'Total']],
    body: tableBody,
    theme: 'striped',
    headStyles: {
      fillColor: PURPLE_BAR,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9.5
    },
    bodyStyles: {
      textColor: TEXT_MAIN,
      fontSize: 9
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  const finalY = doc.lastAutoTable.finalY + 8;

  // Summary Box (Right Aligned)
  let sumY = finalY;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);

  doc.text('Subtotal:', rightX, sumY);
  doc.text(`BDT ${subtotal.toLocaleString()}`, 196, sumY, { align: 'right' });
  sumY += 5;

  if (discountAmount > 0) {
    doc.text(`Discount:`, rightX, sumY);
    doc.text(`- BDT ${Math.round(discountAmount).toLocaleString()}`, 196, sumY, { align: 'right' });
    sumY += 5;
  }

  if (taxAmount > 0) {
    doc.text(`Tax / VAT (${taxRate}%):`, rightX, sumY);
    doc.text(`+ BDT ${Math.round(taxAmount).toLocaleString()}`, 196, sumY, { align: 'right' });
    sumY += 5;
  }

  // Total Due Line
  doc.setDrawColor(200, 200, 210);
  doc.line(rightX, sumY, 196, sumY);
  sumY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...PURPLE_BAR);
  doc.text('TOTAL DUE:', rightX, sumY);
  doc.text(`BDT ${totalAmount.toLocaleString()}`, 196, sumY, { align: 'right' });

  // Notes & Payment Terms
  if (invoice.notes && invoice.notes.trim()) {
    const notesY = Math.max(finalY + 10, sumY + 10);
    doc.setFillColor(245, 245, 250);
    doc.roundedRect(14, notesY, 182, 22, 3, 3, 'F');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PURPLE_BAR);
    doc.text('Payment Terms & Notes:', 18, notesY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...TEXT_MUTED);
    doc.text(doc.splitTextToSize(invoice.notes, 174), 18, notesY + 12);
  }

  // Footer (Page Bottom)
  const pageHeight = doc.internal.pageSize.height || 297;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...TEXT_MUTED);
  doc.text('Thank you for partnering with Purplebot Digital Agency.', 105, pageHeight - 12, { align: 'center' });
  doc.text('This is a computer-generated invoice document.', 105, pageHeight - 7, { align: 'center' });

  // Save PDF file
  const cleanClientName = (invoice.clientName || 'Client').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`${invoice.id}_${cleanClientName}.pdf`);
}


function toggleInvoiceActions(invoiceId, event) {
  if (event) event.stopPropagation();
  openInvoiceActionId = openInvoiceActionId === invoiceId ? null : invoiceId;
  filterInvoices();
}

// Close action dropdowns on window click
window.addEventListener('click', () => {
  if (openInvoiceActionId) {
    openInvoiceActionId = null;
    filterInvoices();
  }
});

async function updateInvoiceStatus(invoiceId, newStatus) {
  openInvoiceActionId = null;
  try {
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (data.success) {
      fetchInitialData();
    }
  } catch (err) {
    console.error('Error updating invoice status:', err);
  }
}

// Create Invoice Modal Controls & Line Item Logic
let invoiceLineItems = [];

function openCreateInvoiceModal() {
  const modal = document.getElementById('createInvoiceModal');
  const clientSelect = document.getElementById('invoiceClientSelect');
  const taskSelect = document.getElementById('invoiceTaskSelect');

  if (clientSelect && appData.clients) {
    clientSelect.innerHTML = appData.clients.map(c => `<option value="${c.name}" data-id="${c.id}">${c.name} (${c.category})</option>`).join('');
  }

  if (taskSelect && appData.tasks) {
    taskSelect.innerHTML = `<option value="">None (Standalone Invoice)</option>` +
      appData.tasks.map(t => `<option value="${t.id}">${t.title} (${t.client})</option>`).join('');
  }

  // Set default due date to 15 days from now
  const dueDateInput = document.getElementById('invoiceDueDate');
  if (dueDateInput) {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    dueDateInput.value = d.toISOString().split('T')[0];
  }

  // Initial Line Item
  invoiceLineItems = [
    { description: 'AV Production & Creative Deliverables', qty: 1, rate: 15000 }
  ];
  renderInvoiceLineItems();
  computeInvoiceTotals();

  if (modal) modal.classList.remove('hidden');
}

function closeCreateInvoiceModal() {
  const modal = document.getElementById('createInvoiceModal');
  if (modal) modal.classList.add('hidden');
}

function addInvoiceLineItem() {
  invoiceLineItems.push({ description: '', qty: 1, rate: 0 });
  renderInvoiceLineItems();
  computeInvoiceTotals();
}

function removeInvoiceLineItem(index) {
  if (invoiceLineItems.length <= 1) {
    alert('An invoice must have at least one line item.');
    return;
  }
  invoiceLineItems.splice(index, 1);
  renderInvoiceLineItems();
  computeInvoiceTotals();
}

function renderInvoiceLineItems() {
  const container = document.getElementById('invoiceLineItemsContainer');
  if (!container) return;

  container.innerHTML = invoiceLineItems.map((item, idx) => `
    <div class="line-item-row">
      <input type="text" class="form-input" placeholder="Deliverable / Service Description" value="${item.description}" oninput="updateLineItem(${idx}, 'description', this.value)">
      <input type="number" class="form-input" placeholder="Qty" value="${item.qty}" min="1" oninput="updateLineItem(${idx}, 'qty', this.value)">
      <input type="number" class="form-input" placeholder="Unit Rate (৳)" value="${item.rate}" min="0" oninput="updateLineItem(${idx}, 'rate', this.value)">
      <div class="line-item-total">৳${((Number(item.qty) || 1) * (Number(item.rate) || 0)).toLocaleString()}</div>
      <button type="button" class="btn-remove-line" onclick="removeInvoiceLineItem(${idx})">✕</button>
    </div>
  `).join('');
}

function updateLineItem(idx, key, val) {
  if (key === 'qty' || key === 'rate') {
    invoiceLineItems[idx][key] = Number(val) || 0;
  } else {
    invoiceLineItems[idx][key] = val;
  }
  
  // Update the row total text directly
  const totals = document.querySelectorAll('.line-item-total');
  if (totals[idx]) {
    totals[idx].innerText = `৳${(invoiceLineItems[idx].qty * invoiceLineItems[idx].rate).toLocaleString()}`;
  }

  computeInvoiceTotals();
}

function computeInvoiceTotals() {
  const subtotal = invoiceLineItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const discountType = document.getElementById('invoiceDiscountType')?.value || 'percentage';
  const discountVal = Number(document.getElementById('invoiceDiscountValue')?.value) || 0;
  const taxRate = Number(document.getElementById('invoiceTaxRate')?.value) || 0;

  let discountAmount = 0;
  if (discountType === 'percentage') {
    discountAmount = subtotal * (discountVal / 100);
  } else {
    discountAmount = discountVal;
  }

  const taxBase = Math.max(0, subtotal - discountAmount);
  const taxAmount = taxBase * (taxRate / 100);
  const total = Math.round(taxBase + taxAmount);

  if (document.getElementById('invoiceCalcSubtotal')) document.getElementById('invoiceCalcSubtotal').innerText = `৳${subtotal.toLocaleString()}`;
  if (document.getElementById('invoiceCalcDiscount')) document.getElementById('invoiceCalcDiscount').innerText = `-৳${Math.round(discountAmount).toLocaleString()}`;
  if (document.getElementById('invoiceCalcTax')) document.getElementById('invoiceCalcTax').innerText = `+৳${Math.round(taxAmount).toLocaleString()}`;
  if (document.getElementById('invoiceCalcTotal')) document.getElementById('invoiceCalcTotal').innerText = `৳${total.toLocaleString()}`;
}

async function submitCreateInvoice(event, forceStatus) {
  if (event) event.preventDefault();

  const clientName = document.getElementById('invoiceClientSelect').value;
  const clientObj = (appData.clients || []).find(c => c.name === clientName);
  const clientId = clientObj ? clientObj.id : 'CLI-0001';
  const dueDate = document.getElementById('invoiceDueDate').value;
  const status = forceStatus || document.getElementById('invoiceStatusSelect').value || 'Draft';
  const discountType = document.getElementById('invoiceDiscountType').value;
  const discountValue = Number(document.getElementById('invoiceDiscountValue').value) || 0;
  const taxRate = Number(document.getElementById('invoiceTaxRate').value) || 0;
  const notes = document.getElementById('invoiceNotes').value.trim();

  const validItems = invoiceLineItems.filter(i => i.description.trim() !== '');

  if (validItems.length === 0) {
    alert('Please enter at least one item description.');
    return;
  }

  try {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        clientName,
        dueDate,
        status,
        items: validItems,
        discountType,
        discountValue,
        taxRate,
        notes
      })
    });
    const data = await res.json();
    if (data.success) {
      closeCreateInvoiceModal();
      fetchInitialData();
      alert(`📄 Invoice "${data.invoice.id}" created successfully for ${clientName}!`);
    }
  } catch (err) {
    console.error('Error creating invoice:', err);
  }
}


// Render Asset Tracker
let _editingAssetId = null;

function renderAssets() {
  const tbody = document.getElementById('assetsTableBody');
  if (!tbody) return;

  tbody.innerHTML = (appData.assets || []).map(a => {
    const isCheckedOut = (a.assignedTo && a.assignedTo !== 'Unassigned') || a.condition === 'In Use';

    return `
      <tr>
        <td><code>${a.id}</code></td>
        <td><strong>${a.name}</strong><br><small style="color:var(--text-dim);">${a.serial || 'No S/N'}</small></td>
        <td><span class="badge badge-purple">${a.category}</span></td>
        <td>$${(Number(a.purchasePrice) || 0).toLocaleString()}</td>
        <td style="color:var(--amber-accent); font-weight:600;">-$${(Number(a.monthlyDepreciation) || 0).toLocaleString()}/mo</td>
        <td>👤 ${a.assignedTo || 'Unassigned'}</td>
        <td><span class="badge ${isCheckedOut ? 'badge-amber' : 'badge-emerald'}">${isCheckedOut ? 'In Use' : (a.condition || 'Good')}</span></td>
        <td style="text-align: right;">
          <div style="display: flex; justify-content: flex-end; gap: 0.4rem;">
            ${isCheckedOut ? `
              <button class="btn-approve-sm" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="checkInAsset('${a.id}')">📥 Check In</button>
            ` : `
              <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.75rem; color:var(--cyan-accent);" onclick="checkOutAsset('${a.id}')">📤 Check Out</button>
            `}
            <button class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.78rem;" onclick="openEditAssetModal('${a.id}')">✏️ Edit</button>
            <button class="btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.78rem; color: var(--pink-accent); border-color: rgba(239, 68, 68, 0.3);" onclick="executeDeleteAsset('${a.id}')">🗑️ Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  renderCheckoutLog();
}

// BC-9: Equipment Check-Out & Check-In Workflow Logic
async function checkOutAsset(assetId) {
  const asset = (appData.assets || []).find(a => a.id === assetId);
  if (!asset) return;

  const teamList = (appData.team || []).map((t, idx) => `${idx + 1}. ${t.name} (${t.role})`).join('\n');
  const teamPrompt = `📤 Check Out "${asset.name}"\nSelect crew member number or enter name:\n\n${teamList || '1. Farhan Ahmed (Video Director)'}`;
  
  const selected = prompt(teamPrompt, '1');
  if (!selected) return;

  let borrower = selected.trim();
  const numIndex = parseInt(selected) - 1;
  if (!isNaN(numIndex) && appData.team && appData.team[numIndex]) {
    borrower = appData.team[numIndex].name;
  }

  try {
    const res = await fetch(`/api/assets/${assetId}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ borrower })
    });
    const data = await res.json();
    if (data.success) {
      alert(`📤 ${asset.name} checked out to ${borrower}! Status set to "In Use".`);
      fetchInitialData();
    }
  } catch (err) {
    console.error('Error checking out asset:', err);
  }
}

async function checkInAsset(assetId) {
  const asset = (appData.assets || []).find(a => a.id === assetId);
  if (!asset) return;

  if (!confirm(`📥 Confirm return / check-in of "${asset.name}" to studio vault?`)) return;

  try {
    const res = await fetch(`/api/assets/${assetId}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      alert(`📥 ${asset.name} returned to studio inventory! Status reset to "Good".`);
      fetchInitialData();
    }
  } catch (err) {
    console.error('Error checking in asset:', err);
  }
}

function renderCheckoutLog() {
  const panel = document.getElementById('checkoutLogPanel');
  if (!panel) return;

  const logs = appData.checkoutLog || [];

  if (logs.length === 0) {
    panel.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">📦 Equipment Booking & Check-In/Out Audit Log</h2>
      </div>
      <div style="text-align:center; padding:2rem; color:var(--text-muted);">
        No equipment checkouts logged yet. Click "📤 Check Out" on gear items to track shoot usage.
      </div>
    `;
    return;
  }

  panel.innerHTML = `
    <div class="panel-header" style="display:flex; justify-content:space-between; align-items:center;">
      <div>
        <h2 class="panel-title">📦 Equipment Booking & Check-In/Out Audit Log</h2>
        <div style="font-size:0.8rem; color:var(--text-muted);">Audit history of camera gear, lighting, and audio equipment shoot bookings</div>
      </div>
      <span class="badge badge-purple">${logs.length} Log Entries</span>
    </div>

    <table class="data-table">
      <thead>
        <tr>
          <th>Log ID</th>
          <th>Equipment Name</th>
          <th>Borrower</th>
          <th>Check-Out Date</th>
          <th>Return Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${logs.map(l => {
          const isOut = l.status === 'Checked Out';
          return `
            <tr>
              <td><code>${l.id}</code></td>
              <td><strong>${l.assetName}</strong> (${l.assetId})</td>
              <td>👤 ${l.borrower}</td>
              <td>${l.checkoutDate}</td>
              <td>${l.returnDate || '<em style="color:var(--amber-accent);">In Field</em>'}</td>
              <td><span class="badge ${isOut ? 'badge-amber' : 'badge-emerald'}">${l.status}</span></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function openAddAssetModal() {
  _editingAssetId = null;

  // Populate dynamic crew dropdown
  const crewSelect = document.getElementById('assetFormAssignedTo');
  if (crewSelect) {
    const crewOptions = (appData.team || []).map(t => `<option value="${t.name}">${t.name} (${t.role})</option>`).join('');
    crewSelect.innerHTML = `<option value="Unassigned / Studio Base">Unassigned / Studio Base</option>` + crewOptions;
  }

  document.getElementById('assetModalTitle').innerText = 'Log New Asset';
  document.getElementById('assetModalSubtitle').innerText = 'Register camera gear, lights, workstations, or software';
  document.getElementById('assetFormName').value = '';
  document.getElementById('assetFormSerial').value = '';
  document.getElementById('assetFormCategory').value = 'Camera Gear';
  document.getElementById('assetFormPrice').value = '';
  document.getElementById('assetFormDepreciation').value = '';
  document.getElementById('assetFormAssignedTo').value = 'Unassigned / Studio Base';
  document.getElementById('assetFormCondition').value = 'Excellent';
  document.getElementById('assetFormSubmitBtn').innerText = '💾 Save Asset Record';
  document.getElementById('assetFormModal')?.classList.remove('hidden');
}

function openEditAssetModal(assetId) {
  const asset = (appData.assets || []).find(a => a.id === assetId);
  if (!asset) return;

  _editingAssetId = assetId;

  // Populate dynamic crew dropdown
  const crewSelect = document.getElementById('assetFormAssignedTo');
  if (crewSelect) {
    const crewOptions = (appData.team || []).map(t => `<option value="${t.name}">${t.name} (${t.role})</option>`).join('');
    crewSelect.innerHTML = `<option value="Unassigned / Studio Base">Unassigned / Studio Base</option>` + crewOptions;
  }

  document.getElementById('assetModalTitle').innerText = `Edit: ${asset.name}`;
  document.getElementById('assetModalSubtitle').innerText = `Updating asset specifications (${asset.id})`;
  document.getElementById('assetFormName').value = asset.name || '';
  document.getElementById('assetFormSerial').value = asset.serial || '';
  document.getElementById('assetFormCategory').value = asset.category || 'Camera Gear';
  document.getElementById('assetFormPrice').value = asset.purchasePrice || 0;
  document.getElementById('assetFormDepreciation').value = asset.monthlyDepreciation || 0;
  document.getElementById('assetFormAssignedTo').value = asset.assignedTo || 'Unassigned / Studio Base';
  document.getElementById('assetFormCondition').value = asset.condition || 'Excellent';
  document.getElementById('assetFormSubmitBtn').innerText = '💾 Save Changes';
  document.getElementById('assetFormModal')?.classList.remove('hidden');
}

function closeAssetFormModal() {
  document.getElementById('assetFormModal')?.classList.add('hidden');
  _editingAssetId = null;
}

async function submitAssetForm(event) {
  event.preventDefault();

  const condition = document.getElementById('assetFormCondition').value;
  const name = document.getElementById('assetFormName').value;

  const payload = {
    name,
    serial: document.getElementById('assetFormSerial').value,
    category: document.getElementById('assetFormCategory').value,
    purchasePrice: Number(document.getElementById('assetFormPrice').value) || 0,
    monthlyDepreciation: Number(document.getElementById('assetFormDepreciation').value) || 0,
    assignedTo: document.getElementById('assetFormAssignedTo').value,
    condition
  };

  const isEdit = !!_editingAssetId;
  const url = isEdit ? `/api/assets/${_editingAssetId}` : '/api/assets';
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      closeAssetFormModal();
      await fetchInitialData();

      // Check if maintenance ticket should be generated
      if (condition === 'Needs Repair' || condition === 'Damaged') {
        if (confirm(`⚠️ Asset "${name}" marked as "${condition}". Log a support repair ticket in HR Ops?`)) {
          await fetch('/api/tickets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category: 'Equipment Repair',
              title: `Repair Request: ${name}`,
              description: `Equipment marked as ${condition}. Requires inspection / maintenance.`,
              urgency: 'High',
              loggedBy: window.currentUser?.profile?.name || 'Mahmudul Hasan',
              assignedTo: 'Maintenance Lead'
            })
          });
          alert('🔧 Support repair ticket logged in HR Ops!');
          await fetchInitialData();
        }
      }
    } else {
      alert('Failed to save asset: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error saving asset:', err);
    alert('Network error while saving asset.');
  }
}

async function executeDeleteAsset(assetId) {
  const asset = (appData.assets || []).find(a => a.id === assetId);
  if (!confirm(`Are you sure you want to remove "${asset?.name || assetId}" from the equipment tracker?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/assets/${assetId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      fetchInitialData();
    } else {
      alert('Failed to delete asset: ' + (data.error || 'Unknown error'));
    }
  } catch (err) {
    console.error('Error deleting asset:', err);
    alert('Network error while deleting asset.');
  }
}


let currentReviewId = 'REV-001';

async function approveDeliverableCut() {
  const rev = (appData.reviews || []).find(r => r.id === currentReviewId) || appData.reviews[0];
  const reviewId = rev ? rev.id : 'REV-001';

  try {
    const res = await fetch(`/api/reviews/${reviewId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      const invMsg = data.invoice ? `\n📄 Draft Invoice "${data.invoice.id}" has been auto-created in Financials.` : '';
      alert(`🎉 Deliverable cut for "${rev?.projectName || 'Project'}" approved!${invMsg}\nTask auto-advanced to "Approved".`);
      await fetchInitialData();
      if (data.invoice) {
        switchTab('financials');
        switchFinancialsTab('invoices');
      }
    }
  } catch (err) {
    console.error('Error approving deliverable cut:', err);
  }
}

// BC-11: Generate Public Client Review Share Link
function generateShareLink(reviewId) {
  const rev = (appData.reviews || []).find(r => r.id === (reviewId || currentReviewId)) || appData.reviews[0];
  const shareUrl = `${window.location.origin}/api/review-share/${rev.id}`;
  
  navigator.clipboard.writeText(shareUrl).then(() => {
    let toast = document.getElementById('shareToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'shareToast';
      toast.className = 'share-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `🔗 Public Client Share Link Copied to Clipboard!<br><small style="font-weight:400; opacity:0.9;">${shareUrl}</small>`;
    toast.style.display = 'flex';
    setTimeout(() => { toast.style.display = 'none'; }, 4000);
  }).catch(err => {
    alert(`Public Client Share Link: ${shareUrl}`);
  });
}

// Render Review Room V2 (Multi-Project)
function renderReviewRoom() {
  const reviews = appData.reviews || [];
  if (reviews.length === 0) return;

  // Populate project selector dropdown if needed
  const select = document.getElementById('reviewProjectSelect');
  if (select) {
    const optionsHtml = reviews.map(r => `
      <option value="${r.id}" ${r.id === currentReviewId ? 'selected' : ''}>
        🎥 ${r.projectName || r.id} (${r.client || 'Agency'})
      </option>
    `).join('');
    
    if (select.innerHTML !== optionsHtml) {
      select.innerHTML = optionsHtml;
    }
  }

  // Find current active review
  const rev = reviews.find(r => r.id === currentReviewId) || reviews[0];
  if (!rev) return;
  currentReviewId = rev.id;

  // Update video player src dynamically if changed
  const video = document.getElementById('reviewVideo');
  if (video && rev.mediaUrl && !video.src.includes(encodeURI(rev.mediaUrl))) {
    video.src = rev.mediaUrl;
    video.load();
    if (typeof clearCanvas === 'function') clearCanvas();
  }

  // Resolution Checklist Progress
  const comments = rev.comments || [];
  const resolved = comments.filter(c => c.resolved).length;
  const total = comments.length;
  const percent = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const resText = document.getElementById('resolutionText');
  const resFill = document.getElementById('resolutionFill');
  if (resText) resText.innerText = `${resolved} / ${total} Resolved`;
  if (resFill) resFill.style.width = `${percent}%`;

  // Render Comments List
  const list = document.getElementById('commentsList');
  if (list) {
    if (comments.length === 0) {
      list.innerHTML = `
        <div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.88rem;">
          💬 No markup comments logged for this project cut yet.
        </div>
      `;
    } else {
      list.innerHTML = comments.map(c => {
        const replies = c.replies || [];
        return `
          <div class="comment-card ${c.resolved ? 'resolved' : ''}" onclick="jumpToCommentTimestamp(${c.timeSeconds})">
            <div class="comment-header">
              <span style="font-weight:600; color:#fff;">${c.author}</span>
              <span class="comment-timestamp">${c.timestamp}</span>
            </div>
            <div style="color:var(--text-muted); margin:0.2rem 0;">"${c.text}"</div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.4rem;">
              <div style="display:flex; gap:0.4rem;">
                <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="event.stopPropagation(); toggleResolveComment('${c.id}')">
                  ${c.resolved ? '✅ Resolved' : '⭕ Mark Resolved'}
                </button>
                <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="toggleReplyInput('${c.id}', event)">
                  💬 Reply ${replies.length > 0 ? `(${replies.length})` : ''}
                </button>
              </div>
              ${c.drawings && c.drawings.length > 0 ? `<span style="color:var(--pink-accent); font-size:0.75rem;">🎨 Canvas Markup Attached</span>` : ''}
            </div>

            <!-- Nested Reply Thread -->
            ${replies.length > 0 ? `
              <div class="reply-thread-box" onclick="event.stopPropagation()">
                ${replies.map(r => `
                  <div class="reply-card">
                    <div class="reply-header">
                      <strong style="color:var(--purple-light);">${r.author}</strong>
                      <span style="color:var(--text-dim); font-size:0.72rem;">${r.createdAt || ''}</span>
                    </div>
                    <div style="font-size:0.82rem; color:var(--text-muted);">${r.text}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <!-- Inline Reply Form Container -->
            <div id="replyContainer_${c.id}" class="reply-input-box" style="display: none;" onclick="event.stopPropagation()">
              <input type="text" id="replyInput_${c.id}" class="form-input" style="font-size:0.8rem; padding:0.35rem 0.6rem;" placeholder="Write a reply..." onkeydown="if(event.key==='Enter'){ submitCommentReply('${c.id}', event); }">
              <button class="btn-purple" style="padding:0.35rem 0.7rem; font-size:0.78rem;" onclick="submitCommentReply('${c.id}', event)">Send</button>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

function toggleReplyInput(commentId, event) {
  if (event) event.stopPropagation();
  const el = document.getElementById(`replyContainer_${commentId}`);
  if (el) {
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
    if (el.style.display === 'flex') {
      const input = document.getElementById(`replyInput_${commentId}`);
      if (input) input.focus();
    }
  }
}

async function submitCommentReply(commentId, event) {
  if (event) event.stopPropagation();

  const rev = (appData.reviews || []).find(r => r.id === currentReviewId) || appData.reviews[0];
  if (!rev) return;

  const input = document.getElementById(`replyInput_${commentId}`);
  const text = input ? input.value.trim() : '';
  if (!text) return;

  const authorName = currentRole === 'client' ? `${rev.client || 'Client'} POC` : 'Mahmudul Hasan (Admin)';

  try {
    const res = await fetch(`/api/reviews/${rev.id}/comments/${commentId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author: authorName,
        authorRole: currentRole,
        text
      })
    });
    const data = await res.json();
    if (data.success) {
      if (input) input.value = '';
      fetchInitialData();
    }
  } catch (err) {
    console.error('Error submitting comment reply:', err);
  }
}


function switchReviewProject(reviewId) {
  currentReviewId = reviewId;
  renderReviewRoom();
}

async function toggleResolveComment(commentId) {
  const rev = (appData.reviews || []).find(r => r.id === currentReviewId) || appData.reviews[0];
  if (!rev) return;

  try {
    await fetch(`/api/reviews/${rev.id}/comments/${commentId}/resolve`, { method: 'POST' });
    fetchInitialData();
  } catch (err) {
    console.error('Error resolving comment:', err);
  }
}

function jumpToCommentTimestamp(seconds) {
  const video = document.getElementById('reviewVideo');
  if (video) {
    video.currentTime = seconds;
    video.pause();
    if (typeof drawMarkupForCurrentTime === 'function') drawMarkupForCurrentTime();
  }
}

async function submitNewComment() {
  const rev = (appData.reviews || []).find(r => r.id === currentReviewId) || appData.reviews[0];
  if (!rev) return;

  const input = document.getElementById('newCommentInput');
  const text = input ? input.value.trim() : '';
  if (!text) return;

  const video = document.getElementById('reviewVideo');
  const timeSeconds = Math.floor(video ? video.currentTime : 0);
  const mins = String(Math.floor(timeSeconds / 60)).padStart(2, '0');
  const secs = String(timeSeconds % 60).padStart(2, '0');
  const timestamp = `${mins}:${secs}`;

  try {
    await fetch(`/api/reviews/${rev.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author: currentRole === 'client' ? `${rev.client || 'Client'} POC` : 'Mahmudul Hasan (Admin)',
        authorRole: currentRole,
        timestamp,
        timeSeconds,
        text,
        drawings: currentDrawings
      })
    });
    if (input) input.value = '';
    currentDrawings = [];
    if (typeof clearCanvas === 'function') clearCanvas();
    fetchInitialData();
  } catch (err) {
    console.error('Error submitting comment:', err);
  }
}

function openNewReviewModal() {
  // Populate client dropdown
  const clientSelect = document.getElementById('revFormClient');
  if (clientSelect) {
    clientSelect.innerHTML = (appData.clients || []).map(c => `<option value="${c.name}">${c.name} (${c.category})</option>`).join('');
  }

  document.getElementById('revFormTitle').value = '';
  document.getElementById('revFormMediaUrl').value = '';
  document.getElementById('newReviewModal')?.classList.remove('hidden');
}

function closeNewReviewModal() {
  document.getElementById('newReviewModal')?.classList.add('hidden');
}

async function submitNewReview(event) {
  event.preventDefault();

  const payload = {
    projectName: document.getElementById('revFormTitle').value,
    client: document.getElementById('revFormClient').value,
    mediaType: document.getElementById('revFormMediaType').value,
    mediaUrl: document.getElementById('revFormMediaUrl').value
  };

  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success && data.review) {
      closeNewReviewModal();
      currentReviewId = data.review.id;
      await fetchInitialData();
    } else {
      alert('Failed to launch review session.');
    }
  } catch (err) {
    console.error('Error launching new review session:', err);
    alert('Network error while launching review session.');
  }
}


/* -------------------------------------------------------------
 * 🎨 Review Room 1920x1080 Responsive Canvas Markup Overlay
 * ------------------------------------------------------------- */
function setupCanvas() {
  const canvas = document.getElementById('drawingCanvas');
  const player = document.getElementById('playerContainer');
  const video = document.getElementById('reviewVideo');

  if (!canvas || !player) return;

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    startX = (e.clientX - rect.left) * (1920 / canvas.width);
    startY = (e.clientY - rect.top) * (1080 / canvas.height);
  });

  canvas.addEventListener('mouseup', (e) => {
    if (!isDrawing) return;
    isDrawing = false;
    const rect = canvas.getBoundingClientRect();
    const endX = (e.clientX - rect.left) * (1920 / canvas.width);
    const endY = (e.clientY - rect.top) * (1080 / canvas.height);
    const color = document.getElementById('brushColor').value || '#ec4899';

    if (activeDrawingTool === 'circle') {
      const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
      currentDrawings.push({ type: 'circle', x: startX, y: startY, radius, color });
    } else if (activeDrawingTool === 'arrow') {
      currentDrawings.push({ type: 'arrow', startX, startY, endX, endY, color });
    }

    renderCurrentCanvasStrokes();
  });

  if (video) {
    video.addEventListener('timeupdate', () => {
      if (!video.paused) {
        clearCanvas();
      } else {
        drawMarkupForCurrentTime();
      }
    });
  }
}

function resizeCanvas() {
  const canvas = document.getElementById('drawingCanvas');
  const player = document.getElementById('playerContainer');
  if (canvas && player) {
    canvas.width = player.clientWidth;
    canvas.height = player.clientHeight;
    renderCurrentCanvasStrokes();
  }
}

function setDrawingTool(tool) {
  activeDrawingTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`tool${tool.charAt(0).toUpperCase() + tool.slice(1)}`);
  if (btn) btn.classList.add('active');
}

function clearActiveCanvas() {
  currentDrawings = [];
  clearCanvas();
}

function clearCanvas() {
  const canvas = document.getElementById('drawingCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function renderCurrentCanvasStrokes() {
  const canvas = document.getElementById('drawingCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const scaleX = canvas.width / 1920;
  const scaleY = canvas.height / 1080;

  currentDrawings.forEach(d => {
    ctx.strokeStyle = d.color || '#ec4899';
    ctx.lineWidth = 4 * scaleX;

    if (d.type === 'circle') {
      ctx.beginPath();
      ctx.arc(d.x * scaleX, d.y * scaleY, d.radius * scaleX, 0, Math.PI * 2);
      ctx.stroke();
    } else if (d.type === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(d.startX * scaleX, d.startY * scaleY);
      ctx.lineTo(d.endX * scaleX, d.endY * scaleY);
      ctx.stroke();
    }
  });
}

function drawMarkupForCurrentTime() {
  const video = document.getElementById('reviewVideo');
  const rev = appData.reviews[0];
  if (!video || !rev) return;

  const curSec = Math.floor(video.currentTime);
  const matchingComment = rev.comments.find(c => Math.abs(c.timeSeconds - curSec) <= 1);
  if (matchingComment && matchingComment.drawings) {
    currentDrawings = matchingComment.drawings;
    renderCurrentCanvasStrokes();
  }
}

/* -------------------------------------------------------------
 * 📱 Telegram Bot Mobile Simulator Engine
 * ------------------------------------------------------------- */
function toggleTelegramSimulator() {
  const modal = document.getElementById('telegramSimModal');
  if (modal) modal.classList.toggle('hidden');
}

async function sendSimCommand(cmdText) {
  addTgMsg(cmdText, 'user');

  try {
    const res = await fetch('/api/telegram-simulator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: cmdText })
    });
    const data = await res.json();
    addTgMsg(data.responseText, 'bot', data.inlineButtons);
  } catch (err) {
    console.error('Telegram sim error:', err);
  }
}

function sendSimInput() {
  const input = document.getElementById('tgInput');
  const val = input.value.trim();
  if (!val) return;
  input.value = '';
  sendSimCommand(val);
}

function getNextKanbanStage(currentStage) {
  const stages = ['Strategy', 'Scripting', 'Shooting', 'Editing', 'Client Review', 'Approved'];
  const idx = stages.indexOf(currentStage);
  if (idx === -1 || idx === stages.length - 1) return currentStage || 'Shooting';
  return stages[idx + 1];
}

function replaceTgBtnWithStatus(btnEl, statusHtml) {
  if (!btnEl) return;
  const btnGroup = btnEl.closest('.tg-btn-group');
  if (btnGroup) {
    btnGroup.innerHTML = `<span class="tg-status-badge">${statusHtml}</span>`;
  }
}

function addTgMsg(text, sender, inlineButtons = null) {
  const body = document.getElementById('tgChatBody');
  if (!body) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `tg-msg ${sender}`;
  msgDiv.innerHTML = text.replace(/\n/g, '<br>').replace(/\*(.*?)\*/g, '<strong>$1</strong>');

  if (inlineButtons) {
    const btnGroup = document.createElement('div');
    btnGroup.className = 'tg-btn-group';
    inlineButtons.forEach(row => {
      row.forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'tg-inline-btn';
        btn.innerText = b.text;
        btn.onclick = (e) => handleSimCallback(b.callback_data, e.target);
        btnGroup.appendChild(btn);
      });
    });
    msgDiv.appendChild(btnGroup);
  }

  body.appendChild(msgDiv);
  body.scrollTop = body.scrollHeight;
}

async function handleSimCallback(callbackData, btnEl = null) {
  if (callbackData.startsWith('accept_task:')) {
    const taskId = callbackData.split(':')[1];
    const task = (appData.tasks || []).find(t => t.id === taskId);
    const nextStage = getNextKanbanStage(task?.stage || 'Strategy');

    await advanceTaskStage(taskId, nextStage);
    replaceTgBtnWithStatus(btnEl, `✅ Accepted — Advanced to ${nextStage}`);
    addTgMsg(`✅ <strong>Task Assignment ${taskId} Accepted!</strong><br>Stage advanced to <strong>${nextStage}</strong> on Kanban board.`, 'bot');

  } else if (callbackData.startsWith('reject_task:')) {
    const taskId = callbackData.split(':')[1];
    replaceTgBtnWithStatus(btnEl, `⚠️ Select Decline Reason Below`);
    addTgMsg(`⚠️ Please select a reason for declining task <strong>${taskId}</strong>:`, 'bot', [
      [
        { text: '📅 Schedule Conflict', callback_data: `reject_reason:${taskId}:Schedule Conflict` },
        { text: '🔧 Equipment Deficit', callback_data: `reject_reason:${taskId}:Equipment Deficit` }
      ],
      [
        { text: '💊 Personal / Medical Leave', callback_data: `reject_reason:${taskId}:Personal Leave` }
      ]
    ]);

  } else if (callbackData.startsWith('reject_reason:')) {
    const parts = callbackData.split(':');
    const taskId = parts[1];
    const reason = parts[2] || 'Reason Unspecified';

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority: `Decline Note: ${reason}` })
      });
    } catch (err) {
      console.error('Error logging decline note:', err);
    }

    replaceTgBtnWithStatus(btnEl, `❌ Declined — ${reason}`);
    addTgMsg(`❌ <strong>Task ${taskId} Declined by Crew Member.</strong><br>Reason: <em>${reason}</em>.<br>Agency Owner has been notified to reassign task.`, 'bot');
    fetchInitialData();

  } else if (callbackData.startsWith('resolve_comment:')) {
    const commentId = callbackData.split(':')[1];
    await toggleResolveComment(commentId);
    replaceTgBtnWithStatus(btnEl, `✅ Comment Resolved`);
    addTgMsg(`✅ <strong>Review Comment Resolved!</strong><br>Status updated in Review Room V2.`, 'bot');
  }
}

// Mock CSV Importer
function mockImportCSV() {
  alert('📥 CSV Import Mockup: Successfully imported 12 client records from clients_export_2026.csv!');
}

// B1: LEADS PIPELINE CRM LOGIC
let _editingLeadId = null;

function renderLeads() {
  const leads = appData.leads || [];

  // Compute KPIs
  const totalLeads = leads.length;
  const pipelineValue = leads.reduce((sum, l) => {
    const val = Number((l.value || '').replace(/[^0-9.]/g, '')) || 0;
    return sum + val;
  }, 0);
  const qualifiedDeals = leads.filter(l => l.stage === 'Qualified' || l.stage === 'Proposal Sent' || l.stage === 'Negotiation').length;
  const wonDeals = leads.filter(l => l.stage === 'Won / Closed').length;

  const kpiTotalEl = document.getElementById('kpiTotalLeads');
  const kpiValEl = document.getElementById('kpiPipelineValue');
  const kpiQualEl = document.getElementById('kpiQualifiedDeals');
  const kpiWonEl = document.getElementById('kpiWonDeals');

  if (kpiTotalEl) kpiTotalEl.innerText = totalLeads;
  if (kpiValEl) kpiValEl.innerText = `$${pipelineValue.toLocaleString()}`;
  if (kpiQualEl) kpiQualEl.innerText = qualifiedDeals;
  if (kpiWonEl) kpiWonEl.innerText = wonDeals;

  const stages = ['New Inquiry', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won / Closed'];
  const stageMap = {
    'New Inquiry': 'NewInquiry',
    'Qualified': 'Qualified',
    'Proposal Sent': 'ProposalSent',
    'Negotiation': 'Negotiation',
    'Won / Closed': 'WonClosed'
  };

  stages.forEach(stg => {
    const colKey = stageMap[stg];
    const colEl = document.getElementById(`col-${colKey}`);
    const countEl = document.getElementById(`count-${colKey}`);
    const colLeads = leads.filter(l => l.stage === stg);

    if (countEl) countEl.innerText = colLeads.length;

    if (colEl) {
      if (colLeads.length === 0) {
        colEl.innerHTML = `<div style="text-align:center; padding:1.5rem 0.5rem; color:var(--text-muted); font-size:0.8rem;">No leads in this stage</div>`;
      } else {
        colEl.innerHTML = colLeads.map(l => {
          let badgeColor = 'badge-purple';
          if (l.source === 'Instagram DM') badgeColor = 'badge-pink';
          else if (l.source === 'Referral') badgeColor = 'badge-emerald';
          else if (l.source === 'Website') badgeColor = 'badge-cyan';
          else if (l.source === 'WhatsApp') badgeColor = 'badge-emerald';

          const isWon = l.stage === 'Won / Closed';

          return `
            <div class="kanban-card" style="border-left: 3px solid var(--purple-light);">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                <span class="badge ${badgeColor}" style="font-size:0.7rem;">${l.source || 'Inquiry'}</span>
                <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;"><code>${l.id}</code></span>
              </div>
              <div style="font-weight:700; color:#fff; font-size:0.95rem; margin-bottom:0.2rem;">${l.company}</div>
              <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.4rem;">👤 ${l.contactPerson}</div>
              <div style="font-size:0.78rem; color:var(--purple-light); margin-bottom:0.4rem;">🎯 ${l.service || 'Agency Services'}</div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding-top:0.4rem; border-top:1px solid rgba(255,255,255,0.06);">
                <strong style="color:var(--emerald-accent); font-size:0.88rem;">${l.value || '$0'}</strong>
                <div style="display:flex; gap:0.3rem;">
                  ${!isWon ? `
                    <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.72rem;" onclick="advanceLeadStage('${l.id}', '${l.stage}')" title="Advance Stage">
                      ▶
                    </button>
                    <button class="btn-purple" style="padding:0.2rem 0.5rem; font-size:0.72rem;" onclick="convertLeadToClient('${l.id}')" title="Convert to Active Client Account">
                      🏆 Client
                    </button>
                  ` : `<span class="badge badge-emerald" style="font-size:0.7rem;">Won</span>`}
                  <button class="btn-secondary" style="padding:0.2rem 0.4rem; font-size:0.72rem;" onclick="openEditLeadModal('${l.id}')">✏️</button>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  });
}

function openAddLeadModal() {
  _editingLeadId = null;
  document.getElementById('leadModalTitle').innerText = '💼 Add New Lead';
  document.getElementById('leadModalSubtitle').innerText = 'Add a new prospect inquiry to the sales pipeline';
  document.getElementById('leadFormSubmitBtn').innerText = '💾 Save Lead Record';

  document.getElementById('leadFormCompany').value = '';
  document.getElementById('leadFormContact').value = '';
  document.getElementById('leadFormEmail').value = '';
  document.getElementById('leadFormPhone').value = '';
  document.getElementById('leadFormSource').value = 'Instagram DM';
  document.getElementById('leadFormCategory').value = '';
  document.getElementById('leadFormService').value = '';
  document.getElementById('leadFormValue').value = '';
  document.getElementById('leadFormStage').value = 'New Inquiry';
  document.getElementById('leadFormNotes').value = '';

  document.getElementById('leadFormModal')?.classList.remove('hidden');
}

function openEditLeadModal(leadId) {
  const lead = (appData.leads || []).find(l => l.id === leadId);
  if (!lead) return;

  _editingLeadId = leadId;
  document.getElementById('leadModalTitle').innerText = `✏️ Edit Lead (${lead.id})`;
  document.getElementById('leadModalSubtitle').innerText = 'Update prospect details and pipeline stage';
  document.getElementById('leadFormSubmitBtn').innerText = '💾 Save Changes';

  document.getElementById('leadFormCompany').value = lead.company || '';
  document.getElementById('leadFormContact').value = lead.contactPerson || '';
  document.getElementById('leadFormEmail').value = lead.email || '';
  document.getElementById('leadFormPhone').value = lead.phone || '';
  document.getElementById('leadFormSource').value = lead.source || 'Instagram DM';
  document.getElementById('leadFormCategory').value = lead.category || '';
  document.getElementById('leadFormService').value = lead.service || '';
  document.getElementById('leadFormValue').value = lead.value || '';
  document.getElementById('leadFormStage').value = lead.stage || 'New Inquiry';
  document.getElementById('leadFormNotes').value = lead.notes || '';

  document.getElementById('leadFormModal')?.classList.remove('hidden');
}

function closeLeadFormModal() {
  document.getElementById('leadFormModal')?.classList.add('hidden');
  _editingLeadId = null;
}

async function submitLeadForm(event) {
  event.preventDefault();

  const payload = {
    company: document.getElementById('leadFormCompany').value.trim(),
    contactPerson: document.getElementById('leadFormContact').value.trim(),
    email: document.getElementById('leadFormEmail').value.trim(),
    phone: document.getElementById('leadFormPhone').value.trim(),
    whatsapp: document.getElementById('leadFormPhone').value.trim(),
    source: document.getElementById('leadFormSource').value,
    category: document.getElementById('leadFormCategory').value.trim(),
    service: document.getElementById('leadFormService').value.trim(),
    value: document.getElementById('leadFormValue').value.trim(),
    stage: document.getElementById('leadFormStage').value,
    notes: document.getElementById('leadFormNotes').value.trim()
  };

  const url = _editingLeadId ? `/api/leads/${_editingLeadId}` : '/api/leads';
  const method = _editingLeadId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      closeLeadFormModal();
      fetchInitialData();
      alert(`✅ Lead "${payload.company}" saved successfully!`);
    }
  } catch (err) {
    console.error('Error saving lead:', err);
  }
}

async function advanceLeadStage(leadId, currentStage) {
  const stages = ['New Inquiry', 'Qualified', 'Proposal Sent', 'Negotiation', 'Won / Closed'];
  const curIdx = stages.indexOf(currentStage);
  if (curIdx === -1 || curIdx >= stages.length - 1) return;
  const nextStage = stages[curIdx + 1];

  try {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: nextStage })
    });
    fetchInitialData();
  } catch (err) {
    console.error('Error advancing lead stage:', err);
  }
}

async function convertLeadToClient(leadId) {
  const lead = (appData.leads || []).find(l => l.id === leadId);
  if (!lead) return;

  if (!confirm(`🏆 Convert "${lead.company}" into an active agency client account?`)) return;

  try {
    const res = await fetch(`/api/leads/${leadId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success && data.client) {
      await fetchInitialData();
      alert(`🎉 Lead "${lead.company}" successfully converted to active Client (${data.client.id})!`);
      switchTab('crm');
      setTimeout(() => openClientProfile(data.client.id), 200);
    }
  } catch (err) {
    console.error('Error converting lead to client:', err);
  }
}

// B2: QUOTATIONS & PROPOSALS ENGINE LOGIC
let _currentQuoteLineItems = [];

function renderQuotations() {
  const quotes = appData.quotes || [];

  // Compute Quote KPIs
  const totalQuoted = quotes.reduce((sum, q) => sum + (Number(q.amount) || 0), 0);
  const pendingQuotes = quotes.filter(q => q.status === 'Sent' || q.status === 'Draft').length;
  const approvedQuotes = quotes.filter(q => q.status === 'Approved').length;
  const convertedQuotes = quotes.filter(q => q.status === 'Converted').length;

  const kpiTotal = document.getElementById('kpiTotalQuoted');
  const kpiPend = document.getElementById('kpiPendingQuotes');
  const kpiApp = document.getElementById('kpiApprovedQuotes');
  const kpiConv = document.getElementById('kpiConvertedQuotes');

  if (kpiTotal) kpiTotal.innerText = `$${totalQuoted.toLocaleString()}`;
  if (kpiPend) kpiPend.innerText = pendingQuotes;
  if (kpiApp) kpiApp.innerText = approvedQuotes;
  if (kpiConv) kpiConv.innerText = convertedQuotes;

  const tbody = document.getElementById('quotesTableBody');
  if (!tbody) return;

  if (quotes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          📄 No quotations created yet. Click "+ Create Quotation" to build a commercial proposal.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = quotes.map(q => {
    let badgeClass = 'badge-purple';
    if (q.status === 'Approved') badgeClass = 'badge-emerald';
    else if (q.status === 'Converted') badgeClass = 'badge-cyan';
    else if (q.status === 'Draft') badgeClass = 'badge-amber';
    else if (q.status === 'Sent') badgeClass = 'badge-purple';

    const isConverted = q.status === 'Converted';

    return `
      <tr>
        <td><code>${q.id}</code></td>
        <td><strong>${q.clientName}</strong></td>
        <td>${q.date || 'Today'}</td>
        <td><small style="color:var(--text-muted);">${q.validUntil || '14 Days'}</small></td>
        <td><strong style="color:var(--emerald-accent);">$${(Number(q.amount) || 0).toLocaleString()}</strong></td>
        <td><span class="badge ${badgeClass}">${q.status}</span></td>
        <td style="text-align: right;">
          <div style="display:flex; justify-content:flex-end; gap:0.4rem;">
            <button class="btn-secondary" style="padding:0.25rem 0.6rem; font-size:0.78rem;" onclick="generateQuotePDF('${q.id}')" title="Export PDF Proposal">
              📄 PDF
            </button>
            ${!isConverted ? `
              <button class="btn-purple" style="padding:0.25rem 0.65rem; font-size:0.78rem;" onclick="convertQuoteToInvoice('${q.id}')" title="Convert to Active Client Invoice">
                ⚡ Convert
              </button>
            ` : `<span class="badge badge-cyan" style="font-size:0.72rem;">Converted</span>`}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openCreateQuoteModal() {
  _currentQuoteLineItems = [
    { description: 'Agency Services', qty: 1, rate: 1000 }
  ];

  const clientNameInput = document.getElementById('quoteClientName');
  if (clientNameInput) clientNameInput.value = '';

  const validUntilInput = document.getElementById('quoteValidUntil');
  if (validUntilInput) {
    const twoWeeks = new Date(Date.now() + 14 * 86400000);
    validUntilInput.value = twoWeeks.toISOString().split('T')[0];
  }

  document.getElementById('quoteTerms').value = '50% advance upon contract signing, 50% upon final delivery handover.';
  document.getElementById('quoteTaxRate').value = '15';
  document.getElementById('quoteDiscountValue').value = '0';

  renderQuoteLineItems();
  computeQuoteTotals();

  document.getElementById('createQuoteModal')?.classList.remove('hidden');
}

function closeCreateQuoteModal() {
  document.getElementById('createQuoteModal')?.classList.add('hidden');
}

function addQuoteLineItem() {
  _currentQuoteLineItems.push({ description: '', qty: 1, rate: 0 });
  renderQuoteLineItems();
  computeQuoteTotals();
}

function removeQuoteLineItem(index) {
  if (_currentQuoteLineItems.length <= 1) return;
  _currentQuoteLineItems.splice(index, 1);
  renderQuoteLineItems();
  computeQuoteTotals();
}

function updateQuoteLineItem(idx, key, val) {
  if (!_currentQuoteLineItems[idx]) return;
  if (key === 'qty' || key === 'rate') {
    _currentQuoteLineItems[idx][key] = Number(val) || 0;
  } else {
    _currentQuoteLineItems[idx][key] = val;
  }
  computeQuoteTotals();
}

function renderQuoteLineItems() {
  const container = document.getElementById('quoteLineItemsContainer');
  if (!container) return;

  container.innerHTML = _currentQuoteLineItems.map((item, idx) => `
    <div style="display: grid; grid-template-columns: 1fr 80px 100px 30px; gap: 0.5rem; align-items: center;">
      <input type="text" class="form-input" style="padding:0.4rem 0.6rem; font-size:0.85rem;" placeholder="Scope item description..." value="${item.description}" oninput="updateQuoteLineItem(${idx}, 'description', this.value)">
      <input type="number" class="form-input" style="padding:0.4rem 0.6rem; font-size:0.85rem; text-align:center;" min="1" value="${item.qty}" oninput="updateQuoteLineItem(${idx}, 'qty', this.value)">
      <input type="number" class="form-input" style="padding:0.4rem 0.6rem; font-size:0.85rem; text-align:right;" min="0" value="${item.rate}" oninput="updateQuoteLineItem(${idx}, 'rate', this.value)">
      <button type="button" style="background:transparent; border:none; color:var(--pink-accent); cursor:pointer; font-weight:bold; font-size:1.1rem;" onclick="removeQuoteLineItem(${idx})">✕</button>
    </div>
  `).join('');
}

function computeQuoteTotals() {
  const subtotal = _currentQuoteLineItems.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.rate) || 0)), 0);
  const taxRate = Number(document.getElementById('quoteTaxRate')?.value || 0);
  const discount = Number(document.getElementById('quoteDiscountValue')?.value || 0);

  const taxAmount = (subtotal - discount) * (taxRate / 100);
  const total = Math.max(0, subtotal - discount + taxAmount);

  const subEl = document.getElementById('quoteCalcSubtotal');
  const totEl = document.getElementById('quoteCalcTotal');

  if (subEl) subEl.innerText = `$${subtotal.toLocaleString()}`;
  if (totEl) totEl.innerText = `$${total.toLocaleString()}`;

  return { subtotal, taxAmount, discount, total };
}

async function submitCreateQuote(event, status) {
  if (event) event.preventDefault();

  const clientName = document.getElementById('quoteClientName').value.trim();
  const validUntil = document.getElementById('quoteValidUntil').value;
  const terms = document.getElementById('quoteTerms').value.trim();
  const taxRate = Number(document.getElementById('quoteTaxRate').value) || 0;
  const discount = Number(document.getElementById('quoteDiscountValue').value) || 0;

  if (!clientName) {
    alert('Please enter Client or Lead Name.');
    return;
  }

  const { total } = computeQuoteTotals();

  const payload = {
    clientName,
    validUntil,
    amount: total,
    taxRate,
    discount,
    status: status || 'Draft',
    terms,
    items: _currentQuoteLineItems
  };

  try {
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      closeCreateQuoteModal();
      fetchInitialData();
      alert(`✅ Quotation "${data.quote.id}" saved successfully!`);
    }
  } catch (err) {
    console.error('Error creating quote:', err);
  }
}

async function convertQuoteToInvoice(quoteId) {
  const quote = (appData.quotes || []).find(q => q.id === quoteId);
  if (!quote) return;

  if (!confirm(`⚡ Convert quotation "${quote.id}" for ${quote.clientName} into an active client Invoice?`)) return;

  try {
    const res = await fetch(`/api/quotes/${quoteId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success && data.invoice) {
      await fetchInitialData();
      alert(`🎉 Quotation "${quote.id}" converted to Invoice ${data.invoice.id}!`);
      // Switch to Financials -> Invoices subtab
      switchTab('financials');
      switchFinancialsTab('invoices');
    }
  } catch (err) {
    console.error('Error converting quote:', err);
  }
}

function generateQuotePDF(quoteId) {
  const quote = (appData.quotes || []).find(q => q.id === quoteId);
  if (!quote) {
    alert('Quotation not found!');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(147, 51, 234);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text('PURPLEBOT DIGITAL AGENCY', 14, 20);
  doc.setFontSize(10);
  doc.text('Commercial Proposal & Scope Quotation', 14, 28);

  doc.setFontSize(16);
  doc.text(quote.id, 160, 20, { align: 'right' });
  doc.setFontSize(9);
  doc.text(`Date: ${quote.date || '2026-07-27'}`, 160, 27, { align: 'right' });
  doc.text(`Valid Until: ${quote.validUntil || '14 Days'}`, 160, 33, { align: 'right' });

  // Client Details Section
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.text('PROPOSAL PREPARED FOR:', 14, 52);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(quote.clientName, 14, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Status: ${quote.status}`, 14, 67);

  // Line Items Table
  const tableData = (quote.items || []).map(item => [
    item.description,
    item.qty,
    `$${(Number(item.rate) || 0).toLocaleString()}`,
    `$${((Number(item.qty) || 0) * (Number(item.rate) || 0)).toLocaleString()}`
  ]);

  doc.autoTable({
    startY: 75,
    head: [['Scope Item Description', 'Qty', 'Rate ($)', 'Total ($)']],
    body: tableData,
    headStyles: { fillStyle: 'F', fillColor: [147, 51, 234], textColor: [255, 255, 255] },
    theme: 'striped'
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  // Financial Breakdown Summary
  doc.setFontSize(10);
  doc.text(`Total Amount: $${(Number(quote.amount) || 0).toLocaleString()} USD`, 140, finalY);

  // Scope Notes & Terms
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('COMMERCIAL TERMS & MILESTONES:', 14, finalY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const splitTerms = doc.splitTextToSize(quote.terms || '50% advance upon contract signing, 50% upon final deliverable handover.', 180);
  doc.text(splitTerms, 14, finalY + 22);

  // Footer Signature
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('Authorized by Purplebot Digital Agency • Dhaka, Bangladesh • contact@purplebot.digital', 105, 280, { align: 'center' });

  doc.save(`Proposal_${quote.id}_${quote.clientName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

// B3: SOCIAL CONTENT PLANNER & CALENDAR LOGIC
let _editingPostId = null;
let activeSocialView = 'calendar';

function switchSocialView(mode) {
  activeSocialView = mode;
  const calView = document.getElementById('socialCalendarView');
  const queueView = document.getElementById('socialQueueView');
  const btnCal = document.getElementById('btnViewCalendar');
  const btnQueue = document.getElementById('btnViewQueue');

  if (mode === 'calendar') {
    if (calView) calView.style.display = 'block';
    if (queueView) queueView.style.display = 'none';
    if (btnCal) { btnCal.className = 'btn-purple'; }
    if (btnQueue) { btnQueue.className = 'btn-secondary'; }
  } else {
    if (calView) calView.style.display = 'none';
    if (queueView) queueView.style.display = 'block';
    if (btnCal) { btnCal.className = 'btn-secondary'; }
    if (btnQueue) { btnQueue.className = 'btn-purple'; }
  }
}

let _editingPostId = null;
let _dispatchPostId = null;

function renderSocialCalendar() {
  const posts = appData.posts || [];
  const clients = appData.clients || [];

  // Populate Client Filter Dropdown
  const clientFilterSelect = document.getElementById('socialFilterClient');
  if (clientFilterSelect) {
    const curVal = clientFilterSelect.value || 'ALL';
    const opts = ['<option value="ALL">All Clients</option>'].concat(
      clients.map(c => `<option value="${c.name}" ${c.name === curVal ? 'selected' : ''}>${c.name}</option>`)
    );
    clientFilterSelect.innerHTML = opts.join('');
  }

  // Filter posts by active filters
  const platformFilter = document.getElementById('socialFilterPlatform')?.value || 'ALL';
  const clientFilter = document.getElementById('socialFilterClient')?.value || 'ALL';

  const filteredPosts = posts.filter(p => {
    const pClient = p.clientName || p.client || '';
    const matchPlat = (platformFilter === 'ALL') || (p.platform === platformFilter);
    const matchClient = (clientFilter === 'ALL') || (pClient === clientFilter);
    return matchPlat && matchClient;
  });

  // Compute KPIs
  const scheduledCount = posts.filter(p => p.status === 'Approved' || p.status === 'Scheduled').length;
  const draftCount = posts.filter(p => p.status === 'Draft' || p.status === 'Pending Client Approval').length;
  const dueThisWeek = posts.filter(p => p.status === 'Due Today' || p.status === 'Approved').length;

  const kpiSch = document.getElementById('kpiScheduledPosts');
  const kpiDue = document.getElementById('kpiPostsThisWeek');
  const kpiDraft = document.getElementById('kpiDraftPosts');

  if (kpiSch) kpiSch.innerText = scheduledCount;
  if (kpiDue) kpiDue.innerText = dueThisWeek;
  if (kpiDraft) kpiDraft.innerText = draftCount;

  // Render Month Calendar Grid (July 2026)
  const gridContainer = document.getElementById('socialCalendarGrid');
  if (gridContainer) {
    let html = '';
    // Empty padding cells for Wed start (3 cells)
    for (let p = 0; p < 3; p++) {
      html += `<div style="background: rgba(10,5,22,0.3); border-radius:8px; min-height:100px; opacity:0.3;"></div>`;
    }

    // Days 1 to 31
    for (let day = 1; day <= 31; day++) {
      const dayStr = `2026-07-${String(day).padStart(2, '0')}`;
      const dayPosts = filteredPosts.filter(p => p.scheduledDate === dayStr);

      html += `
        <div style="background: rgba(20,15,38,0.7); border:1px solid rgba(168,85,247,0.15); border-radius:8px; padding:0.4rem; min-height:105px; display:flex; flex-direction:column; gap:0.3rem;">
          <div style="font-size:0.78rem; font-weight:700; color:${dayPosts.length > 0 ? 'var(--purple-light)' : 'var(--text-dim)'}; text-align:right;">${day}</div>
          <div style="display:flex; flex-direction:column; gap:0.3rem; overflow-y:auto; max-height:85px;">
            ${dayPosts.map(p => {
              let bg = 'rgba(147, 51, 234, 0.25)';
              let border = 'var(--purple-light)';
              if (p.platform === 'Instagram') { bg = 'rgba(236, 72, 153, 0.25)'; border = 'var(--pink-accent)'; }
              else if (p.platform === 'Facebook') { bg = 'rgba(59, 130, 246, 0.25)'; border = '#3b82f6'; }
              else if (p.platform === 'TikTok') { bg = 'rgba(30, 41, 59, 0.6)'; border = '#94a3b8'; }
              else if (p.platform === 'LinkedIn') { bg = 'rgba(6, 182, 212, 0.25)'; border = 'var(--cyan-accent)'; }

              const clientName = p.clientName || p.client || 'Client';

              return `
                <div onclick="openDispatchHubModal('${p.id}')" style="background:${bg}; border-left:3px solid ${border}; border-radius:4px; padding:0.25rem 0.35rem; cursor:pointer; font-size:0.72rem;" title="${p.title} (${clientName}) - Click for 1-Click Dispatch">
                  <div style="font-weight:700; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.title}</div>
                  <div style="font-size:0.68rem; color:var(--text-muted); display:flex; justify-content:space-between;">
                    <span>${p.platform}</span>
                    <span style="color:#4ade80;">${p.status === 'Due Today' ? '🔥 Due' : p.status}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }
    gridContainer.innerHTML = html;
  }

  // Render List Queue Table
  const tbody = document.getElementById('socialQueueTableBody');
  if (tbody) {
    if (filteredPosts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">
            📱 No scheduled posts match your filter. Click "+ Create Post" to schedule content.
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = filteredPosts.map(p => {
        let badgeClass = 'badge-purple';
        if (p.platform === 'Instagram') badgeClass = 'badge-pink';
        else if (p.platform === 'LinkedIn') badgeClass = 'badge-cyan';
        else if (p.platform === 'Facebook') badgeClass = 'badge-purple';

        let statusBadge = 'badge-purple';
        if (p.status === 'Published') statusBadge = 'badge-emerald';
        else if (p.status === 'Approved') statusBadge = 'badge-emerald';
        else if (p.status === 'Due Today') statusBadge = 'badge-pink';
        else if (p.status === 'Pending Client Approval') statusBadge = 'badge-amber';
        else if (p.status === 'Changes Requested') statusBadge = 'badge-pink';

        const clientName = p.clientName || p.client || 'Client';

        return `
          <tr>
            <td><code>${p.id}</code></td>
            <td><strong>${clientName}</strong></td>
            <td><span class="badge ${badgeClass}">${p.platform}</span></td>
            <td><small style="color:var(--text-muted);">${p.assignedPublisher || 'Social Team'}</small></td>
            <td>
              <strong style="color:#fff;">${p.title}</strong><br>
              <small style="color:var(--text-muted); font-size:0.75rem;">${(p.caption || '').slice(0, 60)}...</small>
            </td>
            <td>${p.scheduledDate} ${p.scheduledTime || ''}</td>
            <td><span class="badge ${statusBadge}">${p.status}</span></td>
            <td style="text-align: right;">
              <div style="display:flex; justify-content:flex-end; gap:0.3rem;">
                <button class="btn-purple" style="padding:0.2rem 0.6rem; font-size:0.75rem;" onclick="openDispatchHubModal('${p.id}')">🚀 1-Click Dispatch</button>
                <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="openEditPostModal('${p.id}')">✏️ Edit</button>
                <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.75rem; color:var(--pink-accent);" onclick="executeDeletePost('${p.id}')">🗑️</button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // Check if URL has dispatchId param to open hub automatically
  const urlParams = new URLSearchParams(window.location.search);
  const dispatchParam = urlParams.get('dispatchId');
  if (dispatchParam && !window._dispatchModalOpened) {
    window._dispatchModalOpened = true;
    openDispatchHubModal(dispatchParam);
  }
}

function openCreatePostModal() {
  _editingPostId = null;
  document.getElementById('postModalTitle').innerText = '📱 Create Social Post & Schedule Dispatch';
  document.getElementById('postIdInput').value = '';

  const clientSelect = document.getElementById('postClientSelect');
  if (clientSelect && appData.clients) {
    clientSelect.innerHTML = appData.clients.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  }

  document.getElementById('postPlatformSelect').value = 'Facebook';
  document.getElementById('postTitleInput').value = '';
  document.getElementById('postCaptionInput').value = '';
  document.getElementById('postMediaUrlInput').value = '';

  const tomorrow = new Date(Date.now() + 86400000);
  document.getElementById('postDateInput').value = tomorrow.toISOString().split('T')[0];
  document.getElementById('postTimeInput').value = '18:00';
  document.getElementById('postStatusSelect').value = 'Pending Client Approval';

  onSocialClientChange();
  document.getElementById('createPostModal')?.classList.remove('hidden');
}

function onSocialClientChange() {
  const clientName = document.getElementById('postClientSelect')?.value;
  const platform = document.getElementById('postPlatformSelect')?.value || 'Facebook';
  const targetUrlInput = document.getElementById('postTargetUrlInput');

  if (!clientName || !targetUrlInput || _editingPostId) return;

  const clientObj = (appData.clients || []).find(c => c.name === clientName);
  if (clientObj && clientObj.socialLinks) {
    const platKey = platform.toLowerCase().replace(/[^a-z]/g, '');
    const foundUrl = clientObj.socialLinks[platKey] || clientObj.socialLinks['facebook'] || clientObj.socialLinks['instagram'] || '';
    if (foundUrl) targetUrlInput.value = foundUrl;
  }
}

function openEditPostModal(postId) {
  const post = (appData.posts || []).find(p => p.id === postId);
  if (!post) return;

  _editingPostId = postId;
  document.getElementById('postModalTitle').innerText = `✏️ Edit Post (${post.id})`;
  document.getElementById('postIdInput').value = post.id;

  const clientSelect = document.getElementById('postClientSelect');
  if (clientSelect && appData.clients) {
    const curClient = post.clientName || post.client || '';
    clientSelect.innerHTML = appData.clients.map(c => `<option value="${c.name}" ${c.name === curClient ? 'selected' : ''}>${c.name}</option>`).join('');
  }

  document.getElementById('postPlatformSelect').value = post.platform || 'Facebook';
  document.getElementById('postTitleInput').value = post.title || '';
  document.getElementById('postTargetUrlInput').value = post.targetUrl || '';
  document.getElementById('postCaptionInput').value = post.caption || '';
  document.getElementById('postMediaUrlInput').value = (post.mediaUrls && post.mediaUrls[0]) || '';
  document.getElementById('postDateInput').value = post.scheduledDate || '';
  document.getElementById('postTimeInput').value = post.scheduledTime || '18:00';
  document.getElementById('postPublisherSelect').value = post.assignedPublisher || 'Sabrin Akhtar';
  document.getElementById('postStatusSelect').value = post.status || 'Pending Client Approval';

  document.getElementById('createPostModal')?.classList.remove('hidden');
}

function closeCreatePostModal() {
  document.getElementById('createPostModal')?.classList.add('hidden');
  _editingPostId = null;
}

async function submitSocialPost(event) {
  event.preventDefault();

  const clientName = document.getElementById('postClientSelect').value;
  const clientObj = (appData.clients || []).find(c => c.name === clientName);

  const payload = {
    clientId: clientObj?.id || '',
    clientName: clientName,
    platform: document.getElementById('postPlatformSelect').value,
    title: document.getElementById('postTitleInput').value.trim(),
    targetUrl: document.getElementById('postTargetUrlInput').value.trim(),
    caption: document.getElementById('postCaptionInput').value.trim(),
    mediaUrls: [document.getElementById('postMediaUrlInput').value.trim()].filter(Boolean),
    scheduledDate: document.getElementById('postDateInput').value,
    scheduledTime: document.getElementById('postTimeInput').value,
    assignedPublisher: document.getElementById('postPublisherSelect').value,
    status: document.getElementById('postStatusSelect').value
  };

  const url = _editingPostId ? `/api/posts/${_editingPostId}` : '/api/posts';
  const method = _editingPostId ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      closeCreatePostModal();
      await fetchInitialData();
      alert(`✅ Social post "${payload.title}" saved successfully!\nStatus: ${payload.status}`);
    }
  } catch (err) {
    console.error('Error saving social post:', err);
  }
}

// ==========================================
// 🚀 1-CLICK DISPATCH HUB HANDLERS (Phase A)
// ==========================================

function openDispatchHubModal(postId) {
  const post = (appData.posts || []).find(p => p.id === postId);
  if (!post) return;

  _dispatchPostId = postId;
  const clientName = post.clientName || post.client || 'Client';

  document.getElementById('dhPlatformBadge').innerText = post.platform || 'Social';
  document.getElementById('dhStatusBadge').innerText = post.status || 'Approved';
  document.getElementById('dhPostTitle').innerText = post.title || 'Untitled Post';
  document.getElementById('dhClientScheduled').innerText = `Client: ${clientName} • Scheduled: ${post.scheduledDate} at ${post.scheduledTime || '18:00'}`;

  const targetUrl = post.targetUrl || 'https://facebook.com';
  const targetLink = document.getElementById('dhTargetUrlLink');
  const launchBtn = document.getElementById('dhLaunchBtn');

  if (targetLink) {
    targetLink.href = targetUrl;
    targetLink.innerText = targetUrl;
  }
  if (launchBtn) {
    launchBtn.href = targetUrl;
  }

  const captionText = document.getElementById('dhCaptionText');
  if (captionText) {
    captionText.value = post.caption || '';
  }

  const mediaBox = document.getElementById('dhMediaAssetsBox');
  if (mediaBox) {
    const urls = post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls : ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'];
    mediaBox.innerHTML = urls.map((url, i) => `
      <div style="display:flex; align-items:center; gap:0.6rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); padding:0.4rem 0.8rem; border-radius:8px;">
        <span style="font-size:0.8rem; color:#a855f7;">🖼️ Asset #${i + 1}</span>
        <a href="${url}" target="_blank" class="btn-secondary" style="font-size:0.75rem; padding:0.2rem 0.5rem; text-decoration:none;">📥 Open Asset Link</a>
      </div>
    `).join('');
  }

  const publishBtn = document.getElementById('dhMarkPublishedBtn');
  if (publishBtn) {
    if (post.status === 'Published') {
      publishBtn.innerText = '✅ Already Published';
      publishBtn.disabled = true;
      publishBtn.style.opacity = '0.6';
    } else {
      publishBtn.innerText = '✅ Mark as Published';
      publishBtn.disabled = false;
      publishBtn.style.opacity = '1';
    }
  }

  document.getElementById('dispatchHubModal')?.classList.remove('hidden');
}

function closeDispatchHubModal() {
  document.getElementById('dispatchHubModal')?.classList.add('hidden');
  _dispatchPostId = null;
}

function copyDispatchCaption() {
  const captionText = document.getElementById('dhCaptionText')?.value;
  if (!captionText) return;

  navigator.clipboard.writeText(captionText).then(() => {
    alert('📋 Caption copied to clipboard! You can now paste it directly on the social media page.');
  }).catch(err => {
    console.error('Failed to copy text:', err);
  });
}

async function markPostAsPublished() {
  if (!_dispatchPostId) return;

  try {
    const res = await fetch(`/api/posts/${_dispatchPostId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publishedBy: 'Social Handler' })
    });
    const data = await res.json();
    if (data.success) {
      alert('✅ Post status updated to PUBLISHED!');
      closeDispatchHubModal();
      await fetchInitialData();
    }
  } catch (err) {
    console.error('Error marking post as published:', err);
  }
}

async function triggerDispatchTelegramAlert() {
  if (!_dispatchPostId) return;

  try {
    const res = await fetch(`/api/posts/${_dispatchPostId}/dispatch-alert`, {
      method: 'POST'
    });
    const data = await res.json();
    if (data.success) {
      alert('⚡ 1-Click Dispatch alert re-pushed via Telegram!');
    }
  } catch (err) {
    console.error('Error pushing dispatch alert:', err);
  }
}

async function executeDeletePost(postId) {
  if (!confirm(`Are you sure you want to delete post "${postId}"?`)) return;

  try {
    const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      fetchInitialData();
    }
  } catch (err) {
    console.error('Error deleting post:', err);
  }
}

// B4: SERVICE BOOKING FLOW LOGIC
function openServiceBookingModal(serviceId) {
  const serviceSelect = document.getElementById('bookingFormService');
  if (serviceSelect && appData.services) {
    serviceSelect.innerHTML = appData.services.map(s => `
      <option value="${s.title}" ${s.id === serviceId ? 'selected' : ''}>${s.title} (${s.price})</option>
    `).join('');
  }

  document.getElementById('bookingFormContact').value = '';
  document.getElementById('bookingFormCompany').value = '';
  document.getElementById('bookingFormPhone').value = '';
  document.getElementById('bookingFormEmail').value = '';
  document.getElementById('bookingFormNotes').value = '';

  document.getElementById('serviceBookingModal')?.classList.remove('hidden');
}

function closeServiceBookingModal() {
  document.getElementById('serviceBookingModal')?.classList.add('hidden');
}

async function submitServiceBooking(event) {
  event.preventDefault();

  const payload = {
    contactPerson: document.getElementById('bookingFormContact').value.trim(),
    company: document.getElementById('bookingFormCompany').value.trim(),
    phone: document.getElementById('bookingFormPhone').value.trim(),
    whatsapp: document.getElementById('bookingFormPhone').value.trim(),
    email: document.getElementById('bookingFormEmail').value.trim(),
    service: document.getElementById('bookingFormService').value,
    timeline: document.getElementById('bookingFormTimeline').value,
    value: document.getElementById('bookingFormValue').value,
    notes: document.getElementById('bookingFormNotes').value.trim()
  };

  try {
    const res = await fetch('/api/leads/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      closeServiceBookingModal();
      await fetchInitialData();
      if (confirm(`🎉 Service booking inquiry for "${payload.company}" received!\nLead ID: ${data.lead.id} created in Lead Pipeline.\n\nWould you like to view this lead in the Leads Pipeline now?`)) {
        switchTab('leads');
      }
    }
  } catch (err) {
    console.error('Error submitting service booking:', err);
  }
}

// B5: LIVE CHAT HUB LOGIC
let activeChatClientId = 'CLI-0004';

function selectChatThread(clientId) {
  activeChatClientId = clientId;
  fetch(`/api/chats/${clientId}/read`, { method: 'PUT' }).then(() => fetchInitialData());
}

function renderChatHub() {
  const chats = appData.chats || [];

  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const badgeEl = document.getElementById('chatUnreadTotalBadge');
  if (badgeEl) badgeEl.innerText = `💬 ${totalUnread} Unread Messages`;

  const searchQuery = (document.getElementById('chatSearchInput')?.value || '').toLowerCase();
  const filteredChats = chats.filter(c => (c.clientName || '').toLowerCase().includes(searchQuery));
  const listEl = document.getElementById('chatThreadsList');

  if (listEl) {
    if (filteredChats.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.8rem;">No chat threads found</div>`;
    } else {
      listEl.innerHTML = filteredChats.map(c => {
        const isActive = c.clientId === activeChatClientId || c.id === activeChatClientId;
        const lastMsg = c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1] : { text: 'No messages yet', timestamp: '' };

        let channelBadge = 'badge-purple';
        if (c.channel === 'WhatsApp') channelBadge = 'badge-emerald';
        else if (c.channel === 'Telegram') channelBadge = 'badge-cyan';

        return `
          <div onclick="selectChatThread('${c.clientId || c.id}')" style="padding:0.75rem; border-radius:10px; cursor:pointer; background:${isActive ? 'rgba(147, 51, 234, 0.25)' : 'rgba(9,9,11,0.5)'}; border:1px solid ${isActive ? 'var(--purple-light)' : 'rgba(255,255,255,0.06)'}; transition:all 0.2s;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
              <strong style="color:${isActive ? '#fff' : 'var(--text-main)'}; font-size:0.88rem;">${c.clientName}</strong>
              <small style="color:var(--text-muted); font-size:0.7rem;">${c.lastUpdated || lastMsg.timestamp}</small>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span style="font-size:0.78rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">${lastMsg.text}</span>
              <div style="display:flex; gap:0.4rem; align-items:center;">
                <span class="badge ${channelBadge}" style="font-size:0.65rem;">${c.channel}</span>
                ${c.unreadCount > 0 ? `<span class="badge badge-pink" style="font-size:0.65rem;">${c.unreadCount}</span>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  const activeThread = chats.find(c => c.clientId === activeChatClientId || c.id === activeChatClientId) || chats[0];
  if (!activeThread) return;

  activeChatClientId = activeThread.clientId || activeThread.id;

  const headerName = document.getElementById('chatHeaderClientName');
  const headerChannel = document.getElementById('chatHeaderChannel');
  const headerAvatar = document.getElementById('chatHeaderAvatar');
  const headerSub = document.getElementById('chatHeaderSub');

  if (headerName) headerName.innerText = activeThread.clientName;
  if (headerChannel) {
    headerChannel.innerText = activeThread.channel;
    headerChannel.className = `badge ${activeThread.channel === 'WhatsApp' ? 'badge-emerald' : (activeThread.channel === 'Telegram' ? 'badge-cyan' : 'badge-purple')}`;
  }
  if (headerAvatar) headerAvatar.innerText = activeThread.clientName.slice(0, 2).toUpperCase();
  if (headerSub) headerSub.innerText = `${activeThread.channel} Thread • ID: ${activeThread.id}`;

  const container = document.getElementById('chatMessagesContainer');
  if (container) {
    const msgs = activeThread.messages || [];
    if (msgs.length === 0) {
      container.innerHTML = `<div style="text-align:center; margin:auto; color:var(--text-muted); font-size:0.85rem;">No conversation history yet. Send a message to start the thread.</div>`;
    } else {
      container.innerHTML = msgs.map(m => {
        const isAgency = m.isAgency;
        const align = isAgency ? 'flex-end' : 'flex-start';
        const bg = isAgency ? 'rgba(147, 51, 234, 0.35)' : 'rgba(24, 18, 43, 0.9)';
        const border = isAgency ? '1px solid rgba(192, 132, 252, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)';

        return `
          <div style="display:flex; flex-direction:column; align-items:${align}; max-width:75%; align-self:${align};">
            <div style="font-size:0.7rem; color:var(--text-muted); margin-bottom:0.2rem; padding:0 0.2rem;">
              <strong>${m.sender}</strong> <span style="font-size:0.65rem;">(${m.timestamp})</span>
            </div>
            <div style="background:${bg}; border:${border}; border-radius:12px; padding:0.65rem 0.9rem; color:#fff; font-size:0.88rem; line-height:1.45; box-shadow:0 2px 8px rgba(0,0,0,0.2);">
              ${m.text}
            </div>
          </div>
        `;
      }).join('');
      setTimeout(() => { container.scrollTop = container.scrollHeight; }, 50);
    }
  }
}

function insertQuickReply(text) {
  const input = document.getElementById('chatMessageInput');
  if (input) {
    input.value = text;
    input.focus();
  }
}

async function sendChatMessage(event) {
  event.preventDefault();

  const input = document.getElementById('chatMessageInput');
  const text = input ? input.value.trim() : '';
  if (!text || !activeChatClientId) return;

  const payload = {
    sender: 'Mahmudul Hasan (Purplebot)',
    role: 'Agency Director',
    text: text,
    isAgency: true
  };

  try {
    const res = await fetch(`/api/chats/${activeChatClientId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      if (input) input.value = '';
      fetchInitialData();
    }
  } catch (err) {
    console.error('Error sending chat message:', err);
  }
}

function openClientProfileFromChat() {
  if (!activeChatClientId) return;
  switchTab('crm');
  setTimeout(() => openClientProfile(activeChatClientId), 200);
}

// B6: BOT MANAGEMENT & CONFIGURATION LOGIC
let activeBotTarget = 'clientBot';
let activeBotSubtab = 'config';

function switchBotTarget(target) {
  activeBotTarget = target;
  const btnClient = document.getElementById('btnTargetClientBot');
  const btnTeam = document.getElementById('btnTargetTeamBot');

  if (target === 'clientBot') {
    if (btnClient) btnClient.className = 'btn-purple';
    if (btnTeam) btnTeam.className = 'btn-secondary';
  } else {
    if (btnClient) btnClient.className = 'btn-secondary';
    if (btnTeam) btnTeam.className = 'btn-purple';
  }

  renderBotConfig();
}

function switchBotSubtab(subtabId) {
  activeBotSubtab = subtabId;
  const subtabs = ['channels', 'config', 'kb', 'videos', 'leads', 'users', 'analytics'];

  subtabs.forEach(st => {
    const btn = document.getElementById(`subtab-bot-${st}`);
    const panel = document.getElementById(`bot-panel-${st}`);
    if (btn) btn.className = st === subtabId ? 'btn-purple' : 'btn-secondary';
    if (panel) panel.style.display = st === subtabId ? 'block' : 'none';
  });
}

function renderBotConfig() {
  const cfg = appData.botConfig || {};
  const currentBotCfg = cfg[activeBotTarget] || {};

  // Panel 1: Configuration Inputs
  const nameEl = document.getElementById('botCfgName');
  const toneEl = document.getElementById('botCfgTone');
  const personaEl = document.getElementById('botCfgPersona');
  const greetingEl = document.getElementById('botCfgGreeting');
  const fallbackEl = document.getElementById('botCfgFallback');

  if (nameEl) nameEl.value = currentBotCfg.name || '';
  if (toneEl) toneEl.value = currentBotCfg.tone || 'Empathetic & Creative';
  if (personaEl) personaEl.value = currentBotCfg.persona || '';
  if (greetingEl) greetingEl.value = currentBotCfg.greeting || '';
  if (fallbackEl) fallbackEl.value = currentBotCfg.fallback || '';

  // Panel 2: Knowledge Base Table
  const kbBody = document.getElementById('botKBTableBody');
  if (kbBody) {
    const kbItems = cfg.knowledgeBase || [];
    if (kbItems.length === 0) {
      kbBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No Knowledge Base items trained yet. Click "+ Add Knowledge Item" to train FAQ responses.</td></tr>`;
    } else {
      kbBody.innerHTML = kbItems.map(k => `
        <tr>
          <td><code>${k.id}</code></td>
          <td><span class="badge badge-purple">${k.category || 'General'}</span></td>
          <td><strong>${k.question}</strong></td>
          <td><small style="color:var(--text-muted);">${k.answer}</small></td>
          <td style="text-align:right;">
            <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.75rem; color:var(--pink-accent);" onclick="deleteKBItem('${k.id}')">🗑️ Delete</button>
          </td>
        </tr>
      `).join('');
    }
  }

  // Panel 3: Video Tutorials
  const videosContainer = document.getElementById('botVideosContainer');
  if (videosContainer) {
    const vids = cfg.videoTutorials || [];
    videosContainer.innerHTML = vids.map(v => `
      <div style="background:rgba(20,15,38,0.8); border:1px solid var(--border-color); border-radius:10px; padding:0.8rem;">
        <div style="font-size:0.75rem; color:var(--purple-light); font-weight:700; margin-bottom:0.3rem;">🎥 ${v.category || 'Tutorial'}</div>
        <div style="font-weight:700; color:#fff; font-size:0.9rem; margin-bottom:0.4rem;">${v.title}</div>
        <video src="${v.url}" controls style="width:100%; border-radius:6px; max-height:140px; background:#000;"></video>
      </div>
    `).join('');
  }

  // Panel 4: Captured Leads
  const leadsBody = document.getElementById('botLeadsTableBody');
  if (leadsBody) {
    const leads = (appData.leads || []).filter(l => (l.source || '').toLowerCase().includes('bot') || (l.source || '').toLowerCase().includes('telegram') || (l.source || '').toLowerCase().includes('website'));
    if (leads.length === 0) {
      leadsBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No bot-captured leads recorded yet</td></tr>`;
    } else {
      leadsBody.innerHTML = leads.map(l => `
        <tr>
          <td><code>${l.id}</code></td>
          <td><strong>${l.company}</strong> (${l.contactPerson})</td>
          <td>${l.service || 'Inquiry'}</td>
          <td><span class="badge badge-pink">${l.source}</span></td>
          <td><span class="badge badge-purple">${l.stage}</span></td>
          <td style="text-align:right;">
            <button class="btn-purple" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="switchTab('leads')">💼 View</button>
          </td>
        </tr>
      `).join('');
    }
  }

  // Panel 5: Bot Users
  const usersBody = document.getElementById('botUsersTableBody');
  if (usersBody) {
    const team = appData.team || [];
    usersBody.innerHTML = team.map(emp => `
      <tr>
        <td><code>${emp.telegramId || 'TG-' + emp.id}</code></td>
        <td><strong>${emp.name}</strong></td>
        <td>${emp.role}</td>
        <td>${emp.phone}</td>
        <td><span class="badge badge-emerald">Verified Active</span></td>
      </tr>
    `).join('');
  }

  // Panel 6: Telegram Groups & Channels Directory
  const groupsBody = document.getElementById('groupsTableBody');
  if (groupsBody) {
    fetch('/api/groups')
      .then(res => res.json())
      .then(groups => {
        appData.groups = groups || [];
        if (groups.length === 0) {
          groupsBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No Telegram Groups or Channels registered yet. Click "+ Add Group / Channel" to register one.</td></tr>`;
        } else {
          groupsBody.innerHTML = groups.map(g => `
            <tr>
              <td><code>${g.id}</code></td>
              <td><strong>${g.name}</strong><br><small style="color:var(--text-muted);">${g.description || 'No description'}</small></td>
              <td><span class="badge ${g.type === 'channel' ? 'badge-purple' : 'badge-emerald'}">${g.type === 'channel' ? '📢 Channel' : '👥 Group'}</span></td>
              <td><code>${g.chatId}</code></td>
              <td><span class="badge badge-purple">${g.bot === 'teamBot' ? 'Purple Man' : 'Purple Bot'}</span></td>
              <td>${g.linkedClientId || 'Internal Agency'}</td>
              <td style="text-align:right; display:flex; gap:0.4rem; justify-content:flex-end;">
                <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.75rem;" onclick="testPostGroup('${g.id}')">⚡ Test Post</button>
                <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.75rem; color:var(--pink-accent);" onclick="deleteGroup('${g.id}')">🗑️ Remove</button>
              </td>
            </tr>
          `).join('');
        }
      }).catch(err => console.warn('Fetch groups error:', err));
  }
}

// Telegram Groups Modal Handlers
function openAddGroupModal() {
  const select = document.getElementById('grpLinkedClient');
  if (select) {
    select.innerHTML = '<option value="">None (Internal Agency Channel)</option>' +
      (appData.clients || []).map(c => `<option value="${c.id}">${c.name} (${c.id})</option>`).join('');
  }
  document.getElementById('addGroupModal')?.classList.remove('hidden');
}

function closeAddGroupModal() {
  document.getElementById('addGroupModal')?.classList.add('hidden');
}

async function submitAddGroup(e) {
  e.preventDefault();
  const name = document.getElementById('grpName').value.trim();
  const type = document.getElementById('grpType').value;
  const bot = document.getElementById('grpBot').value;
  const chatId = document.getElementById('grpChatId').value.trim();
  const linkedClientId = document.getElementById('grpLinkedClient').value;
  const description = document.getElementById('grpDesc').value.trim();

  try {
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, bot, chatId, linkedClientId, description })
    });
    const data = await res.json();
    if (data.success) {
      closeAddGroupModal();
      renderBotConfig();
      alert(`✅ Telegram group [${name}] registered successfully!`);
    } else {
      alert('Error adding group: ' + (data.error || 'Failed'));
    }
  } catch (err) {
    alert('Failed to register group: ' + err.message);
  }
}

async function deleteGroup(id) {
  if (!confirm('Are you sure you want to remove this Telegram Group record?')) return;
  try {
    await fetch(`/api/groups/${id}`, { method: 'DELETE' });
    renderBotConfig();
  } catch (err) {
    console.error('Delete group error:', err);
  }
}

async function testPostGroup(id) {
  try {
    const res = await fetch(`/api/groups/${id}/test-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '🤖 *PurpleOS Bot Test Broadcast*\nConnection active & verified!' })
    });
    const data = await res.json();
    alert(data.message || 'Test post sent!');
  } catch (err) {
    alert('Test post error: ' + err.message);
  }
}

// Workspace Access Card Generator Handler
let currentAccessCardData = null;

async function generateUserAccessCard(phone, linkedId, linkedType = 'team', email = '') {
  try {
    const res = await fetch('/api/auth/pin/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, linkedId, linkedType, email, sendTelegram: false })
    });
    const data = await res.json();
    if (!data.success) {
      alert('Error generating access PIN: ' + (data.error || 'Failed'));
      return;
    }

    currentAccessCardData = { ...data, phone, linkedId, linkedType };

    const cardTextEl = document.getElementById('accessCardText');
    if (cardTextEl) cardTextEl.innerText = data.inviteCardText;

    const waBtn = document.getElementById('accessCardWaBtn');
    if (waBtn) waBtn.href = data.whatsappLink;

    document.getElementById('accessCardModal')?.classList.remove('hidden');

  } catch (err) {
    alert('Generate PIN error: ' + err.message);
  }
}

function closeAccessCardModal() {
  document.getElementById('accessCardModal')?.classList.add('hidden');
}

function copyAccessCard() {
  if (currentAccessCardData?.inviteCardText) {
    navigator.clipboard.writeText(currentAccessCardData.inviteCardText);
    alert('📋 Workspace Access Card copied to clipboard!');
  }
}

async function pushAccessCardTelegram() {
  if (!currentAccessCardData) return;
  try {
    const res = await fetch('/api/auth/pin/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: currentAccessCardData.phone,
        linkedId: currentAccessCardData.linkedId,
        linkedType: currentAccessCardData.linkedType,
        sendTelegram: true
      })
    });
    const data = await res.json();
    if (data.telegramPushed) {
      alert('🚀 Access PIN pushed directly to user via Telegram!');
    } else {
      alert('⚠️ Could not push to Telegram. User may not have paired their Telegram chat ID yet.');
    }
  } catch (err) {
    alert('Telegram push error: ' + err.message);
  }
}

async function saveBotConfig() {
  const currentBotCfg = {
    name: document.getElementById('botCfgName')?.value.trim() || '',
    tone: document.getElementById('botCfgTone')?.value || '',
    persona: document.getElementById('botCfgPersona')?.value.trim() || '',
    greeting: document.getElementById('botCfgGreeting')?.value.trim() || '',
    fallback: document.getElementById('botCfgFallback')?.value.trim() || ''
  };

  const teamBotToken = document.getElementById('cfgTeamBotToken')?.value.trim();
  const clientBotToken = document.getElementById('cfgClientBotToken')?.value.trim();
  const aiProvider = document.getElementById('cfgAiProvider')?.value;
  const aiGlobalKey = document.getElementById('cfgAiGlobalKey')?.value.trim();
  const clientByokEnabled = document.getElementById('cfgAiClientByok')?.checked ?? true;

  const payload = {
    [activeBotTarget]: currentBotCfg,
    teamBotToken,
    clientBotToken,
    aiConfig: {
      provider: aiProvider,
      globalKey: aiGlobalKey,
      clientByokEnabled
    }
  };

  try {
    const res = await fetch('/api/bot-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      fetchInitialData();
      alert(`✅ Bot configuration for "${activeBotTarget === 'clientBot' ? 'Client Assistant Bot' : 'Team Crew Operations Bot'}" saved!`);
    }
  } catch (err) {
    console.error('Error saving bot config:', err);
  }
}

function openAddKBModal() {
  document.getElementById('kbFormQuestion').value = '';
  document.getElementById('kbFormAnswer').value = '';
  document.getElementById('kbItemModal')?.classList.remove('hidden');
}

function closeAddKBModal() {
  document.getElementById('kbItemModal')?.classList.add('hidden');
}

async function submitAddKBItem(event) {
  event.preventDefault();

  const payload = {
    category: document.getElementById('kbFormCategory').value,
    question: document.getElementById('kbFormQuestion').value.trim(),
    answer: document.getElementById('kbFormAnswer').value.trim()
  };

  try {
    const res = await fetch('/api/bot-config/kb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      closeAddKBModal();
      fetchInitialData();
      alert('✅ Knowledge Base item added!');
    }
  } catch (err) {
    console.error('Error adding KB item:', err);
  }
}

async function deleteKBItem(kbId) {
  if (!confirm(`Delete Knowledge Base item "${kbId}"?`)) return;

  try {
    const res = await fetch(`/api/bot-config/kb/${kbId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      fetchInitialData();
    }
  } catch (err) {
    console.error('Error deleting KB item:', err);
  }
}

// B7: CLIENT ONBOARDING AUTOMATION LOGIC
async function toggleOnboardingStep(clientId, stepKey) {
  const client = (appData.clients || []).find(c => c.id === clientId);
  if (!client) return;

  const defaultSteps = [
    { key: 'welcomeSent', title: 'Welcome Kit & Portal Access Link Sent', done: true },
    { key: 'contractSigned', title: 'Service Agreement / Retainer Contract Executed', done: true },
    { key: 'invoiceCreated', title: 'Initial Retainer Invoice Created', done: true },
    { key: 'kickoffCall', title: 'Kick-off Alignment Call Scheduled', done: true },
    { key: 'briefCollected', title: 'Creative Brief & Brand Assets Collected', done: false },
    { key: 'milestoneCreated', title: 'First Project Milestone Created in Kanban Board', done: false }
  ];

  const currentOnboarding = client.onboarding || { steps: defaultSteps };
  const updatedSteps = (currentOnboarding.steps || defaultSteps).map(s => {
    if (s.key === stepKey) {
      return { ...s, done: !s.done, date: !s.done ? new Date().toISOString().split('T')[0] : null };
    }
    return s;
  });

  const completedCount = updatedSteps.filter(s => s.done).length;
  const pct = Math.round((completedCount / updatedSteps.length) * 100);

  const payload = {
    onboarding: {
      progressPct: pct,
      steps: updatedSteps
    }
  };

  try {
    const res = await fetch(`/api/clients/${clientId}/onboarding`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      await fetchInitialData();
      if (activeDrawerClientId === clientId) {
        renderClientDrawer();
      }
    }
  } catch (err) {
    console.error('Error toggling onboarding step:', err);
  }
}

function openWelcomeEmailModal(clientId) {
  const client = (appData.clients || []).find(c => c.id === clientId);
  if (!client) return;

  const toInput = document.getElementById('welcomeEmailTo');
  const subjectInput = document.getElementById('welcomeEmailSubject');
  const bodyInput = document.getElementById('welcomeEmailBody');

  if (toInput) toInput.value = `${client.contactPerson || client.name} <${client.email || 'client@brand.com'}>`;
  if (subjectInput) subjectInput.value = `🚀 Welcome to Purplebot Digital Agency — ${client.name} Account Activation`;

  if (bodyInput) {
    bodyInput.value = `Dear ${client.contactPerson || 'Team'},\n\n` +
      `Welcome to Purplebot Digital Agency! We are thrilled to partner with ${client.name} as your dedicated digital growth and creative media agency.\n\n` +
      `Below are your official account onboarding details:\n` +
      `--------------------------------------------------\n` +
      `Account Name: ${client.name}\n` +
      `Client ID: ${client.id}\n` +
      `Account Lead: Naimur Rahman (naimur@purplebot.digital)\n` +
      `Client Portal Access: https://portal.purplebot.digital/login?client=${client.id}\n` +
      `--------------------------------------------------\n\n` +
      `Next Onboarding Steps:\n` +
      `1. Log into your Client Portal to review active campaign schedules and invoices.\n` +
      `2. Upload your brand vector logos and style guides into the Asset Vault.\n` +
      `3. Join our dedicated WhatsApp / Telegram project group for daily communication.\n\n` +
      `If you have any immediate questions, please feel free to reach out to your Account Lead.\n\n` +
      `Best regards,\n` +
      `Mahmudul Hasan\n` +
      `Managing Director | Purplebot Digital Agency`;
  }

  document.getElementById('welcomeEmailModal')?.classList.remove('hidden');
}

function closeWelcomeEmailModal() {
  document.getElementById('welcomeEmailModal')?.classList.add('hidden');
}

function copyWelcomeEmailText() {
  const bodyText = document.getElementById('welcomeEmailBody')?.value || '';
  navigator.clipboard.writeText(bodyText).then(() => {
    alert('📋 Welcome Pack Email text copied to clipboard!');
  }).catch(err => {
    console.error('Failed to copy text:', err);
  });
}

// B8: TELEGRAM WEBHOOK ENGINE & WHATSAPP DIRECT LINK LOGIC
function openWebhookGatewayModal() {
  renderWebhookLogs();
  document.getElementById('webhookGatewayModal')?.classList.remove('hidden');
}

function closeWebhookGatewayModal() {
  document.getElementById('webhookGatewayModal')?.classList.add('hidden');
}

function renderWebhookLogs() {
  const tbody = document.getElementById('webhookLogsTableBody');
  if (!tbody) return;

  const logs = appData.webhookLogs || [];
  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No webhook event logs recorded yet</td></tr>`;
  } else {
    tbody.innerHTML = logs.map(l => {
      let channelBadge = 'badge-cyan';
      if (l.channel === 'Telegram') channelBadge = 'badge-cyan';
      else if (l.channel === 'WhatsApp') channelBadge = 'badge-emerald';

      let typeBadge = (l.type || '').includes('inbound') ? 'badge-purple' : 'badge-pink';

      return `
        <tr>
          <td><code>${l.id}</code></td>
          <td><span class="badge ${channelBadge}">${l.channel}</span></td>
          <td><span class="badge ${typeBadge}">${l.type}</span></td>
          <td><strong>${l.sender}</strong></td>
          <td><small style="color:var(--text-muted);">${l.payload}</small></td>
          <td><span class="badge badge-emerald">${l.status}</span></td>
          <td><small style="color:var(--text-dim);">${l.timestamp}</small></td>
        </tr>
      `;
    }).join('');
  }
}

async function triggerTestTelegramWebhook() {
  const sampleUpdates = [
    { sender: 'Arman Hossain (Chillox)', text: 'Hi Naimur, when can we expect the 8-Year Anniversary Vlog cut?' },
    { sender: 'Tanvir Hasan (UCB Bank)', text: '/mybookings' },
    { sender: 'Samiul Alam (Clear Men)', text: 'Payment verification for INV-2026-002 sent.' },
    { sender: 'Major Farhan', text: '/help' }
  ];
  const randomUpdate = sampleUpdates[Math.floor(Math.random() * sampleUpdates.length)];

  try {
    const res = await fetch('/api/webhooks/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(randomUpdate)
    });
    const data = await res.json();
    if (data.success) {
      if (appData.webhookLogs) appData.webhookLogs.unshift(data.log);
      renderWebhookLogs();
    }
  } catch (err) {
    console.error('Error triggering Telegram webhook:', err);
  }
}

async function sendTelegramPushAlert() {
  const alertText = `Push Notification Alert: New deliverable video cut uploaded to Review Room V2!`;

  try {
    const res = await fetch('/api/webhooks/send-telegram-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertText })
    });
    const data = await res.json();
    if (data.success) {
      if (appData.webhookLogs) appData.webhookLogs.unshift(data.log);
      renderWebhookLogs();
      alert('🚀 Telegram Push Notification dispatched!');
    }
  } catch (err) {
    console.error('Error sending Telegram alert:', err);
  }
}

function generateWhatsAppLink(phone, messageText) {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(messageText || 'Hello from Purplebot Digital Agency!');
  return `https://wa.me/${cleanPhone || '8801911998877'}?text=${encodedText}`;
}

function openSampleWhatsAppLink() {
  const sampleMsg = "Hi Arman! This is Naimur from Purplebot Digital. Your 8-Year Anniversary Vlog cut is ready in Review Room V2: https://portal.purplebot.digital/review";
  const waUrl = generateWhatsAppLink('+8801911998877', sampleMsg);
  window.open(waUrl, '_blank');
}

// Module C10: BI Dashboard & Aggregated Intelligence Rendering
async function renderAnalytics() {
  const cardsContainer = document.getElementById('analyticsMetricCards');
  if (!cardsContainer) return;

  try {
    const res = await fetch('/api/analytics');
    const data = await res.json();
    if (!data.success) return;

    const fin = data.financials;
    const fun = data.funnel;

    cardsContainer.innerHTML = `
      <div class="stat-box" style="background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.3);">
        <div style="font-size: 0.78rem; color: var(--purple-light); font-weight: 700;">MONTHLY RECURRING REVENUE</div>
        <div style="font-size: 1.8rem; font-weight: 800; color: #fff; margin: 0.3rem 0;">$${fin.mrr.toLocaleString()} USD</div>
        <div style="font-size: 0.75rem; color: #34d399;">🟢 Gross Margin: ${fin.marginPercent}%</div>
      </div>
      <div class="stat-box" style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3);">
        <div style="font-size: 0.78rem; color: #34d399; font-weight: 700;">PAID COLLECTED REVENUE</div>
        <div style="font-size: 1.8rem; font-weight: 800; color: #fff; margin: 0.3rem 0;">$${fin.paidRevenue.toLocaleString()} USD</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">Verified in Bank/Bkash</div>
      </div>
      <div class="stat-box" style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3);">
        <div style="font-size: 0.78rem; color: #fbbf24; font-weight: 700;">PENDING UNCOLLECTED</div>
        <div style="font-size: 1.8rem; font-weight: 800; color: #fff; margin: 0.3rem 0;">$${fin.pendingRevenue.toLocaleString()} USD</div>
        <div style="font-size: 0.75rem; color: #fbbf24;">Action required</div>
      </div>
      <div class="stat-box" style="background: rgba(6,182,212,0.1); border: 1px solid rgba(6,182,212,0.3);">
        <div style="font-size: 0.78rem; color: #38bdf8; font-weight: 700;">ACTIVE RETAINER CLIENTS</div>
        <div style="font-size: 1.8rem; font-weight: 800; color: #fff; margin: 0.3rem 0;">${data.totalClientsCount} Clients</div>
        <div style="font-size: 0.75rem; color: #38bdf8;">${data.activeTasksCount} active campaigns</div>
      </div>
    `;

    // 6-Month Growth Bar Chart
    const chartBox = document.getElementById('analyticsChartBox');
    if (chartBox) {
      const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
      const revValues = [12000, 14500, 15000, 16800, 17200, fin.mrr || 18400];
      const maxVal = Math.max(...revValues, 20000);

      chartBox.innerHTML = months.map((m, idx) => {
        const heightPct = Math.round((revValues[idx] / maxVal) * 100);
        return `
          <div style="flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end;">
            <div style="font-size:0.75rem; color:#34d399; font-weight:700; margin-bottom:0.4rem;">$${(revValues[idx]/1000).toFixed(1)}k</div>
            <div style="width:100%; height:${heightPct}%; background:linear-gradient(180deg, #a855f7, #ec4899); border-radius:8px 8px 0 0; min-height:10px;"></div>
            <div style="font-size:0.78rem; color:var(--text-muted); font-weight:600; margin-top:0.5rem;">${m}</div>
          </div>
        `;
      }).join('');
    }

    // Funnel Visual
    const funnelBox = document.getElementById('analyticsFunnelBox');
    if (funnelBox) {
      const tot = Math.max(1, fun.totalLeads);
      funnelBox.innerHTML = `
        <div style="background:rgba(255,255,255,0.04); padding:0.6rem 0.8rem; border-radius:8px;">
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#fff;">
            <span>1. Inquiries Received</span> <strong>${fun.totalLeads} (100%)</strong>
          </div>
          <div style="height:6px; background:var(--purple-accent); border-radius:4px; margin-top:0.4rem;"></div>
        </div>
        <div style="background:rgba(255,255,255,0.04); padding:0.6rem 0.8rem; border-radius:8px;">
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#fff;">
            <span>2. Contacted & Qualified</span> <strong>${fun.contacted} (${Math.round((fun.contacted/tot)*100)}%)</strong>
          </div>
          <div style="height:6px; background:#38bdf8; width:${Math.round((fun.contacted/tot)*100)}%; border-radius:4px; margin-top:0.4rem;"></div>
        </div>
        <div style="background:rgba(255,255,255,0.04); padding:0.6rem 0.8rem; border-radius:8px;">
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#fff;">
            <span>3. Proposal Sent</span> <strong>${fun.quoted} (${Math.round((fun.quoted/tot)*100)}%)</strong>
          </div>
          <div style="height:6px; background:#fbbf24; width:${Math.round((fun.quoted/tot)*100)}%; border-radius:4px; margin-top:0.4rem;"></div>
        </div>
        <div style="background:rgba(255,255,255,0.04); padding:0.6rem 0.8rem; border-radius:8px;">
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; color:#fff;">
            <span>4. Won & Converted</span> <strong>${fun.won} (${Math.round((fun.won/tot)*100)}%)</strong>
          </div>
          <div style="height:6px; background:#34d399; width:${Math.round((fun.won/tot)*100)}%; border-radius:4px; margin-top:0.4rem;"></div>
        </div>
      `;
    }

    // Public Website Activity Tracker (v0.7.5.1)
    try {
      const trackRes = await fetch('/api/track');
      const trackData = await trackRes.json();
      if (trackData.success && trackData.summary) {
        const sum = trackData.summary;
        const webCard = document.getElementById('analyticsWebsiteActivity');
        if (webCard) {
          webCard.innerHTML = `
            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:1rem; margin-top:1rem;">
              <div style="background:rgba(124,58,237,0.1); border:1px solid rgba(124,58,237,0.25); padding:0.85rem; border-radius:12px; text-align:center;">
                <div style="font-size:0.75rem; color:#a78bfa; font-weight:700;">PAGE VIEWS</div>
                <div style="font-size:1.4rem; font-weight:800; color:#fff; margin-top:0.2rem;">${sum.totalViews}</div>
              </div>
              <div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.25); padding:0.85rem; border-radius:12px; text-align:center;">
                <div style="font-size:0.75rem; color:#38bdf8; font-weight:700;">CTA CLICKS</div>
                <div style="font-size:1.4rem; font-weight:800; color:#fff; margin-top:0.2rem;">${sum.totalClicks}</div>
              </div>
              <div style="background:rgba(236,72,153,0.1); border:1px solid rgba(236,72,153,0.25); padding:0.85rem; border-radius:12px; text-align:center;">
                <div style="font-size:0.75rem; color:#f472b6; font-weight:700;">BOT OPENS</div>
                <div style="font-size:1.4rem; font-weight:800; color:#fff; margin-top:0.2rem;">${sum.botOpens}</div>
              </div>
              <div style="background:rgba(52,211,153,0.1); border:1px solid rgba(52,211,153,0.25); padding:0.85rem; border-radius:12px; text-align:center;">
                <div style="font-size:0.75rem; color:#34d399; font-weight:700;">LEADS CAPTURED</div>
                <div style="font-size:1.4rem; font-weight:800; color:#fff; margin-top:0.2rem;">${sum.leadsCaptured}</div>
              </div>
            </div>
          `;
        }
      }
    } catch (e) {}
  } catch (err) {
    console.error('Error rendering BI analytics:', err);
  }
}

// Module A2: Admin Panel Team User Invite Modal Logic
function openInviteStaffModal() {
  const modal = document.getElementById('inviteStaffModal');
  if (modal) modal.classList.remove('hidden');
}

function closeInviteStaffModal() {
  const modal = document.getElementById('inviteStaffModal');
  if (modal) modal.classList.add('hidden');
}

async function submitStaffInvite(event) {
  event.preventDefault();

  const name = document.getElementById('invStaffName').value.trim();
  const email = document.getElementById('invStaffEmail').value.trim();
  const phone = document.getElementById('invStaffPhone').value.trim();
  const accessLevel = document.getElementById('invStaffAccessLevel').value;
  const department = document.getElementById('invStaffDept').value;
  const baseSalary = document.getElementById('invStaffSalary').value;

  try {
    const res = await fetch('/api/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, accessLevel, department, baseSalary })
    });
    const data = await res.json();
    if (data.success) {
      closeInviteStaffModal();
      fetchInitialData();
      navigator.clipboard.writeText(data.inviteCardText);
      alert(`🎉 Staff Invite & Temp Password Created for ${name}!\n\nEmp Code: ${data.empCode}\nTemporary Password: ${data.tempPassword}\n\nInvite card copied to clipboard!`);
    } else {
      alert('Error creating staff invite: ' + (data.error || 'Please try again.'));
    }
  } catch (err) {
    console.error('Error creating staff invite:', err);
  }
}

// ==========================================
// 🏥 PHASE C: HR OPERATIONS HUB (Leaves, EOD, Tickets)
// ==========================================

let activeHrSubtab = 'leaves';

function switchHrSubtab(tabName) {
  activeHrSubtab = tabName;

  ['leaves', 'eod', 'tickets'].forEach(t => {
    const btn = document.getElementById(`hr-subtab-btn-${t}`);
    const div = document.getElementById(`hr-subtab-${t}`);
    if (btn) btn.className = t === tabName ? 'fin-subtab-btn active' : 'fin-subtab-btn';
    if (div) div.style.display = t === tabName ? 'block' : 'none';
  });

  renderHrOps();
}

function renderHrOps() {
  const leaves = appData.leaves || [];
  const eodReports = appData.eod_reports || [];
  const tickets = appData.tickets || [];

  // 1. LEAVE APPROVALS QUEUE
  const leavesTbody = document.getElementById('leavesTableBody');
  const pendingLeavesBadge = document.getElementById('hrPendingLeavesBadge');
  const pendingLeaves = leaves.filter(l => l.status === 'Pending');

  if (pendingLeavesBadge) {
    pendingLeavesBadge.innerText = `${pendingLeaves.length} Pending`;
    pendingLeavesBadge.className = pendingLeaves.length > 0 ? 'badge badge-amber' : 'badge badge-emerald';
  }

  if (leavesTbody) {
    if (leaves.length === 0) {
      leavesTbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; color:var(--text-muted); padding:2rem;">
            🌴 No leave requests logged. Click "+ Request Leave" in Crew Portal to log.
          </td>
        </tr>
      `;
    } else {
      leavesTbody.innerHTML = leaves.map(l => {
        let statusBadge = 'badge-purple';
        if (l.status === 'Approved') statusBadge = 'badge-emerald';
        else if (l.status === 'Declined') statusBadge = 'badge-pink';
        else if (l.status === 'Pending') statusBadge = 'badge-amber';

        return `
          <tr>
            <td><code>${l.id}</code></td>
            <td><strong>${l.staffName}</strong></td>
            <td><span class="badge badge-purple">${l.type}</span></td>
            <td>
              ${l.startDate} to ${l.endDate}<br>
              <small style="color:var(--purple-light); font-weight:700;">(${l.totalDays || 1} Days)</small>
            </td>
            <td><small style="color:#cbd5e1;">${l.reason}</small></td>
            <td><span class="badge ${statusBadge}">${l.status}</span></td>
            <td style="text-align:right;">
              ${l.status === 'Pending' ? `
                <div style="display:flex; justify-content:flex-end; gap:0.4rem;">
                  <button class="btn-purple" style="padding:0.2rem 0.6rem; font-size:0.75rem; background:#10b981;" onclick="approveLeave('${l.id}')">✅ Approve</button>
                  <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.75rem; color:#f43f5e;" onclick="rejectLeave('${l.id}')">❌ Decline</button>
                </div>
              ` : `<small style="color:var(--text-muted);">${l.reviewedBy || 'Manager'}</small>`}
            </td>
          </tr>
        `;
      }).join('');
    }
  }

  // 2. DAILY 7PM EOD DIGEST FEED
  const eodContainer = document.getElementById('eodReportsContainer');
  const eodBadge = document.getElementById('hrEodSubmittedBadge');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayEods = eodReports.filter(e => (e.date || '').startsWith(todayStr) || (e.submittedAt || '').startsWith(todayStr));

  if (eodBadge) {
    eodBadge.innerText = `${todayEods.length} Submitted Today`;
  }

  if (eodContainer) {
    if (eodReports.length === 0) {
      eodContainer.innerHTML = `
        <div style="text-align:center; padding:2rem; color:var(--text-muted);">
          📋 No EOD daily reports logged yet today. Click "⚡ Trigger 7PM EOD Prompt" to prompt team.
        </div>
      `;
    } else {
      eodContainer.innerHTML = eodReports.map(e => `
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <span style="font-size:1.2rem;">👤</span>
              <div>
                <strong style="color:#fff; font-size:0.95rem;">${e.staffName}</strong>
                <div style="font-size:0.75rem; color:var(--text-muted);">${e.date || 'Today'} • Submitted at ${(e.submittedAt || '').split('T')[1]?.slice(0, 5) || '19:00'}</div>
              </div>
            </div>
            ${e.blockers && e.blockers.toLowerCase() !== 'none' ? `
              <span class="badge badge-pink">⚠️ Blocker Reported</span>
            ` : `<span class="badge badge-emerald">✅ Smooth Ops</span>`}
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:1rem; font-size:0.85rem; margin-top:0.6rem;">
            <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.2); padding:0.6rem; border-radius:8px;">
              <div style="font-weight:700; color:#4ade80; margin-bottom:0.2rem; font-size:0.75rem; text-transform:uppercase;">1. Tasks Completed</div>
              <div style="color:#cbd5e1; white-space:pre-wrap;">${e.tasksCompleted}</div>
            </div>

            <div style="background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.2); padding:0.6rem; border-radius:8px;">
              <div style="font-weight:700; color:#38bdf8; margin-bottom:0.2rem; font-size:0.75rem; text-transform:uppercase;">2. Tasks In Progress</div>
              <div style="color:#cbd5e1; white-space:pre-wrap;">${e.tasksInProgress}</div>
            </div>

            <div style="background:rgba(244,63,94,0.08); border:1px solid rgba(244,63,94,0.2); padding:0.6rem; border-radius:8px;">
              <div style="font-weight:700; color:#fb7185; margin-bottom:0.2rem; font-size:0.75rem; text-transform:uppercase;">3. Blockers / Help Needed</div>
              <div style="color:#cbd5e1; white-space:pre-wrap;">${e.blockers}</div>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  // 3. SUPPORT & MAINTENANCE TICKETS BOARD
  const ticketsTbody = document.getElementById('ticketsTableBody');
  const openTicketsBadge = document.getElementById('hrOpenTicketsBadge');
  const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress');

  if (openTicketsBadge) {
    openTicketsBadge.innerText = `${openTickets.length} Open Tickets`;
    openTicketsBadge.className = openTickets.length > 0 ? 'badge badge-amber' : 'badge badge-emerald';
  }

  if (ticketsTbody) {
    if (tickets.length === 0) {
      ticketsTbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; color:var(--text-muted); padding:2rem;">
            🔧 No support tickets logged. Click "+ Report Support Ticket" to log an issue.
          </td>
        </tr>
      `;
    } else {
      ticketsTbody.innerHTML = tickets.map(t => {
        let urgBadge = 'badge-purple';
        if (t.urgency === 'High') urgBadge = 'badge-pink';
        else if (t.urgency === 'Medium') urgBadge = 'badge-amber';

        let statusBadge = 'badge-purple';
        if (t.status === 'Resolved') statusBadge = 'badge-emerald';
        else if (t.status === 'In Progress') statusBadge = 'badge-cyan';
        else if (t.status === 'Open') statusBadge = 'badge-amber';

        return `
          <tr>
            <td><code>${t.id}</code></td>
            <td><span class="badge badge-purple">${t.category}</span></td>
            <td>
              <strong style="color:#fff;">${t.title}</strong><br>
              <small style="color:var(--text-muted); font-size:0.75rem;">${t.description}</small>
            </td>
            <td><span class="badge ${urgBadge}">${t.urgency}</span></td>
            <td><small style="color:#cbd5e1;">${t.loggedBy}</small></td>
            <td><small style="color:var(--purple-light);">${t.assignedTo || 'Maintenance'}</small></td>
            <td>
              <select class="role-select" style="font-size:0.75rem; padding:0.2rem 0.4rem;" onchange="updateTicketStatus('${t.id}', this.value)">
                <option value="Open" ${t.status === 'Open' ? 'selected' : ''}>Open</option>
                <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                <option value="Resolved" ${t.status === 'Resolved' ? 'selected' : ''}>✅ Resolved</option>
              </select>
            </td>
            <td style="text-align:right;">
              ${t.status !== 'Resolved' ? `
                <button class="btn-purple" style="padding:0.2rem 0.6rem; font-size:0.75rem; background:#10b981;" onclick="updateTicketStatus('${t.id}', 'Resolved')">✅ Resolve</button>
              ` : `<small style="color:#4ade80;">Resolved</small>`}
            </td>
          </tr>
        `;
      }).join('');
    }
  }
}

async function approveLeave(leaveId) {
  const leave = (appData.leaves || []).find(l => l.id === leaveId);
  const reviewer = window.currentUser?.profile?.name || 'Agency Owner';

  try {
    const res = await fetch(`/api/leaves/${leaveId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewedBy: reviewer })
    });
    const data = await res.json();
    if (data.success) {
      alert(`✅ Leave request ${leaveId} for ${leave?.staffName || 'Staff'} APPROVED!\nStaff attendance status set to "On Leave" and Telegram notification dispatched (AUT-011).`);
      await fetchInitialData();
    }
  } catch (err) {
    console.error('Error approving leave:', err);
  }
}

async function rejectLeave(leaveId) {
  const leave = (appData.leaves || []).find(l => l.id === leaveId);
  const reviewer = window.currentUser?.profile?.name || 'Agency Owner';

  try {
    const res = await fetch(`/api/leaves/${leaveId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewedBy: reviewer })
    });
    const data = await res.json();
    if (data.success) {
      alert(`❌ Leave request ${leaveId} for ${leave?.staffName || 'Staff'} DECLINED.`);
      await fetchInitialData();
    }
  } catch (err) {
    console.error('Error rejecting leave:', err);
  }
}

async function triggerManualEodPrompt() {
  const activeCount = (appData.team || []).filter(t => t.telegramId).length;
  try {
    const res = await fetch('/api/eod/trigger-prompt', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert(`✅ 7PM EOD prompt pushed to ${activeCount} active crew member(s) via Telegram (AUT-012)!`);
      fetchInitialData();
    }
  } catch (err) {
    console.error('Error triggering manual EOD prompt:', err);
  }
}

async function updateTicketStatus(ticketId, newStatus) {
  const ticket = (appData.tickets || []).find(t => t.id === ticketId);
  const reviewer = window.currentUser?.profile?.name || 'Maintenance Lead';

  try {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, resolvedBy: reviewer })
    });
    const data = await res.json();
    if (data.success) {
      if (newStatus === 'Resolved') {
        alert(`✅ Support Ticket ${ticketId} marked RESOLVED!\n${ticket?.loggedBy || 'Staff'} notified via Telegram (AUT-013).`);
      }
      fetchInitialData();
    }
  } catch (err) {
    console.error('Error updating ticket status:', err);
  }
}
      alert('⚡ 7:00 PM Daily EOD Telegram prompt pushed to all active team members!');
    }
  } catch (err) {
    console.error('Error pushing EOD prompt:', err);
  }
}

function openNewTicketModal() {
  document.getElementById('ticketTitleInput').value = '';
  document.getElementById('ticketDescInput').value = '';
  document.getElementById('createTicketModal')?.classList.remove('hidden');
}

function closeCreateTicketModal() {
  document.getElementById('createTicketModal')?.classList.add('hidden');
}

async function submitNewTicket(event) {
  event.preventDefault();

  const payload = {
    category: document.getElementById('ticketCategoryInput').value,
    urgency: document.getElementById('ticketUrgencyInput').value,
    title: document.getElementById('ticketTitleInput').value.trim(),
    assignedTo: document.getElementById('ticketAssignedToInput').value.trim(),
    description: document.getElementById('ticketDescInput').value.trim(),
    loggedBy: 'Mahmudul Hasan (Owner)'
  };

  try {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      alert(`✅ Support Ticket ${data.ticket.id} logged successfully!`);
      closeCreateTicketModal();
      await fetchInitialData();
    }
  } catch (err) {
    console.error('Error logging ticket:', err);
  }
}

async function updateTicketStatus(ticketId, newStatus) {
  try {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, resolvedBy: 'Maintenance Lead' })
    });
    const data = await res.json();
    if (data.success) {
      if (newStatus === 'Resolved') alert(`✅ Ticket ${ticketId} resolved! Staff notified via Telegram.`);
      await fetchInitialData();
    }
  } catch (err) {
    console.error('Error updating ticket status:', err);
  }
}

// ==========================================
// 👑 PHASE D: EXECUTIVE INTELLIGENCE & BROADCASTS
// ==========================================

function renderExecutiveIntelligence() {
  const openTasks = (appData.tasks || []).filter(t => t.stage !== 'Approved').length;
  const pendingExp = (appData.expenses || []).filter(e => e.status !== 'Disbursed' && e.status !== 'Rejected').length;
  const activeStaff = (appData.team || []).length;
  const paidRev = (appData.invoices || []).filter(i => i.status === 'Paid').reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalRev = (appData.invoices || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const mBody = document.getElementById('eiMorningBody');
  if (mBody) {
    mBody.innerHTML = `
      • Active Shoot Campaigns: ${openTasks} Workflows<br>
      • Team Capacity: ${activeStaff} Staff Members Active<br>
      • Pending Approvals: ${pendingExp} Expense Claims<br>
      • Social Dispatches: Check Social Hub
    `;
  }

  const eBody = document.getElementById('eiEveningBody');
  if (eBody) {
    eBody.innerHTML = `
      • Total Paid Revenue: $${paidRev.toLocaleString()} USD<br>
      • Portfolio Total Revenue: $${totalRev.toLocaleString()} USD<br>
      • Team EOD Status: Check HR Ops Tab<br>
      • Active Support Tickets: ${(appData.tickets || []).filter(t => t.status !== 'Resolved').length} Open
    `;
  }

  renderAutomationLogs();
}

function renderAutomationLogs() {
  const tbody = document.getElementById('automationLogsTableBody');
  const badge = document.getElementById('automationLogsBadge');
  if (!tbody) return;

  const logs = appData.automationLogs || [];
  if (badge) badge.innerText = `${logs.length} Dispatch${logs.length === 1 ? '' : 'es'} Logged`;

  if (logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; color:var(--text-muted); padding:2rem;">
          📲 No automation notification dispatches logged yet. Trigger an automated action or briefing to view audit entries.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td><code>${l.id}</code></td>
      <td><span class="badge badge-purple">${l.ruleId || 'AUT-SYS'}</span></td>
      <td><strong>${l.event}</strong></td>
      <td><small style="color:var(--cyan-accent);">${l.recipient || 'Telegram Target'}</small></td>
      <td><small style="color:#cbd5e1;">${(l.payload || '').slice(0, 45)}...</small></td>
      <td><small style="color:var(--text-muted);">${(l.timestamp || '').split('T')[0] || 'Today'}</small></td>
      <td><span class="badge badge-emerald">Dispatched</span></td>
    </tr>
  `).join('');
}

async function triggerMorningBriefing() {
  try {
    const res = await fetch('/api/reports/morning', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert('⚡ 9:00 AM Morning Executive Briefing pushed to Telegram!');
    }
  } catch (err) {
    console.error('Error triggering morning briefing:', err);
  }
}

async function triggerEveningDigest() {
  try {
    const res = await fetch('/api/reports/evening', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert('⚡ 8:30 PM Evening Executive Digest pushed to Telegram!');
    }
  } catch (err) {
    console.error('Error triggering evening digest:', err);
  }
}

async function triggerWeeklyReport() {
  try {
    const res = await fetch('/api/reports/weekly', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert('⚡ Weekly Executive KPI Summary pushed to Telegram!');
    }
  } catch (err) {
    console.error('Error triggering weekly report:', err);
  }
}

async function triggerSpecialistBriefings() {
  try {
    const res = await fetch('/api/reports/specialist-briefing', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert('⚡ 9:00 AM Personal Daily Task Briefings pushed to all team specialists via Telegram!');
    }
  } catch (err) {
    console.error('Error triggering specialist briefings:', err);
  }
}

function openBroadcastModal() {
  document.getElementById('bcTitleInput').value = '';
  document.getElementById('bcMessageInput').value = '';
  document.getElementById('broadcastModal')?.classList.remove('hidden');
}

function closeBroadcastModal() {
  document.getElementById('broadcastModal')?.classList.add('hidden');
}

async function submitBroadcastNotice(event) {
  event.preventDefault();

  const payload = {
    title: document.getElementById('bcTitleInput').value.trim(),
    targetGroup: document.getElementById('bcTargetInput').value,
    message: document.getElementById('bcMessageInput').value.trim(),
    urgent: document.getElementById('bcUrgentInput').checked,
    senderName: 'Mahmudul Hasan (Owner)'
  };

  try {
    const res = await fetch('/api/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      alert('📢 Team Broadcast Notice dispatched instantly to all staff & Telegram groups!');
      closeBroadcastModal();
    }
  } catch (err) {
    console.error('Error sending broadcast:', err);
  }
}

// PUBLIC LANDING CMS MANAGER HANDLERS (v0.7.5.1)
async function openCMSManagerModal() {
  const modal = document.getElementById('cmsModal');
  if (!modal) return;

  try {
    const res = await fetch('/api/cms/content');
    const data = await res.json();
    if (data.success && data.content) {
      const cms = data.content;
      const info = cms.agencyInfo || {};

      document.getElementById('cmsEmailInput').value = info.email || 'contact@purplebot.digital';
      document.getElementById('cmsPhoneInput').value = info.phone || '+88 01711 019550';
      document.getElementById('cmsWhatsappInput').value = info.whatsapp || '+8801711019550';
      document.getElementById('cmsRegAddressInput').value = info.registeredAddress || '';
      document.getElementById('cmsOpAddressInput').value = info.operatingAddress || '';
      document.getElementById('cmsMarqueeInput').value = (cms.clientMarquee || []).join(', ');
    }
  } catch (err) {
    console.error('Error opening CMS modal:', err);
  }

  modal.style.display = 'flex';
}

function closeCMSManagerModal() {
  const modal = document.getElementById('cmsModal');
  if (modal) modal.style.display = 'none';
}

async function saveCMSContent(e) {
  e.preventDefault();

  const marqueeArr = document.getElementById('cmsMarqueeInput').value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const payload = {
    agencyInfo: {
      email: document.getElementById('cmsEmailInput').value.trim(),
      phone: document.getElementById('cmsPhoneInput').value.trim(),
      whatsapp: document.getElementById('cmsWhatsappInput').value.trim(),
      registeredAddress: document.getElementById('cmsRegAddressInput').value.trim(),
      operatingAddress: document.getElementById('cmsOpAddressInput').value.trim()
    },
    clientMarquee: marqueeArr
  };

  try {
    const res = await fetch('/api/cms/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      alert('🎉 Landing Page CMS updated! Changes are now live on purplebot.digital.');
      closeCMSManagerModal();
    }
  } catch (err) {
    console.error('Error saving CMS content:', err);
  }
}

