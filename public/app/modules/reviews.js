/**
 * public/app/modules/reviews.js
 * Client Review Room & Creative Proofing Hub Module
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.reviews = async function(container) {
  let reviewsList = [];
  let activeFilter = 'all';

  async function initView() {
    renderSkeleton();
    await loadData();
  }

  function renderSkeleton() {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            🎬 Client Review Room & Proofing Hub
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Monitor active video commercial cuts, graphic design proofs, client feedback timestamp markers, and approvals.
          </div>
        </div>
        <a href="/reviewroom.html" target="_blank" class="btn-primary" style="text-decoration:none;">🚀 Launch Live Review Room</a>
      </div>

      <!-- Filter Bar -->
      <div style="display:flex; gap:0.5rem; background:var(--surface-1); padding:0.35rem; border-radius:12px; border:1px solid var(--border-subtle); width:fit-content; margin-bottom:1.5rem;">
        <button class="btn-ghost ${activeFilter === 'all' ? 'btn-secondary' : ''}" onclick="window.REVIEWS_MODULE.filter('all')">All Media (${reviewsList.length})</button>
        <button class="btn-ghost ${activeFilter === 'video' ? 'btn-secondary' : ''}" onclick="window.REVIEWS_MODULE.filter('video')">📹 Video TVC & Reels</button>
        <button class="btn-ghost ${activeFilter === 'graphic' ? 'btn-secondary' : ''}" onclick="window.REVIEWS_MODULE.filter('graphic')">🎨 Graphic Proofs</button>
      </div>

      <!-- Review Items Grid -->
      <div id="reviewsGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem;">
        <div style="color: var(--text-muted); padding: 2rem;">Loading active review projects...</div>
      </div>
    `;
  }

  async function loadData() {
    try {
      const res = await APP_API.get('/reviews').catch(() => []);
      reviewsList = Array.isArray(res) ? res : [];
      renderGrid();
    } catch (err) {
      console.error('[Reviews Module] Load error:', err);
    }
  }

  function renderGrid() {
    const grid = document.getElementById('reviewsGrid');
    if (!grid) return;

    let items = reviewsList;
    if (activeFilter === 'video') items = items.filter(r => (r.mediaType || r.media_type || '').includes('video'));
    if (activeFilter === 'graphic') items = items.filter(r => !(r.mediaType || r.media_type || '').includes('video'));

    if (items.length === 0) {
      grid.innerHTML = `<div style="color: var(--text-muted); padding: 2.5rem; text-align: center; grid-column: 1/-1;">No review room projects found for this filter.</div>`;
      return;
    }

    grid.innerHTML = items.map(r => {
      const title = r.projectName || r.project_name || r.title || 'Creative Project';
      const version = r.activeVersion || r.active_version || 'v1.0';
      const mediaType = r.mediaType || r.media_type || 'Video Cut';
      const unresolved = r.unresolvedCount || r.totalCount || 0;
      const clientName = r.clientName || r.client_name || 'Client Account';
      const id = r.id || r.projectId || '1';

      return `
        <div class="card-glass" style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.6rem;">
              <span class="badge badge-purple">${escapeHTML(mediaType)}</span>
              <span class="badge ${unresolved > 0 ? 'badge-amber' : 'badge-emerald'}">${unresolved > 0 ? `💬 ${unresolved} Feedback` : '✅ Approved'}</span>
            </div>

            <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.2rem;">${escapeHTML(title)}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.8rem;">Client: <strong style="color:var(--text-secondary);">${escapeHTML(clientName)}</strong> • Version: <strong style="color:var(--purple-light);">${escapeHTML(version)}</strong></div>

            <!-- Preview Card Box -->
            <div style="background: rgba(0,0,0,0.4); border-radius: 10px; border: 1px solid var(--border-subtle); height: 130px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; position: relative; overflow: hidden;">
              ${r.posterUrl || r.poster_url ? `<img src="${r.posterUrl || r.poster_url}" style="width:100%; height:100%; object-fit:cover;" />` : `<div style="font-size: 2rem;">🎬</div>`}
              <div style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.7); color: #fff; font-size: 0.68rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 6px;">Frame.io Sync Ready</div>
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem;">
            <a href="/reviewroom.html?id=${id}" target="_blank" class="btn-primary btn-sm" style="flex: 1; text-decoration:none; text-align:center;">
              🔍 Open Review Room
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  window.REVIEWS_MODULE = {
    filter(f) {
      activeFilter = f;
      renderGrid();
    }
  };

  await initView();
};
