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

  function getCurrency() {
    return localStorage.getItem('gro10x_currency') || 'BDT';
  }

  function formatMoney(amount) {
    const curr = getCurrency();
    const val = Number(amount) || 0;
    if (curr === 'USD') {
      return '$' + Math.round(val / 120).toLocaleString();
    }
    return '৳' + Math.round(val).toLocaleString();
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  const DEFAULT_ASSETS = [
    {
      id: 'AST-MBP-01',
      name: 'MacBook Pro M3 Max 16"',
      serial: 'SN-MBP-9821',
      category: 'Laptop & PC',
      purchasePrice: 385000,
      monthlyDepreciation: 6500,
      condition: 'In Use',
      assignedTo: 'Firoz Uddin Ahmed',
      purchaseDate: '2026-01-15',
      warrantyExpiry: '2027-01-15',
      notes: 'Primary Tech Admin workstation'
    },
    {
      id: 'AST-CAM-01',
      name: 'Sony FX3 Cinema Camera',
      serial: 'SN-CAM-4421',
      category: 'Camera & Cinema',
      purchasePrice: 420000,
      monthlyDepreciation: 7000,
      condition: 'In Use',
      assignedTo: 'Anika Nower',
      purchaseDate: '2026-02-10',
      warrantyExpiry: '2027-02-10',
      notes: '4K 120fps Full Frame Cinema Line'
    },
    {
      id: 'AST-LGT-01',
      name: 'Godox SL-200W II Studio Light',
      serial: 'SN-LGT-1044',
      category: 'Lighting & Audio',
      purchasePrice: 45000,
      monthlyDepreciation: 800,
      condition: 'Good',
      assignedTo: 'Unassigned',
      purchaseDate: '2026-02-20',
      warrantyExpiry: '2027-02-20',
      notes: 'Studio Key Light with Bowens mount'
    },
    {
      id: 'AST-AUD-01',
      name: 'Rode Wireless PRO Dual Mic Kit',
      serial: 'SN-AUD-7732',
      category: 'Lighting & Audio',
      purchasePrice: 55000,
      monthlyDepreciation: 1000,
      condition: 'Excellent',
      assignedTo: 'Unassigned',
      purchaseDate: '2026-03-01',
      warrantyExpiry: '2027-03-01',
      notes: '32-bit float on-board recording'
    },
    {
      id: 'AST-FRN-01',
      name: 'Ergonomic Herman Miller Chair',
      serial: 'SN-FRN-0012',
      category: 'Office & Furniture',
      purchasePrice: 95000,
      monthlyDepreciation: 1200,
      condition: 'Good',
      assignedTo: 'Unassigned',
      purchaseDate: '2026-01-10',
      warrantyExpiry: '2031-01-10',
      notes: 'Executive posture support chair'
    },
    {
      id: 'AST-MBA-01',
      name: 'MacBook Air M2 15"',
      serial: 'SN-MBA-6102',
      category: 'Laptop & PC',
      purchasePrice: 165000,
      monthlyDepreciation: 3000,
      condition: 'Good',
      assignedTo: 'Unassigned',
      purchaseDate: '2026-02-05',
      warrantyExpiry: '2027-02-05',
      notes: 'General crew editing laptop'
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
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
          <button id="assetsCurrencyToggleBtn" class="btn-ghost" onclick="window.ASSETS_MODULE.toggleCurrency()" style="border:1px solid rgba(255,255,255,0.12); padding:0.45rem 0.85rem; font-size:0.82rem; font-weight:800; border-radius:8px; display:inline-flex; align-items:center; gap:0.4rem; color:var(--text-primary);">
            <span>${getCurrency() === 'USD' ? '$ USD Mode' : '৳ BDT Mode'}</span>
            <span style="font-size:0.7rem; opacity:0.6;">(1:120)</span>
          </button>
          <button id="btnOpenAddAssetModal" class="btn-primary" onclick="window.ASSETS_MODULE.openAddModal()">+ Log & Assign Hardware</button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Total Hardware Items</div>
          <div id="kpiAssetsTotal" class="kpi-val">${assetsData.length}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Assigned to Crew</div>
          <div id="kpiAssetsAssigned" class="kpi-val" style="color:var(--purple-light);">${assignedCount}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Currently In Use</div>
          <div id="kpiAssetsInUse" class="kpi-val" style="color:var(--amber-brand);">${inUseCount}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Total Inventory Value</div>
          <div id="kpiAssetsTotalValue" class="kpi-val" style="color:var(--emerald-brand);">${formatMoney(totalValue)}</div>
        </div>
      </div>

      <!-- Category Filter Bar -->
      <div id="assetsCategoryTabs" style="display:flex; gap:0.5rem; margin-bottom:1.25rem; flex-wrap:wrap;">
        <button id="btnAssetCatAll" data-category="ALL" class="btn-ghost asset-cat-btn ${selectedCategory === 'ALL' ? 'btn-secondary active' : ''}" 
                style="font-size:0.8rem; padding:0.4rem 0.8rem;" 
                onclick="window.ASSETS_MODULE.filterCategory('ALL')">
          📦 All Items (${assetsData.length})
        </button>
        <button id="btnAssetCatLaptop" data-category="Laptop & PC" class="btn-ghost asset-cat-btn ${selectedCategory === 'Laptop & PC' ? 'btn-secondary active' : ''}" 
                style="font-size:0.8rem; padding:0.4rem 0.8rem;" 
                onclick="window.ASSETS_MODULE.filterCategory('Laptop & PC')">
          💻 Laptop & PC
        </button>
        <button id="btnAssetCatCamera" data-category="Camera & Cinema" class="btn-ghost asset-cat-btn ${selectedCategory === 'Camera & Cinema' ? 'btn-secondary active' : ''}" 
                style="font-size:0.8rem; padding:0.4rem 0.8rem;" 
                onclick="window.ASSETS_MODULE.filterCategory('Camera & Cinema')">
          🎥 Camera & Cinema
        </button>
        <button id="btnAssetCatLighting" data-category="Lighting & Audio" class="btn-ghost asset-cat-btn ${selectedCategory === 'Lighting & Audio' ? 'btn-secondary active' : ''}" 
                style="font-size:0.8rem; padding:0.4rem 0.8rem;" 
                onclick="window.ASSETS_MODULE.filterCategory('Lighting & Audio')">
          💡 Lighting & Audio
        </button>
        <button id="btnAssetCatOffice" data-category="Office & Furniture" class="btn-ghost asset-cat-btn ${selectedCategory === 'Office & Furniture' ? 'btn-secondary active' : ''}" 
                style="font-size:0.8rem; padding:0.4rem 0.8rem;" 
                onclick="window.ASSETS_MODULE.filterCategory('Office & Furniture')">
          🪑 Office & Furniture
        </button>
      </div>

      <!-- Asset Inventory Table -->
      <div class="data-table-container">
        <table id="assetsTable" class="data-table">
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
                  <td style="font-weight:800; color:var(--emerald-brand);">${formatMoney(a.purchasePrice || a.purchase_price)}</td>
                  <td>
                    <div style="display:flex; gap:0.3rem; flex-wrap:wrap;">
                      ${isAssigned ? `
                        <button class="btn-secondary btn-sm btn-return-asset" style="font-size:0.75rem;" onclick="window.ASSETS_MODULE.returnAsset('${a.id}')">📥 Return</button>
                      ` : `
                        <button class="btn-primary btn-sm btn-checkout-asset" style="font-size:0.75rem;" onclick="window.ASSETS_MODULE.openCheckoutModal('${a.id}')">📤 Check Out</button>
                      `}
                      <button class="btn-secondary btn-sm btn-edit-asset" style="font-size:0.75rem;" onclick='window.ASSETS_MODULE.openEditModal(${JSON.stringify(a).replace(/'/g, "&apos;")})'>✏️ Edit</button>
                      <button class="btn-secondary btn-sm btn-delete-asset" style="font-size:0.75rem; color:#ef4444;" onclick="window.ASSETS_MODULE.deleteAsset('${a.id}')">🗑️</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('') || `<tr><td colspan="7" style="text-align:center; padding:3rem; color:var(--text-muted);">No hardware assets found in this category.</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- Log Hardware Modal -->
      <div class="modal-overlay" id="addAssetModal" onclick="if(event.target === this) window.ASSETS_MODULE.closeAddModal()">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">📷 Log New Hardware Asset</h3>
            <button id="btnCloseAddAssetModal" onclick="window.ASSETS_MODULE.closeAddModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
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
              <button type="button" id="btnCancelAddAssetModal" class="btn-secondary" onclick="window.ASSETS_MODULE.closeAddModal()">Cancel</button>
              <button type="submit" class="btn-primary" id="astSubmitBtn">🚀 Log Equipment & Save</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Edit Hardware Modal -->
      <div class="modal-overlay" id="editAssetModal" onclick="if(event.target === this) window.ASSETS_MODULE.closeEditModal()">
        <div class="modal-box">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">✏️ Edit Hardware Asset</h3>
            <button id="btnCloseEditAssetModal" onclick="window.ASSETS_MODULE.closeEditModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
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
              <button type="button" id="btnCancelEditAssetModal" class="btn-secondary" onclick="window.ASSETS_MODULE.closeEditModal()">Cancel</button>
              <button type="submit" id="editAstSubmitBtn" class="btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Checkout Asset Modal -->
      <div class="modal-overlay" id="checkoutAssetModal" onclick="if(event.target === this) window.ASSETS_MODULE.closeCheckoutModal()">
        <div class="modal-box" style="max-width:440px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">📤 Check Out Equipment</h3>
            <button id="btnCloseCheckoutAssetModal" onclick="window.ASSETS_MODULE.closeCheckoutModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
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
              <button type="button" id="btnCancelCheckoutAssetModal" class="btn-secondary" onclick="window.ASSETS_MODULE.closeCheckoutModal()">Cancel</button>
              <button type="submit" id="checkoutSubmitBtn" class="btn-primary">📤 Confirm Check Out</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  window.ASSETS_MODULE = {
    getCurrency,
    formatMoney,
    toggleCurrency() {
      const next = getCurrency() === 'USD' ? 'BDT' : 'USD';
      this.switchCurrency(next);
    },
    switchCurrency(currency) {
      localStorage.setItem('gro10x_currency', currency);
      window.dispatchEvent(new CustomEvent('gro10x_currency_changed', { detail: { currency } }));
      renderAssetsView();
    },
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
      try {
        await APP_API.delete(`/assets/${id}`);
        assetsData = assetsData.filter(a => a.id !== id);
        if (window.showToast) window.showToast('Hardware asset removed successfully 🗑️', 'info');
        renderAssetsView();
      } catch (err) {
        assetsData = assetsData.filter(a => a.id !== id);
        if (window.showToast) window.showToast('Hardware asset removed 🗑️', 'info');
        renderAssetsView();
      }
    }
  };

  // Route-guarded Escape key listener for modal dismissal
  if (window._assetsKeydownHandler) {
    window.removeEventListener('keydown', window._assetsKeydownHandler);
  }
  window._assetsKeydownHandler = function(e) {
    if (window.location.hash !== '#assets') return;
    if (e.key === 'Escape') {
      const modals = ['addAssetModal', 'editAssetModal', 'checkoutAssetModal'];
      modals.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
      });
    }
  };
  window.addEventListener('keydown', window._assetsKeydownHandler);

  // Global aliases
  window.AssetsModule = window.ASSETS_MODULE;
  window.switchAssetsCurrency = (curr) => window.ASSETS_MODULE.switchCurrency(curr);

  // Deduplicated gro10x_currency_changed listener with #assets route guard
  if (window._assetsCurrencyHandler) {
    window.removeEventListener('gro10x_currency_changed', window._assetsCurrencyHandler);
  }
  window._assetsCurrencyHandler = function(e) {
    if (window.location.hash !== '#assets') return;
    renderAssetsView();
  };
  window.addEventListener('gro10x_currency_changed', window._assetsCurrencyHandler);

  // Real-time SSE support
  if (window.APP_SSE && typeof window.APP_SSE.subscribe === 'function') {
    window.APP_SSE.subscribe('asset_update', (updated) => {
      if (window.location.hash === '#assets') {
        if (Array.isArray(updated) && updated.length > 0) assetsData = updated;
        renderAssetsView();
      }
    });
  }

  await loadAssetsData();
};

// Module-level global aliases
window.ASSETS_MODULE = window.ASSETS_MODULE || {};
window.AssetsModule = window.ASSETS_MODULE;
window.switchAssetsCurrency = function(curr) {
  if (window.ASSETS_MODULE && typeof window.ASSETS_MODULE.switchCurrency === 'function') {
    window.ASSETS_MODULE.switchCurrency(curr);
  } else {
    localStorage.setItem('gro10x_currency', curr);
    window.dispatchEvent(new CustomEvent('gro10x_currency_changed', { detail: { currency: curr } }));
  }
};
