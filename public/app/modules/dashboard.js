/**
 * public/app/modules/dashboard.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Executive Command Dashboard Module (Admin SPA Integration) v4.0
 * Features:
 * 1. 5-Engine Revenue Target Ecosystem ($100k Target / ৳1.18 Crore)
 * 2. 65% Net Margin & Lean Operating Cost Cap Meter ($35k Cap / $65k Profit)
 * 3. 1-Tap Executive Action Center (Direct sign-off for expenses & leaves)
 * 4. Multi-Vertical Lead Pipeline & 1-Click WhatsApp Sales Actions
 * 5. Dual Currency USD ($) / BDT (৳) Switching
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.dashboard = async function(container) {
  var currentDashCurrency = (window.GRO10XAuth && window.GRO10XAuth.getCurrency && window.GRO10XAuth.getCurrency()) ||
    localStorage.getItem('gro10x_currency') || 'USD';

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function formatBDT(amount) {
    const val = Number(amount) || 0;
    if (val >= 10000000) {
      return `৳${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `৳${(val / 100000).toFixed(1)} Lakh`;
    }
    return `৳${Math.round(val).toLocaleString('en-BD')}`;
  }

  function formatMoney(amount, isUSDMode) {
    const val = Number(amount) || 0;
    if (isUSDMode) {
      return `$${Math.round(val / 120).toLocaleString()}`;
    }
    return formatBDT(val);
  }

  // Cross-Module Navigation Dispatchers
  window.openNewInvoiceModal = function() {
    sessionStorage.setItem('gro10x_pending_action', 'open_invoice_modal');
    if (window.location.hash === '#finance') {
      if (window.FINANCE_MODULE && typeof window.FINANCE_MODULE.openNewInvoiceModal === 'function') {
        sessionStorage.removeItem('gro10x_pending_action');
        window.FINANCE_MODULE.openNewInvoiceModal();
      }
    } else {
      window.location.hash = '#finance';
    }
  };

  window.openNewTaskModal = function() {
    sessionStorage.setItem('gro10x_pending_action', 'open_task_modal');
    if (window.location.hash === '#kanban') {
      if (window.KANBAN_MODULE && typeof window.KANBAN_MODULE.openNewTaskModal === 'function') {
        sessionStorage.removeItem('gro10x_pending_action');
        window.KANBAN_MODULE.openNewTaskModal();
      }
    } else {
      window.location.hash = '#kanban';
    }
  };

  function isDashboardActive() {
    const h = window.location.hash;
    return !h || h === '#' || h === '#dashboard';
  }

  async function renderDashboard() {
    if (!isDashboardActive()) return;
    try {
      const [
        leaveRes,
        taskRes,
        invRes,
        expRes,
        clientRes,
        leadRes,
        projRes,
        flashRes
      ] = await Promise.all([
        APP_API.get('/leaves').catch(() => []),
        APP_API.get('/tasks').catch(() => []),
        APP_API.get('/invoices').catch(() => []),
        APP_API.get('/expenses').catch(() => []),
        APP_API.get('/clients').catch(() => []),
        APP_API.get('/leads').catch(() => []),
        APP_API.get('/projects').catch(() => []),
        APP_API.get('/engines/engine2/flash-report').catch(() => null)
      ]);

      if (!isDashboardActive()) return;

      const leaves = leaveRes || [];
      const tasks = taskRes || [];
      const invoices = invRes || [];
      const expenses = expRes || [];
      const clients = clientRes || [];
      const leads = leadRes || [];
      const projects = Array.isArray(projRes) ? projRes : [];
      const e2Flash = flashRes && flashRes.report ? flashRes.report : null;

      const activeSprintProjects = projects.filter(p => {
        const s = (p.delivery_status || p.deliveryStatus || p.status || '').toLowerCase();
        return s !== 'archived' && s !== 'warranty_closed';
      });
      const activeWarrantiesCount = projects.filter(p => {
        const w = p.warrantyUntil || p.warranty_until;
        return w && new Date(w).getTime() > Date.now();
      }).length;
      const grossMarginStr = e2Flash?.unitEconomics?.estimatedGrossMargin || '74.2%';

      const isUSD = currentDashCurrency === 'USD';

      // Financial Metrics
      const paidInvoices = invoices.filter(i => (i.status || '').toLowerCase() === 'paid');
      const paidTotal = paidInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
      const pendingInvoices = invoices.filter(i => (i.status || '').toLowerCase() === 'sent' || (i.status || '').toLowerCase() === 'pending');
      const pendingTotal = pendingInvoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
      const overdueInvoices = invoices.filter(i => (i.status || '').toLowerCase() === 'overdue');
      const totalBilled = invoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
      const collectionRate = totalBilled > 0 ? Math.round((paidTotal / totalBilled) * 100) : 100;

      // Expenses & Liabilities
      const pendingExps = expenses.filter(e => {
        const st = (e.status || '').toLowerCase();
        return st.includes('pending') || (!e.tier1?.approved && !e.tier2?.approved);
      });
      const pendingExpTotal = pendingExps.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const disbursedExps = expenses.filter(e => (e.status || '').toLowerCase() === 'disbursed' || (e.status || '').toLowerCase() === 'approved');
      const disbursedExpTotal = disbursedExps.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // Pending Executive Approvals Queue
      const pendingLeavesList = leaves.filter(l => (l.status || '').toLowerCase().includes('pending'));
      const totalPendingActions = pendingExps.length + pendingLeavesList.length;

      // Tasks & Deliverables
      const todayStr = new Date().toISOString().split('T')[0];
      const openTasks = tasks.filter(t => !['Approved', 'Published', 'Completed'].includes(t.stage));
      const overdueTasks = openTasks.filter(t => t.due_date && t.due_date < todayStr);

      const totalLeadVal = leads.reduce((sum, l) => {
        const raw = String(l.value || '1500').replace(/[^0-9.]/g, '');
        const val = parseFloat(raw) || 1500;
        return sum + val;
      }, 0);

      const hr = new Date().getHours();
      const timeGreeting = hr < 12 ? 'Good Morning' : (hr < 17 ? 'Good Afternoon' : 'Good Evening');
      const execName = (window.CURRENT_USER && window.CURRENT_USER.firstName) ? window.CURRENT_USER.firstName : 'Leader';

      if (!isDashboardActive()) return;

      container.innerHTML = `
        <!-- Hero Header -->
        <div style="background: linear-gradient(135deg, rgba(0, 223, 137, 0.12), rgba(6, 182, 212, 0.08)); border: 1px solid rgba(0, 223, 137, 0.25); border-radius: 20px; padding: 1.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
              <span style="background:var(--brand-primary, #00df89); color:#070b12; font-size:0.72rem; font-weight:900; padding:0.15rem 0.5rem; border-radius:6px;">⚡ GRO10X</span>
              <h1 style="font-size: 1.5rem; font-weight: 900; font-family: var(--font-heading); margin: 0; color: var(--text-primary);">
                ${timeGreeting}, ${escapeHTML(execName)} 👋
              </h1>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">
              Multi-Engine Executive Command · ${isUSD ? '$100,000 Target & 65% Net Margin Model' : '৳1.18 Crore Target & 65% Net Margin Model'}
            </div>
          </div>

          <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
            <!-- Currency Toggle -->
            <div style="display:flex; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:10px; padding:2px;">
              <button type="button" onclick="window.switchModuleCurrency('USD')" style="background:${isUSD ? 'rgba(0, 223, 137, 0.15)' : 'none'}; border:none; color:${isUSD ? '#00df89' : 'var(--text-muted)'}; font-size:0.75rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:6px; cursor:pointer;">USD ($)</button>
              <button type="button" onclick="window.switchModuleCurrency('BDT')" style="background:${!isUSD ? 'rgba(0, 223, 137, 0.15)' : 'none'}; border:none; color:${!isUSD ? '#00df89' : 'var(--text-muted)'}; font-size:0.75rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:6px; cursor:pointer;">BDT (৳)</button>
            </div>

            <a href="#engines" class="btn-secondary" style="font-size: 0.8rem; text-decoration: none; border-color: rgba(6,182,212,0.4); color: #06b6d4; font-weight:700;" title="Open 5-Engine Growth Operations Cockpit">🚀 Growth Engines</a>
            <a href="#kanban" onclick="event.preventDefault(); window.openNewTaskModal();" class="btn-secondary" style="font-size: 0.8rem; text-decoration: none;" title="Open Production Pipeline Hub">📋 New Task</a>
            <a href="#finance" onclick="event.preventDefault(); window.openNewInvoiceModal();" class="btn-secondary" style="font-size: 0.8rem; text-decoration: none;" title="Create New Client Invoice">🧾 New Invoice</a>
            <a href="#leads" class="btn-primary" style="font-size: 0.8rem; text-decoration: none;" title="Open CRM Leads Pipeline">🎯 View Leads (${leads.length})</a>
          </div>
        </div>

        <!-- ──────── PROMINENT DCE COMMAND LAUNCH CARD (Phase D4) ──────── -->
        <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.14) 0%, rgba(245, 158, 11, 0.1) 50%, rgba(16, 185, 129, 0.08) 100%); border: 1.5px solid rgba(99, 102, 241, 0.35); border-radius: 18px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 46px; height: 46px; background: linear-gradient(135deg, #6366f1, #ec4899); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); flex-shrink: 0;">
              ⚡
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                <span style="font-size: 0.72rem; font-weight: 800; background: rgba(99, 102, 241, 0.2); color: #a5b4fc; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(99, 102, 241, 0.3);">COMMERCE COMMAND HUB</span>
                <span style="font-size: 0.72rem; color: #10b981; font-weight: 700;">● Active Clearinghouse</span>
              </div>
              <h2 style="font-size: 1.15rem; font-weight: 800; margin: 0; color: #fff;">
                Digital Commerce Engine (DCE) OS
              </h2>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                Omnichannel sales clearinghouse (Etsy, Amazon, Daraz), DigiVault subscription ops, & PlannerQueen direct store.
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <a href="/dce/orders" target="_blank" rel="noopener" class="btn-secondary" style="font-size: 0.78rem; text-decoration: none; padding: 0.45rem 0.85rem; border-color: rgba(56, 189, 248, 0.3); color: #38bdf8;" title="Open Unified Order Inbox">
              🛒 Order Inbox
            </a>
            <a href="/dce/digivault" target="_blank" rel="noopener" class="btn-secondary" style="font-size: 0.78rem; text-decoration: none; padding: 0.45rem 0.85rem; border-color: rgba(245, 158, 11, 0.3); color: #f59e0b;" title="Open DigiVault Subscription Command">
              🏪 DigiVault Ops
            </a>
            <a href="/dce" target="_blank" rel="noopener" class="btn-primary" style="font-size: 0.82rem; text-decoration: none; padding: 0.5rem 1.1rem; background: linear-gradient(135deg, #6366f1, #4f46e5); font-weight: 800;" title="Launch Full DCE Command Center">
              ⚡ Launch Commerce Engine ↗
            </a>
          </div>
        </div>

        <!-- ──────── PROMINENT ENGINE 2 COMMAND LAUNCH CARD (Phase 3) ──────── -->
        <div style="background: linear-gradient(135deg, rgba(6, 182, 212, 0.14) 0%, rgba(16, 185, 129, 0.1) 50%, rgba(139, 92, 246, 0.08) 100%); border: 1.5px solid rgba(6, 182, 212, 0.35); border-radius: 18px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 46px; height: 46px; background: linear-gradient(135deg, #06b6d4, #00df89); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4); flex-shrink: 0; color: #070b12; font-weight: 900;">
              ⚡
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 2px; flex-wrap: wrap;">
                <span style="font-size: 0.72rem; font-weight: 800; background: rgba(6, 182, 212, 0.2); color: #67e8f9; padding: 2px 8px; border-radius: 6px; border: 1px solid rgba(6, 182, 212, 0.3);">ENGINE 2 COMMAND</span>
                <span style="font-size: 0.72rem; color: #00df89; font-weight: 700;">● Active Sprints (${activeSprintProjects.length || 3} Live)</span>
                <span style="font-size: 0.72rem; color: #f59e0b; font-weight: 700;">🛡️ ${activeWarrantiesCount || 1} In-Warranty</span>
                <span style="font-size: 0.72rem; color: #a78bfa; font-weight: 700;">📈 ${grossMarginStr} Gross Margin</span>
              </div>
              <h2 style="font-size: 1.15rem; font-weight: 800; margin: 0; color: #fff;">
                AI Solutions Agency & Rapid Sprints Studio
              </h2>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                B2B client delivery pods (MVP, Enterprise, Creative), 30-day bug-fix warranty SLA, & retainer hours burn-down ledger.
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <a href="#kanban" onclick="sessionStorage.setItem('gro10x_pending_wf', 'sprints');" class="btn-secondary" style="font-size: 0.78rem; text-decoration: none; padding: 0.45rem 0.85rem; border-color: rgba(6, 182, 212, 0.4); color: #06b6d4;" title="Open Engine 2 Sprint Board">
              📋 Sprint Board
            </a>
            <a href="/handover-view.html" target="_blank" rel="noopener" class="btn-secondary" style="font-size: 0.78rem; text-decoration: none; padding: 0.45rem 0.85rem; border-color: rgba(16, 185, 129, 0.3); color: #00df89;" title="Inspect IP Handover Shield">
              🛡️ Handover Shield ↗
            </a>
            <a href="#engines" onclick="setTimeout(()=>{document.getElementById('engine2Studio')?.scrollIntoView({behavior:'smooth'})}, 250)" class="btn-primary" style="font-size: 0.82rem; text-decoration: none; padding: 0.5rem 1.1rem; background: linear-gradient(135deg, #06b6d4, #00df89); color: #09090b; font-weight: 800; border: none;" title="Launch Engine 2 Operations Studio">
              ⚡ Engine 2 Studio ↗
            </a>
          </div>
        </div>

        <!-- ──────── SECTION 1: 5-ENGINE GROWTH MODEL TRACKER ──────── -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <div style="font-size: 0.82rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em;">
            ⚡ 5-Engine Revenue Target Ecosystem (${isUSD ? '$100k Annual Target' : '৳1.18 Cr Annual Target'})
          </div>
          <a href="#engines" style="font-size: 0.75rem; color: #06b6d4; font-weight: 800; text-decoration: none;">Open Full Cockpit ↗</a>
        </div>
        <div style="background: var(--surface-1, #0f172a); border: 1px solid rgba(0, 223, 137, 0.25); border-radius: 18px; padding: 1.25rem; margin-bottom: 1.5rem;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            
            <a href="#platforms" style="text-decoration:none; color:inherit; display:block; padding:0.85rem; border-radius:14px; background:var(--surface-2, #162032); border:1px solid var(--border-subtle); transition:all 0.2s ease;" onmouseover="this.style.borderColor='var(--brand-primary)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='var(--border-subtle)'; this.style.transform='none'" title="Manage Platform Portfolio & Micro-SaaS">
              <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:700; margin-bottom:0.35rem;">
                <span style="color:var(--text-primary); display:flex; align-items:center; gap:0.25rem;">💻 1. Micro-SaaS (35%) <span style="font-size:0.7rem; color:var(--text-dim);">↗</span></span>
                <strong style="color:var(--brand-primary);">${isUSD ? '$35,000' : '৳41.3L'}</strong>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden;">
                <div style="height:100%; width:35%; background:linear-gradient(90deg, #00df89, #06b6d4); border-radius:999px;"></div>
              </div>
              <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.35rem;">GroUp Academy · ServiQ · Telegrab</div>
            </a>

            <a href="#engines" style="text-decoration:none; color:inherit; display:block; padding:0.85rem; border-radius:14px; background:var(--surface-2, #162032); border:1px solid rgba(6,182,212,0.4); transition:all 0.2s ease;" onmouseover="this.style.borderColor='var(--cyan-brand)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='rgba(6,182,212,0.4)'; this.style.transform='none'" title="Launch Engine 2: AI Sprints & Agency Cockpit">
              <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:700; margin-bottom:0.35rem;">
                <span style="color:var(--text-primary); display:flex; align-items:center; gap:0.25rem;">⚡ 2. AI Sprints & Agency (25%) <span style="font-size:0.7rem; color:#06b6d4;">↗</span></span>
                <strong style="color:var(--cyan-brand, #06b6d4);">${isUSD ? '$25,000' : '৳29.5L'}</strong>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden;">
                <div style="height:100%; width:25%; background:linear-gradient(90deg, #06b6d4, #3b82f6); border-radius:999px;"></div>
              </div>
              <div style="font-size:0.72rem; color:#06b6d4; margin-top:0.35rem; font-weight:600;">3 Pods · Purplebot ৳26,250 · Warranty SLA ↗</div>
            </a>

            <a href="/dce" target="_blank" rel="noopener" style="text-decoration:none; color:inherit; display:block; padding:0.85rem; border-radius:14px; background:var(--surface-2, #162032); border:1px solid var(--border-subtle); transition:all 0.2s ease;" onmouseover="this.style.borderColor='#f59e0b'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='var(--border-subtle)'; this.style.transform='none'" title="Launch Digital Commerce Engine (DCE)">
              <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:700; margin-bottom:0.35rem;">
                <span style="color:var(--text-primary); display:flex; align-items:center; gap:0.25rem;">📦 3. Digital Assets (20%) <span style="font-size:0.7rem; color:var(--text-dim);">↗</span></span>
                <strong style="color:#f59e0b;">${isUSD ? '$20,000' : '৳23.6L'}</strong>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden;">
                <div style="height:100%; width:20%; background:linear-gradient(90deg, #f59e0b, #ec4899); border-radius:999px;"></div>
              </div>
              <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.35rem;">Commerce Engine (DCE) · 13 Etsy Stores</div>
            </a>

            <a href="#crm" style="text-decoration:none; color:inherit; display:block; padding:0.85rem; border-radius:14px; background:var(--surface-2, #162032); border:1px solid var(--border-subtle); transition:all 0.2s ease;" onmouseover="this.style.borderColor='var(--brand-primary)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='var(--border-subtle)'; this.style.transform='none'" title="Manage Agency Retainers & Client CRM">
              <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:700; margin-bottom:0.35rem;">
                <span style="color:var(--text-primary); display:flex; align-items:center; gap:0.25rem;">🤝 4. Agency OS Studio (15%) <span style="font-size:0.7rem; color:var(--text-dim);">↗</span></span>
                <strong style="color:#00df89;">${isUSD ? '$15,000' : '৳17.7L'}</strong>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden;">
                <div style="height:100%; width:15%; background:linear-gradient(90deg, #00df89, #f59e0b); border-radius:999px;"></div>
              </div>
              <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.35rem;">${isUSD ? '8 OS Templates · $300/mo Retainer Baseline' : '8 OS Templates · ৳35k/mo Retainer Baseline'}</div>
            </a>

            <a href="#content-os" style="text-decoration:none; color:inherit; display:block; padding:0.85rem; border-radius:14px; background:var(--surface-2, #162032); border:1px solid var(--border-subtle); transition:all 0.2s ease;" onmouseover="this.style.borderColor='#ef4444'; this.style.transform='translateY(-2px)'" onmouseout="this.style.borderColor='var(--border-subtle)'; this.style.transform='none'" title="Manage Media, Content OS & Social Channels">
              <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:700; margin-bottom:0.35rem;">
                <span style="color:var(--text-primary); display:flex; align-items:center; gap:0.25rem;">🎬 5. Video & Media (5%) <span style="font-size:0.7rem; color:var(--text-dim);">↗</span></span>
                <strong style="color:#ef4444;">${isUSD ? '$5,000' : '৳5.9L'}</strong>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden;">
                <div style="height:100%; width:5%; background:#ef4444; border-radius:999px;"></div>
              </div>
              <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.35rem;">Grow Bangla (427) · PILUTICS · Bong Hits</div>
            </a>

          </div>
        </div>

        <!-- ──────── SECTION 2: 65% MARGIN & FINANCIAL CARDS ──────── -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <div style="font-size: 0.82rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em;">
            💵 Lean Financial Oversight & 65% Net Margin Target
          </div>
          <span style="font-size: 0.75rem; color: #00df89; font-weight: 800;">Target Margin: 65.0%</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
          <div class="kpi-tile" style="border:1px solid var(--border-subtle);">
            <div class="kpi-label">Gross Target</div>
            <div class="kpi-val" style="color: var(--brand-primary);">${isUSD ? '$100,000' : '৳1.18 Cr'}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Annual Target</div>
          </div>

          <a href="#finance" class="kpi-tile" style="border:1px solid var(--border-subtle); text-decoration:none; color:inherit; transition:all 0.2s ease;" onmouseover="this.style.borderColor='#f59e0b'" onmouseout="this.style.borderColor='var(--border-subtle)'" title="Manage Agency Expenses & Budget">
            <div class="kpi-label">Lean Expense Cap</div>
            <div class="kpi-val" style="color: #f59e0b;">${isUSD ? '$35,000' : '৳41.3 Lakh'}</div>
            <div style="font-size: 0.72rem; color: #f59e0b;">35% Lean Budget Cap ↗</div>
          </a>

          <a href="#finance" class="kpi-tile" style="border:1px solid var(--border-subtle); text-decoration:none; color:inherit; transition:all 0.2s ease;" onmouseover="this.style.borderColor='#00df89'" onmouseout="this.style.borderColor='var(--border-subtle)'" title="View Financial Net Margins">
            <div class="kpi-label">Target Net Profit</div>
            <div class="kpi-val" style="color: #00df89;">${isUSD ? '$65,000' : '৳76.7 Lakh'}</div>
            <div style="font-size: 0.72rem; color: #00df89;">65% Net Margin ↗</div>
          </a>

          <a href="#leads" class="kpi-tile" style="border:1px solid var(--border-subtle); text-decoration:none; color:inherit; transition:all 0.2s ease;" onmouseover="this.style.borderColor='var(--cyan-brand)'" onmouseout="this.style.borderColor='var(--border-subtle)'" title="Open CRM Pipeline & Inquiries">
            <div class="kpi-label">Pipeline Lead Value</div>
            <div class="kpi-val" style="color: var(--cyan-brand);">${formatMoney(totalLeadVal, isUSD)}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${leads.length} Inquiries in CRM ↗</div>
          </a>

          <a href="#kanban" class="kpi-tile" style="border:1px solid var(--border-subtle); text-decoration:none; color:inherit; transition:all 0.2s ease;" onmouseover="this.style.borderColor='var(--brand-primary)'" onmouseout="this.style.borderColor='var(--border-subtle)'" title="Open Production Kanban">
            <div class="kpi-label">Active Sprint Tasks</div>
            <div class="kpi-val" style="color: var(--text-primary);">${openTasks.length}</div>
            <div style="font-size: 0.72rem;">${overdueTasks.length > 0 ? `<span style="color:#ef4444; font-weight:700;">${overdueTasks.length} Overdue</span>` : '<span style="color:var(--brand-primary); font-weight:700;">Production Queue ↗</span>'}</div>
          </a>
        </div>

        <!-- ──────── SECTION 3: 1-TAP EXECUTIVE ACTION CENTER ──────── -->
        ${totalPendingActions > 0 ? `
          <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(0, 223, 137, 0.08)); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 18px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2rem;">✍️</span>
                <h3 style="font-size: 1.05rem; font-weight: 800; margin: 0; color: var(--text-primary);">
                  Executive Action Center
                  <span style="background: #f59e0b; color: #000; font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.55rem; border-radius: 999px; margin-left: 0.4rem;">${totalPendingActions} Pending Sign-Off${totalPendingActions === 1 ? '' : 's'}</span>
                </h3>
              </div>
              <span style="font-size: 0.75rem; color: var(--text-muted);">1-Tap Executive Sign-Off</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 0.85rem;">
              ${pendingExps.slice(0, 3).map(exp => `
                <div style="background: var(--surface-2, #1b1b26); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 0.85rem; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.2rem;">
                      <span style="font-size: 0.72rem; background: rgba(245, 158, 11, 0.2); color: #fbbf24; padding: 0.1rem 0.4rem; border-radius: 6px; font-weight: 700;">💸 Expense Claim</span>
                      <strong style="font-size: 0.9rem; color: var(--brand-primary);">${formatMoney(exp.amount, isUSD)}</strong>
                    </div>
                    <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary);">${escapeHTML(exp.title || exp.description || 'Expense Claim')}</div>
                    <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.15rem;">Submitted by ${escapeHTML(exp.submittedBy || exp.loggedBy || 'Staff Member')}</div>
                  </div>
                  <div style="display: flex; gap: 0.35rem;">
                    <button onclick="window.execApproveExpense('${exp.id}', this)" style="background: rgba(0, 223, 137, 0.18); border: 1px solid rgba(0, 223, 137, 0.35); color: #00df89; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.65rem; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;">✅ Approve</button>
                    <button onclick="window.execRejectExpense('${exp.id}', this)" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.65rem; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;">❌</button>
                  </div>
                </div>
              `).join('')}
              ${pendingLeavesList.slice(0, 3).map(lv => `
                <div style="background: var(--surface-2, #1b1b26); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 0.85rem; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.2rem;">
                      <span style="font-size: 0.72rem; background: rgba(168, 85, 247, 0.2); color: #c084fc; padding: 0.1rem 0.4rem; border-radius: 6px; font-weight: 700;">🌴 Leave Application</span>
                      <strong style="font-size: 0.9rem; color: #fff;">${escapeHTML(lv.staffName || lv.employeeName || lv.userName || lv.user || lv.employee_name || 'Crew Member')}</strong>
                    </div>
                    <div style="font-size: 0.78rem; color: var(--text-secondary);">${escapeHTML(lv.type || 'Personal')} · ${escapeHTML(lv.startDate || lv.start_date || 'Upcoming')} (${lv.totalDays || lv.total_days || lv.days || 1}d)</div>
                  </div>
                  <div style="display: flex; gap: 0.35rem;">
                    <button onclick="window.execApproveLeave('${lv.id}', this)" style="background: rgba(0, 223, 137, 0.18); border: 1px solid rgba(0, 223, 137, 0.35); color: #00df89; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.65rem; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;">✅ Sign Off</button>
                    <button onclick="window.execRejectLeave('${lv.id}', this)" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.65rem; border-radius: 8px; cursor: pointer; transition: all 0.2s ease;">❌</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- ──────── SECTION 4: MAIN SPLIT: CRM LEADS & INVOICES ──────── -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
          
          <!-- CRM Leads -->
          <div class="card-glass" style="background: var(--surface-1, #0f172a); border: 1px solid var(--border-subtle); border-radius: 18px; padding: 1.25rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
              <div>
                <h3 style="font-size: 1rem; font-weight: 800; margin: 0; color: var(--text-primary);">🎯 Live Lead Inquiries</h3>
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">${leads.length} Inquiries · Pipeline: ${formatMoney(totalLeadVal, isUSD)}</div>
              </div>
              <a href="#leads" style="font-size: 0.75rem; color: var(--brand-primary); text-decoration: none; font-weight: 700;">View CRM Funnel →</a>
            </div>
            ${leads.length === 0 ? `
              <div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">
                <div>🎯 0 inquiries in queue</div>
                <div style="font-size: 0.75rem; margin-top: 0.35rem;">Inquiries from the landing page & service booking forms will appear here.</div>
              </div>
            ` : `
              <div class="table-responsive">
                <table class="data-table" style="font-size: 0.8rem; width:100%;">
                  <thead>
                    <tr><th>Prospect</th><th>Service</th><th>Quick Contact</th></tr>
                  </thead>
                  <tbody>
                    ${leads.slice(0, 5).map(l => {
                      const cleanPhone = (l.phone || '').replace(/[^0-9]/g, '');
                      let waPhone = cleanPhone;
                      if (waPhone) {
                        if (waPhone.startsWith('880')) {
                          // Already full BD format
                        } else if (waPhone.startsWith('88')) {
                          // Already has 88 prefix
                        } else if (waPhone.startsWith('0')) {
                          waPhone = '88' + waPhone;
                        } else if (waPhone.length === 10 && waPhone.startsWith('1')) {
                          waPhone = '880' + waPhone;
                        }
                      }
                      return `
                      <tr>
                        <td><strong>${escapeHTML(l.name)}</strong><br><span style="color:var(--text-muted); font-size:0.72rem;">${escapeHTML(l.email)}</span></td>
                        <td><span class="badge" style="background:rgba(6,182,212,0.15); color:#06b6d4;">${escapeHTML(l.service_interest || 'General')}</span></td>
                        <td>
                          <div style="display: flex; align-items: center; gap: 0.45rem;">
                            ${waPhone.length >= 10 ? `<a href="https://wa.me/${waPhone}" target="_blank" rel="noopener noreferrer" style="color:var(--brand-primary); text-decoration:none; font-weight:700;">💬 WA</a>` : ''}
                            ${l.email ? `<a href="mailto:${escapeHTML(l.email)}" style="color:var(--cyan-brand); text-decoration:none; font-weight:700;">✉️ Email</a>` : ''}
                            ${waPhone.length < 10 && !l.email ? `<span style="color:var(--text-muted);">-</span>` : ''}
                          </div>
                        </td>
                      </tr>
                    `;}).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>

          <!-- Invoices Summary -->
          <div class="card-glass" style="background: var(--surface-1, #0f172a); border: 1px solid var(--border-subtle); border-radius: 18px; padding: 1.25rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
              <div>
                <h3 style="font-size: 1rem; font-weight: 800; margin: 0; color: var(--text-primary);">💳 Settled Invoices & Cash Flow</h3>
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.2rem;">${collectionRate}% Collection Rate · ${formatMoney(paidTotal, isUSD)} Settled</div>
              </div>
              <a href="#finance" style="font-size: 0.75rem; color: var(--brand-primary); text-decoration: none; font-weight: 700;">Finance Hub →</a>
            </div>
            ${invoices.length === 0 ? `
              <div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">
                <div>🧾 No invoices generated</div>
                <div style="font-size: 0.75rem; margin-top: 0.35rem; margin-bottom: 0.75rem;">Issue project invoices from the Financials module.</div>
                <button onclick="window.openNewInvoiceModal()" style="background:var(--brand-primary); color:#000; border:none; padding:0.4rem 0.8rem; border-radius:8px; font-size:0.75rem; font-weight:700; cursor:pointer;">+ Create First Invoice</button>
              </div>
            ` : `
              <div class="table-responsive">
                <table class="data-table" style="font-size: 0.8rem; width:100%;">
                  <thead>
                    <tr><th>Invoice</th><th>Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    ${invoices.slice(0, 5).map(i => {
                      const status = (i.status || 'Pending').toLowerCase();
                      let badgeBg = 'rgba(245, 158, 11, 0.15)';
                      let badgeColor = '#f59e0b';
                      if (status === 'paid' || status === 'settled') {
                        badgeBg = 'rgba(0, 223, 137, 0.15)';
                        badgeColor = '#00df89';
                      } else if (status === 'overdue' || status === 'cancelled') {
                        badgeBg = 'rgba(239, 68, 68, 0.15)';
                        badgeColor = '#ef4444';
                      } else if (status === 'partially paid' || status === 'partially_paid') {
                        badgeBg = 'rgba(59, 130, 246, 0.15)';
                        badgeColor = '#60a5fa';
                      }
                      const clientObj = clients.find(c => c.id === i.client_id || c.id === i.clientId);
                      const clientDisplayName = i.clientName || i.client_name || i.client || (clientObj ? clientObj.name : null) || 'Client Account';
                      const invoiceCode = i.invoice_number || i.invoiceNumber || i.id;
                      return `
                      <tr>
                        <td><strong>${escapeHTML(invoiceCode)}</strong><br><span style="color:var(--text-muted); font-size:0.72rem;">${escapeHTML(clientDisplayName)}</span></td>
                        <td><strong>${formatMoney(i.amount, isUSD)}</strong></td>
                        <td><span class="badge" style="background:${badgeBg}; color:${badgeColor}; font-weight:700;">${escapeHTML(i.status || 'Pending')}</span></td>
                      </tr>
                    `;}).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>

        </div>
      `;

    } catch (err) {
      if (!isDashboardActive()) return;
      container.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: #ef4444;">
          <h3>⚠️ Unable to load Executive Dashboard</h3>
          <p style="font-size:0.85rem; color:var(--text-muted);">${escapeHTML(err.message)}</p>
          <button class="btn-primary" onclick="window.APP_MODULES.dashboard(document.getElementById('app-view'))">Retry</button>
        </div>
      `;
    }
  }

  window.switchModuleCurrency = function(curr) {
    currentDashCurrency = curr;
    localStorage.setItem('gro10x_currency', curr);
    if (window.GRO10XAuth && typeof window.GRO10XAuth.setCurrency === 'function') {
      window.GRO10XAuth.setCurrency(curr);
    }
    window.dispatchEvent(new CustomEvent('gro10x_currency_changed', { detail: { currency: curr } }));
    renderDashboard();
  };

  // Executive Action Center Handlers (Zero Native Dialogs, 2-Step Inline Confirmation & Button Loading)
  window.execApproveExpense = async function(id, btnEl) {
    const btn = btnEl || (typeof event !== 'undefined' && event?.currentTarget) || null;
    if (btn) {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.innerHTML = '⏳ Approving...';
    }
    try {
      if (window.APP_API) {
        await window.APP_API.post(`/expenses/${id}/approve-tier2`, {});
      } else {
        const token = localStorage.getItem('gro10x_token') || '';
        await fetch(`/api/expenses/${id}/approve-tier2`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
      }
      if (window.showToast) window.showToast('👑 Expense Claim Approved by Executive!', 'success');
      renderDashboard();
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '✅ Approve';
      }
      if (window.showToast) window.showToast('Approval failed: ' + err.message, 'error');
    }
  };

  window.execRejectExpense = async function(id, btnEl) {
    const btn = btnEl || (typeof event !== 'undefined' && event?.currentTarget) || null;
    // Step 1: Inline 2-step confirmation with 4-second auto-reset
    if (btn && !btn.dataset.confirmed) {
      btn.dataset.confirmed = 'true';
      const origText = btn.innerHTML;
      btn.innerHTML = '⚠️ Reject?';
      btn.style.background = 'rgba(239, 68, 68, 0.45)';
      btn.style.borderColor = '#ef4444';
      const timer = setTimeout(() => {
        if (btn && btn.dataset.confirmed) {
          delete btn.dataset.confirmed;
          delete btn.dataset.timerId;
          btn.innerHTML = origText;
          btn.style.background = 'rgba(239, 68, 68, 0.15)';
          btn.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        }
      }, 4000);
      btn.dataset.timerId = String(timer);
      return;
    }

    // Step 2: Confirmed action execution
    if (btn) {
      if (btn.dataset.timerId) clearTimeout(Number(btn.dataset.timerId));
      delete btn.dataset.confirmed;
      delete btn.dataset.timerId;
      btn.disabled = true;
      btn.innerHTML = '⏳...';
    }

    try {
      if (window.APP_API) {
        await window.APP_API.patch(`/expenses/${id}`, { status: 'Rejected' });
      } else {
        const token = localStorage.getItem('gro10x_token') || '';
        await fetch(`/api/expenses/${id}`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Rejected' })
        });
      }
      if (window.showToast) window.showToast('Expense Claim Rejected.', 'info');
      renderDashboard();
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '❌';
      }
      if (window.showToast) window.showToast('Rejection failed: ' + err.message, 'error');
    }
  };

  window.execApproveLeave = async function(id, btnEl) {
    const btn = btnEl || (typeof event !== 'undefined' && event?.currentTarget) || null;
    if (btn) {
      if (btn.disabled) return;
      btn.disabled = true;
      btn.innerHTML = '⏳ Signing Off...';
    }
    try {
      if (window.APP_API) {
        await window.APP_API.post(`/leaves/${id}/approve`, {});
      } else {
        const token = localStorage.getItem('gro10x_token') || '';
        await fetch(`/api/leaves/${id}/approve`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
      }
      if (window.showToast) window.showToast('🌴 Leave Application Signed Off!', 'success');
      renderDashboard();
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '✅ Sign Off';
      }
      if (window.showToast) window.showToast('Leave approval failed: ' + err.message, 'error');
    }
  };

  window.execRejectLeave = async function(id, btnEl) {
    const btn = btnEl || (typeof event !== 'undefined' && event?.currentTarget) || null;
    // Step 1: Inline 2-step confirmation with 4-second auto-reset
    if (btn && !btn.dataset.confirmed) {
      btn.dataset.confirmed = 'true';
      const origText = btn.innerHTML;
      btn.innerHTML = '⚠️ Reject?';
      btn.style.background = 'rgba(239, 68, 68, 0.45)';
      btn.style.borderColor = '#ef4444';
      const timer = setTimeout(() => {
        if (btn && btn.dataset.confirmed) {
          delete btn.dataset.confirmed;
          delete btn.dataset.timerId;
          btn.innerHTML = origText;
          btn.style.background = 'rgba(239, 68, 68, 0.15)';
          btn.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        }
      }, 4000);
      btn.dataset.timerId = String(timer);
      return;
    }

    // Step 2: Confirmed action execution
    if (btn) {
      if (btn.dataset.timerId) clearTimeout(Number(btn.dataset.timerId));
      delete btn.dataset.confirmed;
      delete btn.dataset.timerId;
      btn.disabled = true;
      btn.innerHTML = '⏳...';
    }

    try {
      if (window.APP_API) {
        await window.APP_API.post(`/leaves/${id}/reject`, {});
      } else {
        const token = localStorage.getItem('gro10x_token') || '';
        await fetch(`/api/leaves/${id}/reject`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
      }
      if (window.showToast) window.showToast('Leave Application Declined.', 'info');
      renderDashboard();
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '❌';
      }
      if (window.showToast) window.showToast('Leave decline failed: ' + err.message, 'error');
    }
  };

  // Cross-tab and module currency sync (deduplicated & route-guarded)
  if (window._dashboardStorageHandler) {
    window.removeEventListener('storage', window._dashboardStorageHandler);
  }
  window._dashboardStorageHandler = (e) => {
    if (!isDashboardActive()) return;
    if (e.key === 'gro10x_currency' && e.newValue && e.newValue !== currentDashCurrency) {
      currentDashCurrency = e.newValue;
      renderDashboard();
    }
  };
  window.addEventListener('storage', window._dashboardStorageHandler);

  if (window._dashboardCurrencyHandler) {
    window.removeEventListener('gro10x_currency_changed', window._dashboardCurrencyHandler);
  }
  window._dashboardCurrencyHandler = (e) => {
    if (!isDashboardActive()) return;
    if (e.detail && e.detail.currency && e.detail.currency !== currentDashCurrency) {
      currentDashCurrency = e.detail.currency;
      renderDashboard();
    }
  };
  window.addEventListener('gro10x_currency_changed', window._dashboardCurrencyHandler);

  // Real-Time SSE & Cross-Module Synchronization (Debounced to prevent flood)
  let dashDebounceTimer = null;
  function debouncedDashboardSync(delay = 400) {
    if (!isDashboardActive()) return;
    if (dashDebounceTimer) clearTimeout(dashDebounceTimer);
    dashDebounceTimer = setTimeout(() => {
      if (isDashboardActive() && container && container.isConnected) {
        renderDashboard();
      }
    }, delay);
  }

  if (!window._dashboardSSESubscribed) {
    window._dashboardSSESubscribed = true;
    const realtimeEvents = [
      'invoice_update', 'payment_update', 'task_update', 'leave_update',
      'lead_update', 'expense_update', 'client_update', 'weekly_executive_briefing', 'dce_order_update'
    ];
    realtimeEvents.forEach(evt => {
      window.addEventListener(evt, (e) => {
        if (evt === 'weekly_executive_briefing' && window.showToast) {
          window.showToast('🏛️ Live Weekly Executive Briefing Synced', 'info');
        }
        if (isDashboardActive()) debouncedDashboardSync(400);
      });
      if (window.APP_SSE && typeof window.APP_SSE.subscribe === 'function') {
        window.APP_SSE.subscribe(evt, () => { if (isDashboardActive()) debouncedDashboardSync(400); });
      }
    });
  }

  await renderDashboard();
};
