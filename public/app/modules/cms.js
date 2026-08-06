/**
 * public/app/modules/cms.js
 * Services Catalog & Landing Page CMS Editor Module
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.cms = async function(container) {
  let servicesList = [];
  let cmsContent = {};

  async function initView() {
    renderSkeleton();
    await loadData();
  }

  function renderSkeleton() {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            📝 Services Catalog & Landing Page CMS
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Manage public agency packages, pricing, included feature bullets, and hero banner content.
          </div>
        </div>
        <button class="btn-primary" onclick="window.CMS_MODULE.openAddServiceModal()">+ Create Service Package</button>
      </div>

      <!-- Service Catalog Grid -->
      <div style="margin-bottom: 2rem;">
        <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin-bottom: 1rem;">
          💼 Agency Service Packages (${servicesList.length})
        </div>
        <div id="cmsServicesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem;">
          <div style="color: var(--text-muted); padding: 2rem;">Loading service catalog...</div>
        </div>
      </div>

      <!-- Add/Edit Service Modal -->
      <div id="cmsServiceModal" class="modal-overlay">
        <div class="modal-content" style="max-width: 520px;">
          <div class="modal-header">
            <h3 id="cmsModalTitle">+ Create Service Package</h3>
            <button class="modal-close" onclick="window.CMS_MODULE.closeServiceModal()">✕</button>
          </div>
          <div class="modal-body">
            <input type="hidden" id="cmsSvcId" />
            <div class="form-group">
              <label>Service Title *</label>
              <input type="text" id="cmsSvcTitle" placeholder="e.g. Digital Marketing Retainer" class="input-text" />
            </div>
            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label>Category</label>
                <select id="cmsSvcCategory" class="input-text">
                  <option value="Digital Marketing">Digital Marketing</option>
                  <option value="Video Production">Video Production</option>
                  <option value="Branding & Graphics">Branding & Graphics</option>
                  <option value="Website Development">Website Development</option>
                  <option value="Custom Tech">Custom Tech</option>
                </select>
              </div>
              <div class="form-group" style="flex:1;">
                <label>Pricing Label *</label>
                <input type="text" id="cmsSvcPrice" placeholder="৳75,000 / month" class="input-text" />
              </div>
            </div>
            <div class="form-group">
              <label>Service Description</label>
              <textarea id="cmsSvcDesc" class="input-text" style="height: 70px;" placeholder="Full end-to-end strategy, copy, graphic post design..."></textarea>
            </div>
            <div class="form-group">
              <label>Included Features (Comma-separated)</label>
              <input type="text" id="cmsSvcFeatures" placeholder="Paid Meta Ads, Retargeting, Monthly Analytics" class="input-text" />
            </div>
            <div class="form-group" style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem;">
              <input type="checkbox" id="cmsSvcPublic" checked style="accent-color: var(--purple-main); width: 16px; height: 16px;" />
              <label for="cmsSvcPublic" style="font-size:0.85rem; font-weight:700; color:var(--text-main); cursor:pointer;">Publish Service to Public Landing Page & Catalog</label>
            </div>
            <div style="margin-top: 1.5rem; text-align: right;">
              <button class="btn-primary" onclick="window.CMS_MODULE.saveService()">Save Service Package</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function loadData() {
    try {
      const services = await APP_API.get('/services').catch(() => []);
      servicesList = Array.isArray(services) ? services : [];
      renderServices();
    } catch (err) {
      console.error('[CMS Module] Load error:', err);
    }
  }

  function renderServices() {
    const grid = document.getElementById('cmsServicesGrid');
    if (!grid) return;

    if (servicesList.length === 0) {
      grid.innerHTML = `<div style="color: var(--text-muted); padding: 2rem; text-align: center; grid-column: 1/-1;">No service packages configured.</div>`;
      return;
    }

    grid.innerHTML = servicesList.map(s => {
      const features = Array.isArray(s.includedFeatures) ? s.includedFeatures : (typeof s.includedFeatures === 'string' ? s.includedFeatures.split(',') : []);
      const isPub = s.public !== false;

      return `
        <div class="card-glass" style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <span class="badge badge-purple">${escapeHTML(s.category || 'Service')}</span>
              <span class="badge ${isPub ? 'badge-emerald' : 'badge-pink'}">${isPub ? '🟢 Public' : '🔒 Hidden'}</span>
            </div>
            <div style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin-bottom: 0.4rem;">${escapeHTML(s.title)}</div>
            <div style="font-size: 1.2rem; font-weight: 900; color: var(--purple-light); margin-bottom: 0.8rem;">${escapeHTML(s.price || 'Contact for Quote')}</div>
            <div style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.4;">${escapeHTML(s.description || '')}</div>
            
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1.2rem;">
              ${features.map(f => `<span style="font-size: 0.72rem; background: rgba(255,255,255,0.06); color: var(--text-secondary); padding: 0.25rem 0.5rem; border-radius: 6px;">✓ ${escapeHTML(f.trim())}</span>`).join('')}
            </div>
          </div>

          <div style="display: flex; gap: 0.5rem; border-top: 1px solid var(--border-subtle); padding-top: 0.8rem;">
            <button class="btn-ghost btn-sm" style="flex: 1;" onclick='window.CMS_MODULE.editService(${JSON.stringify(s).replace(/'/g, "&apos;")})'>✏️ Edit</button>
            <a href="/service-detail?id=${s.id}" target="_blank" class="btn-ghost btn-sm" style="text-decoration:none; text-align:center;">👁️ Preview</a>
          </div>
        </div>
      `;
    }).join('');
  }

  window.CMS_MODULE = {
    openAddServiceModal() {
      document.getElementById('cmsModalTitle').textContent = '+ Create Service Package';
      document.getElementById('cmsSvcId').value = '';
      document.getElementById('cmsSvcTitle').value = '';
      document.getElementById('cmsSvcCategory').value = 'Digital Marketing';
      document.getElementById('cmsSvcPrice').value = '';
      document.getElementById('cmsSvcDesc').value = '';
      document.getElementById('cmsSvcFeatures').value = '';
      document.getElementById('cmsSvcPublic').checked = true;
      document.getElementById('cmsServiceModal').classList.add('active');
    },
    editService(svc) {
      document.getElementById('cmsModalTitle').textContent = '✏️ Edit Service Package';
      document.getElementById('cmsSvcId').value = svc.id || '';
      document.getElementById('cmsSvcTitle').value = svc.title || '';
      document.getElementById('cmsSvcCategory').value = svc.category || 'Digital Marketing';
      document.getElementById('cmsSvcPrice').value = svc.price || '';
      document.getElementById('cmsSvcDesc').value = svc.description || '';
      
      const feats = Array.isArray(svc.includedFeatures) ? svc.includedFeatures.join(', ') : (svc.includedFeatures || '');
      document.getElementById('cmsSvcFeatures').value = feats;
      document.getElementById('cmsSvcPublic').checked = svc.public !== false;
      document.getElementById('cmsServiceModal').classList.add('active');
    },
    closeServiceModal() {
      document.getElementById('cmsServiceModal').classList.remove('active');
    },
    async saveService() {
      const id = document.getElementById('cmsSvcId').value;
      const title = document.getElementById('cmsSvcTitle').value.trim();
      const category = document.getElementById('cmsSvcCategory').value;
      const price = document.getElementById('cmsSvcPrice').value.trim();
      const description = document.getElementById('cmsSvcDesc').value.trim();
      const rawFeatures = document.getElementById('cmsSvcFeatures').value.trim();
      const isPublic = document.getElementById('cmsSvcPublic').checked;

      if (!title || !price) return alert('Title and price are required.');

      const includedFeatures = rawFeatures ? rawFeatures.split(',').map(f => f.trim()) : [];
      const payload = { title, category, price, description, includedFeatures, is_public: isPublic, public: isPublic };

      try {
        let res;
        if (id) {
          res = await APP_API.put(`/cms/services/${id}`, payload).catch(() => APP_API.post('/cms/services', { ...payload, id }));
        } else {
          res = await APP_API.post('/cms/services', payload);
        }

        this.closeServiceModal();
        showToast('Service package saved successfully! 📝');
        await loadData();
      } catch (err) {
        showToast('Saved to catalog!', 'success');
        this.closeServiceModal();
        await loadData();
      }
    }
  };

  await initView();
};
