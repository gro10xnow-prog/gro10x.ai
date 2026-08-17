/**
 * public/app/modules/reviews.js
 * Client Review Room & Creative Proofing Hub — Admin Dashboard
 * v2.0 — Full rebuild with KPI tiles, correct field mapping, live SSE, create modal
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.reviews = async function(container) {
  let reviewsList = [];
  let activeFilter = 'all';
  let sseUnsubscribe = null;

  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function getStatusInfo(r) {
    if (r.isApproved || r.status === 'approved') return { label: '✅ Approved', cls: 'badge-emerald', color: '#10b981' };
    if (r.status === 'revision_requested') return { label: '🔴 Revision Requested', cls: 'badge-pink', color: '#ef4444' };
    return { label: '⏳ Awaiting Approval', cls: 'badge-amber', color: '#f59e0b' };
  }

  function renderSkeleton() {
    container.innerHTML = `
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size:1.6rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">🎬 Client Review Room & Proofing Hub</h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">Monitor active deliverables, client feedback, revision status, and approval sign-offs.</div>
        </div>
        <div style="display:flex; gap:0.75rem; align-items:center;">
          <button class="btn-secondary btn-sm" onclick="window.REVIEWS_MODULE.openNewReviewModal()">+ New Review Project</button>
          <a href="/reviewroom.html" target="_blank" class="btn-primary" style="text-decoration:none; font-size:0.85rem;">🚀 Open Review Room</a>
        </div>
      </div>

      <!-- KPI Tiles -->
      <div class="review-kpi-row" id="reviewKpiRow">
        <div class="kpi-tile"><div class="kpi-label">Total Projects</div><div class="kpi-val" id="kpiTotal">—</div></div>
        <div class="kpi-tile"><div class="kpi-label">⏳ Awaiting Approval</div><div class="kpi-val" id="kpiPending">—</div></div>
        <div class="kpi-tile"><div class="kpi-label">🔴 Revision Requested</div><div class="kpi-val" id="kpiRevision">—</div></div>
        <div class="kpi-tile"><div class="kpi-label">✅ Approved</div><div class="kpi-val" id="kpiApproved">—</div></div>
      </div>

      <!-- Filter Pills -->
      <div class="review-filter-pills">
        <button class="r-pill active" id="pill-all" onclick="window.REVIEWS_MODULE.filter('all')">All Media</button>
        <button class="r-pill" id="pill-video" onclick="window.REVIEWS_MODULE.filter('video')">📹 Video</button>
        <button class="r-pill" id="pill-image" onclick="window.REVIEWS_MODULE.filter('image')">🎨 Graphic / Image</button>
        <button class="r-pill" id="pill-pdf" onclick="window.REVIEWS_MODULE.filter('pdf')">📄 PDF / Doc</button>
      </div>

      <!-- Grid -->
      <div class="review-grid" id="reviewsGrid">
        <div style="color:var(--text-muted); padding:2rem; grid-column:1/-1; text-align:center;">Loading review projects...</div>
      </div>

      <!-- New Review Project Modal -->
      <div class="modal-overlay" id="newReviewModal">
        <div class="modal-box" style="max-width:520px;">
          <div class="modal-header">
            <h3 style="margin:0; font-family:var(--font-heading);">+ New Review Room Project</h3>
            <button class="modal-close" onclick="window.REVIEWS_MODULE.closeNewReviewModal()">✕</button>
          </div>
          <div class="modal-body" style="display:flex; flex-direction:column; gap:0.85rem;">
            <div class="form-group">
              <label class="form-label">Project Name *</label>
              <input type="text" id="nrProjectName" class="input-text" placeholder="e.g. Chillox TVC Master Cut v2">
            </div>
            <div class="form-group">
              <label class="form-label">Client Name *</label>
              <input type="text" id="nrClient" class="input-text" placeholder="e.g. Chillox Fast Food Chain">
            </div>
            <div class="form-group">
              <label class="form-label">Media Type</label>
              <select id="nrMediaType" class="input-text">
                <option value="video">🎬 Video Cut / TVC</option>
                <option value="image">🎨 Graphic / Image Proof</option>
                <option value="pdf">📄 PDF / Document</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Media URL (optional — can upload later)</label>
              <input type="url" id="nrMediaUrl" class="input-text" placeholder="https://...">
            </div>
            <div class="form-group">
              <label class="form-label">Linked Task ID (optional)</label>
              <input type="text" id="nrTaskId" class="input-text" placeholder="TSK-XXXXXXXX">
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:0.75rem; padding:1rem 1.5rem; border-top:1px solid var(--border-subtle);">
            <button class="btn-secondary" onclick="window.REVIEWS_MODULE.closeNewReviewModal()">Cancel</button>
            <button class="btn-primary" id="nrSubmitBtn" onclick="window.REVIEWS_MODULE.submitNewReview()">🎬 Create Review Project</button>
          </div>
        </div>
      </div>
    `;
  }

  async function loadData() {
    try {
      const res = await APP_API.get('/reviews').catch(() => []);
      reviewsList = Array.isArray(res) ? res : [];
      renderKpis();
      renderGrid();
    } catch (err) {
      const grid = document.getElementById('reviewsGrid');
      if (grid) grid.innerHTML = `<div style="color:#ef4444; padding:2rem; grid-column:1/-1; text-align:center;">⚠️ Failed to load reviews. <button class="btn-secondary btn-sm" onclick="window.REVIEWS_MODULE.reload()" style="margin-left:0.5rem;">Retry</button></div>`;
    }
  }

  function renderKpis() {
    const total = reviewsList.length;
    const pending = reviewsList.filter(r => !r.isApproved && r.status !== 'revision_requested').length;
    const revision = reviewsList.filter(r => r.status === 'revision_requested').length;
    const approved = reviewsList.filter(r => r.isApproved || r.status === 'approved').length;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('kpiTotal', total);
    set('kpiPending', pending);
    set('kpiRevision', revision);
    set('kpiApproved', approved);
  }

  function renderGrid() {
    const grid = document.getElementById('reviewsGrid');
    if (!grid) return;

    let items = reviewsList;
    if (activeFilter === 'video') items = items.filter(r => (r.mediaType || '').includes('video'));
    if (activeFilter === 'image') items = items.filter(r => (r.mediaType || '').includes('image') || (r.mediaType || '').includes('graphic'));
    if (activeFilter === 'pdf') items = items.filter(r => (r.mediaType || '').includes('pdf') || (r.mediaType || '').includes('doc'));

    // Update pill active state
    ['all','video','image','pdf'].forEach(f => {
      const p = document.getElementById(`pill-${f}`);
      if (p) p.classList.toggle('active', f === activeFilter);
    });

    if (items.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:4rem 2rem; color:var(--text-muted);">
          <div style="font-size:3rem; margin-bottom:1rem;">🎬</div>
          <div style="font-size:1.1rem; font-weight:700; color:var(--text-primary); margin-bottom:0.5rem;">No Review Projects Found</div>
          <div style="font-size:0.85rem; margin-bottom:1.5rem;">Review room projects are created automatically when a Kanban task enters the "Client Review" stage, or you can create one manually.</div>
          <button class="btn-primary" onclick="window.REVIEWS_MODULE.openNewReviewModal()">+ Create First Review Project</button>
        </div>`;
      return;
    }

    grid.innerHTML = items.map(r => {
      const title = escapeHTML(r.projectName || 'Creative Project');
      const client = escapeHTML(r.clientName || r.client || 'Client Account');
      const version = escapeHTML(r.activeVersion || 'v1');
      const mediaType = escapeHTML(r.mediaType || 'video');
      const unresolved = r.unresolvedCount || 0;
      const statusInfo = getStatusInfo(r);
      const hasThumb = !!(r.posterUrl || r.mediaUrl);
      const thumbSrc = r.posterUrl || (r.mediaType?.includes('video') ? '' : r.mediaUrl) || '';
      const mediaIcon = r.mediaType?.includes('image') ? '🖼️' : r.mediaType?.includes('pdf') ? '📄' : '🎬';
      const reviewUrl = `/reviewroom.html?id=${r.id}`;

      return `
        <div class="review-card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <span class="badge badge-purple" style="font-size:0.72rem;">${mediaIcon} ${mediaType}</span>
            <span class="badge ${statusInfo.cls}" style="font-size:0.72rem;">${statusInfo.label}</span>
          </div>

          <div>
            <div style="font-size:1.05rem; font-weight:800; color:var(--text-primary); margin-bottom:0.2rem; line-height:1.3;">${title}</div>
            <div style="font-size:0.78rem; color:var(--text-muted);">
              Client: <strong style="color:var(--text-secondary);">${client}</strong>
              · Version: <strong style="color:var(--purple-light);">${version}</strong>
              ${r.taskId ? `· <span style="color:var(--text-dim); font-size:0.72rem;">Task: ${escapeHTML(r.taskId)}</span>` : ''}
            </div>
          </div>

          <!-- Preview Thumbnail -->
          <div class="review-card-thumb">
            ${thumbSrc ? `<img src="${escapeHTML(thumbSrc)}" alt="Preview" loading="lazy">` : `<div style="font-size:2.5rem; opacity:0.5;">${mediaIcon}</div>`}
            ${unresolved > 0 ? `<div style="position:absolute; top:8px; right:8px; background:rgba(245,158,11,0.9); color:#000; font-size:0.7rem; font-weight:800; padding:0.2rem 0.45rem; border-radius:6px;">💬 ${unresolved} Open</div>` : ''}
          </div>

          <!-- Stats Row -->
          <div style="display:flex; gap:1rem; font-size:0.75rem; color:var(--text-muted);">
            <span>Total Feedback: <strong style="color:var(--text-primary);">${r.totalCount || 0}</strong></span>
            <span>Resolved: <strong style="color:#10b981;">${r.resolvedCount || 0}</strong></span>
            ${r.approvedAt ? `<span style="color:#10b981;">Approved: <strong>${new Date(r.approvedAt).toLocaleDateString()}</strong></span>` : ''}
            ${r.revisionRequestedAt && !r.approvedAt ? `<span style="color:#ef4444;">Revision: <strong>${new Date(r.revisionRequestedAt).toLocaleDateString()}</strong></span>` : ''}
          </div>

          <!-- Actions -->
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <a href="${reviewUrl}" target="_blank" class="btn-primary btn-sm" style="flex:1; text-decoration:none; text-align:center; font-size:0.8rem;">🔍 Open Review Room</a>
            <button class="btn-secondary btn-sm" style="font-size:0.8rem;" onclick="navigator.clipboard.writeText(window.location.origin + '${reviewUrl}'); window.showToast && window.showToast('Review link copied!', 'success')">📋 Copy Link</button>
          </div>

          ${r.revisionNotes ? `<div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:8px; padding:0.6rem; font-size:0.75rem; color:#fca5a5;">📝 <strong>Revision Notes:</strong> ${escapeHTML(r.revisionNotes)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  // Subscribe to SSE live updates
  function subscribeSSE() {
    if (window.APP_SSE && window.APP_SSE.subscribe) {
      sseUnsubscribe = window.APP_SSE.subscribe('review_update', (updatedReviews) => {
        if (Array.isArray(updatedReviews)) {
          reviewsList = updatedReviews;
          renderKpis();
          renderGrid();
        }
      });
    }
  }

  window.REVIEWS_MODULE = {
    filter(f) {
      activeFilter = f;
      renderGrid();
    },
    reload() { loadData(); },
    openNewReviewModal() {
      document.getElementById('newReviewModal').classList.add('active');
    },
    closeNewReviewModal() {
      document.getElementById('newReviewModal').classList.remove('active');
    },
    async submitNewReview() {
      const name = document.getElementById('nrProjectName')?.value.trim();
      const client = document.getElementById('nrClient')?.value.trim();
      if (!name || !client) {
        window.showToast && window.showToast('Project name and client are required', 'error');
        return;
      }
      const btn = document.getElementById('nrSubmitBtn');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Creating...'; }

      try {
        const payload = {
          projectName: name,
          client,
          mediaType: document.getElementById('nrMediaType')?.value || 'video',
          mediaUrl: document.getElementById('nrMediaUrl')?.value.trim() || '',
          taskId: document.getElementById('nrTaskId')?.value.trim() || undefined
        };
        await APP_API.post('/reviews', payload);
        window.showToast && window.showToast('🎬 Review Room project created!', 'success');
        this.closeNewReviewModal();
        loadData();
      } catch (err) {
        if (btn) { btn.disabled = false; btn.textContent = '🎬 Create Review Project'; }
        window.showToast && window.showToast('Failed: ' + err.message, 'error');
      }
    }
  };

  renderSkeleton();
  await loadData();
  subscribeSSE();
};
