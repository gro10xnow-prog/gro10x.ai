/**
 * public/client/modules/home.js
 * Executive Client Partner Dashboard
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};
var escapeHTML = window.escapeHTML || function(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; };

window.CLIENT_MODULES.home = async function(container) {
  try {
    const me = await CLIENT_API.get('/auth/me').catch(() => ({}));
    let localUser = {};
    try { localUser = JSON.parse(localStorage.getItem('purple_user') || '{}'); } catch(e) {}
    const user = me?.user || me || localUser;
    const clientName = user.company || user.name || '';

    const [posts, invoices, tickets, clientInfo, projects] = await Promise.all([
      clientName 
        ? CLIENT_API.get(`/posts/client/${encodeURIComponent(clientName)}`).catch(() => CLIENT_API.get('/posts').catch(() => []))
        : CLIENT_API.get('/posts').catch(() => []),
      CLIENT_API.get('/invoices').catch(() => []),
      CLIENT_API.get('/tickets').catch(() => []),
      CLIENT_API.get('/clients/me').catch(() => ({})),
      CLIENT_API.get('/projects').catch(() => [])
    ]);

    const projectList = Array.isArray(projects) ? projects : [];
    
    // Resolve active warranty project
    const activeWarrantyProject = projectList.find(p => {
      const w = p.warrantyUntil || p.warranty_until;
      return w && (new Date(w).getTime() > Date.now());
    }) || projectList.find(p => p.delivery_status === 'APPROVED' || p.deliveryStatus === 'APPROVED') || null;

    let isWarrantyActive = false;
    let warrantyDaysRemaining = 0;
    let warrantyExpiryDateStr = '';

    if (activeWarrantyProject) {
      const rawW = activeWarrantyProject.warrantyUntil || activeWarrantyProject.warranty_until;
      if (rawW) {
        const diff = new Date(rawW).getTime() - Date.now();
        if (diff > 0) {
          isWarrantyActive = true;
          warrantyDaysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
          warrantyExpiryDateStr = new Date(rawW).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        }
      }
    }

    // Resolve active sprint project (default to first active project or Purplebot sprint)
    const activeSprint = projectList.find(p => p.delivery_status !== 'WARRANTY_CLOSED') || {
      id: 'proj-purplebot-01',
      name: 'AI Agency OS & Automated Retainer Sprint',
      delivery_status: 'DELIVERED',
      delivery_pod: {
        podName: 'MVP Rapid Delivery Pod',
        icon: '⚡',
        targetVelocityDays: 14,
        leadEngineer: 'Fahim Rahman'
      }
    };

    const pod = activeSprint.delivery_pod || activeSprint.deliveryPod || {
      podName: 'MVP Rapid Delivery Pod',
      icon: '⚡',
      targetVelocityDays: 14,
      leadEngineer: 'Fahim Rahman'
    };

    const isDelivered = activeSprint.delivery_status === 'DELIVERED' || activeSprint.delivery_status === 'APPROVED' || activeSprint.deliveryStatus === 'DELIVERED';
    const isApproved = activeSprint.delivery_status === 'APPROVED' || activeSprint.deliveryStatus === 'APPROVED';
    const sprintPct = isApproved ? 100 : isDelivered ? 90 : 65;

    const pendingApprovals = (posts || []).filter(p => p.status === 'Pending Client Approval' || p.status === 'Client Review').length;
    const totalScheduled = (posts || []).filter(p => p.status === 'Approved' || p.status === 'Scheduled' || p.status === 'Draft').length;
    const unpaidInvoices = (invoices || []).filter(i => i.status !== 'Paid').length;
    const openTickets = (tickets || []).filter(t => t.status === 'Open' || t.status === 'In Progress').length;
    const retainerStatus = clientInfo.status || 'Active Retainer';

    // Find the next upcoming scheduled post
    const upcomingPosts = (posts || [])
      .filter(p => p.scheduledDate)
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    const nextPost = upcomingPosts[0];

    container.innerHTML = `
      <!-- Greeting & Retainer Status Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size: 1.55rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.35rem;">
            👋 Welcome back, ${escapeHTML(user.name || 'Partner')}!
          </h1>
          <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
            <span class="badge badge-purple" style="font-size:0.72rem; padding:0.25rem 0.65rem;">
              🏢 ${escapeHTML(clientInfo.name || user.company || 'Client Workspace')}
            </span>
            <span class="badge badge-emerald" style="font-size:0.72rem; padding:0.25rem 0.65rem;">
              ⚡ ${escapeHTML(retainerStatus)}
            </span>
            <span class="badge badge-blue" style="font-size:0.72rem; padding:0.25rem 0.65rem;">
              🚀 Engine 2 Partner
            </span>
          </div>
        </div>

        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <a href="#brief" class="btn-primary" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem;">
            📝 Submit Brief
          </a>
          <a href="/msa-view.html?id=${encodeURIComponent(activeSprint.id || 'proj-purplebot-01')}" target="_blank" class="btn-secondary" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem;">
            📜 Legal MSA & NDA
          </a>
        </div>
      </div>

      <!-- 30-Day Bug-Fix Warranty Countdown Shield Banner -->
      ${isWarrantyActive ? `
        <div class="card-glass" style="background:linear-gradient(135deg, rgba(16,185,129,0.18), rgba(5,150,105,0.32)); border:1px solid rgba(16,185,129,0.45); margin-bottom:1.5rem; padding:1.15rem 1.4rem; border-radius:14px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
            <div style="display:flex; align-items:center; gap:0.9rem;">
              <div style="font-size:2rem;">🛡️</div>
              <div>
                <div style="font-size:0.72rem; font-weight:800; color:#34d399; text-transform:uppercase; letter-spacing:0.05em;">
                  Institutional Warranty Shield · Zero-Cost Defect Resolution
                </div>
                <div style="font-size:1.2rem; font-weight:900; font-family:var(--font-heading); color:#fff; margin:0.15rem 0;">
                  30-Day Bug-Fix Warranty — <span style="color:#6ee7b7;">${warrantyDaysRemaining} Days Remaining</span>
                </div>
                <div style="font-size:0.8rem; color:rgba(255,255,255,0.85);">
                  Active for <strong>${escapeHTML(activeWarrantyProject.name || 'AI Sprint Solution')}</strong> · Closes on <strong>${warrantyExpiryDateStr}</strong> · SLA: <strong>4h P0 Critical / 24h P1 Standard</strong>
                </div>
              </div>
            </div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
              <a href="#tickets" class="btn-primary btn-sm" style="background:#059669; text-decoration:none; display:inline-flex; align-items:center; gap:0.35rem;">
                🎟️ File Warranty Ticket
              </a>
              <a href="/handover-view.html?id=${encodeURIComponent(activeWarrantyProject.id)}" target="_blank" class="btn-secondary btn-sm" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.35rem;">
                📄 IP Handover Shield
              </a>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Engine 2: Active Rapid Sprint Progress Cockpit -->
      <div class="card-glass" style="background:linear-gradient(135deg, rgba(124,58,237,0.14), rgba(15,23,42,0.6)); border:1px solid rgba(139,92,246,0.35); margin-bottom:1.5rem; padding:1.25rem 1.4rem; border-radius:14px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
              <span class="badge badge-purple" style="font-size:0.75rem;">
                ${pod.icon || '⚡'} ${escapeHTML(pod.podName || 'MVP Rapid Delivery Pod')}
              </span>
              <span class="badge ${isApproved ? 'badge-emerald' : isDelivered ? 'badge-blue' : 'badge-amber'}" style="font-size:0.75rem;">
                ${isApproved ? '✅ Handover Approved' : isDelivered ? '🚀 Deliverables Released' : '⚡ In Active Sprint'}
              </span>
            </div>
            <h2 style="font-size:1.2rem; font-family:var(--font-heading); margin:0 0 0.25rem; color:#fff;">
              ${escapeHTML(activeSprint.name || 'AI Solution Sprint')}
            </h2>
            <div style="font-size:0.8rem; color:var(--text-secondary);">
              Velocity Target: <strong>${pod.targetVelocityDays || 14} Days</strong> · Lead Engineer: <strong>${escapeHTML(pod.leadEngineer || 'Fahim Rahman')}</strong>
            </div>
          </div>

          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <a href="#review" class="btn-primary btn-sm" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.35rem;">
              🎬 Review Deliverables
            </a>
            <a href="#retainer" class="btn-secondary btn-sm" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.35rem;">
              ⏳ Retainer Bank
            </a>
            <a href="/handover-view.html?id=${encodeURIComponent(activeSprint.id)}" target="_blank" class="btn-secondary btn-sm" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.35rem;">
              🛡️ Handover Shield
            </a>
          </div>
        </div>

        <!-- Sprint Stages Bar -->
        <div style="margin-top:0.75rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-muted); margin-bottom:0.4rem;">
            <span>Sprint Execution Stage</span>
            <span style="font-weight:700; color:var(--purple-light);">${sprintPct}% Complete</span>
          </div>
          <div style="height:8px; background:rgba(255,255,255,0.08); border-radius:999px; overflow:hidden;">
            <div style="height:100%; width:${sprintPct}%; background:linear-gradient(90deg, #8b5cf6, #00df89); border-radius:999px;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.68rem; color:var(--text-dim); margin-top:0.35rem;">
            <span style="color:${sprintPct >= 20 ? '#a78bfa' : 'inherit'};">1. Scope Lock</span>
            <span style="color:${sprintPct >= 40 ? '#a78bfa' : 'inherit'};">2. Architecture</span>
            <span style="color:${sprintPct >= 65 ? '#a78bfa' : 'inherit'};">3. Pod Build</span>
            <span style="color:${sprintPct >= 90 ? '#34d399' : 'inherit'};">4. QA & Deliver</span>
            <span style="color:${sprintPct >= 100 ? '#34d399' : 'inherit'};">5. Handover Shield</span>
          </div>
        </div>
      </div>

      <!-- 4 KPI Tiles Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1.15rem; margin-bottom: 1.5rem;">
        <a href="#review" style="text-decoration:none;" class="kpi-tile">
          <div class="kpi-label">Pending Approvals</div>
          <div class="kpi-val" style="color: var(--pink-brand);">${pendingApprovals}</div>
          <div class="kpi-sub" style="color: var(--pink-brand);">🎬 Review Video Cuts ▶</div>
        </a>

        <a href="#campaign" style="text-decoration:none;" class="kpi-tile">
          <div class="kpi-label">Content In Pipeline</div>
          <div class="kpi-val" style="color: var(--purple-light);">${totalScheduled}</div>
          <div class="kpi-sub">📋 Campaign Schedule ▶</div>
        </a>

        <a href="#invoices" style="text-decoration:none;" class="kpi-tile">
          <div class="kpi-label">Pending Invoices</div>
          <div class="kpi-val" style="color: var(--amber-brand);">${unpaidInvoices}</div>
          <div class="kpi-sub" style="color: var(--amber-brand);">💳 Billing Overview ▶</div>
        </a>

        <a href="#tickets" style="text-decoration:none;" class="kpi-tile">
          <div class="kpi-label">Support Requests</div>
          <div class="kpi-val" style="color: #38bdf8;">${openTickets}</div>
          <div class="kpi-sub">🎟️ Track Status ▶</div>
        </a>
      </div>

      <!-- Main Dashboard Content Grid -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1.25rem; margin-bottom:1.5rem;">
        
        <!-- Next Scheduled Content Preview Card -->
        <div class="card-glass" style="display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
              <h2 style="font-size:1.1rem; font-family:var(--font-heading); margin:0;">📅 Next Scheduled Post</h2>
              ${nextPost ? `<span class="badge badge-purple">${escapeHTML(nextPost.platform || 'Social')}</span>` : ''}
            </div>

            ${nextPost ? `
              <div style="background:var(--surface-3); padding:0.85rem; border-radius:12px; border:1px solid rgba(255,255,255,0.05); margin-bottom:0.75rem;">
                <div style="font-weight:700; color:var(--text-primary); margin-bottom:0.25rem;">
                  ${escapeHTML(nextPost.title)}
                </div>
                <div style="font-size:0.78rem; color:var(--purple-light); font-weight:600; margin-bottom:0.4rem;">
                  ⏰ ${escapeHTML(nextPost.scheduledDate)} ${nextPost.scheduledTime ? `at ${escapeHTML(nextPost.scheduledTime)}` : ''}
                </div>
                <div style="font-size:0.78rem; color:var(--text-muted); max-height:45px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                  ${escapeHTML(nextPost.caption || 'Ready for publishing')}
                </div>
              </div>
            ` : `
              <div style="padding:1.5rem; text-align:center; color:var(--text-muted); font-size:0.88rem;">
                No upcoming content currently scheduled.
              </div>
            `}
          </div>

          <div style="margin-top:1rem;">
            <a href="#campaign" class="btn-secondary btn-sm" style="width:100%; text-align:center; text-decoration:none; display:block;">
              View Full Publishing Calendar →
            </a>
          </div>
        </div>

        <!-- Quick Actions & AM Fast Lane -->
        <div class="card-glass" style="display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <h2 style="font-size:1.1rem; font-family:var(--font-heading); margin:0 0 1rem;">🚀 Client Quick Actions</h2>
            <div style="display:flex; flex-direction:column; gap:0.6rem;">
              <a href="#review" class="btn-primary" style="text-decoration:none; justify-content:center; display:flex; align-items:center; gap:0.4rem;">
                🎬 Watch & Approve Cuts (${pendingApprovals})
              </a>
              <a href="#brief" class="btn-secondary" style="text-decoration:none; justify-content:center; display:flex; align-items:center; gap:0.4rem;">
                📝 Kick Off Campaign Brief
              </a>
              <a href="#account" class="btn-secondary" style="text-decoration:none; justify-content:center; display:flex; align-items:center; gap:0.4rem;">
                👤 Contact Dedicated Account Manager
              </a>
            </div>
          </div>

          <div style="margin-top:1.25rem; font-size:0.75rem; color:var(--text-muted); text-align:center;">
            Need immediate help? Reach your AM via WhatsApp or call office desk.
          </div>
        </div>

      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card-glass" style="padding:2rem; text-align:center;">Welcome to Client Portal</div>`;
  }
};
