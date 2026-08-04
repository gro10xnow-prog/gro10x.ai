/**
 * public/client/modules/campaign.js
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};
window.CLIENT_MODULES.campaign = async function(container) {
  const posts = await CLIENT_API.get('/posts').catch(() => []);
  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">📋 Campaign & Content Schedule</h1>
      <div style="font-size:0.88rem; color:var(--text-muted);">Social posts and publishing schedule.</div>
    </div>
    <div class="data-table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Platform</th>
            <th>Post Title</th>
            <th>Scheduled Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${(posts || []).map(p => `
            <tr>
              <td><span class="badge badge-purple">${p.platform || 'Social'}</span></td>
              <td style="font-weight:700;">${p.title}</td>
              <td style="color:var(--text-muted);">${p.scheduledDate || 'TBD'}</td>
              <td><span class="badge badge-emerald">${p.status || 'Active'}</span></td>
            </tr>
          `).join('') || `<tr><td colspan="4" style="text-align:center; padding:2rem;">No posts scheduled</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
};
