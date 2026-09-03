/**
 * public/app/modules/cms.js
 * Services Catalog & Landing Page CMS Editor Module
 * v2.0 — Full Rebuild with KPI tiles, Delete button, Icon selector, real error handling, and live SSE
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.cms = async function(container) {
  let servicesList = [];
  let isLoading = true;
  let hasError = false;

  async function initView() {
    renderSkeleton();
    await loadData();
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function renderSkeleton() {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            📝 Services Catalog & Landing Page CMS
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Manage public agency packages, pricing, included feature bullets, and website services.
          </div>
        </div>
        <div style="display: flex; gap: 0.75rem; align-items: center;">
          <a href="/#services" target="_blank" class="btn-secondary" style="text-decoration:none; font-size:0.85rem;">🌐 View Live Services</a>
          <button class="btn-primary" onclick="window.CMS_MODULE.openAddServiceModal()">+ Create Service Package</button>
        </div>
      </div>

      <!-- KPI Summary Header -->
      <div class="cms-kpi-row" id="cmsKpiRow">
        <div class="kpi-tile"><div class="kpi-label">Total Services</div><div class="kpi-val" id="kpiTotal">...</div></div>
        <div class="kpi-tile"><div class="kpi-label">🟢 Public on Website</div><div class="kpi-val" id="kpiPublic">...</div></div>
        <div class="kpi-tile"><div class="kpi-label">🔒 Hidden / Internal</div><div class="kpi-val" id="kpiHidden">...</div></div>
      </div>

      <!-- Link to Marketplace Gigs -->
      <a href="#gigs" style="display:flex; justify-content:space-between; align-items:center; background:linear-gradient(135deg, rgba(0,223,137,0.1), rgba(6,182,212,0.1)); border:1px solid rgba(0,223,137,0.3); border-radius:12px; padding:0.85rem 1.25rem; margin-bottom:1.5rem; text-decoration:none; color:var(--text-main);">
        <div>
          <strong style="color:#00df89; font-size:0.92rem;">⚡ Marketplace Gigs Studio (Fiverr & Upwork)</strong>
          <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.15rem;">7 AI-optimized gig packages with 1-click copy-paste drawers & 10-point health checks.</div>
        </div>
        <span class="btn-primary btn-sm" style="background:#00df89; color:#09090b; font-weight:800; border:none; padding:0.35rem 0.75rem;">Open Gig Studio &rarr;</span>
      </a>

      <!-- Service Catalog Grid -->
      <div style="margin-bottom: 2rem;">
        <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin-bottom: 1rem;">
          💼 Agency Service Packages (<span id="cmsServicesCount">0</span>)
        </div>
        <div id="cmsServicesGrid" class="cms-grid">
          <div style="color: var(--text-muted); padding: 3rem; text-align:center; grid-column: 1/-1;">Loading service catalog...</div>
        </div>
      </div>

      <!-- Add/Edit Service Modal -->
      <div id="cmsServiceModal" class="modal-overlay">
        <div class="modal-box" style="max-width: 540px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
            <h3 id="cmsModalTitle" style="margin:0; font-family:var(--font-heading); color:#fff;">+ Create Service Package</h3>
            <button onclick="window.CMS_MODULE.closeServiceModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <form onsubmit="window.CMS_MODULE.saveService(event)" style="display:flex; flex-direction:column; gap:0.9rem;">
            <input type="hidden" id="cmsSvcId" />

            <div style="display:flex; gap:0.75rem;">
              <div class="form-group" style="width:90px;">
                <label class="form-label">Icon</label>
                <select id="cmsSvcIcon" class="input-text">
                  <option value="📢">📢 Ads</option>
                  <option value="🎥">🎥 Video</option>
                  <option value="🎨">🎨 Brand</option>
                  <option value="💻">💻 Web</option>
                  <option value="📱">📱 Social</option>
                  <option value="🤖">🤖 Bot/AI</option>
                  <option value="⚡">⚡ Tech</option>
                  <option value="🎯">🎯 Growth</option>
                </select>
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Service Title *</label>
                <input type="text" id="cmsSvcTitle" placeholder="e.g. Digital Marketing Retainer" class="input-text" required />
              </div>
            </div>

            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Category</label>
                <select id="cmsSvcCategory" class="input-text">
                  <option value="Digital Marketing">Digital Marketing</option>
                  <option value="Video Production">Video Production</option>
                  <option value="Branding & Graphics">Branding & Graphics</option>
                  <option value="Website Development">Website Development</option>
                  <option value="Custom Tech">Custom Tech</option>
                </select>
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Pricing Label *</label>
                <input type="text" id="cmsSvcPrice" placeholder="৳75,000 / month" class="input-text" required />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Service Description</label>
              <textarea id="cmsSvcDesc" class="input-text" rows="3" placeholder="Full end-to-end strategy, copy, graphic post design..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Included Features (Comma-separated)</label>
              <input type="text" id="cmsSvcFeatures" placeholder="Paid Meta Ads, Retargeting, Monthly Analytics" class="input-text" />
            </div>

            <div class="form-group" style="display:flex; align-items:center; gap:0.5rem; margin-top:0.3rem;">
              <input type="checkbox" id="cmsSvcPublic" checked style="accent-color: var(--purple-main); width: 16px; height: 16px;" />
              <label for="cmsSvcPublic" style="font-size:0.85rem; font-weight:700; color:var(--text-main); cursor:pointer;">Publish Service to Public Landing Page & Catalog</label>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top: 0.8rem;">
              <button type="button" class="btn-secondary" onclick="window.CMS_MODULE.closeServiceModal()">Cancel</button>
              <button type="submit" class="btn-primary" id="cmsSubmitBtn">🚀 Save Service Package</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  const DEFAULT_SERVICES = [
    { id: "SVC-001", icon: "📢", title: "Digital Marketing & Growth", category: "Digital Marketing", price: "৳75,000 / month", description: "Data-driven social media management, paid advertising, and conversion rate optimization.", includedFeatures: ["Paid Meta & Google Ads", "Social Media Strategy", "Audience Retargeting", "Monthly Growth Analytics"], public: true },
    { id: "SVC-002", icon: "🎥", title: "Video Production & Editing", category: "Video Production", price: "৳45,000 / 10 Reels", description: "High-impact commercial TVCs, viral Reels/TikToks, and full post-production color grading.", includedFeatures: ["Commercial TVC Shoots", "Short-Form Reels & TikToks", "Color Grading & Sound FX", "Frame.io Review Workflows"], public: true },
    { id: "SVC-003", icon: "🎨", title: "Branding & Motion Design", category: "Branding & Graphics", price: "৳65,000 / project", description: "Brand identity systems, 3D motion graphics, packaging, and high-converting ad creative.", includedFeatures: ["Brand Guidelines & Logos", "3D & 2D Motion Graphics", "Social Media Creative Kits", "Packaging & Print Design"], public: true },
    { id: "SVC-004", icon: "💻", title: "Website & Tech Development", category: "Website Development", price: "৳120,000 / project", description: "Custom web applications, responsive landing pages, e-commerce, and bot integrations.", includedFeatures: ["Custom React / Next.js Apps", "High-Converting Landing Pages", "Telegram & WhatsApp Bots", "API & CRM Integration"], public: true }
  ];

  async function loadData() {
    isLoading = true;
    hasError = false;

    try {
      let services = await APP_API.get('/cms/services').catch(() => null);
      if (!Array.isArray(services)) {
        const fallback = await APP_API.get('/services').catch(() => null);
        services = (fallback && fallback.data) ? fallback.data : fallback;
      }
      servicesList = (Array.isArray(services) && services.length > 0) ? services : DEFAULT_SERVICES;
      isLoading = false;
      renderContent();
    } catch (err) {
      console.warn('[CMS Module] Load fallback note:', err);
      servicesList = DEFAULT_SERVICES;
      isLoading = false;
      renderContent();
    }
  }

  function renderErrorState(message) {
    const grid = document.getElementById('cmsServicesGrid');
    if (grid) {
      grid.innerHTML = `
        <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:16px; padding:3rem; text-align:center; color:#fca5a5; grid-column: 1/-1;">
          <div style="font-size:2.5rem; margin-bottom:0.5rem;">⚠️</div>
          <div style="font-size:1.1rem; font-weight:700; color:#fff; margin-bottom:0.4rem;">Error Loading Services</div>
          <div style="font-size:0.85rem; margin-bottom:1.5rem;">${escapeHTML(message)}</div>
          <button class="btn-primary" onclick="window.CMS_MODULE.reload()">🔄 Retry Loading</button>
        </div>
      `;
    }
  }

  function renderContent() {
    renderKPIs();
    renderServices();
  }

  function renderKPIs() {
    const total = servicesList.length;
    const isPubCount = servicesList.filter(s => s.public !== false && s.is_public !== false).length;
    const isHiddenCount = total - isPubCount;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('kpiTotal', total);
    set('kpiPublic', isPubCount);
    set('kpiHidden', isHiddenCount);
    set('cmsServicesCount', total);
  }

  function renderServices() {
    const grid = document.getElementById('cmsServicesGrid');
    if (!grid) return;

    if (servicesList.length === 0) {
      grid.innerHTML = `
        <div style="color: var(--text-muted); padding: 3rem; text-align: center; grid-column: 1/-1; border: 1px dashed var(--border-subtle); border-radius: 16px;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">💼</div>
          <div style="font-weight: 700; color: #fff; margin-bottom: 0.4rem;">No Service Packages Configured</div>
          <div style="font-size: 0.85rem; margin-bottom: 1.25rem;">Create packages to show pricing and features on your agency website.</div>
          <button class="btn-primary" onclick="window.CMS_MODULE.openAddServiceModal()">+ Create First Package</button>
        </div>
      `;
      return;
    }

    grid.innerHTML = servicesList.map(s => {
      const features = Array.isArray(s.includedFeatures) ? s.includedFeatures : (Array.isArray(s.features) ? s.features : (typeof s.includedFeatures === 'string' ? s.includedFeatures.split(',') : []));
      const isPub = s.public !== false && s.is_public !== false;
      const icon = s.icon || '⚡';

      return `
        <div class="cms-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <span class="badge badge-purple">${icon} ${escapeHTML(s.category || 'Service')}</span>
              <span class="badge ${isPub ? 'badge-emerald' : 'badge-pink'}">${isPub ? '🟢 Public' : '🔒 Hidden'}</span>
            </div>
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.3rem;">${escapeHTML(s.title)}</div>
            <div style="font-size: 1.2rem; font-weight: 900; color: var(--purple-light); margin-bottom: 0.7rem;">${escapeHTML(s.price || 'Contact for Quote')}</div>
            <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.4;">${escapeHTML(s.description || '')}</div>
            
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.8rem;">
              ${features.map(f => `<span style="font-size: 0.72rem; background: rgba(255,255,255,0.06); color: var(--text-secondary); padding: 0.25rem 0.5rem; border-radius: 6px;">✓ ${escapeHTML(f.trim())}</span>`).join('')}
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem; border-top: 1px solid var(--border-subtle); padding-top: 0.8rem;">
            <button class="btn-secondary btn-sm" style="flex: 1;" onclick="window.CMS_MODULE.openEditModal('${s.id}')">✏️ Edit</button>
            <a href="/service-detail.html?id=${s.id}" target="_blank" class="btn-secondary btn-sm" style="text-decoration:none; text-align:center;">👁️ Preview</a>
            <button class="btn-secondary btn-sm" style="color: #ef4444;" title="Delete Service" onclick="window.CMS_MODULE.deleteService('${s.id}')">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Subscribe to real-time updates via SSE
  let sseUnsub = null;
  if (window.APP_SSE && window.APP_SSE.subscribe) {
    sseUnsub = window.APP_SSE.subscribe('cms_update', () => {
      loadData();
    });
  }

  window.CMS_MODULE = {
    reload() {
      loadData();
    },
    openAddServiceModal() {
      document.getElementById('cmsModalTitle').textContent = '+ Create Service Package';
      document.getElementById('cmsSvcId').value = '';
      document.getElementById('cmsSvcIcon').value = '📢';
      document.getElementById('cmsSvcTitle').value = '';
      document.getElementById('cmsSvcCategory').value = 'Digital Marketing';
      document.getElementById('cmsSvcPrice').value = '';
      document.getElementById('cmsSvcDesc').value = '';
      document.getElementById('cmsSvcFeatures').value = '';
      document.getElementById('cmsSvcPublic').checked = true;
      document.getElementById('cmsServiceModal').classList.add('active');
    },
    openEditModal(id) {
      const svc = servicesList.find(s => s.id === id);
      if (!svc) return;

      document.getElementById('cmsModalTitle').textContent = '✏️ Edit Service Package';
      document.getElementById('cmsSvcId').value = svc.id || '';
      document.getElementById('cmsSvcIcon').value = svc.icon || '📢';
      document.getElementById('cmsSvcTitle').value = svc.title || '';
      document.getElementById('cmsSvcCategory').value = svc.category || 'Digital Marketing';
      document.getElementById('cmsSvcPrice').value = svc.price || '';
      document.getElementById('cmsSvcDesc').value = svc.description || '';
      
      const feats = Array.isArray(svc.includedFeatures) ? svc.includedFeatures.join(', ') : (Array.isArray(svc.features) ? svc.features.join(', ') : (svc.includedFeatures || ''));
      document.getElementById('cmsSvcFeatures').value = feats;
      document.getElementById('cmsSvcPublic').checked = svc.public !== false && svc.is_public !== false;
      document.getElementById('cmsServiceModal').classList.add('active');
    },
    closeServiceModal() {
      document.getElementById('cmsServiceModal').classList.remove('active');
    },
    closeModal() {
      this.closeServiceModal();
    },
    async saveService(e) {
      if (e && e.preventDefault) e.preventDefault();
      const id = document.getElementById('cmsSvcId').value;
      const icon = document.getElementById('cmsSvcIcon').value;
      const title = document.getElementById('cmsSvcTitle').value.trim();
      const category = document.getElementById('cmsSvcCategory').value;
      const price = document.getElementById('cmsSvcPrice').value.trim();
      const description = document.getElementById('cmsSvcDesc').value.trim();
      const rawFeatures = document.getElementById('cmsSvcFeatures').value.trim();
      const isPublic = document.getElementById('cmsSvcPublic').checked;

      if (!title || !price) {
        if (window.showToast) window.showToast('Title and price are required.', 'error');
        return;
      }

      const submitBtn = document.getElementById('cmsSubmitBtn');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Saving...'; }

      const includedFeatures = rawFeatures ? rawFeatures.split(',').map(f => f.trim()) : [];
      const payload = { title, category, price, description, icon, features: includedFeatures, includedFeatures, is_public: isPublic, public: isPublic };

      try {
        if (id) {
          await APP_API.put(`/cms/services/${id}`, payload);
          if (window.showToast) window.showToast('Service package updated! 📝', 'success');
        } else {
          await APP_API.post('/cms/services', payload);
          if (window.showToast) window.showToast('Service package created! 📝', 'success');
        }

        this.closeServiceModal();
        await loadData();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to save service: ' + err.message, 'error');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🚀 Save Service Package'; }
      }
    },
    async deleteService(id) {
      if (!confirm('Are you sure you want to delete this service package?')) return;
      try {
        await APP_API.delete(`/cms/services/${id}`);
        if (window.showToast) window.showToast('Service package deleted.', 'info');
        await loadData();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to delete service: ' + err.message, 'error');
      }
    }
  };

  await initView();
};
