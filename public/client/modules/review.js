/**
 * public/client/modules/review.js
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};

window.CLIENT_MODULES.review = async function(container) {
  let posts = [];

  async function loadReviewPosts() {
    const all = await CLIENT_API.get('/posts').catch(() => []);
    posts = (all || []).filter(p => p.status === 'Pending Client Approval' || p.status === 'Client Review' || p.status === 'Approved');
    renderReviewRoom();
  }

  function renderReviewRoom() {
    container.innerHTML = `
      <div style="margin-bottom: 1.5rem;">
        <h1 style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
          🎬 Content Review Room
        </h1>
        <div style="font-size: 0.88rem; color: var(--text-muted);">
          Review video cuts, graphic assets, and copywriting. Approve or request adjustments directly.
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:1.25rem;">
        ${posts.map(p => `
          <div class="card-glass" style="display:flex; flex-direction:column; gap:1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <div>
                <span class="badge badge-purple">${p.platform || 'Facebook'}</span>
                <h3 style="font-size:1.1rem; margin:0.3rem 0 0; color:var(--text-primary);">${p.title}</h3>
              </div>
              <span class="badge ${p.status === 'Approved' ? 'badge-emerald' : 'badge-pink'}">${p.status}</span>
            </div>

            <div style="background:var(--surface-3); padding:0.85rem; border-radius:12px; font-size:0.88rem; color:var(--text-secondary); line-height:1.5;">
              ${p.caption || 'No caption provided.'}
            </div>

            ${p.videoUrl ? `
              <div style="border-radius:12px; overflow:hidden; background:#000; text-align:center; padding:1rem;">
                <a href="${p.videoUrl}" target="_blank" class="btn-secondary">▶ Preview Media Content</a>
              </div>
            ` : ''}

            ${p.status !== 'Approved' ? `
              <div style="display:flex; gap:0.75rem;">
                <button class="btn-primary" style="flex:1;" onclick="window.CLIENT_REVIEW.approve('${p.id}')">✅ Approve Post</button>
                <button class="btn-danger" style="flex:1;" onclick="window.CLIENT_REVIEW.requestChanges('${p.id}')">✏️ Request Adjustment</button>
              </div>
            ` : `<div style="font-size:0.8rem; color:var(--emerald-brand); font-weight:700;">Approved for publishing</div>`}
          </div>
        `).join('') || `<div class="card-glass" style="padding:3rem; text-align:center; color:var(--text-muted);">No assets currently waiting for review.</div>`}
      </div>
    `;
  }

  window.CLIENT_REVIEW = {
    async approve(id) {
      try {
        await CLIENT_API.patch(`/posts/${id}/status`, { status: 'Approved' });
        showClientToast('Content Approved! 🚀');
        loadReviewPosts();
      } catch (e) {
        showClientToast('Error processing approval');
      }
    },
    async requestChanges(id) {
      const feedback = prompt('Please enter details of adjustments needed:');
      if (!feedback) return;
      try {
        await CLIENT_API.patch(`/posts/${id}/status`, { status: 'Changes Requested', feedback });
        showClientToast('Feedback sent to production team!');
        loadReviewPosts();
      } catch (e) {
        showClientToast('Error sending feedback');
      }
    }
  };

  await loadReviewPosts();
};
