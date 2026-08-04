/**
 * public/client/modules/home.js
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};

window.CLIENT_MODULES.home = async function(container) {
  try {
    const me = await CLIENT_API.get('/auth/me').catch(() => ({}));
    let localUser = {};
    try { localUser = JSON.parse(localStorage.getItem('purple_user') || '{}'); } catch(e) {}
    const user = me?.user || me || localUser;
    const [posts, invoices, tickets] = await Promise.all([
      CLIENT_API.get('/posts').catch(() => []),
      CLIENT_API.get('/invoices/invoices').catch(() => []),
      CLIENT_API.get('/tickets').catch(() => [])
    ]);

    const pendingApprovals = (posts || []).filter(p => p.status === 'Pending Client Approval' || p.status === 'Client Review').length;
    const unpaidInvoices = (invoices || []).filter(i => i.status !== 'Paid').length;
    const openTickets = (tickets || []).filter(t => t.status === 'Open' || t.status === 'In Progress').length;

    container.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
          👋 Welcome back, ${user.name || 'Partner'}!
        </h1>
        <div style="font-size: 0.88rem; color: var(--text-muted);">
          Here is an overview of your active campaigns, pending approvals, and support desk status.
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <a href="#review" style="text-decoration:none;" class="kpi-tile">
          <div class="kpi-label">Pending Asset Approvals</div>
          <div class="kpi-val" style="color: var(--pink-brand);">${pendingApprovals}</div>
          <div class="kpi-sub" style="color: var(--pink-brand);">🎬 Action Required ▶</div>
        </a>
        <a href="#invoices" style="text-decoration:none;" class="kpi-tile">
          <div class="kpi-label">Pending Invoices</div>
          <div class="kpi-val" style="color: var(--amber-brand);">${unpaidInvoices}</div>
          <div class="kpi-sub" style="color: var(--amber-brand);">💳 Billing Summary ▶</div>
        </a>
        <a href="#tickets" style="text-decoration:none;" class="kpi-tile">
          <div class="kpi-label">Active Support Tickets</div>
          <div class="kpi-val" style="color: var(--purple-light);">${openTickets}</div>
          <div class="kpi-sub">🎟️ Track Status ▶</div>
        </a>
      </div>

      <div class="card-glass">
        <h2 style="font-size:1.1rem; font-family:var(--font-heading); margin-top:0;">🚀 Quick Actions</h2>
        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
          <a href="#review" class="btn-primary">Watch Video Cuts (${pendingApprovals})</a>
          <a href="#tickets" class="btn-secondary">+ Submit Ticket / Request</a>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="card-glass" style="padding:2rem; text-align:center;">Welcome to Client Portal</div>`;
  }
};
