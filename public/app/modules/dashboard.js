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
  var currentDashCurrency = localStorage.getItem('gro10x_currency') || 'USD';

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  async function renderDashboard() {
    try {
      const [
        teamRes,
        leaveRes,
        eodRes,
        taskRes,
        invRes,
        expRes,
        clientRes,
        leadRes
      ] = await Promise.all([
        APP_API.get('/team').catch(() => []),
        APP_API.get('/leaves').catch(() => []),
        APP_API.get('/team/eod').catch(() => []),
        APP_API.get('/tasks').catch(() => []),
        APP_API.get('/invoices').catch(() => []),
        APP_API.get('/expenses').catch(() => []),
        APP_API.get('/clients').catch(() => []),
        APP_API.get('/leads').catch(() => [])
      ]);

      const team = teamRes || [];
      const leaves = leaveRes || [];
      const eods = eodRes || [];
      const tasks = taskRes || [];
      const invoices = invRes || [];
      const expenses = expRes || [];
      const clients = clientRes || [];
      const leads = leadRes || [];

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
      const todayDate = new Date();
      const openTasks = tasks.filter(t => !['Approved', 'Published', 'Completed'].includes(t.stage));
      const overdueTasks = openTasks.filter(t => t.due_date && t.due_date < todayStr);

      const totalLeadVal = leads.reduce((sum, l) => {
        const val = parseFloat(String(l.value || '1500').replace(/[^0-9.]/g, '')) || 1500;
        return sum + val;
      }, 0);

      const hr = new Date().getHours();
      const timeGreeting = hr < 12 ? 'Good Morning' : (hr < 17 ? 'Good Afternoon' : 'Good Evening');
      const execName = (window.CURRENT_USER && window.CURRENT_USER.firstName) ? window.CURRENT_USER.firstName : 'Leader';

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
              Multi-Engine Executive Command · $100,000 Target & 65% Net Margin Model
            </div>
          </div>

          <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
            <!-- Currency Toggle -->
            <div style="display:flex; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle); border-radius:10px; padding:2px;">
              <button type="button" onclick="window.switchModuleCurrency('USD')" style="background:${isUSD ? 'rgba(0, 223, 137, 0.15)' : 'none'}; border:none; color:${isUSD ? '#00df89' : 'var(--text-muted)'}; font-size:0.75rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:6px; cursor:pointer;">USD ($)</button>
              <button type="button" onclick="window.switchModuleCurrency('BDT')" style="background:${!isUSD ? 'rgba(0, 223, 137, 0.15)' : 'none'}; border:none; color:${!isUSD ? '#00df89' : 'var(--text-muted)'}; font-size:0.75rem; font-weight:800; padding:0.2rem 0.5rem; border-radius:6px; cursor:pointer;">BDT (৳)</button>
            </div>

            <a href="#kanban" class="btn-secondary" style="font-size: 0.8rem; text-decoration: none;">📋 New Task</a>
            <a href="#finance" class="btn-secondary" style="font-size: 0.8rem; text-decoration: none;">🧾 New Invoice</a>
            <a href="#leads" class="btn-primary" style="font-size: 0.8rem; text-decoration: none;">🎯 View Leads (${leads.length})</a>
          </div>
        </div>

        <!-- ──────── SECTION 1: 5-ENGINE GROWTH MODEL TRACKER ──────── -->
        <div style="font-size: 0.82rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.75rem;">
          ⚡ 5-Engine Revenue Target Ecosystem ($100k Annual Target)
        </div>
        <div style="background: var(--surface-1, #0f172a); border: 1px solid rgba(0, 223, 137, 0.25); border-radius: 18px; padding: 1.25rem; margin-bottom: 1.5rem;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem;">
            
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:700; margin-bottom:0.35rem;">
                <span style="color:var(--text-primary);">💻 1. Micro-SaaS (35%)</span>
                <strong style="color:var(--brand-primary);">${isUSD ? '$35,000' : '৳41.3L'}</strong>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden;">
                <div style="height:100%; width:35%; background:linear-gradient(90deg, #00df89, #06b6d4); border-radius:999px;"></div>
              </div>
              <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.25rem;">GroUp Academy · ServiQ · Telegrab</div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:700; margin-bottom:0.35rem;">
                <span style="color:var(--text-primary);">⚡ 2. Platform Revenue (25%)</span>
                <strong style="color:var(--cyan-brand, #06b6d4);">${isUSD ? '$25,000' : '৳29.5L'}</strong>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden;">
                <div style="height:100%; width:25%; background:linear-gradient(90deg, #06b6d4, #3b82f6); border-radius:999px;"></div>
              </div>
              <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.25rem;">Fiverr (4 Gigs Live) · Chrome Store</div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:700; margin-bottom:0.35rem;">
                <span style="color:var(--text-primary);">📦 3. Digital Assets (20%)</span>
                <strong style="color:#f59e0b;">${isUSD ? '$20,000' : '৳23.6L'}</strong>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden;">
                <div style="height:100%; width:20%; background:linear-gradient(90deg, #f59e0b, #ec4899); border-radius:999px;"></div>
              </div>
              <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.25rem;">DigiVault (AI Subs) · 13 Etsy Stores</div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:700; margin-bottom:0.35rem;">
                <span style="color:var(--text-primary);">🤝 4. Agency OS Studio (15%)</span>
                <strong style="color:#00df89;">${isUSD ? '$15,000' : '৳17.7L'}</strong>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden;">
                <div style="height:100%; width:15%; background:linear-gradient(90deg, #00df89, #f59e0b); border-radius:999px;"></div>
              </div>
              <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.25rem;">8 OS Templates · ৳35k/mo Retainer Baseline</div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:700; margin-bottom:0.35rem;">
                <span style="color:var(--text-primary);">🎬 5. Video & Media (5%)</span>
                <strong style="color:#ef4444;">${isUSD ? '$5,000' : '৳5.9L'}</strong>
              </div>
              <div style="width:100%; height:8px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden;">
                <div style="height:100%; width:5%; background:#ef4444; border-radius:999px;"></div>
              </div>
              <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.25rem;">Grow Bangla (427) · PILUTICS · Bong Hits</div>
            </div>

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

          <div class="kpi-tile" style="border:1px solid var(--border-subtle);">
            <div class="kpi-label">Lean Expense Cap</div>
            <div class="kpi-val" style="color: #f59e0b;">${isUSD ? '$35,000' : '৳41.3 Lakh'}</div>
            <div style="font-size: 0.72rem; color: #f59e0b;">35% Lean Budget Cap</div>
          </div>

          <div class="kpi-tile" style="border:1px solid var(--border-subtle);">
            <div class="kpi-label">Target Net Profit</div>
            <div class="kpi-val" style="color: #00df89;">${isUSD ? '$65,000' : '৳76.7 Lakh'}</div>
            <div style="font-size: 0.72rem; color: #00df89;">65% Net Margin</div>
          </div>

          <div class="kpi-tile" style="border:1px solid var(--border-subtle);">
            <div class="kpi-label">Pipeline Lead Value</div>
            <div class="kpi-val" style="color: var(--cyan-brand);">${isUSD ? `$${totalLeadVal.toLocaleString()}` : `৳${Math.round(totalLeadVal * 118).toLocaleString()}`}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${leads.length} Inquiries in CRM</div>
          </div>

          <div class="kpi-tile" style="border:1px solid var(--border-subtle);">
            <div class="kpi-label">Active Sprint Tasks</div>
            <div class="kpi-val" style="color: var(--text-primary);">${openTasks.length}</div>
            <div style="font-size: 0.72rem; color: var(--brand-primary);">Production Queue</div>
          </div>
        </div>

        <!-- ──────── SECTION 3: 1-TAP EXECUTIVE ACTION CENTER ──────── -->
        ${totalPendingActions > 0 ? `
          <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(0, 223, 137, 0.08)); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 18px; padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2rem;">✍️</span>
                <h3 style="font-size: 1.05rem; font-weight: 800; margin: 0; color: var(--text-primary);">
                  Executive Action Center
                  <span style="background: #f59e0b; color: #000; font-size: 0.72rem; font-weight: 800; padding: 0.15rem 0.55rem; border-radius: 999px; margin-left: 0.4rem;">${totalPendingActions} Pending Sign-Offs</span>
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
                      <strong style="font-size: 0.9rem; color: var(--brand-primary);">${isUSD ? `$${Number(exp.amount || 0).toLocaleString()}` : `৳${(Number(exp.amount) || 0).toLocaleString()}`}</strong>
                    </div>
                    <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary);">${escapeHTML(exp.description || 'Expense')}</div>
                  </div>
                  <div style="display: flex; gap: 0.35rem;">
                    <button onclick="window.execApproveExpense('${exp.id}')" style="background: rgba(0, 223, 137, 0.18); border: 1px solid rgba(0, 223, 137, 0.35); color: #00df89; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.65rem; border-radius: 8px; cursor: pointer;">✅ Approve</button>
                    <button onclick="window.execRejectExpense('${exp.id}')" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.65rem; border-radius: 8px; cursor: pointer;">❌</button>
                  </div>
                </div>
              `).join('')}
              ${pendingLeavesList.slice(0, 3).map(lv => `
                <div style="background: var(--surface-2, #1b1b26); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 0.85rem; display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;">
                  <div>
                    <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.2rem;">
                      <span style="font-size: 0.72rem; background: rgba(168, 85, 247, 0.2); color: #c084fc; padding: 0.1rem 0.4rem; border-radius: 6px; font-weight: 700;">🌴 Leave Application</span>
                      <strong style="font-size: 0.9rem; color: #fff;">${escapeHTML(lv.userName || lv.user || 'Crew Member')}</strong>
                    </div>
                    <div style="font-size: 0.78rem; color: var(--text-secondary);">${escapeHTML(lv.type || 'Personal')} · ${lv.startDate || 'Upcoming'} (${lv.days || 1}d)</div>
                  </div>
                  <div style="display: flex; gap: 0.35rem;">
                    <button onclick="window.execApproveLeave('${lv.id}')" style="background: rgba(0, 223, 137, 0.18); border: 1px solid rgba(0, 223, 137, 0.35); color: #00df89; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.65rem; border-radius: 8px; cursor: pointer;">✅ Sign Off</button>
                    <button onclick="window.execRejectLeave('${lv.id}')" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.65rem; border-radius: 8px; cursor: pointer;">❌</button>
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
              <h3 style="font-size: 1rem; font-weight: 800; margin: 0; color: var(--text-primary);">🎯 Live Lead Inquiries</h3>
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
                    ${leads.slice(0, 5).map(l => `
                      <tr>
                        <td><strong>${escapeHTML(l.name)}</strong><br><span style="color:var(--text-muted); font-size:0.72rem;">${escapeHTML(l.email)}</span></td>
                        <td><span class="badge" style="background:rgba(6,182,212,0.15); color:#06b6d4;">${escapeHTML(l.service_interest || 'General')}</span></td>
                        <td><a href="https://wa.me/${(l.phone || '').replace(/[^0-9]/g, '')}" target="_blank" style="color:var(--brand-primary); text-decoration:none; font-weight:700;">💬 WhatsApp</a></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>

          <!-- Invoices Summary -->
          <div class="card-glass" style="background: var(--surface-1, #0f172a); border: 1px solid var(--border-subtle); border-radius: 18px; padding: 1.25rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
              <h3 style="font-size: 1rem; font-weight: 800; margin: 0; color: var(--text-primary);">💳 Settled Invoices & Cash Flow</h3>
              <a href="#finance" style="font-size: 0.75rem; color: var(--brand-primary); text-decoration: none; font-weight: 700;">Finance Hub →</a>
            </div>
            ${invoices.length === 0 ? `
              <div style="padding: 1.5rem; text-align: center; color: var(--text-muted);">
                <div>🧾 No invoices generated</div>
                <div style="font-size: 0.75rem; margin-top: 0.35rem;">Issue project invoices from the Financials module.</div>
              </div>
            ` : `
              <div class="table-responsive">
                <table class="data-table" style="font-size: 0.8rem; width:100%;">
                  <thead>
                    <tr><th>Invoice ID</th><th>Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    ${invoices.slice(0, 5).map(i => `
                      <tr>
                        <td><strong>${escapeHTML(i.id)}</strong><br><span style="color:var(--text-muted); font-size:0.72rem;">${escapeHTML(i.client_id || 'Client')}</span></td>
                        <td><strong>${isUSD ? `$${Number(i.amount || 0).toLocaleString()}` : `৳${(Number(i.amount) || 0).toLocaleString()}`}</strong></td>
                        <td><span class="badge" style="background:rgba(0,223,137,0.15); color:#00df89;">${escapeHTML(i.status || 'Pending')}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>

        </div>
      `;

    } catch (err) {
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
    renderDashboard();
  };

  // Executive Action Center Handlers
  window.execApproveExpense = async function(id) {
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
      if (window.showToast) window.showToast('Approval failed: ' + err.message, 'error');
    }
  };

  window.execRejectExpense = async function(id) {
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
      if (window.showToast) window.showToast('Rejection failed: ' + err.message, 'error');
    }
  };

  window.execApproveLeave = async function(id) {
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
      if (window.showToast) window.showToast('Leave approval failed: ' + err.message, 'error');
    }
  };

  window.execRejectLeave = async function(id) {
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
      if (window.showToast) window.showToast('Leave decline failed: ' + err.message, 'error');
    }
  };

  // Cross-tab currency sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'gro10x_currency' && e.newValue && e.newValue !== currentDashCurrency) {
      currentDashCurrency = e.newValue;
      renderDashboard();
    }
  });

  await renderDashboard();
};
