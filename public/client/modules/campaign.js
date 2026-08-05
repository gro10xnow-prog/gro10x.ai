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
    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
      ${(posts || []).map(p => {
        let badgeClass = 'badge-purple';
        if (p.platform === 'Instagram') badgeClass = 'badge-pink';
        else if (p.platform === 'LinkedIn') badgeClass = 'badge-cyan';

        let statusBadge = 'badge-purple';
        if (p.status === 'Approved' || p.status === 'Published') statusBadge = 'badge-emerald';
        else if (p.status === 'Pending Client Approval') statusBadge = 'badge-amber';
        else if (p.status === 'Due Today' || p.status === 'Changes Requested') statusBadge = 'badge-pink';

        const mediaUrl = (p.mediaUrls && p.mediaUrls[0]) || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80';

        return `
          <div style="background:var(--surface); border:1px solid rgba(255,255,255,0.06); border-radius:16px; overflow:hidden; display:flex; flex-direction:column;">
            <div style="height:140px; background:#000; position:relative;">
              <img src="${mediaUrl}" style="width:100%; height:100%; object-fit:cover;" alt="Post Preview">
              <span class="badge ${badgeClass}" style="position:absolute; top:0.5rem; left:0.5rem; z-index:2; backdrop-filter:blur(4px);">${p.platform || 'Social'}</span>
              <span class="badge ${statusBadge}" style="position:absolute; top:0.5rem; right:0.5rem; z-index:2; backdrop-filter:blur(4px);">${p.status || 'Active'}</span>
            </div>
            <div style="padding:1rem; flex:1; display:flex; flex-direction:column;">
              <h3 style="margin:0 0 0.25rem; font-size:1rem; font-weight:700;">${p.title}</h3>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.5rem;">📅 ${p.scheduledDate || 'TBD'} ${p.scheduledTime || ''}</div>
              <div style="font-size:0.8rem; color:var(--text-2); max-height:60px; overflow-y:auto; white-space:pre-wrap; background:rgba(0,0,0,0.2); padding:0.5rem; border-radius:8px;">${p.caption || 'No caption provided.'}</div>
            </div>
          </div>
        `;
      }).join('') || `<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">No posts scheduled</div>`}
    </div>
  `;
};
