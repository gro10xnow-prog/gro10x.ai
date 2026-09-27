/**
 * public/app/modules/reviews.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Engine 2: Client Review Room & Sprint Proofing Hub — Agency Admin Cockpit
 * ─────────────────────────────────────────────────────────────────────────────
 * Powers:
 * 1. Multi-Format Sprint Deliverables (Staging URLs, GitHub Repos, APIs, Video Cuts)
 * 2. Definition of Done (DoD) Checklist Manager & Acceptance Gate Tracking
 * 3. Scope Creep Shield Monitoring (Flags out-of-scope feedback vs locked specs)
 * 4. Revision Round Lifecycle (Round 1/2 tracking under 48h turnaround SLA)
 * 5. 30-Day Bug-Fix Warranty Activation & Commercial Milestone Release Tracking
 * 6. Live SSE synchronization and stakeholder assignment matrix
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.reviews = async function(container) {
  let reviewsList = [];
  let clientsList = [];
  let activeFilter = 'all';
  let sseUnsubscribe = null;

  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function getStatusInfo(r) {
    if (r.isApproved || r.status === 'approved') return { label: '✅ Approved & Warranty Active', cls: 'badge-emerald', color: '#10b981' };
    if (r.status === 'revision_requested') return { label: `🔴 Revision (Round ${r.revisionRound || 1}/${r.maxRevisions || 2})`, cls: 'badge-pink', color: '#ef4444' };
    return { label: '⏳ Awaiting Client Approval', cls: 'badge-amber', color: '#f59e0b' };
  }

  function renderSkeleton() {
    container.innerHTML = `
      <!-- Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.25rem;">
            <span class="badge badge-purple" style="font-size:0.72rem;">ENGINE 2 SPRINT GOVERNANCE</span>
            <span class="badge badge-cyan" style="font-size:0.72rem;">48H REVIEW SLA</span>
          </div>
          <h1 style="font-size:1.65rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">
            🎬 Review Room & Sprint Delivery Cockpit
          </h1>
          <div style="font-size:0.88rem; color:var(--text-muted); max-width:680px;">
            Publish multi-format deliverables (live staging sandboxes, GitHub repositories, API contracts, AV cuts), track client DoD acceptance, monitor Scope Creep Shield alerts, and manage 30-day warranty transitions.
          </div>
        </div>
        <div style="display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap;">
          <button class="btn-primary" id="btnOpenNewReviewModal" onclick="window.REVIEWS_MODULE.openNewReviewModal()" style="display:inline-flex; align-items:center; gap:0.4rem;">
            <span>+ Publish Sprint Deliverable</span>
          </button>
          <a href="/reviewroom.html" id="btnOpenReviewRoom" target="_blank" class="btn-secondary" style="text-decoration:none; font-size:0.85rem; display:inline-flex; align-items:center; gap:0.4rem;">
            <span>🚀 Open Full Review Room ↗</span>
          </a>
        </div>
      </div>

      <!-- KPI Tiles -->
      <div class="review-kpi-row" id="reviewKpiRow">
        <div class="kpi-tile">
          <div class="kpi-label">Total Deliverables</div>
          <div class="kpi-val" id="kpiTotal">—</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">⏳ Awaiting Client Sign-Off</div>
          <div class="kpi-val" id="kpiPending" style="color:#f59e0b;">—</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">🔴 Revisions In Progress</div>
          <div class="kpi-val" id="kpiRevision" style="color:#ef4444;">—</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">🛡️ Approved & Under Warranty</div>
          <div class="kpi-val" id="kpiApproved" style="color:#10b981;">—</div>
        </div>
      </div>

      <!-- Filter Pills -->
      <div class="review-filter-pills" style="margin-bottom:1.5rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
        <button class="r-pill active" id="pill-all" onclick="window.REVIEWS_MODULE.filter('all')">All Deliverables</button>
        <button class="r-pill" id="pill-staging" onclick="window.REVIEWS_MODULE.filter('staging')">🚀 Staging Apps</button>
        <button class="r-pill" id="pill-code" onclick="window.REVIEWS_MODULE.filter('code')">🐙 Code & API Docs</button>
        <button class="r-pill" id="pill-video" onclick="window.REVIEWS_MODULE.filter('video')">📹 Video Cuts</button>
        <button class="r-pill" id="pill-image" onclick="window.REVIEWS_MODULE.filter('image')">🖼️ Visual & Design</button>
        <button class="r-pill" id="pill-pdf" onclick="window.REVIEWS_MODULE.filter('pdf')">📄 Design & Specs</button>
        <button class="r-pill" id="pill-doc" onclick="window.REVIEWS_MODULE.filter('doc')">📑 Documentation</button>
      </div>

      <!-- Grid -->
      <div class="review-grid" id="reviewsGrid">
        <div style="color:var(--text-muted); padding:3rem; grid-column:1/-1; text-align:center;">Loading active sprint deliverables...</div>
      </div>

      <!-- New Deliverable Modal -->
      <div class="modal-overlay" id="newReviewModal" onclick="if(event.target === this) window.REVIEWS_MODULE.closeNewReviewModal()">
        <div class="modal-box" style="max-width:580px;">
          <div class="modal-header" style="border-bottom:1px solid var(--border-subtle); padding-bottom:0.75rem;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span style="font-size:1.4rem;">🚀</span>
              <h3 style="margin:0; font-family:var(--font-heading);">Publish Sprint Deliverable</h3>
            </div>
            <button class="modal-close" id="btnCloseNewReviewModal" onclick="window.REVIEWS_MODULE.closeNewReviewModal()">✕</button>
          </div>
          
          <div class="modal-body" style="display:flex; flex-direction:column; gap:0.9rem; max-height:68vh; overflow-y:auto; padding-right:0.4rem;">
            
            <div class="form-group">
              <label class="form-label">Deliverable / Sprint Name *</label>
              <input type="text" id="nrProjectName" class="input-text" placeholder="e.g. Chillox AI Ordering Engine v1.0-alpha">
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem;">
              <div class="form-group">
                <label class="form-label">Client Account *</label>
                <select id="nrClient" class="input-text">
                  <option value="">Select client...</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Deliverable Format / Media Type *</label>
                <select id="nrMediaType" class="input-text" onchange="window.REVIEWS_MODULE.handleFormatChange(this.value)">
                  <option value="video">🎬 Demo Screencast / Video Cut</option>
                  <option value="image">🖼️ Visual & Graphic Mockup (Image)</option>
                  <option value="staging_url">🚀 Live Staging Web App</option>
                  <option value="code_repo">🐙 Git Code Repository & PR</option>
                  <option value="api_spec">📖 OpenAPI / Swagger Docs</option>
                  <option value="architecture_doc">📄 Design & Architecture PDF</option>
                </select>
                <input type="hidden" id="nrDeliverableType" value="video">
                <input type="hidden" id="nrTaskId" value="task-sprint-deliverable">
              </div>
            </div>

            <!-- Staging URL Input -->
            <div class="form-group" id="groupStagingUrl">
              <label class="form-label">Staging App Environment URL</label>
              <input type="url" id="nrStagingUrl" class="input-text" placeholder="https://staging.clientapp.gro10x.ai">
            </div>

            <!-- Git Repo & Branch Inputs -->
            <div style="display:grid; grid-template-columns: 2fr 1fr; gap:0.75rem;" id="groupGitRepo">
              <div class="form-group">
                <label class="form-label">Git Repository URL</label>
                <input type="url" id="nrRepoUrl" class="input-text" placeholder="https://github.com/gro10x/client-sprint">
              </div>
              <div class="form-group">
                <label class="form-label">Branch / PR</label>
                <input type="text" id="nrBranchName" class="input-text" placeholder="main or feat/sprint-1">
              </div>
            </div>

            <!-- API Docs URL Input -->
            <div class="form-group" id="groupApiDocs">
              <label class="form-label">API Schema / Swagger Documentation URL</label>
              <input type="url" id="nrApiDocsUrl" class="input-text" placeholder="https://api.clientapp.gro10x.ai/docs">
            </div>

            <!-- Walkthrough Video or Poster Input -->
            <div class="form-group" id="groupMediaUrl">
              <label class="form-label">Demo Video / Media Asset URL (Optional)</label>
              <input type="url" id="nrMediaUrl" class="input-text" placeholder="https://cdn.gro10x.ai/demos/walkthrough.mp4">
            </div>

            <!-- Definition of Done (DoD) Checklist Builder -->
            <div class="form-group">
              <label class="form-label" style="display:flex; justify-content:space-between;">
                <span>Definition of Done (DoD) Criteria</span>
                <span style="font-size:0.72rem; color:var(--text-dim);">Checked by QA & displayed to client</span>
              </label>
              <div id="nrDodContainer" style="display:flex; flex-direction:column; gap:0.4rem; background:var(--surface-3); padding:0.6rem; border-radius:10px;">
                <label style="font-size:0.78rem; display:flex; align-items:center; gap:0.4rem; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" checked class="nr-dod-item" value="Automated unit & integration tests passing (>80% coverage)">
                  <span>Automated unit & integration tests passing (>80% coverage)</span>
                </label>
                <label style="font-size:0.78rem; display:flex; align-items:center; gap:0.4rem; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" checked class="nr-dod-item" value="Zero high-severity CVEs in security dependency audit">
                  <span>Zero high-severity CVEs in security dependency audit</span>
                </label>
                <label style="font-size:0.78rem; display:flex; align-items:center; gap:0.4rem; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" checked class="nr-dod-item" value="Staging environment successfully deployed & health checked">
                  <span>Staging environment successfully deployed & health checked</span>
                </label>
                <label style="font-size:0.78rem; display:flex; align-items:center; gap:0.4rem; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" checked class="nr-dod-item" value="OpenAPI Swagger contracts validated against mock responses">
                  <span>OpenAPI Swagger contracts validated against mock responses</span>
                </label>
              </div>
            </div>

            <!-- Stakeholder Assignment -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem;">
              <div class="form-group">
                <label class="form-label">Lead Engineer</label>
                <input type="text" id="nrLeadDev" class="input-text" placeholder="e.g. Fahim Rahman">
              </div>
              <div class="form-group">
                <label class="form-label">QA Specialist</label>
                <input type="text" id="nrQaLead" class="input-text" placeholder="e.g. Nusrat Jahan">
              </div>
            </div>

          </div>

          <div style="display:flex; justify-content:flex-end; gap:0.75rem; padding:1rem 1.5rem; border-top:1px solid var(--border-subtle);">
            <button class="btn-secondary" onclick="window.REVIEWS_MODULE.closeNewReviewModal()">Cancel</button>
            <button class="btn-primary" id="nrSubmitBtn" onclick="window.REVIEWS_MODULE.submitNewReview()">🚀 Publish Deliverable</button>
          </div>
        </div>
      </div>
    `;
  }

  async function loadData() {
    try {
      const [res, clients] = await Promise.all([
        APP_API.get('/reviews').catch(() => []),
        APP_API.get('/clients').catch(() => [])
      ]);
      reviewsList = Array.isArray(res) ? res : [];
      clientsList = Array.isArray(clients) ? clients : [];
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
    if (activeFilter === 'staging') {
      items = items.filter(r => r.stagingUrl || r.deliverableType === 'staging_url' || (r.mediaType && r.mediaType.includes('web')));
    } else if (activeFilter === 'code') {
      items = items.filter(r => r.repoUrl || r.apiDocsUrl || r.deliverableType === 'code_repo' || r.deliverableType === 'api_spec');
    } else if (activeFilter === 'video') {
      items = items.filter(r => (r.mediaType || '').includes('video') || r.deliverableType === 'video');
    } else if (activeFilter === 'doc') {
      items = items.filter(r => (r.mediaType || '').includes('doc') || (r.mediaType || '').includes('pdf') || (r.mediaType || '').includes('image'));
    }

    // Update pill active state
    ['all','staging','code','video','doc'].forEach(f => {
      const p = document.getElementById(`pill-${f}`);
      if (p) p.classList.toggle('active', f === activeFilter);
    });

    if (items.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:4rem 2rem; color:var(--text-muted);">
          <div style="font-size:3rem; margin-bottom:1rem;">🚀</div>
          <div style="font-size:1.1rem; font-weight:700; color:var(--text-primary); margin-bottom:0.5rem;">No Matching Sprint Deliverables</div>
          <div style="font-size:0.85rem; margin-bottom:1.5rem;">Create a sprint candidate with staging link, GitHub repository, and QA checklist.</div>
          <button class="btn-primary" onclick="window.REVIEWS_MODULE.openNewReviewModal()">+ Publish Sprint Deliverable</button>
        </div>`;
      return;
    }

    grid.innerHTML = items.map(r => {
      const title = escapeHTML(r.projectName || 'Sprint Deliverable');
      const client = escapeHTML(r.clientName || r.client || 'Client Account');
      const version = escapeHTML(r.activeVersion || 'v1.0-alpha');
      const deliverableType = escapeHTML(r.deliverableType || r.mediaType || 'staging_url');
      const statusInfo = getStatusInfo(r);
      const stagingUrl = r.stagingUrl || (deliverableType === 'staging_url' ? r.mediaUrl : null);
      const repoUrl = r.repoUrl || null;
      const apiDocsUrl = r.apiDocsUrl || null;
      const branchName = r.branchName || 'main';
      const dodChecklist = Array.isArray(r.dodChecklist) ? r.dodChecklist : [];
      const completedDod = dodChecklist.filter(d => d.completed).length;
      const totalDod = dodChecklist.length;
      const reviewUrl = `/reviewroom.html?id=${r.id}`;
      const comments = Array.isArray(r.comments) ? r.comments : [];
      const outOfScopeComments = comments.filter(c => c.scopeFlag === 'OUT_OF_SCOPE' || c.commentType === 'OUT_OF_SCOPE');

      return `
        <div class="review-card" id="admin-rev-${escapeHTML(r.id)}" style="display:flex; flex-direction:column; gap:0.9rem;">
          
          <!-- Card Header -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
              <span class="badge badge-purple" style="font-size:0.72rem;">${deliverableType}</span>
              <span class="badge badge-blue" style="font-size:0.72rem;">${version}</span>
            </div>
            <span class="badge ${statusInfo.cls}" style="font-size:0.72rem;">${statusInfo.label}</span>
          </div>

          <div>
            <div style="font-size:1.1rem; font-weight:800; color:var(--text-primary); margin-bottom:0.25rem; line-height:1.3;">
              ${title}
            </div>
            <div style="font-size:0.78rem; color:var(--text-muted);">
              Client: <strong style="color:var(--text-secondary);">${client}</strong>
              · Round: <strong style="color:var(--purple-light);">${r.revisionRound || 1} of ${r.maxRevisions || 2}</strong>
              ${r.taskId ? ` · Task: <span style="color:var(--text-dim);">${escapeHTML(r.taskId)}</span>` : ''}
            </div>
          </div>

          <!-- Multi-format Preview & Quick Links -->
          <div style="display:flex; flex-direction:column; gap:0.45rem; background:var(--surface-3); padding:0.75rem; border-radius:10px; font-size:0.76rem;">
            ${stagingUrl ? `
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#10b981; font-weight:700;">🚀 Staging App</span>
                <a href="${escapeHTML(stagingUrl)}" target="_blank" rel="noopener" style="color:var(--cyan); text-decoration:none;">Open Preview ↗</a>
              </div>
            ` : ''}
            ${repoUrl ? `
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:var(--text-secondary); font-weight:700;">🐙 Git (${escapeHTML(branchName)})</span>
                <a href="${escapeHTML(repoUrl)}" target="_blank" rel="noopener" style="color:var(--text-muted); text-decoration:none;">Inspect Code ↗</a>
              </div>
            ` : ''}
            ${apiDocsUrl ? `
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#38bdf8; font-weight:700;">📖 OpenAPI Specs</span>
                <a href="${escapeHTML(apiDocsUrl)}" target="_blank" rel="noopener" style="color:#38bdf8; text-decoration:none;">Explore Docs ↗</a>
              </div>
            ` : ''}
          </div>

          <!-- DoD Progress Bar -->
          ${totalDod > 0 ? `
            <div style="background:rgba(0,0,0,0.25); border-radius:8px; padding:0.5rem 0.75rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; margin-bottom:0.3rem;">
                <span style="font-weight:700; color:var(--text-secondary);">DoD Acceptance Gate</span>
                <span style="color:${completedDod === totalDod ? '#10b981' : '#f59e0b'}; font-weight:700;">${completedDod}/${totalDod} Passed</span>
              </div>
              <div style="width:100%; height:4px; background:rgba(255,255,255,0.1); border-radius:999px; overflow:hidden;">
                <div style="width:${(completedDod / totalDod) * 100}%; height:100%; background:linear-gradient(90deg, #10b981, #06b6d4);"></div>
              </div>
            </div>
          ` : ''}

          <!-- Scope Creep Alert Pill (if client submitted out of scope notes) -->
          ${outOfScopeComments.length > 0 ? `
            <div style="background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); border-radius:8px; padding:0.5rem 0.75rem; font-size:0.74rem; color:#fde68a;">
              <strong>⚠️ Scope Creep Shield:</strong> ${outOfScopeComments.length} out-of-scope note(s) logged by client. Review for Change Order quote.
            </div>
          ` : ''}

          <!-- Revision Notes -->
          ${r.revisionNotes ? `
            <div style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25); border-radius:8px; padding:0.6rem; font-size:0.74rem; color:#fca5a5;">
              <strong>📝 Client Revision Feedback:</strong> ${escapeHTML(r.revisionNotes)}
            </div>
          ` : ''}

          <!-- Actions -->
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:auto;">
            <a href="${reviewUrl}" target="_blank" class="btn-primary btn-sm" style="flex:1; text-decoration:none; text-align:center; font-size:0.78rem;">
              🔍 Open Review Room
            </a>
            <button class="btn-secondary btn-sm" style="font-size:0.78rem;" onclick="navigator.clipboard.writeText(window.location.origin + '${reviewUrl}'); window.showToast && window.showToast('Client review link copied!', 'success')">
              📋 Share Link
            </button>
          </div>

        </div>
      `;
    }).join('');
  }

  window.REVIEWS_MODULE = {
    filter(f) {
      activeFilter = f;
      document.querySelectorAll('.review-filter-pills .r-pill').forEach(btn => {
        btn.classList.toggle('active', btn.id === `pill-${f}`);
      });
      renderGrid();
    },

    reload() { loadData(); },

    switchReviewsCurrency(curr) {
      return curr || 'USD';
    },

    handleFormatChange(type) {
      const dt = document.getElementById('nrDeliverableType');
      if (dt) dt.value = type;
      const gStaging = document.getElementById('groupStagingUrl');
      const gRepo = document.getElementById('groupGitRepo');
      const gApi = document.getElementById('groupApiDocs');
      const gMedia = document.getElementById('groupMediaUrl');

      if (gStaging) gStaging.style.display = (type === 'staging_url' || type === 'composite_bundle') ? 'block' : 'none';
      if (gRepo) gRepo.style.display = (type === 'code_repo' || type === 'composite_bundle') ? 'grid' : 'none';
      if (gApi) gApi.style.display = (type === 'api_spec' || type === 'composite_bundle') ? 'block' : 'none';
      if (gMedia) gMedia.style.display = (type === 'video' || type === 'image' || type === 'architecture_doc') ? 'block' : 'none';
    },

    async openNewReviewModal() {
      const modal = document.getElementById('newReviewModal');
      if (!modal) return;
      try {
        const clientSelect = document.getElementById('nrClient');
        if (clientSelect && clientsList.length > 0) {
          clientSelect.innerHTML = '<option value="">Select client...</option>' + clientsList.map(c => `<option value="${escapeHTML(c.name)}">${escapeHTML(c.name)}</option>`).join('');
        }
      } catch (e) {}
      modal.classList.add('active');
    },

    closeNewReviewModal() {
      document.getElementById('newReviewModal').classList.remove('active');
    },

    async submitNewReview() {
      const name = document.getElementById('nrProjectName')?.value.trim();
      const client = document.getElementById('nrClient')?.value.trim();
      const deliverableType = document.getElementById('nrDeliverableType')?.value || 'staging_url';
      const stagingUrl = document.getElementById('nrStagingUrl')?.value.trim() || null;
      const repoUrl = document.getElementById('nrRepoUrl')?.value.trim() || null;
      const branchName = document.getElementById('nrBranchName')?.value.trim() || 'main';
      const apiDocsUrl = document.getElementById('nrApiDocsUrl')?.value.trim() || null;
      const mediaUrl = document.getElementById('nrMediaUrl')?.value.trim() || null;
      const leadDev = document.getElementById('nrLeadDev')?.value.trim() || 'Lead Engineer';
      const qaLead = document.getElementById('nrQaLead')?.value.trim() || 'QA Lead';

      if (!name || !client) {
        window.showToast && window.showToast('Project name and client are required', 'error');
        return;
      }

      // Collect selected DoD criteria
      const dodCheckboxes = document.querySelectorAll('.nr-dod-item:checked');
      const dodChecklist = Array.from(dodCheckboxes).map(cb => ({
        item: cb.value,
        completed: true,
        verified_by: qaLead
      }));

      const btn = document.getElementById('nrSubmitBtn');
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Publishing...'; }

      try {
        const payload = {
          projectName: name,
          client,
          deliverableType,
          mediaType: deliverableType === 'video' ? 'video' : 'staging_url',
          stagingUrl,
          repoUrl,
          branchName,
          apiDocsUrl,
          mediaUrl: mediaUrl || stagingUrl || repoUrl,
          dodChecklist,
          activeVersion: 'v1.0-alpha',
          revisionRound: 1,
          maxRevisions: 2
        };

        const res = await APP_API.post('/reviews', payload);

        // Also assign internal stakeholders if created
        if (res && res.review && res.review.projectId) {
          await APP_API.put(`/projects/${res.review.projectId}/stakeholders`, {
            internal: {
              leadEngineer: leadDev,
              qaLead: qaLead,
              deliveryLead: 'Delivery Admin'
            }
          }).catch(() => {});
        }

        window.showToast && window.showToast('🚀 Sprint deliverable published to Review Room!', 'success');
        this.closeNewReviewModal();
        await loadData();
      } catch (err) {
        window.showToast && window.showToast('Failed to publish deliverable: ' + err.message, 'error');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '🚀 Publish Deliverable'; }
      }
    }
  };

  window.switchReviewsCurrency = function(curr) {
    return window.REVIEWS_MODULE?.switchReviewsCurrency ? window.REVIEWS_MODULE.switchReviewsCurrency(curr) : (curr || 'USD');
  };

  renderSkeleton();
  await loadData();

  // Deduplicated SSE sync
  let _reviewsDebounceTimer = null;
  function debouncedReviewsSync() {
    clearTimeout(_reviewsDebounceTimer);
    _reviewsDebounceTimer = setTimeout(() => { loadData(); }, 400);
  }
  if (window.APP_SSE && window.APP_SSE.subscribe) {
    window.APP_SSE.subscribe('review_update', debouncedReviewsSync);
    window.APP_SSE.subscribe('review_comment_update', debouncedReviewsSync);
  }
};
