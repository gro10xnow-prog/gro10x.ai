/**
 * public/app/modules/assets.js
 * Physical Asset Management & Hardware Assignment View Module
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.assets = async function(container) {
  let assetsData = [];
  let teamMembers = [];

  async function loadAssetsData() {
    const [assets, team] = await Promise.all([
      APP_API.get('/assets').catch(() => []),
      APP_API.get('/team').catch(() => [])
    ]);

    assetsData = assets || [];
    teamMembers = team || [];

    renderAssetsView();
  }

  function renderAssetsView() {
    const totalValue = assetsData.reduce((sum, a) => sum + (Number(a.purchasePrice) || 0), 0);
    const assignedCount = assetsData.filter(a => a.assignedTo && a.assignedTo !== 'Unassigned').length;

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            📷 Physical Hardware Assets
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Track agency equipment, cameras, laptops, and specialist hardware assignments.
          </div>
        </div>
        <button class="btn-primary" onclick="window.ASSETS_MODULE.openAddModal()">+ Log & Assign Hardware</button>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Total Hardware Items</div>
          <div class="kpi-val">${assetsData.length}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Items Assigned to Crew</div>
          <div class="kpi-val" style="color:var(--purple-light);">${assignedCount}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Total Inventory Value</div>
          <div class="kpi-val" style="color:var(--emerald-brand);">৳${totalValue.toLocaleString()}</div>
        </div>
      </div>

      <!-- Asset Inventory Table -->
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Serial No</th>
              <th>Item / Equipment</th>
              <th>Category</th>
              <th>Condition</th>
              <th>Assigned Specialist</th>
              <th>Purchase Value</th>
            </tr>
          </thead>
          <tbody>
            ${(assetsData || []).map(a => `
              <tr>
                <td style="font-weight:700; font-family:monospace; color:var(--purple-light);">${a.serial || a.id}</td>
                <td>
                  <div style="font-weight:700; color:var(--text-primary);">${a.name}</div>
                </td>
                <td><span class="badge badge-purple">${a.category || 'General'}</span></td>
                <td>
                  <span class="badge ${a.condition === 'New' || a.condition === 'Excellent' ? 'badge-emerald' : 'badge-amber'}">
                    ${a.condition || 'Good'}
                  </span>
                </td>
                <td style="font-weight:700;">
                  ${a.assignedTo && a.assignedTo !== 'Unassigned' ? `👤 ${a.assignedTo}` : `<span style="color:var(--text-dim);">In Storage</span>`}
                </td>
                <td style="font-weight:800; color:var(--emerald-brand);">৳${(Number(a.purchasePrice) || 0).toLocaleString()}</td>
              </tr>
            `).join('') || `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No hardware assets logged.</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- Log Hardware Modal -->
      <div class="modal-overlay" id="addAssetModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">📷 Log New Hardware Asset</h3>
            <button onclick="window.ASSETS_MODULE.closeAddModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <div class="form-group">
            <label class="form-label">Equipment Name</label>
            <input type="text" id="astName" class="form-input" placeholder="e.g. MacBook Pro M3 Max / Sony FX3">
          </div>

          <div style="display:flex; gap:1rem;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Serial Number</label>
              <input type="text" id="astSerial" class="form-input" placeholder="SN-89237410">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Category</label>
              <select id="astCategory" class="form-select">
                <option value="Laptop & PC">Laptop & PC</option>
                <option value="Camera & Cinema">Camera & Cinema</option>
                <option value="Lighting & Audio">Lighting & Audio</option>
                <option value="Office & Furniture">Office & Furniture</option>
              </select>
            </div>
          </div>

          <div style="display:flex; gap:1rem;">
            <div class="form-group" style="flex:1;">
              <label class="form-label">Purchase Value (BDT)</label>
              <input type="number" id="astPrice" class="form-input" placeholder="180000">
            </div>
            <div class="form-group" style="flex:1;">
              <label class="form-label">Condition</label>
              <select id="astCondition" class="form-select">
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Assign to Specialist</label>
            <select id="astAssignee" class="form-select">
              <option value="Unassigned">Unassigned (In Storage)</option>
              ${teamMembers.map(m => `<option value="${m.name}">${m.name} (${m.role || 'Specialist'})</option>`).join('')}
            </select>
          </div>

          <button class="btn-primary" style="width:100%; margin-top:0.5rem;" onclick="window.ASSETS_MODULE.submitAsset()">
            🚀 Log Equipment & Save
          </button>
        </div>
      </div>
    `;
  }

  window.ASSETS_MODULE = {
    openAddModal() {
      document.getElementById('addAssetModal').classList.add('active');
    },
    closeAddModal() {
      document.getElementById('addAssetModal').classList.remove('active');
    },
    async submitAsset() {
      const name = document.getElementById('astName').value.trim();
      const serial = document.getElementById('astSerial').value.trim();
      const category = document.getElementById('astCategory').value;
      const purchasePrice = document.getElementById('astPrice').value;
      const condition = document.getElementById('astCondition').value;
      const assignedTo = document.getElementById('astAssignee').value;

      if (!name) return alert('Equipment name is required.');

      try {
        const res = await APP_API.post('/assets', {
          name,
          serial: serial || `SN-${Date.now().toString().slice(-6)}`,
          category,
          purchasePrice,
          condition,
          assignedTo
        });

        if (res.success || res.asset || res.id) {
          this.closeAddModal();
          showToast(`Asset "${name}" logged successfully! 📷`);
          loadAssetsData();
        }
      } catch (err) {
        showToast('Failed to log asset', 'error');
      }
    }
  };

  await loadAssetsData();
};
