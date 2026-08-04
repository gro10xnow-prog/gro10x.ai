/**
 * public/crew/modules/profile.js
 */
window.CREW_MODULES = window.CREW_MODULES || {};
window.CREW_MODULES.profile = async function(container) {
  const me = await CREW_API.get('/auth/me').catch(() => ({}));
  const user = me.user || {};

  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">👤 My Personal Profile</h1>
      <div style="font-size:0.88rem; color:var(--text-muted);">View personal details, bank / bKash info, and emergency contacts.</div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.25rem;">
      <div class="card-glass">
        <h3 style="font-size:1.1rem; margin-top:0; font-family:var(--font-heading);">👤 Personal Details</h3>
        <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.88rem;">
          <div><strong style="color:var(--text-muted);">Name:</strong> ${user.name || 'Crew Member'}</div>
          <div><strong style="color:var(--text-muted);">Phone:</strong> ${user.phone || 'Registered Phone'}</div>
          <div><strong style="color:var(--text-muted);">Email:</strong> ${user.email || 'N/A'}</div>
          <div><strong style="color:var(--text-muted);">Department:</strong> ${user.department || 'Production'}</div>
        </div>
      </div>

      <div class="card-glass">
        <h3 style="font-size:1.1rem; margin-top:0; font-family:var(--font-heading);">💳 Disbursement Account</h3>
        <div style="display:flex; flex-direction:column; gap:0.6rem; font-size:0.88rem;">
          <div><strong style="color:var(--text-muted);">Payment Channel:</strong> bKash Mobile Financial Service</div>
          <div><strong style="color:var(--text-muted);">Mobile No:</strong> ${user.phone || 'N/A'}</div>
          <div><strong style="color:var(--text-muted);">Verification:</strong> <span class="badge badge-emerald">Verified</span></div>
        </div>
      </div>
    </div>
  `;
};
