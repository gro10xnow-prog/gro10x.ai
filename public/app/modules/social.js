/**
 * public/app/modules/social.js
 * Social Media Planner & Content Pipeline Module
 * v2.0 — Full Rebuild with KPI tiles, CRM client dropdown, character counter, stage advance controls, error states, and live SSE
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.social = async function(container) {
  let postsData = [];
  let clientsData = [];
  let isLoading = true;
  let hasError = false;

  const PLATFORM_ICONS = {
    Facebook: '📘',
    Instagram: '📸',
    LinkedIn: '💼',
    TikTok: '🎵',
    Twitter: '🐦',
    YouTube: '🎬'
  };

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  async function loadInitialData() {
    isLoading = true;
    hasError = false;
    renderSkeleton();

    try {
      const [postsRes, clientsRes] = await Promise.all([
        APP_API.get('/posts').catch(() => []),
        APP_API.get('/clients').catch(() => [])
      ]);
      postsData = Array.isArray(postsRes) ? postsRes : [];
      clientsData = Array.isArray(clientsRes) ? clientsRes : [];
      isLoading = false;
      renderContent();
    } catch (err) {
      console.error('[Social Module] Failed to load data:', err);
      isLoading = false;
      postsData = [];
      clientsData = [];
      renderContent();
    }
  }

  let activePlatformFilter = 'all';

  const PLATFORM_LIMITS = {
    Facebook: 63000,
    Instagram: 2200,
    LinkedIn: 3000,
    TikTok: 2200,
    Twitter: 280,
    YouTube: 5000
  };

  function renderSkeleton() {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            📱 Social Media Planner
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Manage social content calendar, draft copy, client reviews, and scheduled publishing dispatches.
          </div>
        </div>
        <button class="btn-primary" onclick="window.SOCIAL_MODULE.openPostModal()">+ Draft New Post</button>
      </div>

      <!-- KPI summary bar -->
      <div class="social-kpi-row" id="socialKpiRow">
        <div class="kpi-tile"><div class="kpi-label">Total Posts</div><div class="kpi-val" id="kpiTotal">...</div></div>
        <div class="kpi-tile"><div class="kpi-label">📝 In Pipeline</div><div class="kpi-val" id="kpiPipeline">...</div></div>
        <div class="kpi-tile"><div class="kpi-label">💬 Client Review</div><div class="kpi-val" id="kpiReview">...</div></div>
        <div class="kpi-tile"><div class="kpi-label">🚀 Approved / Ready</div><div class="kpi-val" id="kpiApproved">...</div></div>
      </div>

      <!-- Platform Filter Pills -->
      <div class="review-filter-pills" style="margin-bottom:1.5rem;">
        <button class="r-pill active" id="sp-pill-all" onclick="window.SOCIAL_MODULE.filterPlatform('all')">All Platforms</button>
        <button class="r-pill" id="sp-pill-Facebook" onclick="window.SOCIAL_MODULE.filterPlatform('Facebook')">📘 Facebook</button>
        <button class="r-pill" id="sp-pill-Instagram" onclick="window.SOCIAL_MODULE.filterPlatform('Instagram')">📸 Instagram</button>
        <button class="r-pill" id="sp-pill-LinkedIn" onclick="window.SOCIAL_MODULE.filterPlatform('LinkedIn')">💼 LinkedIn</button>
        <button class="r-pill" id="sp-pill-TikTok" onclick="window.SOCIAL_MODULE.filterPlatform('TikTok')">🎵 TikTok</button>
        <button class="r-pill" id="sp-pill-Twitter" onclick="window.SOCIAL_MODULE.filterPlatform('Twitter')">🐦 Twitter / X</button>
        <button class="r-pill" id="sp-pill-YouTube" onclick="window.SOCIAL_MODULE.filterPlatform('YouTube')">🎬 YouTube</button>
      </div>

      <div id="socialBoardContainer">
        <div style="padding: 3rem; text-align: center; color: var(--text-muted);">Loading social media content board...</div>
      </div>

      <!-- Draft / Edit Post Modal -->
      <div class="modal-overlay" id="postModal">
        <div class="modal-box" style="max-width: 520px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
            <h2 style="color:#fff; font-size:1.2rem; margin:0; font-family:var(--font-heading);" id="postModalTitle">📱 Draft New Social Post</h2>
            <button onclick="window.SOCIAL_MODULE.closePostModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <form onsubmit="window.SOCIAL_MODULE.handleFormSubmit(event)" style="display:flex; flex-direction:column; gap:0.9rem;">
            <input type="hidden" id="spEditId" value="">

            <div class="form-group">
              <label class="form-label">Client Account *</label>
              <select id="spClientSelect" class="input-text" required onchange="window.SOCIAL_MODULE.syncClientName(this)">
                <option value="">-- Select Client from CRM --</option>
              </select>
              <input type="hidden" id="spClientName" value="">
            </div>

            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Platform</label>
                <select id="spPlatform" class="input-text" onchange="window.SOCIAL_MODULE.onPlatformChange(this)">
                  <option value="Facebook">📘 Facebook</option>
                  <option value="Instagram">📸 Instagram</option>
                  <option value="LinkedIn">💼 LinkedIn</option>
                  <option value="TikTok">🎵 TikTok</option>
                  <option value="Twitter">🐦 Twitter / X</option>
                  <option value="YouTube">🎬 YouTube</option>
                </select>
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Scheduled Date</label>
                <input type="date" id="spDate" class="input-text">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Post Title / Topic *</label>
              <input type="text" id="spTitle" class="input-text" placeholder="e.g. Independence Day Special Offer Reel" required>
            </div>

            <div class="form-group">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <label class="form-label">Caption / Copywriting</label>
                <span id="captionCharCount" style="font-size:0.75rem; color:var(--text-dim);">0 / 2,200</span>
              </div>
              <textarea id="spCaption" class="input-text" rows="4" placeholder="Write post copy here..." oninput="window.SOCIAL_MODULE.updateCharCount(this)"></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Hashtags (comma separated)</label>
              <input type="text" id="spHashtags" class="input-text" placeholder="#PurpleBot #DigitalMarketing #Creative">
            </div>

            <div class="form-group">
              <label class="form-label">Media Asset URL (optional)</label>
              <input type="url" id="spMediaUrl" class="input-text" placeholder="https://...">
            </div>

            <div style="display:flex; gap:0.75rem; justify-content:flex-end; margin-top:0.5rem;">
              <button type="button" class="btn-secondary" onclick="window.SOCIAL_MODULE.closePostModal()">Cancel</button>
              <button type="submit" class="btn-primary" id="spSubmitBtn">🚀 Save & Submit Draft</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function renderErrorState(message) {
    const board = document.getElementById('socialBoardContainer');
    if (board) {
      board.innerHTML = `
        <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:16px; padding:3rem; text-align:center; color:#fca5a5;">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">⚠️</div>
          <div style="font-size:1.1rem; font-weight:700; color:#fff; margin-bottom:0.4rem;">Error Loading Social Planner</div>
          <div style="font-size:0.85rem; margin-bottom:1.5rem;">${escapeHTML(message)}</div>
          <button class="btn-primary" onclick="window.SOCIAL_MODULE.reload()">🔄 Retry Loading</button>
        </div>
      `;
    }
  }

  function renderContent() {
    renderKPIs();
    renderBoard();
    populateClientDropdown();
  }

  function renderKPIs() {
    const total = postsData.length;
    const pipeline = postsData.filter(p => p.status === 'Draft' || p.status === 'Internal QC' || p.status === 'Internal Review').length;
    const review = postsData.filter(p => p.status === 'Pending Client Approval' || p.status === 'Client Review' || p.status === 'Revision Requested').length;
    const approved = postsData.filter(p => p.status === 'Approved' || p.status === 'Scheduled' || p.status === 'Due Today').length;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('kpiTotal', total);
    set('kpiPipeline', pipeline);
    set('kpiReview', review);
    set('kpiApproved', approved);
  }

  function renderBoard() {
    const board = document.getElementById('socialBoardContainer');
    if (!board) return;

    let filteredPosts = postsData;
    if (activePlatformFilter !== 'all') {
      filteredPosts = postsData.filter(p => (p.platform || '').toLowerCase() === activePlatformFilter.toLowerCase());
    }

    // Update active pill state
    ['all', 'Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'Twitter', 'YouTube'].forEach(plat => {
      const pill = document.getElementById(`sp-pill-${plat}`);
      if (pill) pill.classList.toggle('active', plat === activePlatformFilter);
    });

    const drafts = filteredPosts.filter(p => p.status === 'Draft' || p.status === 'Pending Draft');
    const internal = filteredPosts.filter(p => p.status === 'Internal QC' || p.status === 'Internal Review');
    const client = filteredPosts.filter(p => p.status === 'Pending Client Approval' || p.status === 'Client Review' || p.status === 'Revision Requested');
    const approved = filteredPosts.filter(p => p.status === 'Approved' || p.status === 'Scheduled' || p.status === 'Due Today');

    board.innerHTML = `
      <div class="social-board">
        <!-- Col 1: Drafts -->
        <div class="social-col">
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:var(--text-secondary);">
            <span>📝 Drafts & Concepts</span>
            <span class="badge badge-gray">${drafts.length}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.85rem; flex:1;">
            ${renderColumnCards(drafts, 'draft')}
          </div>
        </div>

        <!-- Col 2: Internal QC -->
        <div class="social-col">
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:var(--purple-light);">
            <span>👁️ Internal QC</span>
            <span class="badge badge-purple">${internal.length}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.85rem; flex:1;">
            ${renderColumnCards(internal, 'internal')}
          </div>
        </div>

        <!-- Col 3: Client Review -->
        <div class="social-col">
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:var(--amber-brand);">
            <span>💬 Client Review</span>
            <span class="badge badge-amber">${client.length}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.85rem; flex:1;">
            ${renderColumnCards(client, 'client')}
          </div>
        </div>

        <!-- Col 4: Approved & Scheduled -->
        <div class="social-col">
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:var(--emerald-brand);">
            <span>🚀 Approved & Scheduled</span>
            <span class="badge badge-emerald">${approved.length}</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:0.85rem; flex:1;">
            ${renderColumnCards(approved, 'approved')}
          </div>
        </div>
      </div>
    `;
  }

  function renderColumnCards(list, stageKey) {
    if (!list || list.length === 0) {
      return `<div style="text-align:center; color:var(--text-dim); padding:2.5rem 1rem; font-size:0.8rem; border:1px dashed var(--border-subtle); border-radius:12px; height:100%; display:flex; align-items:center; justify-content:center;">No posts in stage</div>`;
    }

    return list.map(p => {
      const icon = PLATFORM_ICONS[p.platform] || '📱';
      const isRevision = p.status === 'Revision Requested';
      const hasMedia = Array.isArray(p.mediaUrls) && p.mediaUrls.length > 0;
      const mediaThumb = hasMedia ? p.mediaUrls[0] : null;

      return `
        <div class="post-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="badge badge-purple" style="font-size:0.72rem;">${icon} ${escapeHTML(p.platform)}</span>
            <span style="font-size:0.72rem; color:var(--text-dim);">📅 ${escapeHTML(p.scheduledDate || 'TBD')}</span>
          </div>

          <div style="font-weight:700; color:var(--text-primary); font-size:0.92rem; line-height:1.3;">
            ${escapeHTML(p.title)}
          </div>

          ${mediaThumb ? `
            <div style="height:100px; border-radius:8px; overflow:hidden; background:rgba(0,0,0,0.3); border:1px solid var(--border-subtle);">
              <img src="${escapeHTML(mediaThumb)}" style="width:100%; height:100%; object-fit:cover;" alt="Media Thumbnail">
            </div>
          ` : ''}

          <div style="font-size:0.78rem; color:var(--text-muted); line-height:1.4; white-space:pre-wrap; max-height:80px; overflow:hidden; text-overflow:ellipsis;">
            ${escapeHTML(p.caption || 'No copy written yet')}
          </div>

          ${p.hashtags ? `<div style="font-size:0.72rem; color:var(--purple-light); opacity:0.9;">${escapeHTML(p.hashtags)}</div>` : ''}

          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; margin-top:0.2rem;">
            <span style="color:var(--text-secondary); font-weight:600;">🏢 ${escapeHTML(p.clientName || 'General Client')}</span>
            ${isRevision ? `<span class="badge badge-pink" style="font-size:0.68rem;">🔴 Revision</span>` : ''}
          </div>

          ${p.clientFeedback ? `
            <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:6px; padding:0.4rem 0.6rem; font-size:0.72rem; color:#fca5a5;">
              💬 <strong>Feedback:</strong> ${escapeHTML(p.clientFeedback)}
            </div>
          ` : ''}

          <!-- Contextual Stage Controls -->
          <div class="post-card-actions">
            ${renderCardButtons(p, stageKey)}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderCardButtons(p, stageKey) {
    let btns = '';

    if (stageKey === 'draft') {
      btns += `<button class="btn-primary btn-sm" style="font-size:0.72rem; flex:1;" onclick="window.SOCIAL_MODULE.updatePostStatus('${p.id}', 'Internal QC')">▶ Send to Internal QC</button>`;
    } else if (stageKey === 'internal') {
      btns += `<button class="btn-primary btn-sm" style="font-size:0.72rem; flex:1;" onclick="window.SOCIAL_MODULE.updatePostStatus('${p.id}', 'Pending Client Approval')">▶ Send to Client Review</button>`;
    } else if (stageKey === 'client') {
      btns += `
        <button class="btn-emerald btn-sm" style="font-size:0.72rem; flex:1;" onclick="window.SOCIAL_MODULE.approvePost('${p.id}')">✅ Approve</button>
        <button class="btn-secondary btn-sm" style="font-size:0.72rem; color:#fca5a5;" onclick="window.SOCIAL_MODULE.promptRejectPost('${p.id}')">🔴 Request Revisions</button>
      `;
    } else if (stageKey === 'approved') {
      btns += `<button class="btn-secondary btn-sm" style="font-size:0.72rem; flex:1;" onclick="window.SOCIAL_MODULE.copyPostContent('${p.id}')">📋 Copy Copy & Tags</button>`;
    }

    // Always include Edit and Delete icon buttons
    btns += `
      <button class="btn-secondary btn-sm" style="padding:0.2rem 0.45rem; font-size:0.75rem;" title="Edit Post" onclick="window.SOCIAL_MODULE.openEditModal('${p.id}')">✏️</button>
      <button class="btn-secondary btn-sm" style="padding:0.2rem 0.45rem; font-size:0.75rem; color:#ef4444;" title="Delete Post" onclick="window.SOCIAL_MODULE.deletePost('${p.id}')">🗑️</button>
    `;

    return btns;
  }

  const DEFAULT_CLIENTS = [];

  function populateClientDropdown() {
    const select = document.getElementById('spClientSelect');
    if (!select) return;

    const list = (Array.isArray(clientsData) && clientsData.length > 0) ? clientsData : DEFAULT_CLIENTS;

    select.innerHTML = '<option value="">-- Select Client from CRM --</option>' + list.map(c => `
      <option value="${c.id}" data-name="${escapeHTML(c.name)}">${escapeHTML(c.name)} (${escapeHTML(c.company || c.brand || c.category || 'Client')})</option>
    `).join('') + '<option value="custom" data-name="General Client">+ General / Manual Client</option>';
  }

  // Subscribe to real-time updates via SSE
  let sseUnsub = null;
  if (window.APP_SSE && window.APP_SSE.subscribe) {
    sseUnsub = window.APP_SSE.subscribe('post_update', (updatedPosts) => {
      if (Array.isArray(updatedPosts)) {
        postsData = updatedPosts;
        renderKPIs();
        renderBoard();
      }
    });
  }

  window.SOCIAL_MODULE = {
    reload() {
      loadInitialData();
    },
    filterPlatform(plat) {
      activePlatformFilter = plat;
      renderBoard();
    },
    onPlatformChange(selectEl) {
      const plat = selectEl.value;
      const caption = document.getElementById('spCaption');
      this.updateCharCount(caption || { value: '' }, plat);
    },
    syncClientName(selectEl) {
      const selectedOption = selectEl.options[selectEl.selectedIndex];
      const nameInput = document.getElementById('spClientName');
      if (selectedOption && nameInput) {
        nameInput.value = selectedOption.getAttribute('data-name') || selectedOption.text || 'General Client';
      }
    },
    updateCharCount(textarea, optPlatform) {
      const counter = document.getElementById('captionCharCount');
      if (!counter) return;
      const plat = optPlatform || document.getElementById('spPlatform')?.value || 'Facebook';
      const limit = PLATFORM_LIMITS[plat] || 2200;
      const len = (textarea.value || '').length;
      counter.textContent = `${len.toLocaleString()} / ${limit.toLocaleString()} (${plat})`;
      counter.style.color = len > limit ? '#ef4444' : 'var(--text-dim)';
    },
    copyPostContent(id) {
      const p = postsData.find(post => post.id === id);
      if (!p) return;
      const text = [p.caption, p.hashtags].filter(Boolean).join('\n\n');
      navigator.clipboard.writeText(text);
      if (window.showToast) window.showToast('📋 Post copy and hashtags copied to clipboard!', 'success');
    },
    async openPostModal() {
      if (clientsData.length === 0) {
        try {
          const res = await APP_API.get('/clients').catch(() => []);
          if (Array.isArray(res) && res.length > 0) clientsData = res;
        } catch(e) {}
      }
      populateClientDropdown();
      document.getElementById('spEditId').value = '';
      document.getElementById('postModalTitle').textContent = '📱 Draft New Social Post';
      document.getElementById('spTitle').value = '';
      document.getElementById('spCaption').value = '';
      document.getElementById('spHashtags').value = '';
      document.getElementById('spMediaUrl').value = '';
      document.getElementById('spDate').value = new Date().toISOString().split('T')[0];
      document.getElementById('spClientSelect').value = '';
      document.getElementById('spClientName').value = '';
      this.updateCharCount({ value: '' });

      document.getElementById('postModal').classList.add('active');
    },
    async openEditModal(id) {
      if (clientsData.length === 0) {
        try {
          const res = await APP_API.get('/clients').catch(() => []);
          if (Array.isArray(res) && res.length > 0) clientsData = res;
        } catch(e) {}
      }
      populateClientDropdown();
      const post = postsData.find(p => p.id === id);
      if (!post) return;

      document.getElementById('spEditId').value = post.id;
      document.getElementById('postModalTitle').textContent = '✏️ Edit Social Post Draft';
      document.getElementById('spTitle').value = post.title || '';
      document.getElementById('spCaption').value = post.caption || '';
      document.getElementById('spHashtags').value = post.hashtags || '';
      document.getElementById('spMediaUrl').value = (post.mediaUrls && post.mediaUrls[0]) || '';
      document.getElementById('spDate').value = post.scheduledDate || new Date().toISOString().split('T')[0];
      document.getElementById('spPlatform').value = post.platform || 'Facebook';
      document.getElementById('spClientName').value = post.clientName || '';
      
      const clientSelect = document.getElementById('spClientSelect');
      if (clientSelect) {
        clientSelect.value = post.clientId || '';
      }
      this.updateCharCount({ value: post.caption || '' }, post.platform);

      document.getElementById('postModal').classList.add('active');
    },
    closePostModal() {
      document.getElementById('postModal').classList.remove('active');
    },
    async handleFormSubmit(e) {
      e.preventDefault();
      const editId = document.getElementById('spEditId').value;
      const title = document.getElementById('spTitle').value.trim();
      const caption = document.getElementById('spCaption').value.trim();
      const hashtags = document.getElementById('spHashtags').value.trim();
      const platform = document.getElementById('spPlatform').value;
      const scheduledDate = document.getElementById('spDate').value;
      const clientId = document.getElementById('spClientSelect').value;
      const clientName = document.getElementById('spClientName').value || 'General Client';
      const mediaUrl = document.getElementById('spMediaUrl').value.trim();

      if (!title) {
        if (window.showToast) window.showToast('Please enter a post title.', 'error');
        return;
      }

      const submitBtn = document.getElementById('spSubmitBtn');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Saving...'; }

      try {
        const payload = {
          title,
          caption,
          hashtags,
          platform,
          scheduledDate,
          clientId,
          clientName,
          mediaUrls: mediaUrl ? [mediaUrl] : []
        };

        if (editId) {
          await APP_API.put(`/posts/${editId}`, payload);
          if (window.showToast) window.showToast('Social post updated!', 'success');
        } else {
          payload.status = 'Draft';
          await APP_API.post('/posts', payload);
          if (window.showToast) window.showToast('Social post draft created!', 'success');
        }

        this.closePostModal();
        loadInitialData();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to save post: ' + err.message, 'error');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🚀 Save & Submit Draft'; }
      }
    },
    async updatePostStatus(id, newStatus) {
      try {
        await APP_API.patch(`/posts/${id}/status`, { status: newStatus });
        if (window.showToast) window.showToast(`Post stage updated to "${newStatus}"`, 'success');
        loadInitialData();
      } catch (err) {
        if (window.showToast) window.showToast('Status update failed: ' + err.message, 'error');
      }
    },
    async approvePost(id) {
      try {
        await APP_API.post(`/posts/${id}/approve`, {});
        if (window.showToast) window.showToast('🎉 Social post approved!', 'success');
        loadInitialData();
      } catch (err) {
        if (window.showToast) window.showToast('Approval failed: ' + err.message, 'error');
      }
    },
    async promptRejectPost(id) {
      const feedback = prompt('Describe the revisions needed for this post:');
      if (feedback === null) return;
      try {
        await APP_API.post(`/posts/${id}/reject`, { feedback });
        if (window.showToast) window.showToast('🔴 Revisions requested.', 'info');
        loadInitialData();
      } catch (err) {
        if (window.showToast) window.showToast('Revision request failed: ' + err.message, 'error');
      }
    },
    async deletePost(id) {
      if (!confirm('Are you sure you want to delete this social post draft?')) return;
      try {
        await APP_API.delete(`/posts/${id}`);
        if (window.showToast) window.showToast('Post deleted.', 'info');
        loadInitialData();
      } catch (err) {
        if (window.showToast) window.showToast('Delete failed: ' + err.message, 'error');
      }
    }
  };

  await loadInitialData();
};
