/**
 * public/client/modules/review.js
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};
const escapeHTML = window.escapeHTML || function(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; };

window.CLIENT_MODULES.review = async function(container) {
  let posts = [];
  let activeChangeId = null;

  async function loadReviewPosts() {
    const all = await CLIENT_API.get('/posts').catch(() => []);
    posts = (all || []).filter(p => p.status === 'Pending Client Approval' || p.status === 'Client Review' || p.status === 'Approved' || p.status === 'Changes Requested');
    renderReviewRoom();
  }

  function renderReviewRoom() {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 1.5rem; flex-wrap:wrap; gap:0.75rem;">
        <div>
          <h1 style="font-size: 1.55rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            🎬 Content Review Room
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Stream video cuts, review graphic assets, and sign off or request structured adjustments.
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:0.4rem; background:var(--surface-3); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.4rem 0.75rem; font-size:0.75rem; color:var(--text-secondary);">
          <span>⌨️ <strong>Hotkeys:</strong> Space (Play/Pause) · ←/→ (5s) · <strong>T</strong> (Note)</span>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:1.25rem;">
        ${posts.map(p => {
          const safePlatform = escapeHTML(p.platform || 'Social');
          const safeTitle = escapeHTML(p.title);
          const safeStatus = escapeHTML(p.status);
          const safeCaption = escapeHTML(p.caption || 'No caption provided.');
          const safeVideoUrl = escapeHTML(p.videoUrl || (p.mediaUrls && p.mediaUrls[0]) || '');
          const safeId = escapeHTML(p.id);
          const isApproved = p.status === 'Approved' || p.status === 'Published';
          const isChangesRequested = p.status === 'Changes Requested';
          
          return `
          <div class="card-glass" style="display:flex; flex-direction:column; gap:1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <div>
                <span class="badge badge-purple">${safePlatform}</span>
                <h3 style="font-size:1.1rem; margin:0.3rem 0 0; color:var(--text-primary);">${safeTitle}</h3>
              </div>
              <span class="badge ${isApproved ? 'badge-emerald' : isChangesRequested ? 'badge-amber' : 'badge-pink'}">${safeStatus}</span>
            </div>

            <div style="background:var(--surface-3); padding:0.85rem; border-radius:12px; font-size:0.88rem; color:var(--text-secondary); line-height:1.5;">
              <strong style="color:var(--purple-light); display:block; font-size:0.75rem; text-transform:uppercase; margin-bottom:0.2rem;">Copy / Caption:</strong>
              ${safeCaption}
            </div>

            ${safeVideoUrl ? `
              <div style="border-radius:12px; overflow:hidden; background:#000; text-align:center;">
                ${safeVideoUrl.match(/\.(mp4|webm|mov)($|\?)/i) ? `
                  <video id="vid-${safeId}" controls style="width:100%; max-height:420px; display:block;" src="${safeVideoUrl}"></video>
                ` : safeVideoUrl.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i) ? `
                  <img src="${safeVideoUrl}" loading="lazy" decoding="async" style="max-width:100%; max-height:420px; object-fit:contain;" alt="Deliverable Preview">
                ` : `
                  <div style="padding:1.5rem;">
                    <a href="${safeVideoUrl}" target="_blank" rel="noopener" class="btn-secondary" style="display:inline-flex; align-items:center; gap:0.4rem; text-decoration:none;">
                      ▶ Stream Creative Deliverable / Video Cut
                    </a>
                  </div>
                `}
              </div>
            ` : ''}

            ${!isApproved ? `
              <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
                <button class="btn-primary" style="flex:1; min-width:160px;" onclick="window.CLIENT_REVIEW.approve('${safeId}')">✅ Approve Deliverable</button>
                <button class="btn-secondary" style="flex:1; min-width:160px; color:#fca5a5; border-color:rgba(239,68,68,0.3);" onclick="window.CLIENT_REVIEW.openAdjustModal('${safeId}', '${safeTitle.replace(/'/g, "\\'")}')">✏️ Request Adjustments</button>
              </div>
            ` : `
              <div style="background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.25); padding:0.75rem 1rem; border-radius:10px;">
                <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; color:var(--emerald-brand); font-weight:700;">
                  ✅ Approved for final publishing & distribution
                </div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.3rem;">
                  📜 <strong>Sign-off Audit Trail:</strong> Verified by ${escapeHTML(p.approvedBy || 'Authorized Client POC')} ${p.approvedAt ? `on ${new Date(p.approvedAt).toLocaleString('en-GB')}` : ''} · Version: ${escapeHTML(p.version || 'v1.0')}
                </div>
              </div>
            `}
          </div>
        `}).join('') || `<div class="card-glass" style="padding:3rem; text-align:center; color:var(--text-muted);">No assets currently waiting for review.</div>`}
      </div>

      <!-- In-App Adjustment Feedback Modal -->
      <div class="modal-overlay" id="clFeedbackModal">
        <div class="modal-box" style="max-width: 500px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">✏️ Request Creative Adjustments</h3>
            <button onclick="window.CLIENT_REVIEW.closeAdjustModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:1rem;" id="clFeedbackItemName">
            Project Deliverable
          </div>

          <div class="form-group">
            <label class="form-label">Timecode / Section (Optional)</label>
            <input type="text" id="clFeedbackTimecode" class="form-input" placeholder="e.g. 00:15–00:22 or Ending logo slate">
          </div>

          <div class="form-group">
            <label class="form-label">Adjustment Details / Notes</label>
            <textarea id="clFeedbackText" class="form-textarea" rows="4" placeholder="Describe the specific changes needed (copy adjustments, color grade, pacing, CTA...)" style="width:100%; border-radius:10px; padding:0.75rem; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); color:#fff; font-family:inherit;"></textarea>
          </div>

          <div style="display:flex; gap:0.75rem; margin-top:1rem;">
            <button class="btn-secondary" style="flex:1;" onclick="window.CLIENT_REVIEW.closeAdjustModal()">Cancel</button>
            <button class="btn-primary" style="flex:1; background:linear-gradient(135deg, #f43f5e, #ec4899);" onclick="window.CLIENT_REVIEW.submitAdjustment()">🚀 Send to Production</button>
          </div>
        </div>
      </div>
    `;
  }

  window.CLIENT_REVIEW = {
    openAdjustModal(id, title) {
      activeChangeId = id;
      document.getElementById('clFeedbackItemName').innerText = `Item: ${title}`;
      document.getElementById('clFeedbackTimecode').value = '';
      document.getElementById('clFeedbackText').value = '';
      document.getElementById('clFeedbackModal').classList.add('active');
    },
    closeAdjustModal() {
      activeChangeId = null;
      document.getElementById('clFeedbackModal').classList.remove('active');
    },
    async submitAdjustment() {
      if (!activeChangeId) return;
      const notes = document.getElementById('clFeedbackText').value.trim();
      const timecode = document.getElementById('clFeedbackTimecode').value.trim();
      
      if (!notes) {
        if (window.showClientToast) window.showClientToast('Please describe the adjustments needed', 'error');
        else alert('Please describe the adjustments needed');
        return;
      }

      const feedback = timecode ? `[At ${timecode}] ${notes}` : notes;

      try {
        await CLIENT_API.patch(`/posts/${activeChangeId}/status`, { status: 'Changes Requested', feedback });
        if (window.showClientToast) window.showClientToast('Feedback dispatched to production team! 🎬');
        else alert('Feedback sent to production team!');
        this.closeAdjustModal();
        loadReviewPosts();
      } catch (e) {
        if (window.showClientToast) window.showClientToast('Error sending feedback: ' + e.message, 'error');
        else alert('Error sending feedback');
      }
    },
    async approve(id) {
      try {
        let user = {};
        try { user = JSON.parse(localStorage.getItem('purple_user') || '{}'); } catch(e) {}
        const approvedBy = user.name || 'Brand POC';
        const approvedAt = new Date().toISOString();

        await CLIENT_API.patch(`/posts/${id}/status`, { 
          status: 'Approved', 
          approvedBy, 
          approvedAt 
        });
        if (window.showClientToast) window.showClientToast('Content Approved & Sign-off Logged! 🚀');
        else alert('Content Approved!');
        loadReviewPosts();
      } catch (e) {
        if (window.showClientToast) window.showClientToast('Error processing approval', 'error');
        else alert('Error processing approval');
      }
    }
  };

  function initKeyboardControls() {
    window.removeEventListener('keydown', handleReviewKeydown);
    window.addEventListener('keydown', handleReviewKeydown);
  }

  function handleReviewKeydown(e) {
    if (window.location.hash !== '#review') return;
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
      return;
    }

    const videos = Array.from(document.querySelectorAll('video'));
    const activeVideo = videos.find(v => !v.paused) || videos[0];

    if (e.code === 'Space') {
      e.preventDefault();
      if (activeVideo) {
        if (activeVideo.paused) activeVideo.play();
        else activeVideo.pause();
      }
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      if (activeVideo) activeVideo.currentTime = Math.max(0, activeVideo.currentTime - 5);
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      if (activeVideo) activeVideo.currentTime = Math.min(activeVideo.duration || 0, activeVideo.currentTime + 5);
    } else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      if (activeVideo) {
        activeVideo.pause();
        const mins = Math.floor(activeVideo.currentTime / 60);
        const secs = Math.floor(activeVideo.currentTime % 60);
        const tc = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        const vidId = activeVideo.id ? activeVideo.id.replace('vid-', '') : (posts[0]?.id || '');
        const targetPost = posts.find(p => p.id === vidId) || posts[0];
        if (targetPost) {
          window.CLIENT_REVIEW.openAdjustModal(targetPost.id, targetPost.title);
          const tcEl = document.getElementById('clFeedbackTimecode');
          if (tcEl) tcEl.value = tc;
        }
      }
    }
  }

  initKeyboardControls();
  await loadReviewPosts();
};
