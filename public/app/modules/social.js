/**
 * public/app/modules/social.js
 * Social Media Planner & Review Hub View Module
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.social = async function(container) {
  let postsData = [];

  async function loadPosts() {
    postsData = await APP_API.get('/posts').catch(() => []);
    renderSocialPlanner();
  }

  function renderSocialPlanner() {
    const drafts = postsData.filter(p => p.status === 'Draft' || p.status === 'Pending Draft');
    const internal = postsData.filter(p => p.status === 'Internal Review');
    const client = postsData.filter(p => p.status === 'Pending Client Approval' || p.status === 'Client Review');
    const approved = postsData.filter(p => p.status === 'Approved' || p.status === 'Scheduled');

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            📱 Social Media Planner
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Manage social content calendar, draft copywriting, and client review workflows.
          </div>
        </div>
        <button class="btn-primary" onclick="window.SOCIAL_MODULE.openPostModal()">+ Draft New Post</button>
      </div>

      <!-- 4-Column Content Pipeline -->
      <div style="display:grid; grid-template-columns: repeat(4, minmax(260px, 1fr)); gap:1.25rem;">
        
        <!-- Drafts -->
        <div style="background:var(--surface-1); border:1px solid var(--border-subtle); border-radius:16px; padding:1.1rem; min-height:480px; display:flex; flex-direction:column; gap:0.85rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:var(--text-secondary);">
            <span>📝 Drafts & Concepts</span>
            <span class="badge badge-gray">${drafts.length}</span>
          </div>
          ${renderPostCards(drafts)}
        </div>

        <!-- Internal Review -->
        <div style="background:var(--surface-1); border:1px solid var(--border-subtle); border-radius:16px; padding:1.1rem; min-height:480px; display:flex; flex-direction:column; gap:0.85rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:var(--purple-light);">
            <span>👁️ Internal QC</span>
            <span class="badge badge-purple">${internal.length}</span>
          </div>
          ${renderPostCards(internal)}
        </div>

        <!-- Client Approval -->
        <div style="background:var(--surface-1); border:1px solid var(--border-subtle); border-radius:16px; padding:1.1rem; min-height:480px; display:flex; flex-direction:column; gap:0.85rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:var(--amber-brand);">
            <span>💬 Client Review</span>
            <span class="badge badge-amber">${client.length}</span>
          </div>
          ${renderPostCards(client)}
        </div>

        <!-- Approved / Scheduled -->
        <div style="background:var(--surface-1); border:1px solid var(--border-subtle); border-radius:16px; padding:1.1rem; min-height:480px; display:flex; flex-direction:column; gap:0.85rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-weight:800; font-size:0.85rem; color:var(--emerald-brand);">
            <span>🚀 Approved & Scheduled</span>
            <span class="badge badge-emerald">${approved.length}</span>
          </div>
          ${renderPostCards(approved)}
        </div>

      </div>

      <!-- New Post Modal -->
      <div class="modal-overlay" id="postModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <h2 style="color:#fff; font-size:1.2rem; margin:0;">📱 Draft New Social Post</h2>
            <button onclick="window.SOCIAL_MODULE.closePostModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div class="form-group">
            <label class="form-label">Client Name</label>
            <input type="text" id="spClient" class="form-input" placeholder="e.g. BD Group Retail">
          </div>

          <div style="display:flex; gap:1rem;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Platform</label>
              <select id="spPlatform" class="form-select">
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="TikTok">TikTok</option>
              </select>
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Scheduled Date</label>
              <input type="date" id="spDate" class="form-input">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Post Title</label>
            <input type="text" id="spTitle" class="form-input" placeholder="e.g. Independence Day Special Reel">
          </div>

          <div class="form-group">
            <label class="form-label">Caption / Copywriting</label>
            <textarea id="spCaption" class="form-textarea" rows="3" placeholder="Write full copy here..."></textarea>
          </div>

          <button class="btn-primary" style="width:100%; margin-top:0.5rem;" onclick="window.SOCIAL_MODULE.submitPost()">🚀 Submit Post for Review</button>
        </div>
      </div>
    `;
  }

  function renderPostCards(list) {
    if (!list || list.length === 0) {
      return `<div style="text-align:center; color:var(--text-dim); padding:2rem; font-size:0.8rem;">No posts in stage</div>`;
    }
    return list.map(p => `
      <div class="card-glass" style="padding:0.9rem; display:flex; flex-direction:column; gap:0.5rem;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="badge badge-purple">${p.platform || 'Facebook'}</span>
          <span style="font-size:0.72rem; color:var(--text-dim);">${p.scheduledDate || 'TBD'}</span>
        </div>
        <div style="font-weight:700; color:var(--text-primary); font-size:0.9rem;">${p.title}</div>
        <div style="font-size:0.78rem; color:var(--text-muted); line-height:1.4;">${p.caption || 'No copy written yet'}</div>
        <div style="font-size:0.75rem; color:var(--purple-light); font-weight:600; margin-top:0.2rem;">🏢 Client: ${p.clientName || 'General'}</div>
      </div>
    `).join('');
  }

  window.SOCIAL_MODULE = {
    openPostModal() {
      document.getElementById('postModal').classList.add('active');
    },
    closePostModal() {
      document.getElementById('postModal').classList.remove('active');
    },
    async submitPost() {
      const clientName = document.getElementById('spClient').value.trim() || 'General Client';
      const platform = document.getElementById('spPlatform').value;
      const title = document.getElementById('spTitle').value.trim();
      const caption = document.getElementById('spCaption').value.trim();
      const scheduledDate = document.getElementById('spDate').value || new Date().toISOString().split('T')[0];

      if (!title) return alert('Please enter post title.');

      try {
        const res = await APP_API.post('/posts', {
          clientName,
          platform,
          title,
          caption,
          scheduledDate,
          scheduledTime: '18:00',
          status: 'Pending Client Approval'
        });
        if (res.success || res.id) {
          this.closePostModal();
          showToast('Social post draft created!');
          loadPosts();
        }
      } catch (err) {
        showToast('Failed to create post', 'error');
      }
    }
  };

  await loadPosts();
};
