/**
 * public/client/modules/account.js
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};
window.CLIENT_MODULES.account = async function(container) {
  const me = await CLIENT_API.get('/auth/me').catch(() => ({}));
  const user = me.user || {};
  const clientInfo = await CLIENT_API.get(`/clients/${user.linkedId || user.id}`).catch(() => ({}));

  const pocs = clientInfo.pocs && clientInfo.pocs.length > 0 ? clientInfo.pocs : [{ name: user.name || 'Primary Contact', role: 'Account Lead' }];

  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">👤 My Account & Contact Information</h1>
      <div style="font-size:0.88rem; color:var(--text-muted);">Company profile and authorized points of contact.</div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.25rem;">
      <div class="card-glass">
        <h3 style="font-size:1.1rem; margin-top:0; font-family:var(--font-heading);">🏢 Company Profile</h3>
        <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.88rem;">
          <div><strong style="color:var(--text-muted);">Brand Name:</strong> ${clientInfo.name || user.name || 'Client Partner'}</div>
          <div><strong style="color:var(--text-muted);">Category:</strong> ${clientInfo.category || 'General'}</div>
          <div><strong style="color:var(--text-muted);">Status:</strong> <span class="badge badge-purple">${clientInfo.status || 'Active Retainer'}</span></div>
          <div><strong style="color:var(--text-muted);">Registered Phone:</strong> ${user.phone || clientInfo.phone || 'N/A'}</div>
        </div>
      </div>

      <div class="card-glass">
        <h3 style="font-size:1.1rem; margin-top:0; font-family:var(--font-heading);">👥 Authorized Contacts (${pocs.length})</h3>
        <div style="display:flex; flex-direction:column; gap:0.75rem;">
          ${pocs.map(p => `
            <div style="padding:0.75rem; background:var(--surface-3); border-radius:10px;">
              <div style="font-weight:700; color:var(--text-primary);">👤 ${p.name}</div>
              <div style="font-size:0.78rem; color:var(--text-muted);">${p.role || 'Contact Representative'}</div>
              ${p.phone ? `<div style="font-size:0.75rem; color:var(--purple-light); margin-top:0.2rem;">📞 ${p.phone}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
};
