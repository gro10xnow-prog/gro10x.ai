/**
 * public/client/modules/home.js
 * Executive Client Partner Dashboard
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};
const escapeHTML = window.escapeHTML || function(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; };

window.CLIENT_MODULES.home = async function(container) {
  try {
    const me = await CLIENT_API.get('/auth/me').catch(() => ({}));
    let localUser = {};
    try { localUser = JSON.parse(localStorage.getItem('purple_user') || '{}'); } catch(e) {}
    const user = me?.user || me || localUser;
    const clientName = user.company || user.name || '';

    const [posts, invoices, tickets, clientInfo] = await Promise.all([
      clientName 
        ? CLIENT_API.get(`/posts/client/${encodeURIComponent(clientName)}`).catch(() => CLIENT_API.get('/posts').catch(() => []))
        : CLIENT_API.get('/posts').catch(() => []),
      CLIENT_API.get('/invoices').catch(() => []),
      CLIENT_API.get('/tickets').catch(() => []),
      CLIENT_API.get(`/clients/${user.linkedId || user.id}`).catch(() => ({}))
    ]);

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
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
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
          </div>
        </div>

        <a href="#brief" class="btn-primary" style="text-decoration:none; display:inline-flex; align-items:center; gap:0.4rem;">
          📝 Submit Brief
        </a>
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
