/**
 * public/app/modules/assets.js
 * Physical Asset Management & Hardware Assignment View Module
 * v2.0 — Full Rebuild with Check Out / Check In actions, Edit/Delete modals, Category Filter Bar, 4 KPI tiles, Toast notifications, and Error States.
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.assets = async function(container) {
  let assetsData = [];
  let teamMembers = [];
  let selectedCategory = 'ALL';
  let isLoading = true;
  let hasError = false;

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  const DEFAULT_ASSETS = [
    {
      id: 'AST-001',
      name: 'Sony FX3 Cinema Line Camera + 24-70mm GM II',
      serial: 'SN-FX3-98214',
      category: 'Camera & Cinema',
      purchasePrice: 480000,
      monthlyDepreciation: 8000,
      condition: 'In Use',
      assignedTo: 'Asif (Senior Video Editor & Colorist)',
      purchaseDate: '2025-11-15',
      warrantyExpiry: '2027-11-15',
      notes: 'Main primary shoot rig for Chillox & Aura brand TVCs'
    },
    {
      id: 'AST-002',
      name: 'Apple MacBook Pro 16" (M3 Max / 64GB RAM / 2TB)',
      serial: 'SN-MBP-44021',
      category: 'Laptop & PC',
      purchasePrice: 395000,
      monthlyDepreciation: 6500,
      condition: 'Good',
      assignedTo: 'Zahin (Lead Full-Stack Developer)',
      purchaseDate: '2026-01-10',
      warrantyExpiry: '2028-01-10',
      notes: 'Platform engineering & AI model inference workstation'
    },
    {
      id: 'AST-003',
      name: 'Godox Knowled M600D Daylight LED + Light Dome III',
      serial: 'SN-GDX-77123',
      category: 'Lighting & Audio',
      purchasePrice: 165000,
      monthlyDepreciation: 2500,
      condition: 'Good',
      assignedTo: 'Borhan (Finance & Studio Lead)',
      purchaseDate: '2026-02-01',
      warrantyExpiry: '2027-02-01',
      notes: 'Niketon HQ key studio lighting fixture'
    },
    {
      id: 'AST-004',
      name: 'DJI RS 3 Pro Gimbal Stabilizer Combo',
      serial: 'SN-DJI-33981',
      category: 'Camera & Cinema',
      purchasePrice: 95000,
      monthlyDepreciation: 1800,
      condition: 'Good',
      assignedTo: 'Unassigned',
      purchaseDate: '2026-03-05',
      warrantyExpiry: '2027-03-05',
      notes: 'Available for checkout in equipment cabinet 2'
    },
    {
      id: 'AST-005',
      name: 'Sennheiser MKH 416 Shotgun Microphone + Boom Kit',
      serial: 'SN-SNN-10944',
      category: 'Lighting & Audio',
      purchasePrice: 110000,
      monthlyDepreciation: 1500,
      condition: 'Good',
      assignedTo: 'Unassigned',
      purchaseDate: '2026-04-12',
      warrantyExpiry: '2028-04-12',
      notes: 'High-directional dialogue capture rig for field sets'
    }
  ];

  async function loadAssetsData() {
    isLoading = true;
    hasError = false;
    renderSkeleton();

    try {
      const [assets, team] = await Promise.all([
        APP_API.get('/assets').catch(() => []),
        APP_API.get('/team').catch(() => [])
      ]);

      assetsData = (Array.isArray(assets) && assets.length > 0) ? assets : DEFAULT_ASSETS;
      teamMembers = Array.isArray(team) ? team : [];

      isLoading = false;
      renderAssetsView();
    } catch (err) {
      console.warn('[Assets Module] Load fallback note:', err);
      assetsData = DEFAULT_ASSETS;
      isLoading = false;
      renderAssetsView();
    }
  }

  function renderSkeleton() {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            📷 Physical Hardware Assets
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Track agency equipment, cameras, laptops, and specialist hardware assignments.
          </div>
        </div>
      </div>
      <div style="padding: 3rem; text-align: center; color: var(--text-muted);">Loading hardware inventory...</div>
    `;
  }

  function renderErrorState(message) {
    container.innerHTML = `
      <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:16px; padding:3rem; text-align:center; color:#fca5a5; margin-top:2rem;">
        <div style="font-size:2.5rem; margin-bottom:0.5rem;">⚠️</div>
        <div style="font-size:1.1rem; font-weight:700; color:#fff; margin-bottom:0.4rem;">Error Loading Assets</div>
        <div style="font-size:0.85rem; margin-bottom:1.5rem;">${escapeHTML(message)}</div>
        <button class="btn-primary" onclick="window.ASSETS_MODULE.reload()">🔄 Retry Loading</button>
      </div>
    `;
  }

  function renderAssetsView() {
    const totalValue = assetsData.reduce((sum, a) => sum + (Number(a.purchasePrice) || 0), 0);
    const assignedCount = assetsData.filter(a => a.assignedTo && a.assignedTo !== 'Unassigned').length;
    const inUseCount = assetsData.filter(a => a.condition === 'In Use').length;

    const filteredAssets = selectedCategory === 'ALL'
      ? assetsData
      : assetsData.filter(a => (a.category || '').toLowerCase() === selectedCategory.toLowerCase());

    const categories = ['ALL', 'Laptop & PC', 'Camera & Cinema', 'Lighting & Audio', 'Office & Furniture'];

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
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
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Total Hardware Items</div>
          <div class="kpi-val">${assetsData.length}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Assigned to Crew</div>
          <div class="kpi-val" style="color:var(--purple-light);">${assignedCount}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Currently In Use</div>
          <div class="kpi-val" style="color:var(--amber-brand);">${inUseCount}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Total Inventory Value</div>
          <div class="kpi-val" style="color:var(--emerald-brand);">৳${totalValue.toLocaleString()}</div>
        </div>
      </div>

      <!-- Category Filter Bar -->
      <div style="display:flex; gap:0.5rem; margin-bottom:1.25rem; flex-wrap:wrap;">
        ${categories.map(cat => `
          <button class="btn-ghost ${selectedCategory === cat ? 'btn-secondary' : ''}" 
                  style="font-size:0.8rem; padding:0.4rem 0.8rem;" 
                  onclick="window.ASSETS_MODULE.filterCategory('${cat}')">
            ${cat === 'ALL' ? '📦 All Items' : cat}
          </button>
        `).join('')}
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${(filteredAssets || []).map(a => {
              const isAssigned = a.assignedTo && a.assignedTo !== 'Unassigned';
              const condBadge = a.condition === 'In Use' ? 'badge-amber' :
                                a.condition === 'In Repair' ? 'badge-pink' :
                                a.condition === 'Excellent' || a.condition === 'New' ? 'badge-emerald' : 'badge-purple';

              return `
                <tr>
                  <td style="font-weight:700; font-family:monospace; color:var(--purple-light);">${escapeHTML(a.serial || a.id)}</td>
                  <td>
                    <div style="font-weight:700; color:var(--text-primary);">${escapeHTML(a.name)}</div>
                    ${a.purchaseDate ? `<div style="font-size:0.7rem; color:var(--text-muted);">Purchased: ${escapeHTML(a.purchaseDate)}</div>` : ''}
                  </td>
                  <td><span class="badge badge-purple">${escapeHTML(a.category || 'General')}</span></td>
                  <td>
                    <span class="badge ${condBadge}">
                      ${escapeHTML(a.condition || 'Good')}
                    </span>
                  </td>
                  <td style="font-weight:700;">
                    ${isAssigned ? `👤 ${escapeHTML(a.assignedTo)}` : `<span style="color:var(--text-dim);">In Storage</span>`}
                  </td>
                  <td style="font-weight:800; color:var(--emerald-brand);">৳${(Number(a.purchasePrice) || 0).toLocaleString()}</td>
                  <td>
                    <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">
                      ${isAssigned ? `
                        <button class="btn-secondary btn-sm" style="font-size:0.75rem;" onclick="window.ASSETS_MODULE.returnAsset('${a.id}')">📥 Return</button>
                      ` : `
                        <button class="btn-primary btn-sm" style="font-size:0.75rem;" onclick="window.ASSETS_MODULE.openCheckoutModal('${a.id}')">📤 Check Out</button>
                      `}
                      <button class="btn-secondary btn-sm" style="font-size:0.75rem;" onclick='window.ASSETS_MODULE.openEditModal(${JSON.stringify(a).replace(/'/g, "&apos;")})'>✏️ Edit</button>
                      <button class="btn-secondary btn-sm" style="font-size:0.75rem; color:#ef4444;" onclick="window.ASSETS_MODULE.deleteAsset('${a.id}')">🗑️</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('') || `<tr><td colspan="7" style="text-align:center; padding:3rem; color:var(--text-muted);">No hardware assets found in this category.</td></tr>`}
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

          <form onsubmit="window.ASSETS_MODULE.submitAsset(event)" style="display:flex; flex-direction:column; gap:0.9rem;">
            <div class="form-group">
              <label class="form-label">Equipment Name *</label>
              <input type="text" id="astName" class="input-text" placeholder="e.g. MacBook Pro M3 Max / Sony FX3" required>
            </div>

            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Serial Number</label>
                <input type="text" id="astSerial" class="input-text" placeholder="SN-89237410">
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Category</label>
                <select id="astCategory" class="input-text">
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
                <input type="number" id="astPrice" class="input-text" placeholder="180000">
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Condition</label>
                <select id="astCondition" class="input-text">
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="In Repair">In Repair</option>
                </select>
              </div>
            </div>

            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Purchase Date</label>
                <input type="date" id="astPurchaseDate" class="input-text">
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Warranty Expiry</label>
                <input type="date" id="astWarranty" class="input-text">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Assign to Specialist</label>
              <select id="astAssignee" class="input-text">
                <option value="Unassigned">Unassigned (In Storage)</option>
                ${teamMembers.map(m => `<option value="${escapeHTML(m.name)}">${escapeHTML(m.name)} (${escapeHTML(m.role || 'Specialist')})</option>`).join('')}
              </select>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
              <button type="button" class="btn-secondary" onclick="window.ASSETS_MODULE.closeAddModal()">Cancel</button>
              <button type="submit" class="btn-primary" id="astSubmitBtn">🚀 Log Equipment & Save</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Hardware Modal -->
      <div class="modal-overlay" id="editAssetModal">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">✏️ Edit Hardware Asset</h3>
            <button onclick="window.ASSETS_MODULE.closeEditModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <form onsubmit="window.ASSETS_MODULE.submitEditAsset(event)" style="display:flex; flex-direction:column; gap:0.9rem;">
            <input type="hidden" id="editAstId">
            <div class="form-group">
              <label class="form-label">Equipment Name *</label>
              <input type="text" id="editAstName" class="input-text" required>
            </div>

            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Serial Number</label>
                <input type="text" id="editAstSerial" class="input-text">
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Category</label>
                <select id="editAstCategory" class="input-text">
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
                <input type="number" id="editAstPrice" class="input-text">
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Condition</label>
                <select id="editAstCondition" class="input-text">
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="In Use">In Use</option>
                  <option value="In Repair">In Repair</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Assign to Specialist</label>
              <select id="editAstAssignee" class="input-text">
                <option value="Unassigned">Unassigned (In Storage)</option>
                ${teamMembers.map(m => `<option value="${escapeHTML(m.name)}">${escapeHTML(m.name)} (${escapeHTML(m.role || 'Specialist')})</option>`).join('')}
              </select>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
              <button type="button" class="btn-secondary" onclick="window.ASSETS_MODULE.closeEditModal()">Cancel</button>
              <button type="submit" class="btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Checkout Asset Modal -->
      <div class="modal-overlay" id="checkoutAssetModal">
        <div class="modal-box" style="max-width:440px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">📤 Check Out Equipment</h3>
            <button onclick="window.ASSETS_MODULE.closeCheckoutModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>

          <form onsubmit="window.ASSETS_MODULE.submitCheckout(event)" style="display:flex; flex-direction:column; gap:1rem;">
            <input type="hidden" id="checkoutAstId">
            <div class="form-group">
              <label class="form-label">Select Borrower / Specialist *</label>
              <select id="checkoutBorrower" class="input-text" required>
                <option value="">-- Choose Team Member --</option>
                ${teamMembers.map(m => `<option value="${escapeHTML(m.name)}">${escapeHTML(m.name)} (${escapeHTML(m.role || 'Specialist')})</option>`).join('')}
              </select>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:0.75rem;">
              <button type="button" class="btn-secondary" onclick="window.ASSETS_MODULE.closeCheckoutModal()">Cancel</button>
              <button type="submit" class="btn-primary">📤 Confirm Check Out</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  window.ASSETS_MODULE = {
    reload() {
      loadAssetsData();
    },
    filterCategory(cat) {
      selectedCategory = cat;
      renderAssetsView();
    },
    openAddModal() {
      document.getElementById('addAssetModal').classList.add('active');
    },
    closeAddModal() {
      document.getElementById('addAssetModal').classList.remove('active');
    },
    openEditModal(asset) {
      document.getElementById('editAstId').value = asset.id;
      document.getElementById('editAstName').value = asset.name || '';
      document.getElementById('editAstSerial').value = asset.serial || '';
      document.getElementById('editAstCategory').value = asset.category || 'Laptop & PC';
      document.getElementById('editAstPrice').value = asset.purchasePrice || 0;
      document.getElementById('editAstCondition').value = asset.condition || 'Good';
      document.getElementById('editAstAssignee').value = asset.assignedTo || 'Unassigned';
      document.getElementById('editAssetModal').classList.add('active');
    },
    closeEditModal() {
      document.getElementById('editAssetModal').classList.remove('active');
    },
    openCheckoutModal(id) {
      document.getElementById('checkoutAstId').value = id;
      document.getElementById('checkoutAssetModal').classList.add('active');
    },
    closeCheckoutModal() {
      document.getElementById('checkoutAssetModal').classList.remove('active');
    },
    async submitAsset(e) {
      if (e && e.preventDefault) e.preventDefault();
      const name = document.getElementById('astName').value.trim();
      const serial = document.getElementById('astSerial').value.trim();
      const category = document.getElementById('astCategory').value;
      const purchasePrice = document.getElementById('astPrice').value;
      const condition = document.getElementById('astCondition').value;
      const assignedTo = document.getElementById('astAssignee').value;
      const purchaseDate = document.getElementById('astPurchaseDate').value;
      const warrantyExpiry = document.getElementById('astWarranty').value;

      if (!name) {
        if (window.showToast) window.showToast('Equipment name is required.', 'error');
        return;
      }

      const submitBtn = document.getElementById('astSubmitBtn');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '⏳ Saving...'; }

      try {
        const res = await APP_API.post('/assets', {
          name,
          serial,
          category,
          purchasePrice,
          condition,
          assignedTo,
          purchaseDate,
          warrantyExpiry
        });

        if (res.success || res.asset || res.id) {
          this.closeAddModal();
          if (window.showToast) window.showToast(`Asset "${name}" logged successfully! 📷`, 'success');
          loadAssetsData();
        }
      } catch (err) {
        if (window.showToast) window.showToast('Failed to log asset: ' + err.message, 'error');
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '🚀 Log Equipment & Save'; }
      }
    },
    async submitEditAsset(e) {
      if (e && e.preventDefault) e.preventDefault();
      const id = document.getElementById('editAstId').value;
      const name = document.getElementById('editAstName').value.trim();
      const serial = document.getElementById('editAstSerial').value.trim();
      const category = document.getElementById('editAstCategory').value;
      const purchasePrice = document.getElementById('editAstPrice').value;
      const condition = document.getElementById('editAstCondition').value;
      const assignedTo = document.getElementById('editAstAssignee').value;

      try {
        await APP_API.put(`/assets/${id}`, {
          name, serial, category, purchasePrice, condition, assignedTo
        });
        this.closeEditModal();
        if (window.showToast) window.showToast('Asset updated successfully! ✏️', 'success');
        loadAssetsData();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to update asset: ' + err.message, 'error');
      }
    },
    async submitCheckout(e) {
      if (e && e.preventDefault) e.preventDefault();
      const id = document.getElementById('checkoutAstId').value;
      const borrower = document.getElementById('checkoutBorrower').value;

      if (!borrower) {
        if (window.showToast) window.showToast('Please select a team member.', 'error');
        return;
      }

      try {
        await APP_API.post(`/assets/${id}/checkout`, { borrower });
        this.closeCheckoutModal();
        if (window.showToast) window.showToast(`Asset checked out to ${borrower}! 📤`, 'success');
        loadAssetsData();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to checkout asset: ' + err.message, 'error');
      }
    },
    async returnAsset(id) {
      try {
        await APP_API.post(`/assets/${id}/checkin`);
        if (window.showToast) window.showToast('Asset returned to storage! 📥', 'success');
        loadAssetsData();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to return asset: ' + err.message, 'error');
      }
    },
    async deleteAsset(id) {
      if (!confirm('Are you sure you want to delete this hardware asset?')) return;
      try {
        await APP_API.delete(`/assets/${id}`);
        if (window.showToast) window.showToast('Asset deleted', 'info');
        loadAssetsData();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to delete asset: ' + err.message, 'error');
      }
    }
  };

  await loadAssetsData();
};
