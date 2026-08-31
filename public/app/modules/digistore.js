/**
 * public/app/modules/digistore.js
 * ─────────────────────────────────────────────────────────────────────────────
 * DigiVault — Digital Subscription & Product Commerce Engine Module v1.0
 * 
 * Capabilities:
 * - 📥 Unified Order Management & Status Pipeline
 * - 🛡️ Blind Vendor Procurement Engine (1-Click WhatsApp Pre-fill with Zero Client Data Leak)
 * - 🔑 Credential Vault & Instant Delivery Dispatch
 * - 📋 44+ Product Live Catalog & Margin Engine (Hero 91% Margin Spotlight)
 * - 🏪 Supplier Directory (Munir & Farhan)
 * - 🔔 Renewal Intelligence & Retention Pipeline
 * - 📊 Revenue & Net Profit Analytics
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.APP_MODULES = window.APP_MODULES || {};

const DigistoreModule = {
  currentTab: 'orders',
  orderFilter: 'all',
  productCategoryFilter: 'all',
  orders: [],
  products: [],
  vendors: [],
  renewals: [],
  analytics: null,

  async render(container) {
    container.innerHTML = `
      <div class="digistore-container" style="padding: 24px 0;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
          <div>
            <h2 style="font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 4px; display: flex; align-items: center; gap: 10px;">
              <span>🏪</span> DigiVault Commerce Engine
            </h2>
            <p style="color: var(--text-muted, #94a3b8); font-size: 14px;">
              Digital subscriptions back-office: order logging, blind WhatsApp procurement, credential delivery vault & renewals.
            </p>
          </div>
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button class="btn btn-primary" id="btnNewDigiOrder" style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">🛒</span> Log New Order (FB / WA)
            </button>
            <button class="btn btn-secondary" id="btnNewDigiProduct" style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">📦</span> Add Product
            </button>
          </div>
        </div>

        <!-- KPI Scorecards -->
        <div class="kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div class="card" style="padding: 20px; border-left: 4px solid var(--primary, #00df89);">
            <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-dim, #64748b);">Verified Revenue</div>
            <div id="kpiDigiRevenue" style="font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 800; color: #00df89; margin-top: 4px;">৳0</div>
            <div style="font-size: 12px; color: var(--text-muted, #94a3b8); margin-top: 4px;">Gross confirmed sales</div>
          </div>
          <div class="card" style="padding: 20px; border-left: 4px solid #06b6d4;">
            <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-dim, #64748b);">Net Profit</div>
            <div id="kpiDigiProfit" style="font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 800; color: #06b6d4; margin-top: 4px;">৳0</div>
            <div id="kpiDigiMargin" style="font-size: 12px; color: #06b6d4; margin-top: 4px; font-weight: 700;">0% Margin</div>
          </div>
          <div class="card" style="padding: 20px; border-left: 4px solid #f59e0b;">
            <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-dim, #64748b);">Delivery Queue</div>
            <div id="kpiDigiPendingDelivery" style="font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 800; color: #f59e0b; margin-top: 4px;">0</div>
            <div style="font-size: 12px; color: var(--text-muted, #94a3b8); margin-top: 4px;">Paid orders awaiting creds</div>
          </div>
          <div class="card" style="padding: 20px; border-left: 4px solid #a855f7;">
            <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-dim, #64748b);">Active Subscriptions</div>
            <div id="kpiDigiActiveSubs" style="font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 800; color: #a855f7; margin-top: 4px;">0</div>
            <div style="font-size: 12px; color: var(--text-muted, #94a3b8); margin-top: 4px;">Live customer accounts</div>
          </div>
          <div class="card" style="padding: 20px; border-left: 4px solid #ec4899;">
            <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-dim, #64748b);">Upcoming Renewals</div>
            <div id="kpiDigiRenewalsDue" style="font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 800; color: #ec4899; margin-top: 4px;">0</div>
            <div style="font-size: 12px; color: var(--text-muted, #94a3b8); margin-top: 4px;">Expiring in next 7 days</div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div style="display: flex; gap: 8px; border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding-bottom: 12px; margin-bottom: 24px; overflow-x: auto;" id="digiNavTabs">
          <button class="filter-chip active" data-tab="orders">📥 Orders Pipeline (<span id="tabBadgeOrders">0</span>)</button>
          <button class="filter-chip" data-tab="delivery">🔑 Delivery Queue (<span id="tabBadgeDelivery" style="color: #f59e0b;">0</span>)</button>
          <button class="filter-chip" data-tab="customers">👤 Customers CRM</button>
          <button class="filter-chip" data-tab="products">📋 Products Catalog (44+)</button>
          <button class="filter-chip" data-tab="vendors">🏪 Verified Suppliers</button>
          <button class="filter-chip" data-tab="renewals">🔔 Renewals Engine</button>
          <button class="filter-chip" data-tab="analytics">📊 Profit Analytics</button>
          <button class="filter-chip" data-tab="links">🔗 Link Studio (UTM)</button>
          <button class="filter-chip" data-tab="social">📢 Social Media Studio</button>
        </div>

        <!-- Tab Views Container -->
        <div id="digiTabContent">
          <!-- Dynamic Content Rendered Here -->
        </div>
      </div>

      <!-- Modals Container -->
      <div id="digiModalsContainer"></div>
    `;

    this.bindGlobalEvents(container);
    this.initRealtimeFeed();
    await this.loadAllData();
    this.switchTab('orders');
  },

  initRealtimeFeed() {
    if (this._sseConnected) return;
    try {
      if (window.EventSource) {
        const sse = new EventSource('/api/events');
        sse.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data);
            if (payload.type && payload.type.startsWith('digistore_')) {
              this.handleRealtimeEvent(payload);
            }
          } catch (err) {}
        };
        sse.addEventListener('digistore_order_created', (e) => {
          try { this.handleRealtimeEvent({ type: 'digistore_order_created', data: JSON.parse(e.data) }); } catch (err) {}
        });
        sse.addEventListener('digistore_order_updated', (e) => {
          try { this.handleRealtimeEvent({ type: 'digistore_order_updated', data: JSON.parse(e.data) }); } catch (err) {}
        });
        this._sseConnected = true;
      }
    } catch (e) {
      console.warn('[DigiVault Realtime Feed Note]:', e.message);
    }
  },

  handleRealtimeEvent(event) {
    const { type, data } = event;
    const orderNum = data?.order_number || data?.orderNumber || 'Order Event';
    const amount = data?.sale_price ? ` (৳${Number(data.sale_price).toLocaleString()})` : '';

    if (type === 'digistore_order_created') {
      this.showToast(`🛒 নতুন অর্ডার এসেছে: ${orderNum}${amount}`, 'success');
    } else if (type === 'digistore_payment_proof') {
      this.showToast(`📸 পেমেন্ট স্ক্রিনশট আপলোড হয়েছে: ${orderNum}`, 'info');
    } else if (type === 'digistore_delivered') {
      this.showToast(`🔑 অর্ডার ডেলিভারি সম্পন্ন: ${orderNum}`, 'success');
    }

    // Refresh active data silently
    this.loadAllData().then(() => {
      if (this.currentTab) this.switchTab(this.currentTab);
    });
  },

  showToast(message, type = 'info') {
    let toastContainer = document.getElementById('digiToastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'digiToastContainer';
      toastContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 99999; display: flex; flex-direction: column; gap: 8px; pointer-events: none;';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
      background: ${type === 'success' ? 'rgba(0, 223, 137, 0.95)' : type === 'warning' ? 'rgba(245, 158, 11, 0.95)' : 'rgba(30, 41, 59, 0.95)'};
      color: ${type === 'success' ? '#000' : '#fff'};
      font-weight: 700;
      font-size: 13px;
      padding: 12px 18px;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      backdrop-filter: blur(8px);
      pointer-events: auto;
      transition: opacity 0.3s ease, transform 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    toast.innerHTML = `<span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  },

  async loadAllData() {
    try {
      const [pRes, oRes, vRes, rRes, aRes, lRes] = await Promise.all([
        APP_API.get('/digistore/products').catch(() => ({ data: [] })),
        APP_API.get('/digistore/orders').catch(() => ({ data: [] })),
        APP_API.get('/digistore/vendors').catch(() => ({ data: [] })),
        APP_API.get('/digistore/renewals').catch(() => ({ data: [] })),
        APP_API.get('/digistore/analytics').catch(() => ({ data: {} })),
        APP_API.get('/digistore/links').catch(() => ({ data: [] }))
      ]);

      this.products = (pRes && pRes.data) || [];
      this.orders = (oRes && oRes.data) || [];
      this.vendors = (vRes && vRes.data) || [];
      this.renewals = (rRes && rRes.data) || [];
      this.analytics = (aRes && aRes.data) || {};
      this.links = (lRes && lRes.data) || [];

      this.updateKPIs();
    } catch (err) {
      console.error('[DigiVault] Error loading initial state:', err);
    }
  },

  updateKPIs() {
    const verifiedOrders = this.orders.filter(o => o.paymentStatus === 'verified');
    const totalRev = verifiedOrders.reduce((sum, o) => sum + (o.salePrice || 0), 0);
    const totalCost = verifiedOrders.reduce((sum, o) => sum + (o.vendorPrice || 0), 0);
    const profit = totalRev - totalCost;
    const margin = totalRev > 0 ? Math.round((profit / totalRev) * 100) : 0;
    const pendingDeliv = this.orders.filter(o => o.paymentStatus === 'verified' && o.deliveryStatus !== 'delivered').length;
    const activeSubs = this.orders.filter(o => (o.deliveryStatus === 'delivered' || o.orderStage === 'delivered') && o.orderStage !== 'confirmed_closed' && o.orderStage !== 'admin_closed').length;

    const elRev = document.getElementById('kpiDigiRevenue');
    const elProf = document.getElementById('kpiDigiProfit');
    const elMargin = document.getElementById('kpiDigiMargin');
    const elDeliv = document.getElementById('kpiDigiPendingDelivery');
    const elActive = document.getElementById('kpiDigiActiveSubs');
    const elRenew = document.getElementById('kpiDigiRenewalsDue');
    const badgeOrders = document.getElementById('tabBadgeOrders');
    const badgeDeliv = document.getElementById('tabBadgeDelivery');

    if (elRev) elRev.textContent = `৳${totalRev.toLocaleString()}`;
    if (elProf) elProf.textContent = `৳${profit.toLocaleString()}`;
    if (elMargin) elMargin.textContent = `${margin}% Net Margin`;
    if (elDeliv) elDeliv.textContent = pendingDeliv;
    if (elActive) elActive.textContent = activeSubs;
    if (elRenew) elRenew.textContent = this.renewals.length;
    if (badgeOrders) badgeOrders.textContent = this.orders.length;
    if (badgeDeliv) badgeDeliv.textContent = pendingDeliv;
  },

  bindGlobalEvents(container) {
    // Tab switching
    container.querySelectorAll('#digiNavTabs button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // New Order Modal
    const btnNewOrder = container.querySelector('#btnNewDigiOrder');
    if (btnNewOrder) {
      btnNewOrder.addEventListener('click', () => this.openNewOrderModal());
    }

    // New Product Modal
    const btnNewProduct = container.querySelector('#btnNewDigiProduct');
    if (btnNewProduct) {
      btnNewProduct.addEventListener('click', () => this.openNewProductModal());
    }
  },

  switchTab(tabName) {
    this.currentTab = tabName;
    document.querySelectorAll('#digiNavTabs button').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabName);
    });

    const content = document.getElementById('digiTabContent');
    if (!content) return;

    switch (tabName) {
      case 'orders':
        this.renderOrdersTab(content);
        break;
      case 'delivery':
        this.renderDeliveryTab(content);
        break;
      case 'customers':
        this.renderCustomersTab(content);
        break;
      case 'products':
        this.renderProductsTab(content);
        break;
      case 'vendors':
        this.renderVendorsTab(content);
        break;
      case 'renewals':
        this.renderRenewalsTab(content);
        break;
      case 'analytics':
        this.renderAnalyticsTab(content);
        break;
      case 'links':
        this.renderLinksTab(content);
        break;
      case 'social':
        this.renderSocialTab(content);
        break;
      default:
        this.renderOrdersTab(content);
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 1: ORDERS PIPELINE
  // ───────────────────────────────────────────────────────────────────────────
  renderOrdersTab(container) {
    let filtered = this.orders;
    if (this.orderFilter !== 'all') {
      if (this.orderFilter === 'pending_payment') filtered = filtered.filter(o => o.orderStage === 'pending_payment' || o.paymentStatus === 'pending');
      else if (this.orderFilter === 'verified') filtered = filtered.filter(o => o.orderStage === 'payment_verified');
      else if (this.orderFilter === 'procuring') filtered = filtered.filter(o => o.orderStage === 'procuring');
      else if (this.orderFilter === 'delivered') filtered = filtered.filter(o => o.orderStage === 'delivered');
      else if (this.orderFilter === 'closed') filtered = filtered.filter(o => o.orderStage === 'confirmed_closed' || o.orderStage === 'admin_closed');
    }

    container.innerHTML = `
      <!-- Order Filters & Actions -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="orderFilterChips">
          <button class="filter-chip ${this.orderFilter === 'all' ? 'active' : ''}" data-filter="all">All Orders (${this.orders.length})</button>
          <button class="filter-chip ${this.orderFilter === 'pending_payment' ? 'active' : ''}" data-filter="pending_payment">⏳ Pending Pay</button>
          <button class="filter-chip ${this.orderFilter === 'verified' ? 'active' : ''}" data-filter="verified">🔵 Verified</button>
          <button class="filter-chip ${this.orderFilter === 'procuring' ? 'active' : ''}" data-filter="procuring">🟠 Procuring</button>
          <button class="filter-chip ${this.orderFilter === 'delivered' ? 'active' : ''}" data-filter="delivered">🔑 Delivered</button>
          <button class="filter-chip ${this.orderFilter === 'closed' ? 'active' : ''}" data-filter="closed">✅ Closed</button>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
          <input type="text" id="inputSearchOrders" placeholder="Search by customer, product, order #..." style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 8px 14px; color: #fff; font-size: 13px; min-width: 240px;" />
          <a href="/api/digistore/export/orders" download class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 6px; text-decoration: none; padding: 8px 12px; font-weight: 600;">
            <span>📥</span> Export CSV
          </a>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <div style="overflow-x: auto;">
          <table class="table" style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: rgba(0,0,0,0.3); border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.08));">
                <th style="padding: 14px 16px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">Order #</th>
                <th style="padding: 14px 16px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">Customer & WA</th>
                <th style="padding: 14px 16px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">Product & Duration</th>
                <th style="padding: 14px 16px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">Sale / Cost / Profit</th>
                <th style="padding: 14px 16px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">Stage & Proofs</th>
                <th style="padding: 14px 16px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">🛡️ Supplier Procure</th>
                <th style="padding: 14px 16px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">Delivery / Link</th>
                <th style="padding: 14px 16px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="ordersTableBody">
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="8" style="padding: 48px; text-align: center; color: var(--text-muted);">
                    <div style="font-size: 32px; margin-bottom: 8px;">📭</div>
                    <div>No orders found in this stage.</div>
                  </td>
                </tr>
              ` : filtered.map(o => this.renderOrderRow(o)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Filter clicks
    container.querySelectorAll('#orderFilterChips button').forEach(b => {
      b.addEventListener('click', (e) => {
        this.orderFilter = e.currentTarget.getAttribute('data-filter');
        this.renderOrdersTab(container);
      });
    });

    // Search filter
    const searchInput = container.querySelector('#inputSearchOrders');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const rows = container.querySelectorAll('#ordersTableBody tr');
        rows.forEach(r => {
          r.style.display = r.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
      });
    }

    this.bindOrderRowActions(container);
  },

  renderOrderRow(o) {
    const isPaid = o.paymentStatus === 'verified';
    const isDelivered = o.deliveryStatus === 'delivered';
    const profitMargin = o.salePrice > 0 ? Math.round((o.profit / o.salePrice) * 100) : 0;
    const stage = o.orderStage || (isDelivered ? 'delivered' : isPaid ? 'payment_verified' : 'pending_payment');

    // Stage Badges
    let stageBadge = `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">⏳ Pending Pay</span>`;
    if (stage === 'payment_verified') stageBadge = `<span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">🔵 Paid & Verified</span>`;
    if (stage === 'procuring') stageBadge = `<span class="badge" style="background: rgba(249, 115, 22, 0.15); color: #f97316; border: 1px solid rgba(249, 115, 22, 0.3);">🟠 Procuring</span>`;
    if (stage === 'delivered') stageBadge = `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">🟢 Delivered</span>`;
    if (stage === 'confirmed_closed') stageBadge = `<span class="badge" style="background: rgba(20, 184, 166, 0.2); color: #14b8a6; border: 1px solid rgba(20, 184, 166, 0.4);">✅ Closed (Cust)</span>`;
    if (stage === 'admin_closed') stageBadge = `<span class="badge" style="background: rgba(148, 163, 184, 0.2); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.4);">🔒 Closed (Admin)</span>`;

    return `
      <tr style="border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.05));" data-order-id="${o.id}">
        <td style="padding: 14px 16px; font-family: monospace; font-weight: 700; color: #38bdf8;">
          ${o.orderNumber}
        </td>
        <td style="padding: 14px 16px;">
          <div style="font-weight: 700; color: #fff;">${o.customerName}</div>
          <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin-top: 2px;">
            <span>📱 ${o.customerContact}</span>
          </div>
          ${o.customerWhatsapp ? `
            <div style="font-size: 11px; color: #25d366; margin-top: 2px; font-weight: 600;">
              💬 WA: ${o.customerWhatsapp}
            </div>
          ` : ''}
        </td>
        <td style="padding: 14px 16px;">
          <div style="font-weight: 600; color: #f8fafc;">${o.productName}</div>
          <div style="font-size: 12px; color: #a855f7; font-weight: 600; margin-top: 2px;">⏱️ ${o.duration}</div>
        </td>
        <td style="padding: 14px 16px;">
          <div style="font-weight: 700; color: #fff;">৳${o.salePrice.toLocaleString()}</div>
          <div style="font-size: 11px; color: var(--text-muted);">Cost: ৳${o.vendorPrice.toLocaleString()}</div>
          <div style="font-size: 11px; color: #10b981; font-weight: 700;">+৳${o.profit.toLocaleString()} (${profitMargin}%)</div>
        </td>
        <td style="padding: 14px 16px;">
          ${stageBadge}
          <div style="display: flex; flex-direction: column; gap: 2px; margin-top: 4px;">
            ${o.paymentProofUrl ? `<button type="button" class="proof-lightbox-trigger" data-img="${o.paymentProofUrl}" data-title="Customer Payment Proof — ${o.orderNumber}" style="background: none; border: none; padding: 0; font-size: 11px; color: #38bdf8; text-decoration: underline; cursor: pointer; text-align: left;">🖼️ Cust Proof</button>` : ''}
            ${o.vendorPaymentProofUrl ? `<button type="button" class="proof-lightbox-trigger" data-img="${o.vendorPaymentProofUrl}" data-title="Vendor Payment Proof — ${o.orderNumber}" style="background: none; border: none; padding: 0; font-size: 11px; color: #f97316; text-decoration: underline; cursor: pointer; text-align: left;">🖼️ Vendor Proof</button>` : ''}
            ${o.adminClosureProofUrl ? `<button type="button" class="proof-lightbox-trigger" data-img="${o.adminClosureProofUrl}" data-title="Closure Proof — ${o.orderNumber}" style="background: none; border: none; padding: 0; font-size: 11px; color: #94a3b8; text-decoration: underline; cursor: pointer; text-align: left;">🖼️ Close Proof</button>` : ''}
          </div>
        </td>
        <td style="padding: 14px 16px;">
          <button class="btn btn-sm btn-procure-modal" data-id="${o.id}" style="padding: 4px 10px; font-size: 11px; background: rgba(37, 211, 102, 0.15); color: #25d366; border: 1px solid rgba(37, 211, 102, 0.3); border-radius: 6px; display: inline-flex; align-items: center; gap: 5px; font-weight: 600; cursor: pointer;">
            <span>💬</span> Procure & Pay
          </button>
          <div style="font-size: 10px; color: #64748b; margin-top: 3px;">To: ${o.vendorName.split(' ')[0]} (৳${o.vendorPrice})</div>
        </td>
        <td style="padding: 14px 16px;">
          ${o.activationLink ? `
            <div style="font-size: 11px; color: #00df89; font-weight: 700; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${o.activationLink}">
              🔗 Link Active
            </div>
          ` : (isDelivered ? `<span style="font-size: 11px; color: #10b981; font-weight: 600;">🔑 Creds Delivered</span>` : `<span style="font-size: 11px; color: #64748b;">Pending Link</span>`)}
          ${o.expiryDate ? `<div style="font-size: 10px; color: #94a3b8; margin-top: 2px;">Exp: ${o.expiryDate}</div>` : ''}
        </td>
        <td style="padding: 14px 16px; text-align: right;">
          <div style="display: flex; gap: 4px; justify-content: flex-end; flex-wrap: wrap;">
            ${!isPaid && o.paymentStatus !== 'rejected' ? `
              <button class="btn btn-sm btn-success btn-verify-pay" data-id="${o.id}" title="Verify Payment">✅ Verify</button>
              <button class="btn btn-sm btn-secondary btn-reject-pay" data-id="${o.id}" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);" title="Reject Payment">❌ Reject</button>
            ` : ''}
            ${!isDelivered && isPaid ? `
              <button class="btn btn-sm btn-primary btn-open-deliver" data-id="${o.id}" title="Enter Link / Credentials">🔑 Deliver</button>
            ` : ''}
            ${(isDelivered && stage !== 'confirmed_closed' && stage !== 'admin_closed') ? `
              <button class="btn btn-sm btn-secondary btn-admin-close" data-id="${o.id}" title="Close Order with Screenshot Proof">🔒 Close</button>
            ` : ''}
            ${o.whatsappDeliveryLink ? `
              <a href="${o.whatsappDeliveryLink}" target="_blank" class="btn btn-sm" style="background: rgba(37,211,102,0.15); color: #25d366; text-decoration: none; padding: 4px 8px;" title="Send via WhatsApp">💬 WA</a>
            ` : ''}
            <button class="btn btn-sm btn-secondary btn-view-timeline" data-id="${o.id}" title="View Order Lifecycle History">📋</button>
          </div>
        </td>
      </tr>
    `;
  },

  bindOrderRowActions(container) {
    // Lightbox triggers for payment proofs
    container.querySelectorAll('.proof-lightbox-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const img = e.currentTarget.getAttribute('data-img');
        const title = e.currentTarget.getAttribute('data-title') || 'Proof Preview';
        if (img) this.openLightboxModal(img, title);
      });
    });

    // Verify Payment button
    container.querySelectorAll('.btn-verify-pay').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        try {
          const res = await APP_API.patch(`/digistore/orders/${id}/verify-payment`);
          if (res && res.message) {
            if (window.showToast) window.showToast(res.message, 'success');
            await this.loadAllData();
            this.renderOrdersTab(container);
          }
        } catch (err) {
          if (window.showToast) window.showToast('Error verifying payment: ' + err.message, 'error');
        }
      });
    });

    // Reject Payment button
    container.querySelectorAll('.btn-reject-pay').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const order = this.orders.find(o => o.id === id);
        if (order) this.openRejectPaymentModal(order);
      });
    });

    // Procure & Pay Vendor button
    container.querySelectorAll('.btn-procure-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const order = this.orders.find(o => o.id === id);
        if (order) this.openProcureModal(order);
      });
    });

    // Deliver button
    container.querySelectorAll('.btn-open-deliver').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const order = this.orders.find(o => o.id === id);
        if (order) this.openDeliveryModal(order);
      });
    });

    // Admin Close Order button
    container.querySelectorAll('.btn-admin-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const order = this.orders.find(o => o.id === id);
        if (order) this.openAdminCloseModal(order);
      });
    });

    // View Timeline button
    container.querySelectorAll('.btn-view-timeline').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const order = this.orders.find(o => o.id === id);
        if (order) this.openTimelineModal(order);
      });
    });

    // Renew button
    container.querySelectorAll('.btn-renew-order').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Create a renewal order for this subscription?')) {
          try {
            await APP_API.post(`/digistore/orders/${id}/renew`);
            if (window.showToast) window.showToast('Renewal order created!', 'success');
            await this.loadAllData();
            this.renderOrdersTab(container);
          } catch (err) {
            if (window.showToast) window.showToast('Error creating renewal: ' + err.message, 'error');
          }
        }
      });
    });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 2: DELIVERY QUEUE (ACTION CENTER)
  // ───────────────────────────────────────────────────────────────────────────
  renderDeliveryTab(container) {
    const queue = this.orders.filter(o => o.paymentStatus === 'verified' && o.deliveryStatus !== 'delivered');
    const vendors = [...new Set(queue.map(o => o.vendorName).filter(Boolean))];

    const renderCards = (items) => {
      if (items.length === 0) {
        return `
          <div class="card" style="padding: 48px; text-align: center; color: var(--text-muted); grid-column: 1 / -1;">
            <div style="font-size: 36px; margin-bottom: 12px;">🎉</div>
            <div style="font-size: 16px; font-weight: 700; color: #fff;">No Orders Match Filter</div>
            <div style="font-size: 13px; margin-top: 4px;">All unfulfilled orders are currently clear or filtered out.</div>
          </div>
        `;
      }
      return items.map(o => `
        <div class="card delivery-card-item" data-id="${o.id}" style="padding: 20px; border-top: 4px solid #f59e0b; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <span style="font-family: monospace; font-size: 12px; color: #38bdf8; font-weight: 700;">${o.orderNumber}</span>
                <h4 style="font-size: 16px; font-weight: 700; color: #fff; margin-top: 2px;">${o.productName}</h4>
              </div>
              <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">⏱️ ${o.duration}</span>
            </div>

            <div style="background: rgba(0,0,0,0.25); border-radius: 8px; padding: 12px; font-size: 13px; margin-bottom: 14px;">
              <div style="color: #94a3b8;">Customer: <strong style="color: #fff;">${o.customerName}</strong> (${o.customerContact})</div>
              <div style="color: #25d366; margin-top: 2px; font-weight: 600;">WhatsApp: ${o.customerWhatsapp || o.customerContact}</div>
              <div style="color: #94a3b8; margin-top: 4px;">Supplier: <strong style="color: #38bdf8;">${o.vendorName}</strong> (Cost: ৳${o.vendorPrice})</div>
              <div style="color: #10b981; margin-top: 4px; font-weight: 700;">Net Profit: +৳${o.profit.toLocaleString()}</div>
            </div>

            ${o.vendorPaymentProofUrl ? `
              <div style="font-size: 11px; color: #10b981; margin-bottom: 10px; display: flex; align-items: center; gap: 4px;">
                <span>✅</span> Vendor Payment Recorded (৳${o.vendorPaymentAmount})
              </div>
            ` : `
              <div style="font-size: 11px; color: #f97316; margin-bottom: 10px; display: flex; align-items: center; gap: 4px;">
                <span>⚠️</span> Need to pay vendor ৳${o.vendorPrice}
              </div>
            `}
          </div>

          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button class="btn btn-secondary btn-queue-procure" data-id="${o.id}" style="flex: 1; font-size: 12px;">
              💬 1-Click Procure
            </button>
            <button class="btn btn-primary btn-queue-deliver" data-id="${o.id}" style="flex: 1; font-size: 12px;">
              🔑 Enter Link / Creds
            </button>
          </div>
        </div>
      `).join('');
    };

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h3 style="font-size: 18px; font-weight: 700; color: #fff;">🔑 Action Center — Unfulfilled Orders (${queue.length})</h3>
          <p style="color: var(--text-muted); font-size: 13px; margin-top: 2px;">
            Verified customer payments ready for procurement and credential delivery.
          </p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <input type="text" id="inputDeliverySearch" placeholder="Search customer, ref, product..." style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 8px 14px; color: #fff; font-size: 13px; min-width: 230px;" />
          <select id="selectDeliveryVendorFilter" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 8px 12px; color: #fff; font-size: 13px;">
            <option value="all">All Suppliers (${vendors.length})</option>
            ${vendors.map(v => `<option value="${v}">${v}</option>`).join('')}
          </select>
        </div>
      </div>

      <div id="deliveryQueueGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 16px;">
        ${renderCards(queue)}
      </div>
    `;

    const bindCardActions = () => {
      container.querySelectorAll('.btn-queue-procure').forEach(btn => {
        btn.onclick = (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const order = this.orders.find(o => o.id === id);
          if (order) this.openProcureModal(order);
        };
      });

      container.querySelectorAll('.btn-queue-deliver').forEach(btn => {
        btn.onclick = (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          const order = this.orders.find(o => o.id === id);
          if (order) this.openDeliveryModal(order);
        };
      });
    };

    bindCardActions();

    // Wire live filter and search
    const inpSearch = container.querySelector('#inputDeliverySearch');
    const selVendor = container.querySelector('#selectDeliveryVendorFilter');
    const grid = container.querySelector('#deliveryQueueGrid');

    const filterQueue = () => {
      const q = inpSearch.value.trim().toLowerCase();
      const v = selVendor.value;

      const filtered = queue.filter(o => {
        const matchSearch = !q ||
          (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
          (o.customerContact && o.customerContact.toLowerCase().includes(q)) ||
          (o.productName && o.productName.toLowerCase().includes(q));
        const matchVendor = v === 'all' || o.vendorName === v;
        return matchSearch && matchVendor;
      });

      grid.innerHTML = renderCards(filtered);
      bindCardActions();
    };

    inpSearch.addEventListener('input', filterQueue);
    selVendor.addEventListener('change', filterQueue);
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TAB: CUSTOMER CRM & INTELLIGENCE
  // ───────────────────────────────────────────────────────────────────────────
  async renderCustomersTab(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h3 style="font-size: 18px; font-weight: 700; color: #fff;">👤 Customer Relationship Management (CRM)</h3>
          <p style="color: var(--text-muted); font-size: 13px;">
            Comprehensive directory of all DigiVault clients, order frequencies, and lifetime value (LTV).
          </p>
        </div>
        <div>
          <input type="text" id="inputSearchCustomers" placeholder="Search by customer, phone, WhatsApp..." style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 8px 14px; color: #fff; font-size: 13px; min-width: 260px;" />
        </div>
      </div>

      <div id="customersTableContainer">
        <div class="card" style="padding: 40px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">⏳</div>
          <div>Loading customer analytics...</div>
        </div>
      </div>
    `;

    try {
      const res = await APP_API.get('/digistore/customers');
      const customers = (res && res.data) || [];

      const renderTable = (list) => {
        if (list.length === 0) {
          return `
            <div class="card" style="padding: 48px; text-align: center; color: var(--text-muted);">
              <div style="font-size: 32px; margin-bottom: 8px;">👤</div>
              <div>No customers found matching search.</div>
            </div>
          `;
        }

        return `
          <div class="card" style="padding: 0; overflow: hidden;">
            <div style="overflow-x: auto;">
              <table class="table" style="width: 100%; border-collapse: collapse; text-align: left;">
                <thead>
                  <tr style="background: rgba(0,0,0,0.3); border-bottom: 1px solid var(--border-subtle);">
                    <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Customer Profile</th>
                    <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Contact Channels</th>
                    <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Total Orders</th>
                    <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Lifetime Value (LTV)</th>
                    <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Net Profit</th>
                    <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Active Subs</th>
                    <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase; text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${list.map(c => `
                    <tr style="border-bottom: 1px solid var(--border-subtle);">
                      <td style="padding: 14px 16px;">
                        <div style="font-weight: 700; color: #fff; display: flex; align-items: center; gap: 6px;">
                          ${c.name}
                          ${c.telegramChatId ? '<span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 10px;">📱 TG Bot</span>' : ''}
                        </div>
                        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                          Member since: ${new Date(c.firstOrderDate).toLocaleDateString('en-GB')}
                        </div>
                      </td>
                      <td style="padding: 14px 16px;">
                        <div style="font-family: monospace; font-size: 13px; color: #fff;">${c.contact}</div>
                        ${c.whatsapp && c.whatsapp !== c.contact ? `
                          <div style="font-size: 11px; color: #25d366;">WA: ${c.whatsapp}</div>
                        ` : ''}
                      </td>
                      <td style="padding: 14px 16px; font-weight: 700; color: #fff;">
                        ${c.totalOrders} ${c.totalOrders === 1 ? 'order' : 'orders'}
                      </td>
                      <td style="padding: 14px 16px; font-weight: 800; color: #00df89; font-size: 15px;">
                        ৳${Number(c.totalSpent).toLocaleString()}
                      </td>
                      <td style="padding: 14px 16px; font-weight: 700; color: #06b6d4;">
                        +৳${Number(c.totalProfit).toLocaleString()}
                      </td>
                      <td style="padding: 14px 16px;">
                        <span class="badge" style="background: ${c.activeSubscriptions > 0 ? 'rgba(0, 223, 137, 0.15)' : 'rgba(255,255,255,0.05)'}; color: ${c.activeSubscriptions > 0 ? '#00df89' : '#64748b'};">
                          ${c.activeSubscriptions} active
                        </span>
                      </td>
                      <td style="padding: 14px 16px; text-align: right;">
                        <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                          <a href="https://wa.me/${(c.whatsapp || c.contact).replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-sm" style="background: rgba(37,211,102,0.15); color: #25d366; text-decoration: none; padding: 5px 10px; font-weight: 600;">
                            💬 WhatsApp
                          </a>
                          <button class="btn btn-sm btn-secondary btn-view-cust-history" data-contact="${c.contact}" style="padding: 5px 10px;">
                            📋 History
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      };

      const tableContainer = container.querySelector('#customersTableContainer');
      tableContainer.innerHTML = renderTable(customers);

      const bindActions = () => {
        container.querySelectorAll('.btn-view-cust-history').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const contact = e.currentTarget.getAttribute('data-contact');
            this.openCustomerHistoryModal(contact);
          });
        });
      };
      bindActions();

      const inpSearch = container.querySelector('#inputSearchCustomers');
      if (inpSearch) {
        inpSearch.addEventListener('input', (e) => {
          const q = e.target.value.toLowerCase().trim();
          const filtered = customers.filter(c => 
            c.name.toLowerCase().includes(q) ||
            c.contact.toLowerCase().includes(q) ||
            (c.whatsapp && c.whatsapp.toLowerCase().includes(q))
          );
          tableContainer.innerHTML = renderTable(filtered);
          bindActions();
        });
      }
    } catch (err) {
      container.querySelector('#customersTableContainer').innerHTML = `
        <div class="card" style="padding: 30px; color: #ef4444; text-align: center;">
          Error loading CRM: ${err.message}
        </div>
      `;
    }
  },

  async openCustomerHistoryModal(contact) {
    const modalsContainer = document.getElementById('digiModalsContainer');
    modalsContainer.innerHTML = `
      <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="card" style="max-width: 800px; width: 100%; padding: 28px; max-height: 90vh; overflow-y: auto; border: 1px solid var(--primary);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 14px;">
            <h3 style="font-size: 18px; font-weight: 700; color: #fff;">📋 Customer Purchase History: ${contact}</h3>
            <button class="btn btn-sm btn-secondary" id="btnCloseCustHistory">✕ Close</button>
          </div>
          <div id="custHistoryContent">
            <div style="text-align: center; color: var(--text-muted); padding: 30px;">Loading customer order history...</div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnCloseCustHistory').addEventListener('click', () => {
      modalsContainer.innerHTML = '';
    });

    try {
      const res = await APP_API.get(`/digistore/customers/${encodeURIComponent(contact)}/orders`);
      const orders = (res && res.data) || [];
      const content = document.getElementById('custHistoryContent');

      if (orders.length === 0) {
        content.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">No previous orders found for this contact.</div>`;
        return;
      }

      content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${orders.map(o => `
            <div class="card" style="padding: 16px; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle);">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                <div>
                  <strong style="font-family: monospace; color: #38bdf8; font-size: 15px;">${o.order_number || o.orderNumber}</strong>
                  <span style="font-size: 12px; color: var(--text-muted); margin-left: 8px;">${new Date(o.created_at || o.createdAt).toLocaleString('en-GB')}</span>
                </div>
                <span class="badge" style="background: ${(o.delivery_status || o.deliveryStatus) === 'delivered' ? 'rgba(0,223,137,0.15)' : 'rgba(245,158,11,0.15)'}; color: ${(o.delivery_status || o.deliveryStatus) === 'delivered' ? '#00df89' : '#f59e0b'};">
                  ${o.order_stage || o.orderStage || o.delivery_status || o.deliveryStatus}
                </span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; font-size: 13px;">
                <div><strong>Product:</strong> ${o.product_name || o.productName}</div>
                <div><strong>Amount:</strong> ৳${Number(o.sale_price || o.salePrice).toLocaleString()} (Profit: +৳${Number(o.profit).toLocaleString()})</div>
                <div><strong>Payment:</strong> ${o.payment_method || o.paymentMethod || 'bKash'} (${o.payment_status || o.paymentStatus})</div>
                <div><strong>Expiry:</strong> ${o.expiry_date || o.expiryDate || 'N/A'}</div>
              </div>
              ${(o.activation_link || o.activationLink) ? `
                <div style="margin-top: 10px; font-size: 12px; background: rgba(0,0,0,0.4); padding: 8px; border-radius: 6px; word-break: break-all;">
                  🔗 <strong>Activation Link:</strong> <a href="${o.activation_link || o.activationLink}" target="_blank" style="color: #38bdf8;">${o.activation_link || o.activationLink}</a>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      document.getElementById('custHistoryContent').innerHTML = `<div style="color: #ef4444; text-align: center; padding: 20px;">Error: ${err.message}</div>`;
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 3: PRODUCTS CATALOG
  // ───────────────────────────────────────────────────────────────────────────
  renderProductsTab(container) {
    const categories = ['all', 'AI Tools', 'Streaming', 'Music', 'Creative Tools', 'Productivity', 'Professional', 'Learning', 'VPN'];
    let filtered = this.products;
    if (this.productCategoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === this.productCategoryFilter);
    }

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="prodCatFilterChips">
          ${categories.map(c => `
            <button class="filter-chip ${this.productCategoryFilter === c ? 'active' : ''}" data-cat="${c}">
              ${c === 'all' ? 'All Products' : c}
            </button>
          `).join('')}
        </div>
        <div>
          <input type="text" id="inputSearchProducts" placeholder="Search catalog..." style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 8px 14px; color: #fff; font-size: 13px; min-width: 220px;" />
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;" id="productsGrid">
        ${filtered.map(p => {
          const margin = p.salePrice > 0 ? Math.round((p.profitMargin / p.salePrice) * 100) : 0;
          return `
            <div class="card product-card-item" style="padding: 18px; border-top: 3px solid ${p.isHero ? '#00df89' : 'rgba(255,255,255,0.1)'}; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                  <span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 11px;">${p.category}</span>
                  ${p.isHero ? `<span class="badge" style="background: rgba(0, 223, 137, 0.15); color: #00df89; font-size: 11px; font-weight: 800;">⭐ BEST SELLER</span>` : ''}
                </div>

                <h4 style="font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 6px; line-height: 1.3;">${p.name}</h4>
                <div style="font-size: 12px; color: #a855f7; font-weight: 600; margin-bottom: 12px;">⏱️ ${p.duration}</div>

                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 10px; margin-bottom: 12px;">
                  <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                    <span style="color: var(--text-muted);">Customer Price:</span>
                    <strong style="color: #fff; font-size: 14px;">৳${p.salePrice.toLocaleString()}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                    <span style="color: var(--text-muted);">Supplier Cost:</span>
                    <span style="color: #94a3b8;">৳${p.vendorPrice.toLocaleString()}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 12px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 4px;">
                    <span style="color: #10b981; font-weight: 700;">Net Profit:</span>
                    <strong style="color: #10b981;">+৳${p.profitMargin.toLocaleString()} (${margin}%)</strong>
                  </div>
                </div>

                ${p.deliveryNotes ? `
                  <div style="font-size: 11px; color: #94a3b8; margin-bottom: 10px; font-style: italic;">
                    ℹ️ ${p.deliveryNotes}
                  </div>
                ` : ''}
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 10px; gap: 8px;">
                <button class="btn btn-sm btn-toggle-stock" data-id="${p.id}" data-current="${p.stock_status || p.stockStatus || 'available'}" style="font-size: 11px; padding: 4px 8px; font-weight: 700; background: ${(p.stock_status || p.stockStatus) === 'out_of_stock' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.15)'}; color: ${(p.stock_status || p.stockStatus) === 'out_of_stock' ? '#ef4444' : '#10b981'};">
                  ${(p.stock_status || p.stockStatus) === 'out_of_stock' ? '🔴 Stock Out' : '🟢 In Stock'}
                </button>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <span style="font-size: 11px; color: #64748b;">${p.vendorName ? p.vendorName.split(' ')[0] : 'Supplier'}</span>
                  <button class="btn btn-sm btn-secondary btn-quick-order" data-prod-id="${p.id}" data-prod-name="${p.name}" data-prod-sale="${p.salePrice}" data-prod-cost="${p.vendorPrice}" data-prod-dur="${p.duration}">
                    🛒 Order
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Filter clicks
    container.querySelectorAll('#prodCatFilterChips button').forEach(b => {
      b.addEventListener('click', (e) => {
        this.productCategoryFilter = e.currentTarget.getAttribute('data-cat');
        this.renderProductsTab(container);
      });
    });

    // Stock toggle clicks
    container.querySelectorAll('.btn-toggle-stock').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const curr = e.currentTarget.getAttribute('data-current');
        const next = curr === 'out_of_stock' ? 'available' : 'out_of_stock';
        try {
          await APP_API.patch(`/digistore/products/${id}/stock`, { stock_status: next });
          this.showToast(`Product stock status updated to ${next}`, 'success');
          await this.loadAllData();
          this.renderProductsTab(container);
        } catch (err) {
          alert('Stock update error: ' + err.message);
        }
      });
    });

    // Search filter
    const searchInput = container.querySelector('#inputSearchProducts');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const items = container.querySelectorAll('.product-card-item');
        items.forEach(it => {
          it.style.display = it.textContent.toLowerCase().includes(query) ? '' : 'none';
        });
      });
    }

    // Quick order click
    container.querySelectorAll('.btn-quick-order').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pId = e.currentTarget.getAttribute('data-prod-id');
        this.openNewOrderModal(pId);
      });
    });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 4: SUPPLIERS DIRECTORY
  // ───────────────────────────────────────────────────────────────────────────
  renderVendorsTab(container) {
    const list = (this.vendors && this.vendors.length > 0) ? this.vendors : [
      { id: 'v1', name: 'Premium Box Munir', contactType: 'whatsapp', contactHandle: '+880 1602-733832', phone: '01602733832', paymentMethod: 'bkash', avgDeliveryMin: 15, notes: 'AI & Gemini Pro 18M Specialist' },
      { id: 'v2', name: 'Farhan Ahmed Rifat (FarhanFlix)', contactType: 'whatsapp', contactHandle: '+880 1609-127266', phone: '01609127266', paymentMethod: 'bkash', avgDeliveryMin: 30, notes: 'Full Catalog & Streaming' }
    ];

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h3 style="font-size: 18px; font-weight: 700; color: #fff;">🏪 Verified Suppliers Directory (${list.length})</h3>
          <p style="color: var(--text-muted); font-size: 13px; margin-top: 2px;">
            Suppliers fulfillment contacts and procurement channels. Strict blind protocol applies.
          </p>
        </div>
        <button class="btn btn-primary" id="btnOpenAddVendorModal" style="display: flex; align-items: center; gap: 6px;">
          <span>➕</span> Add Supplier
        </button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px;">
        ${list.map(v => {
          const cleanPhone = (v.phone || v.contactHandle || '').replace(/[^0-9]/g, '');
          const isMunir = (v.name || '').toLowerCase().includes('munir');
          const borderColor = isMunir ? '#00df89' : '#38bdf8';
          const badgeText = isMunir ? '⭐ AI & VIDEO SPECIALIST' : '🛍️ CATALOG SUPPLIER';

          return `
            <div class="card vendor-card" style="padding: 24px; border-left: 4px solid ${borderColor}; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                  <div>
                    <span class="badge" style="background: rgba(255,255,255,0.08); color: ${borderColor}; font-size: 11px;">${badgeText}</span>
                    <h4 style="font-size: 18px; font-weight: 800; color: #fff; margin-top: 4px;">${v.name}</h4>
                  </div>
                  <span style="font-size: 20px;">${isMunir ? '💎' : '📦'}</span>
                </div>

                ${v.notes ? `
                  <div style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">
                    ${v.notes}
                  </div>
                ` : ''}

                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px; font-size: 13px; margin-bottom: 16px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #94a3b8;">Contact:</span>
                    <strong style="color: #38bdf8;">${v.contactHandle || v.phone || 'N/A'}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                    <span style="color: #94a3b8;">Payment:</span>
                    <span style="color: #fff;">${v.paymentMethod || 'bKash Personal'}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: #94a3b8;">Avg Fulfillment:</span>
                    <span style="color: #10b981; font-weight: 700;">${v.avgDeliveryMin || 20} Mins</span>
                  </div>
                </div>
              </div>

              <div style="display: flex; gap: 8px; margin-top: 10px;">
                ${cleanPhone ? `
                  <a href="https://wa.me/${cleanPhone}" target="_blank" class="btn btn-primary" style="flex: 2; text-align: center; text-decoration: none;">
                    💬 WhatsApp
                  </a>
                ` : ''}
                <button class="btn btn-secondary btn-edit-vendor" data-id="${v.id}" style="flex: 1;">
                  ✏️ Edit
                </button>
                <button class="btn btn-secondary btn-delete-vendor" data-id="${v.id}" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border-color: rgba(239, 68, 68, 0.3);">
                  🗑️
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    container.querySelector('#btnOpenAddVendorModal')?.addEventListener('click', () => {
      this.openNewVendorModal();
    });

    container.querySelectorAll('.btn-edit-vendor').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const v = list.find(item => item.id === id);
        if (v) this.openEditVendorModal(v);
      });
    });

    container.querySelectorAll('.btn-delete-vendor').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Are you sure you want to remove this supplier?')) {
          try {
            await APP_API.delete(`/digistore/vendors/${id}`);
            alert('Supplier removed successfully.');
            await this.loadAllData();
            this.renderVendorsTab(container);
          } catch (err) {
            alert('Error deleting supplier: ' + err.message);
          }
        }
      });
    });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 5: RENEWALS & RETENTION ENGINE
  // ───────────────────────────────────────────────────────────────────────────
  renderRenewalsTab(container) {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h3 style="font-size: 18px; font-weight: 700; color: #fff;">🔔 Subscriptions Due for Renewal (${this.renewals.length})</h3>
          <p style="color: var(--text-muted); font-size: 13px;">
            Automated cron detects subscriptions expiring in ≤ 7 days and dispatches Telegram notifications.
          </p>
        </div>
        <button class="btn btn-secondary btn-sm" id="btnTriggerRenewalCron" style="display: flex; align-items: center; gap: 6px; padding: 8px 14px; font-weight: 700;">
          <span>⚡</span> Run Retention Check Now
        </button>
      </div>

      ${this.renewals.length === 0 ? `
        <div class="card" style="padding: 48px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">✅</div>
          <div>No renewals pending in the next 7 days.</div>
        </div>
      ` : `
        <div class="card" style="padding: 0; overflow: hidden;">
          <table class="table" style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: rgba(0,0,0,0.3); border-bottom: 1px solid var(--border-subtle);">
                <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Customer</th>
                <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Subscription</th>
                <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Expiry Date</th>
                <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Days Left</th>
                <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Renewal Value</th>
                <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${this.renewals.map(r => `
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 14px 16px;">
                    <div style="font-weight: 700; color: #fff;">${r.customerName}</div>
                    <div style="font-size: 12px; color: var(--text-muted);">${r.customerContact}</div>
                  </td>
                  <td style="padding: 14px 16px;">
                    <div style="font-weight: 600; color: #fff;">${r.productName}</div>
                    <div style="font-size: 11px; color: #a855f7;">${r.duration}</div>
                  </td>
                  <td style="padding: 14px 16px; font-family: monospace; color: ${r.isExpired ? '#ef4444' : '#f59e0b'}; font-weight: 700;">
                    ${r.expiryDate}
                  </td>
                  <td style="padding: 14px 16px;">
                    ${r.isExpired ? `
                      <span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">⚠️ EXPIRED</span>
                    ` : `
                      <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">⏳ ${r.daysRemaining} days</span>
                    `}
                  </td>
                  <td style="padding: 14px 16px; font-weight: 700; color: #10b981;">
                    ৳${r.salePrice.toLocaleString()}
                  </td>
                  <td style="padding: 14px 16px; text-align: right;">
                    <div style="display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                      ${r.whatsappReminderLink ? `
                        <a href="${r.whatsappReminderLink}" target="_blank" class="btn btn-sm" style="background: rgba(37,211,102,0.15); color: #25d366; text-decoration: none; padding: 5px 10px; font-weight: 600;">
                          💬 WA Follow-up
                        </a>
                      ` : ''}
                      <button class="btn btn-sm btn-primary btn-renew-order" data-id="${r.id}">
                        🔄 Renew
                      </button>
                      <button class="btn btn-sm btn-secondary btn-procure-modal" data-id="${r.id}" style="padding: 5px 10px;">
                        ⚡ Procure
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;

    const btnCron = container.querySelector('#btnTriggerRenewalCron');
    if (btnCron) {
      btnCron.addEventListener('click', async () => {
        btnCron.disabled = true;
        btnCron.innerHTML = '<span>⏳</span> Evaluating...';
        try {
          const res = await APP_API.post('/digistore/cron/trigger-renewals');
          this.showToast(`✅ Retention evaluation done: ${res.data?.dueOrders?.length || 0} due, ${res.data?.remindersSent || 0} reminders sent`, 'success');
          await this.loadAllData();
          this.renderRenewalsTab(container);
        } catch (err) {
          alert('Cron Trigger Error: ' + err.message);
        } finally {
          btnCron.disabled = false;
          btnCron.innerHTML = '<span>⚡</span> Run Retention Check Now';
        }
      });
    }

    container.querySelectorAll('.btn-renew-order').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        try {
          await APP_API.post(`/digistore/orders/${id}/renew`);
          alert('Renewal order generated successfully!');
          await this.loadAllData();
          this.renderRenewalsTab(container);
        } catch (err) {
          alert('Error: ' + err.message);
        }
      });
    });

    container.querySelectorAll('.btn-procure-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const order = this.orders.find(o => o.id === id);
        if (order) this.openProcureModal(order);
      });
    });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 6: PROFIT ANALYTICS
  // ───────────────────────────────────────────────────────────────────────────
  renderAnalyticsTab(container) {
    const a = this.analytics || {};
    const topProds = a.topProducts || [];
    const channelMap = a.channelBreakdown || {};

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h3 style="font-size: 18px; font-weight: 700; color: #fff;">📊 DigiVault Commerce Intelligence</h3>
          <p style="color: var(--text-muted); font-size: 13px;">
            Financial telemetry across all digital subscription sales, margin breakdowns, and acquisition channels.
          </p>
        </div>
        <a href="/api/digistore/export/financials" download class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 6px; text-decoration: none; padding: 8px 12px; font-weight: 600;">
          <span>📊</span> Export Financials CSV
        </a>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 24px;">
        <!-- Top Products by Profit -->
        <div class="card" style="padding: 20px;">
          <h4 style="font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <span>🏆</span> Top 5 Products by Profit
          </h4>
          ${topProds.length === 0 ? `
            <div style="color: var(--text-muted); font-size: 13px; padding: 20px 0; text-align: center;">No verified sales data yet.</div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 12px;">
              ${topProds.map((tp, idx) => `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.25); padding: 10px 12px; border-radius: 8px;">
                  <div>
                    <div style="font-weight: 700; color: #fff; font-size: 13px;">${idx + 1}. ${tp.name}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">${tp.sales} units sold</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="color: #10b981; font-weight: 800; font-size: 13px;">+৳${tp.profit.toLocaleString()}</div>
                    <div style="font-size: 11px; color: #94a3b8;">Rev: ৳${tp.revenue.toLocaleString()}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Sales Channel Attribution -->
        <div class="card" style="padding: 20px;">
          <h4 style="font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <span>📢</span> Revenue by Acquisition Channel
          </h4>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${Object.entries(channelMap).length === 0 ? `
              <div style="color: var(--text-muted); font-size: 13px; padding: 20px 0; text-align: center;">No channel data yet.</div>
            ` : Object.entries(channelMap).map(([ch, rev]) => `
              <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.25); padding: 10px 12px; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span>${ch === 'facebook' ? '📘 Facebook DM' : ch === 'whatsapp' ? '💬 WhatsApp' : ch === 'telegram' ? '📱 Telegram' : '🌐 Web Store'}</span>
                </div>
                <strong style="color: #38bdf8; font-size: 14px;">৳${rev.toLocaleString()}</strong>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // MODALS
  // ───────────────────────────────────────────────────────────────────────────

  openNewOrderModal(preselectedProductId = null) {
    const modalContainer = document.getElementById('digiModalsContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="modal-card" style="background: #131722; border: 1px solid var(--border-subtle); border-radius: 12px; width: 100%; max-width: 540px; padding: 24px; max-height: 90vh; overflow-y: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="font-size: 18px; font-weight: 800; color: #fff;">🛒 Log New Subscription Order</h3>
            <button class="btn btn-sm btn-secondary btn-close-modal">✕</button>
          </div>

          <form id="formNewDigiOrder" style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Select Product</label>
              <select id="modalOrderProduct" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;">
                ${this.products.map(p => `
                  <option value="${p.id}" data-cost="${p.vendorPrice}" data-sale="${p.salePrice}" data-dur="${p.duration}" ${p.id === preselectedProductId ? 'selected' : ''}>
                    ${p.name} (${p.duration}) — ৳${p.salePrice}
                  </option>
                `).join('')}
              </select>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Customer Name *</label>
                <input type="text" id="modalOrderCustName" required placeholder="e.g. Zahid Hasan" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
              </div>
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Contact Phone / FB *</label>
                <input type="text" id="modalOrderCustContact" required placeholder="e.g. 017xxxxxxxx" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
              </div>
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">WhatsApp No. *</label>
                <input type="text" id="modalOrderCustWhatsapp" required placeholder="e.g. 018xxxxxxxx" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Channel</label>
                <select id="modalOrderChannel" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;">
                  <option value="facebook">Facebook DM</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="telegram">Telegram</option>
                  <option value="direct">Direct / Phone</option>
                </select>
              </div>
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Payment Method</label>
                <select id="modalOrderPayMethod" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;">
                  <option value="bkash">bKash Personal</option>
                  <option value="nagad">Nagad</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Sale Price (৳)</label>
                <input type="number" id="modalOrderSalePrice" required style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
              </div>
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Vendor Cost (৳)</label>
                <input type="number" id="modalOrderCostPrice" required style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
              </div>
            </div>

            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Internal Notes (Optional)</label>
              <textarea id="modalOrderNotes" rows="2" placeholder="e.g. requested family invite on client email" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;"></textarea>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
              <button type="button" class="btn btn-secondary btn-close-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Order</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Auto-update price fields on product change
    const selProd = modalContainer.querySelector('#modalOrderProduct');
    const inpSale = modalContainer.querySelector('#modalOrderSalePrice');
    const inpCost = modalContainer.querySelector('#modalOrderCostPrice');

    const syncPrices = () => {
      const opt = selProd.options[selProd.selectedIndex];
      if (opt) {
        inpSale.value = opt.getAttribute('data-sale') || 0;
        inpCost.value = opt.getAttribute('data-cost') || 0;
      }
    };
    selProd.addEventListener('change', syncPrices);
    syncPrices();

    // Close modal
    modalContainer.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => { modalContainer.innerHTML = ''; });
    });

    // Form submit
    const form = modalContainer.querySelector('#formNewDigiOrder');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pId = selProd.value;
      const opt = selProd.options[selProd.selectedIndex];
      const prodName = opt ? opt.textContent.split(' — ')[0].trim() : 'Subscription';
      const duration = opt ? opt.getAttribute('data-dur') : '1 Month';

      const payload = {
        productId: pId,
        productName: prodName,
        duration: duration,
        customerName: document.getElementById('modalOrderCustName').value.trim(),
        customerContact: document.getElementById('modalOrderCustContact').value.trim(),
        customerWhatsapp: document.getElementById('modalOrderCustWhatsapp').value.trim() || document.getElementById('modalOrderCustContact').value.trim(),
        contactChannel: document.getElementById('modalOrderChannel').value,
        paymentMethod: document.getElementById('modalOrderPayMethod').value,
        salePrice: Number(inpSale.value),
        vendorPrice: Number(inpCost.value),
        notes: document.getElementById('modalOrderNotes').value.trim()
      };

      try {
        await APP_API.post('/digistore/orders', payload);
        alert('Order created successfully!');
        modalContainer.innerHTML = '';
        await this.loadAllData();
        this.switchTab('orders');
      } catch (err) {
        alert('Error creating order: ' + err.message);
      }
    });
  },

  openRejectPaymentModal(order) {
    const modalContainer = document.getElementById('digiModalsContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="modal-card" style="background: #131722; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 12px; width: 100%; max-width: 480px; padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <span style="font-family: monospace; font-size: 12px; color: #38bdf8; font-weight: 700;">${order.orderNumber}</span>
              <h3 style="font-size: 18px; font-weight: 800; color: #ef4444;">❌ Reject Payment Verification</h3>
            </div>
            <button class="btn btn-sm btn-secondary btn-close-modal">✕</button>
          </div>

          <div style="background: rgba(0,0,0,0.25); border-radius: 8px; padding: 12px; font-size: 13px; margin-bottom: 16px;">
            <div style="color: #fff; font-weight: 700;">${order.productName} (৳${order.salePrice})</div>
            <div style="color: var(--text-muted); margin-top: 2px;">Customer: <strong>${order.customerName}</strong> (${order.customerContact})</div>
          </div>

          <form id="formRejectPayment" style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Select Rejection Reason *</label>
              <select id="modalRejectReasonSelect" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;">
                <option value="বিকাশ/নগদ স্টেটমেন্টে কোনো টাকা পাওয়া যায়নি">বিকাশ/নগদ স্টেটমেন্টে কোনো টাকা পাওয়া যায়নি (No payment received)</option>
                <option value="ভুল TrxID বা ফেক স্ক্রিনশট প্রদান করা হয়েছে">ভুল TrxID বা ফেক স্ক্রিনশট প্রদান করা হয়েছে (Invalid TrxID / Fake proof)</option>
                <option value="টাকার পরিমাণ কম পাঠানো হয়েছে">টাকার পরিমাণ কম পাঠানো হয়েছে (Partial / insufficient amount)</option>
                <option value="custom">অন্যান্য কারণ (Custom reason below)</option>
              </select>
            </div>

            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Custom Reason / Customer Explanation</label>
              <textarea id="modalRejectNotes" rows="2" placeholder="Explain why payment could not be verified..." style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;"></textarea>
            </div>

            <div id="rejectResultBox"></div>

            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px;">
              <button type="button" class="btn btn-secondary btn-close-modal">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btnSubmitReject" style="background: #ef4444; border-color: #ef4444; color: #fff; font-weight: 700;">
                Confirm Rejection ❌
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    modalContainer.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => { modalContainer.innerHTML = ''; });
    });

    const form = modalContainer.querySelector('#formRejectPayment');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnSubmitReject');
      btn.disabled = true;
      btn.textContent = 'Rejecting... ⏳';

      const sel = document.getElementById('modalRejectReasonSelect').value;
      const notes = document.getElementById('modalRejectNotes').value.trim();
      const finalReason = sel === 'custom' ? (notes || 'Payment verification failed') : (notes ? `${sel} — ${notes}` : sel);

      try {
        const res = await APP_API.patch(`/digistore/orders/${order.id}/reject-payment`, { reason: finalReason });
        const resultBox = document.getElementById('rejectResultBox');
        resultBox.innerHTML = `
          <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; padding: 12px; margin-top: 8px;">
            <div style="font-weight: 700; color: #ef4444; font-size: 13px; margin-bottom: 4px;">❌ Payment Rejected & Logged to Timeline!</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Customer Telegram bot notified automatically if linked. Use WhatsApp button below:</div>
            ${res.rejectionWhatsAppUrl ? `
              <a href="${res.rejectionWhatsAppUrl}" target="_blank" class="btn" style="background: #25d366; color: #000; font-weight: 700; width: 100%; text-align: center; text-decoration: none; display: block;">
                💬 Send Rejection Notice via WhatsApp ➔
              </a>
            ` : ''}
          </div>
        `;
        btn.textContent = 'Rejected ❌';
        await this.loadAllData();
      } catch (err) {
        alert('Error rejecting payment: ' + err.message);
        btn.disabled = false;
        btn.textContent = 'Confirm Rejection ❌';
      }
    });
  },

  openProcureModal(order) {
    const modalContainer = document.getElementById('digiModalsContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="modal-card" style="background: #131722; border: 1px solid var(--border-subtle); border-radius: 12px; width: 100%; max-width: 520px; padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <span style="font-family: monospace; font-size: 12px; color: #38bdf8; font-weight: 700;">${order.orderNumber}</span>
              <h3 style="font-size: 18px; font-weight: 800; color: #fff;">🛡️ Supplier Procurement & Payment Proof</h3>
            </div>
            <button class="btn btn-sm btn-secondary btn-close-modal">✕</button>
          </div>

          <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 14px; font-size: 13px; margin-bottom: 16px;">
            <div style="color: #fff; font-weight: 700; font-size: 15px;">${order.productName} (⏱️ ${order.duration})</div>
            <div style="color: var(--text-muted); margin-top: 4px;">Supplier: <strong style="color: #38bdf8;">${order.vendorName}</strong> (${order.vendorPhone || 'WhatsApp'})</div>
            <div style="color: #10b981; margin-top: 4px; font-weight: 700;">Customer Sale: ৳${order.salePrice.toLocaleString()} | Supplier Cost: ৳${order.vendorPrice.toLocaleString()}</div>
          </div>

          <form id="formProcureVendor" style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Vendor Payment Amount (৳) *</label>
              <input type="number" id="modalProcureAmount" required value="${order.vendorPrice || 170}" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 14px; font-weight: 700; margin-top: 4px;" />
            </div>

            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Upload Your Payment Screenshot to Supplier (bKash/Nagad)</label>
              <input type="file" id="modalProcureProofFile" accept="image/*" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 8px; color: #fff; font-size: 12px; margin-top: 4px;" />
              <span style="font-size: 11px; color: var(--text-muted);">Attaches proof of supplier payment in system audit timeline.</span>
            </div>

            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Procurement Notes (Optional)</label>
              <input type="text" id="modalProcureNotes" placeholder="e.g. Paid from bKash 01312415757" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
            </div>

            <div style="background: rgba(37, 211, 102, 0.08); border: 1px solid rgba(37, 211, 102, 0.25); border-radius: 8px; padding: 12px; font-size: 12px; color: #25d366;">
              🔒 <strong>Blind Protocol Active:</strong> Customer name & contact are strictly hidden. Vendor will only receive order ref and product details.
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
              <button type="button" class="btn btn-secondary btn-close-modal">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btnSubmitProcure" style="background: #25d366; color: #000; font-weight: 700;">
                💬 Save Proof & Open Supplier WhatsApp ➔
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    modalContainer.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => { modalContainer.innerHTML = ''; });
    });

    const form = modalContainer.querySelector('#formProcureVendor');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnSubmitProcure');
      btn.disabled = true;
      btn.textContent = 'Saving Proof & Opening WA... ⏳';

      const amount = document.getElementById('modalProcureAmount').value;
      const notes = document.getElementById('modalProcureNotes').value.trim();
      const fileInput = document.getElementById('modalProcureProofFile');

      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('notes', notes);
      if (fileInput.files.length > 0) {
        formData.append('proof', fileInput.files[0]);
      }

      try {
        const token = localStorage.getItem('gro10x_token') || sessionStorage.getItem('gro10x_token');
        const res = await fetch(`/api/digistore/orders/${order.id}/vendor-payment`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Procurement failed');

        if (json.data && json.data.procurementUrl) {
          window.open(json.data.procurementUrl, '_blank');
        }

        alert('✅ Vendor payment recorded & supplier WhatsApp opened!');
        modalContainer.innerHTML = '';
        await this.loadAllData();
        this.switchTab('orders');
      } catch (err) {
        alert('Error saving procurement: ' + err.message);
        btn.disabled = false;
        btn.textContent = '💬 Save Proof & Open Supplier WhatsApp ➔';
      }
    });
  },

  openDeliveryModal(order) {
    const modalContainer = document.getElementById('digiModalsContainer');
    if (!modalContainer) return;

    const isLinkProd = (order.productName || '').toLowerCase().includes('gemini') || (order.productName || '').toLowerCase().includes('veo') || order.deliveryType === 'link';

    modalContainer.innerHTML = `
      <div class="modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="modal-card" style="background: #131722; border: 1px solid var(--border-subtle); border-radius: 12px; width: 100%; max-width: 540px; padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <span style="font-family: monospace; font-size: 12px; color: #38bdf8; font-weight: 700;">${order.orderNumber}</span>
              <h3 style="font-size: 18px; font-weight: 800; color: #fff;">🔑 Order Fulfillment & Delivery</h3>
            </div>
            <button class="btn btn-sm btn-secondary btn-close-modal">✕</button>
          </div>

          <div style="background: rgba(0,0,0,0.25); border-radius: 8px; padding: 12px; font-size: 13px; margin-bottom: 16px;">
            <div style="color: #fff; font-weight: 700;">${order.productName} (⏱️ ${order.duration})</div>
            <div style="color: var(--text-muted); margin-top: 2px;">Customer: <strong>${order.customerName}</strong> | WA: <span style="color:#25d366;">${order.customerWhatsapp || order.customerContact}</span></div>
          </div>

          <!-- Preset Guideline Selector -->
          <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <label style="font-size: 12px; color: #38bdf8; font-weight: 700; display: flex; align-items: center; gap: 6px;">
              <span>⚡</span> Quick Guideline Preset Template:
            </label>
            <select id="selectGuidelinePreset" style="width: 100%; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 8px 10px; color: #fff; font-size: 13px; margin-top: 6px;">
              <option value="">-- Choose Guideline Preset Template --</option>
              <option value="gemini">Gemini Pro 18M (6-Step Clean Chrome Guide)</option>
              <option value="netflix">Netflix 4K UHD (Profile PIN & Household Rule)</option>
              <option value="canva">Canva Pro Edu (Team Invite Link Guide)</option>
              <option value="office">Office 365 / Google Drive (Login & Pass Change)</option>
              <option value="vpn">ExpressVPN / NordVPN (Key Activation Guide)</option>
            </select>
          </div>

          <!-- Mode Switcher -->
          <div style="display: flex; gap: 8px; margin-bottom: 16px; background: rgba(0,0,0,0.3); padding: 4px; border-radius: 8px;">
            <button type="button" class="btn btn-sm ${isLinkProd ? 'btn-primary' : 'btn-secondary'}" id="btnTabLinkMode" style="flex: 1;">
              🔗 Activation Link (Gemini)
            </button>
            <button type="button" class="btn btn-sm ${!isLinkProd ? 'btn-primary' : 'btn-secondary'}" id="btnTabCredsMode" style="flex: 1;">
              🔑 ID + Pass Credentials
            </button>
          </div>

          <!-- Link Delivery Form -->
          <form id="formLinkDelivery" style="display: ${isLinkProd ? 'flex' : 'none'}; flex-direction: column; gap: 14px;">
            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Unique Activation Link from Supplier *</label>
              <textarea id="modalActLink" required rows="3" placeholder="Paste link received from vendor (e.g. https://serviceactivation.google.com/subscription/new/AQCpiIG...)" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-family: monospace; font-size: 12px; margin-top: 4px;">${order.activationLink || ''}</textarea>
            </div>

            <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px; font-size: 11px; color: var(--text-muted); line-height: 1.5;">
              <strong style="color: #00df89; display: block; margin-bottom: 4px;">📋 What will be delivered:</strong>
              • The unique activation URL<br>
              • 6-Step Google Chrome guide (clean Gmail requirement)<br>
              • Instant [✅ Confirm] button in Telegram / Web<br>
              • WhatsApp Support link (01889825025)
            </div>

            <div id="linkDeliveryResult"></div>

            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px;">
              <button type="button" class="btn btn-secondary btn-close-modal">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btnSubmitLinkDeliver">Save Link & Dispatch 🚀</button>
            </div>
          </form>

          <!-- Credentials Delivery Form -->
          <form id="formCredsDelivery" style="display: ${!isLinkProd ? 'flex' : 'none'}; flex-direction: column; gap: 14px;">
            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Email / Login ID</label>
              <input type="text" id="modalCredEmail" placeholder="e.g. netflix_user@domain.com" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
            </div>

            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Password / Key / PIN</label>
              <input type="text" id="modalCredPass" placeholder="e.g. Pass@12345" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
            </div>

            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Instructions / Customer Notes</label>
              <textarea id="modalCredNotes" rows="2" placeholder="e.g. Please use Profile #3 only. Do not change password." style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;"></textarea>
            </div>

            <div id="credsDeliveryResult"></div>

            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px;">
              <button type="button" class="btn btn-secondary btn-close-modal">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btnSubmitCredsDeliver">Save & Deliver 🔑</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modalContainer.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => { modalContainer.innerHTML = ''; });
    });

    const btnTabLink = modalContainer.querySelector('#btnTabLinkMode');
    const btnTabCreds = modalContainer.querySelector('#btnTabCredsMode');
    const formLink = modalContainer.querySelector('#formLinkDelivery');
    const formCreds = modalContainer.querySelector('#formCredsDelivery');

    btnTabLink.addEventListener('click', () => {
      btnTabLink.className = 'btn btn-sm btn-primary';
      btnTabCreds.className = 'btn btn-sm btn-secondary';
      formLink.style.display = 'flex';
      formCreds.style.display = 'none';
    });

    btnTabCreds.addEventListener('click', () => {
      btnTabCreds.className = 'btn btn-sm btn-primary';
      btnTabLink.className = 'btn btn-sm btn-secondary';
      formCreds.style.display = 'flex';
      formLink.style.display = 'none';
    });

    // Preset selection logic
    const PRESETS = {
      gemini: {
        type: 'link',
        notes: "1. উপরের অ্যাক্টিভেশন লিংকটি কপি করুন\n2. Google Chrome-এ একটি নতুন Profile তৈরি করুন\n3. সেখানে একটি Clean Gmail দিয়ে লগইন করুন (যেখানে কোনো paid sub নেই)\n4. লিংকে গিয়ে 'FREE ACTIVATION' বাটনে ক্লিক করুন\n5. সফলভাবে অ্যাক্টিভেট হলে নিচে কনফার্ম করুন! 🎉"
      },
      netflix: {
        type: 'creds',
        notes: "⚠️ নিয়ম: শুধুমাত্র আপনার নির্ধারিত প্রোফাইল ও পিন ব্যবহার করবেন। পাসওয়ার্ড বা প্রোফাইল নেম পরিবর্তন করবেন না।"
      },
      canva: {
        type: 'link',
        notes: "1. উপরের টিম ইনভাইট লিংকে ক্লিক করুন\n2. আপনার ব্যক্তিগত ক্যানভা একাউন্টে লগইন করুন\n3. 'Join Team' চাপুন — সরাসরি প্রো ফিচার আনলক হয়ে যাবে! 🎨"
      },
      office: {
        type: 'creds',
        notes: "Portal: portal.office.com\n⚠️ প্রথমবার লগইন করার সাথে সাথে পাসওয়ার্ড পরিবর্তন করে নতুন সিকিউর পাসওয়ার্ড সেট করুন।"
      },
      vpn: {
        type: 'creds',
        notes: "Download: Official Website\nঅ্যাপ ইনস্টল করে এক্টিভেশন কি দিয়ে লগইন করুন।"
      }
    };

    const selPreset = modalContainer.querySelector('#selectGuidelinePreset');
    if (selPreset) {
      selPreset.addEventListener('change', (e) => {
        const val = e.target.value;
        const p = PRESETS[val];
        if (!p) return;

        if (p.type === 'link') {
          btnTabLink.click();
        } else {
          btnTabCreds.click();
          const inpNotes = document.getElementById('modalCredNotes');
          if (inpNotes) inpNotes.value = p.notes;
        }
      });
    }

    // Handle Link Delivery Submit
    formLink.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnSubmitLinkDeliver');
      btn.disabled = true;
      btn.textContent = 'Saving & Dispatching... ⏳';

      const activationLink = document.getElementById('modalActLink').value.trim();

      try {
        const res = await APP_API.post(`/digistore/orders/${order.id}/activation-link`, {
          activationLink,
          deliveryType: 'link'
        });

        const resultBox = document.getElementById('linkDeliveryResult');
        resultBox.innerHTML = `
          <div style="background: rgba(0, 223, 137, 0.1); border: 1px solid #00df89; border-radius: 8px; padding: 14px; margin-top: 10px;">
            <div style="font-weight: 700; color: #00df89; font-size: 13px; margin-bottom: 6px;">🎉 Link Saved & Dispatched!</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">Telegram bot dispatched automatically if linked. Use button below for WhatsApp:</div>
            ${res.whatsappDeliveryUrl ? `
              <a href="${res.whatsappDeliveryUrl}" target="_blank" class="btn btn-primary" style="background: #25d366; color: #000; font-weight: 700; width: 100%; text-align: center; text-decoration: none; display: block;">
                💬 Send Guide & Link via WhatsApp Now ➔
              </a>
            ` : ''}
          </div>
        `;
        btn.textContent = 'Dispatched ✅';
        await this.loadAllData();
      } catch (err) {
        alert('Error dispatching link: ' + err.message);
        btn.disabled = false;
        btn.textContent = 'Save Link & Dispatch 🚀';
      }
    });

    // Handle Creds Delivery Submit
    formCreds.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnSubmitCredsDeliver');
      btn.disabled = true;
      btn.textContent = 'Saving & Delivering... ⏳';

      const payload = {
        deliveryType: 'id_pass',
        credentialData: {
          email: document.getElementById('modalCredEmail').value.trim(),
          password: document.getElementById('modalCredPass').value.trim(),
          notes: document.getElementById('modalCredNotes').value.trim()
        }
      };

      try {
        const res = await APP_API.post(`/digistore/orders/${order.id}/deliver`, payload);
        const resultBox = document.getElementById('credsDeliveryResult');
        resultBox.innerHTML = `
          <div style="background: rgba(0, 223, 137, 0.1); border: 1px solid #00df89; border-radius: 8px; padding: 14px; margin-top: 10px;">
            <div style="font-weight: 700; color: #00df89; font-size: 13px; margin-bottom: 6px;">🔑 Credentials Delivered!</div>
            ${res.whatsappDeliveryUrl ? `
              <a href="${res.whatsappDeliveryUrl}" target="_blank" class="btn btn-primary" style="background: #25d366; color: #000; font-weight: 700; width: 100%; text-align: center; text-decoration: none; display: block;">
                💬 Send Credentials via WhatsApp ➔
              </a>
            ` : ''}
          </div>
        `;
        btn.textContent = 'Delivered ✅';
        await this.loadAllData();
      } catch (err) {
        alert('Error fulfilling order: ' + err.message);
        btn.disabled = false;
        btn.textContent = 'Save & Deliver 🔑';
      }
    });
  },

  openLightboxModal(imgSrc, title = 'Proof Screenshot Preview') {
    let rotation = 0;
    let scale = 1;

    const modalContainer = document.getElementById('digiModalsContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div id="lightboxBackdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.92); backdrop-filter: blur(10px); z-index: 99999; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
        <!-- Header Toolbar -->
        <div style="position: absolute; top: 16px; left: 20px; right: 20px; display: flex; justify-content: space-between; align-items: center; z-index: 100000; flex-wrap: wrap; gap: 8px;">
          <div style="color: #fff; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
            <span>📸</span> <span>${title}</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="btn btn-sm btn-secondary" id="btnLightboxRotate" style="padding: 6px 12px;">🔄 Rotate</button>
            <button class="btn btn-sm btn-secondary" id="btnLightboxZoomIn" style="padding: 6px 12px;">➕ Zoom In</button>
            <button class="btn btn-sm btn-secondary" id="btnLightboxZoomOut" style="padding: 6px 12px;">➖ Zoom Out</button>
            <a href="${imgSrc}" download target="_blank" class="btn btn-sm btn-secondary" style="padding: 6px 12px; text-decoration: none;">📥 Download</a>
            <button class="btn btn-sm btn-primary" id="btnLightboxClose" style="padding: 6px 14px; background: #ef4444; border: none; color: #fff;">✕ Close</button>
          </div>
        </div>

        <!-- Image Container -->
        <div style="max-width: 90vw; max-height: 80vh; overflow: hidden; display: flex; align-items: center; justify-content: center;">
          <img id="lightboxImage" src="${imgSrc}" alt="Lightbox Preview" style="max-width: 85vw; max-height: 75vh; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.8); transition: transform 0.25s ease;" />
        </div>
      </div>
    `;

    const img = document.getElementById('lightboxImage');
    const updateTransform = () => {
      if (img) img.style.transform = `rotate(${rotation}deg) scale(${scale})`;
    };

    document.getElementById('btnLightboxRotate').addEventListener('click', (e) => {
      e.stopPropagation();
      rotation = (rotation + 90) % 360;
      updateTransform();
    });

    document.getElementById('btnLightboxZoomIn').addEventListener('click', (e) => {
      e.stopPropagation();
      scale = Math.min(scale + 0.25, 3);
      updateTransform();
    });

    document.getElementById('btnLightboxZoomOut').addEventListener('click', (e) => {
      e.stopPropagation();
      scale = Math.max(scale - 0.25, 0.5);
      updateTransform();
    });

    const close = () => { modalContainer.innerHTML = ''; };
    document.getElementById('btnLightboxClose').addEventListener('click', close);
    document.getElementById('lightboxBackdrop').addEventListener('click', (e) => {
      if (e.target.id === 'lightboxBackdrop') close();
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') {
        close();
        window.removeEventListener('keydown', escHandler);
      }
    };
    window.addEventListener('keydown', escHandler);
  },

  openAdminCloseModal(order) {
    const modalContainer = document.getElementById('digiModalsContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="modal-card" style="background: #131722; border: 1px solid var(--border-subtle); border-radius: 12px; width: 100%; max-width: 500px; padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <span style="font-family: monospace; font-size: 12px; color: #38bdf8; font-weight: 700;">${order.orderNumber}</span>
              <h3 style="font-size: 18px; font-weight: 800; color: #fff;">🔒 Manual Order Closure</h3>
            </div>
            <button class="btn btn-sm btn-secondary btn-close-modal">✕</button>
          </div>

          <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 12px; font-size: 12px; color: #f87171; margin-bottom: 16px;">
            ⚠️ <strong>Screenshot Required:</strong> You must upload a screenshot of the WhatsApp delivery/confirmation to close this order manually for audit compliance.
          </div>

          <form id="formAdminClose" style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Closure Proof Screenshot *</label>
              <input type="file" id="modalClosureProofFile" required accept="image/*" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 8px; color: #fff; font-size: 12px; margin-top: 4px;" />
            </div>

            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Closure Notes / Reason</label>
              <textarea id="modalClosureNotes" rows="2" placeholder="e.g. Customer acknowledged on WhatsApp and verified activation on clean profile." style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;"></textarea>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px;">
              <button type="button" class="btn btn-secondary btn-close-modal">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btnSubmitAdminClose" style="background: #94a3b8; color: #000; font-weight: 700;">
                🔒 Save Proof & Close Order
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    modalContainer.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => { modalContainer.innerHTML = ''; });
    });

    const form = modalContainer.querySelector('#formAdminClose');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnSubmitAdminClose');
      const fileInput = document.getElementById('modalClosureProofFile');
      if (!fileInput.files || fileInput.files.length === 0) {
        return alert('Proof screenshot is mandatory!');
      }

      btn.disabled = true;
      btn.textContent = 'Closing Order... ⏳';

      const formData = new FormData();
      formData.append('closureProof', fileInput.files[0]);
      formData.append('notes', document.getElementById('modalClosureNotes').value.trim());

      try {
        const token = localStorage.getItem('gro10x_token') || sessionStorage.getItem('gro10x_token');
        const res = await fetch(`/api/digistore/orders/${order.id}/admin-close`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to close order');

        alert('✅ Order closed and proof screenshot saved!');
        modalContainer.innerHTML = '';
        await this.loadAllData();
        this.switchTab('orders');
      } catch (err) {
        alert('Error closing order: ' + err.message);
        btn.disabled = false;
        btn.textContent = '🔒 Save Proof & Close Order';
      }
    });
  },

  async openTimelineModal(order) {
    const modalContainer = document.getElementById('digiModalsContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="modal-card" style="background: #131722; border: 1px solid var(--border-subtle); border-radius: 12px; width: 100%; max-width: 560px; max-height: 80vh; overflow-y: auto; padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <span style="font-family: monospace; font-size: 12px; color: #38bdf8; font-weight: 700;">${order.orderNumber}</span>
              <h3 style="font-size: 18px; font-weight: 800; color: #fff;">📋 Order Audit Timeline</h3>
            </div>
            <button class="btn btn-sm btn-secondary btn-close-modal">✕</button>
          </div>

          <div style="background: rgba(0,0,0,0.25); border-radius: 8px; padding: 12px; font-size: 13px; margin-bottom: 20px;">
            <div style="color: #fff; font-weight: 700;">${order.productName}</div>
            <div style="color: var(--text-muted); margin-top: 2px;">Customer: <strong>${order.customerName}</strong> (${order.customerContact})</div>
          </div>

          <div id="timelineEventsContainer" style="display: flex; flex-direction: column; gap: 14px; padding-left: 10px; border-left: 2px solid rgba(255,255,255,0.1);">
            <div style="color: var(--text-muted); font-size: 13px;">Loading timeline events... ⏳</div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 20px;">
            <button type="button" class="btn btn-secondary btn-close-modal">Close</button>
          </div>
        </div>
      </div>
    `;

    modalContainer.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => { modalContainer.innerHTML = ''; });
    });

    try {
      const events = await APP_API.get(`/digistore/orders/${order.id}/timeline`);
      const container = document.getElementById('timelineEventsContainer');

      if (!events || events.length === 0) {
        container.innerHTML = `
          <div style="font-size: 13px; color: var(--text-muted); padding: 10px 0;">
            Created: ${new Date(order.createdAt).toLocaleString()}<br>
            Current Stage: <strong style="color: #38bdf8;">${order.orderStage}</strong>
          </div>
        `;
        return;
      }

      container.innerHTML = events.map(ev => `
        <div style="position: relative; padding-left: 16px;">
          <div style="position: absolute; left: -17px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: ${ev.stage.includes('closed') ? '#14b8a6' : ev.stage.includes('delivered') ? '#10b981' : ev.stage.includes('procuring') ? '#f97316' : '#38bdf8'}; border: 2px solid #131722;"></div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 2px;">
            <strong style="color: #fff; text-transform: uppercase;">${ev.stage.replace('_', ' ')}</strong>
            <span style="color: var(--text-muted); font-size: 11px;">${new Date(ev.created_at).toLocaleString()}</span>
          </div>
          <div style="font-size: 12px; color: #94a3b8;">${ev.note || ''}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Actor: <span style="color: #cbd5e1;">${ev.actor || 'system'}</span></div>
          ${ev.proof_url ? `<div style="margin-top: 4px;"><a href="${ev.proof_url}" target="_blank" style="font-size: 11px; color: #38bdf8; text-decoration: underline;">🖼️ View Uploaded Proof</a></div>` : ''}
        </div>
      `).join('');
    } catch (e) {
      document.getElementById('timelineEventsContainer').innerHTML = `<div style="color: #f87171; font-size: 13px;">Error loading timeline: ${e.message}</div>`;
    }
  },

  openNewProductModal() {
    const modalContainer = document.getElementById('digiModalsContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="modal-card" style="background: #131722; border: 1px solid var(--border-subtle); border-radius: 12px; width: 100%; max-width: 500px; padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="font-size: 18px; font-weight: 800; color: #fff;">📦 Add New Product to Catalog</h3>
            <button class="btn btn-sm btn-secondary btn-close-modal">✕</button>
          </div>

          <form id="formNewProduct" style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Product Title</label>
              <input type="text" id="modalNewProdName" required placeholder="e.g. Midjourney Pro Shared" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Category</label>
                <select id="modalNewProdCat" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;">
                  <option value="AI Tools">AI Tools</option>
                  <option value="Streaming">Streaming</option>
                  <option value="Music">Music</option>
                  <option value="Creative Tools">Creative Tools</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Professional">Professional</option>
                  <option value="Learning">Learning</option>
                  <option value="VPN">VPN</option>
                </select>
              </div>
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Duration</label>
                <input type="text" id="modalNewProdDuration" placeholder="e.g. 1 Month" value="1 Month" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Customer Price (৳)</label>
                <input type="number" id="modalNewProdSale" required placeholder="e.g. 500" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
              </div>
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Supplier Cost (৳)</label>
                <input type="number" id="modalNewProdCost" required placeholder="e.g. 300" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
              </div>
            </div>

            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Delivery Notes / Limits</label>
              <input type="text" id="modalNewProdNotes" placeholder="e.g. Max 1 Device, ID+Pass provided" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
              <button type="button" class="btn btn-secondary btn-close-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Product</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modalContainer.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => { modalContainer.innerHTML = ''; });
    });

    const form = modalContainer.querySelector('#formNewProduct');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('modalNewProdName').value.trim(),
        category: document.getElementById('modalNewProdCat').value,
        duration: document.getElementById('modalNewProdDuration').value.trim(),
        salePrice: Number(document.getElementById('modalNewProdSale').value),
        vendorPrice: Number(document.getElementById('modalNewProdCost').value),
        deliveryNotes: document.getElementById('modalNewProdNotes').value.trim()
      };

      try {
        await APP_API.post('/digistore/products', payload);
        alert('Product added to catalog!');
        modalContainer.innerHTML = '';
        await this.loadAllData();
        this.switchTab('products');
      } catch (err) {
        alert('Error adding product: ' + err.message);
      }
    });
  },

  openNewVendorModal() {
    const modalContainer = document.getElementById('digiModalsContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="modal-card" style="background: #131722; border: 1px solid var(--border-subtle); border-radius: 12px; width: 100%; max-width: 500px; padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 18px; font-weight: 800; color: #fff;">➕ Add New Supplier</h3>
            <button class="btn btn-sm btn-secondary btn-close-modal">✕</button>
          </div>

          <form id="formNewVendor" style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Supplier Name *</label>
              <input type="text" id="modalVendorName" required placeholder="e.g. Premium Box Munir" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">WhatsApp / Phone *</label>
                <input type="text" id="modalVendorPhone" required placeholder="e.g. 01602733832" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
              </div>
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Contact Handle</label>
                <input type="text" id="modalVendorHandle" placeholder="e.g. +880 1602-733832" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Payment Method</label>
                <input type="text" id="modalVendorPayment" placeholder="e.g. bKash Personal" value="bKash Personal" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
              </div>
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Avg Delivery (Mins)</label>
                <input type="number" id="modalVendorAvgMin" placeholder="30" value="20" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
              </div>
            </div>

            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Notes & Specialties</label>
              <textarea id="modalVendorNotes" rows="2" placeholder="e.g. AI & Gemini Pro 18M Specialist (91% Margin)" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;"></textarea>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px;">
              <button type="button" class="btn btn-secondary btn-close-modal">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btnSubmitNewVendor">Save Supplier</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modalContainer.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => { modalContainer.innerHTML = ''; });
    });

    const form = modalContainer.querySelector('#formNewVendor');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnSubmitNewVendor');
      btn.disabled = true;
      btn.textContent = 'Saving... ⏳';

      const payload = {
        name: document.getElementById('modalVendorName').value.trim(),
        phone: document.getElementById('modalVendorPhone').value.trim(),
        contactHandle: document.getElementById('modalVendorHandle').value.trim() || document.getElementById('modalVendorPhone').value.trim(),
        contactType: 'whatsapp',
        paymentMethod: document.getElementById('modalVendorPayment').value.trim(),
        avgDeliveryMin: Number(document.getElementById('modalVendorAvgMin').value) || 20,
        notes: document.getElementById('modalVendorNotes').value.trim()
      };

      try {
        await APP_API.post('/digistore/vendors', payload);
        alert('Supplier added successfully!');
        modalContainer.innerHTML = '';
        await this.loadAllData();
        this.switchTab('vendors');
      } catch (err) {
        alert('Error adding supplier: ' + err.message);
        btn.disabled = false;
        btn.textContent = 'Save Supplier';
      }
    });
  },

  openEditVendorModal(vendor) {
    const modalContainer = document.getElementById('digiModalsContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="modal-card" style="background: #131722; border: 1px solid var(--border-subtle); border-radius: 12px; width: 100%; max-width: 500px; padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h3 style="font-size: 18px; font-weight: 800; color: #fff;">✏️ Edit Supplier</h3>
            <button class="btn btn-sm btn-secondary btn-close-modal">✕</button>
          </div>

          <form id="formEditVendor" style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Supplier Name *</label>
              <input type="text" id="modalEditVendorName" required value="${vendor.name || ''}" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">WhatsApp / Phone *</label>
                <input type="text" id="modalEditVendorPhone" required value="${vendor.phone || vendor.contactHandle || ''}" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
              </div>
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Contact Handle</label>
                <input type="text" id="modalEditVendorHandle" value="${vendor.contactHandle || ''}" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Payment Method</label>
                <input type="text" id="modalEditVendorPayment" value="${vendor.paymentMethod || 'bKash Personal'}" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
              </div>
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Avg Delivery (Mins)</label>
                <input type="number" id="modalEditVendorAvgMin" value="${vendor.avgDeliveryMin || 20}" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
              </div>
            </div>

            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Notes & Specialties</label>
              <textarea id="modalEditVendorNotes" rows="2" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;">${vendor.notes || ''}</textarea>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 6px;">
              <button type="button" class="btn btn-secondary btn-close-modal">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btnSubmitEditVendor">Update Supplier</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modalContainer.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => { modalContainer.innerHTML = ''; });
    });

    const form = modalContainer.querySelector('#formEditVendor');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnSubmitEditVendor');
      btn.disabled = true;
      btn.textContent = 'Updating... ⏳';

      const payload = {
        name: document.getElementById('modalEditVendorName').value.trim(),
        phone: document.getElementById('modalEditVendorPhone').value.trim(),
        contactHandle: document.getElementById('modalEditVendorHandle').value.trim() || document.getElementById('modalEditVendorPhone').value.trim(),
        paymentMethod: document.getElementById('modalEditVendorPayment').value.trim(),
        avgDeliveryMin: Number(document.getElementById('modalEditVendorAvgMin').value) || 20,
        notes: document.getElementById('modalEditVendorNotes').value.trim()
      };

      try {
        await APP_API.put(`/digistore/vendors/${vendor.id}`, payload);
        alert('Supplier updated successfully!');
        modalContainer.innerHTML = '';
        await this.loadAllData();
        this.switchTab('vendors');
      } catch (err) {
        alert('Error updating supplier: ' + err.message);
        btn.disabled = false;
        btn.textContent = 'Update Supplier';
      }
    });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 7: 🔗 LINK STUDIO (UTM DEEP-LINK GENERATOR)
  // ───────────────────────────────────────────────────────────────────────────
  renderLinksTab(container) {
    const links = this.links || [];

    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 18px; font-weight: 700; color: #fff;">🔗 Link Studio — UTM Deep-Link Generator</h3>
        <p style="color: var(--text-muted); font-size: 13px;">
          Create tracked deep-links for Facebook posts, WhatsApp status, and Telegram channels. Track clicks, orders, and revenue per channel.
        </p>
      </div>

      <!-- Link Generator Form Card -->
      <div class="card" style="padding: 24px; margin-bottom: 24px; border-left: 4px solid var(--primary);">
        <h4 style="font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 14px;">✨ Generate New Tracked Link</h4>

        <form id="formGenLink" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; align-items: flex-end;">
          <div>
            <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Select Product</label>
            <select id="selLinkProduct" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;">
              ${this.products.map(p => `
                <option value="${p.id}" data-slug="${p.slug}" data-name="${p.name}">
                  ${p.name} (৳${p.salePrice})
                </option>
              `).join('')}
            </select>
          </div>

          <div>
            <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Marketing Channel</label>
            <select id="selLinkChannel" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;">
              <option value="facebook">📘 Facebook Post / Group</option>
              <option value="whatsapp">💬 WhatsApp Status / DM</option>
              <option value="telegram">📱 Telegram Channel</option>
              <option value="instagram">📸 Instagram Bio / Story</option>
              <option value="direct">🔗 Direct Share</option>
            </select>
          </div>

          <div>
            <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Campaign Tag</label>
            <input type="text" id="inpLinkCampaign" placeholder="e.g. aug-promo, gemini-blast" value="aug-promo" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
          </div>

          <div>
            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 11px;">
              🔗 Create Link
            </button>
          </div>
        </form>
      </div>

      <!-- Links List Table -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <div style="overflow-x: auto;">
          <table class="table" style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: rgba(0,0,0,0.3); border-bottom: 1px solid var(--border-subtle);">
                <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Product</th>
                <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Channel</th>
                <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Campaign</th>
                <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Clicks</th>
                <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Orders</th>
                <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase;">Shareable Link</th>
                <th style="padding: 14px 16px; font-size: 12px; color: #64748b; text-transform: uppercase; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${links.length === 0 ? `
                <tr>
                  <td colspan="7" style="padding: 40px; text-align: center; color: var(--text-muted);">
                    <div style="font-size: 28px; margin-bottom: 8px;">🔗</div>
                    <div>No campaign links created yet. Generate one above to track traffic!</div>
                  </td>
                </tr>
              ` : links.map(l => `
                <tr style="border-bottom: 1px solid var(--border-subtle);">
                  <td style="padding: 14px 16px; font-weight: 700; color: #fff;">
                    ${l.productName}
                  </td>
                  <td style="padding: 14px 16px;">
                    <span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;">
                      ${l.utmSource === 'facebook' ? '📘 Facebook' : l.utmSource === 'whatsapp' ? '💬 WhatsApp' : l.utmSource === 'telegram' ? '📱 Telegram' : '🔗 ' + l.utmSource}
                    </span>
                  </td>
                  <td style="padding: 14px 16px; font-family: monospace; color: #a855f7;">
                    ${l.utmCampaign}
                  </td>
                  <td style="padding: 14px 16px; font-weight: 700; color: #38bdf8;">
                    ${l.clickCount}
                  </td>
                  <td style="padding: 14px 16px; font-weight: 700; color: #00df89;">
                    ${l.orderCount}
                  </td>
                  <td style="padding: 14px 16px;">
                    <div style="font-size: 11px; color: var(--text-muted); max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: monospace;">
                      ${l.fullUrl}
                    </div>
                  </td>
                  <td style="padding: 14px 16px; text-align: right;">
                    <button class="btn btn-sm btn-secondary btn-copy-link" data-url="${l.fullUrl}" title="Copy Link">
                      📋 Copy
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Form submit
    const form = container.querySelector('#formGenLink');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const selProd = container.querySelector('#selLinkProduct');
      const opt = selProd.options[selProd.selectedIndex];
      const prodId = selProd.value;
      const slug = opt.getAttribute('data-slug');
      const prodName = opt.getAttribute('data-name');
      const channel = container.querySelector('#selLinkChannel').value;
      const campaign = container.querySelector('#inpLinkCampaign').value.trim() || 'promo';

      try {
        await APP_API.post('/digistore/links', {
          productId: prodId,
          productSlug: slug,
          productName: prodName,
          utmSource: channel,
          utmMedium: 'social',
          utmCampaign: campaign
        });

        alert('Tracked deep link generated successfully!');
        await this.loadAllData();
        this.renderLinksTab(container);
      } catch (err) {
        alert('Error: ' + err.message);
      }
    });

    // Copy link buttons
    container.querySelectorAll('.btn-copy-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = e.currentTarget.getAttribute('data-url');
        navigator.clipboard.writeText(url).then(() => {
          alert('Link copied to clipboard!');
        });
      });
    });
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 8: 📢 SOCIAL MEDIA STUDIO (FB & WHATSAPP GENERATOR)
  // ───────────────────────────────────────────────────────────────────────────
  renderSocialTab(container) {
    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 18px; font-weight: 700; color: #fff;">📢 Social Media & Post Copy Studio</h3>
        <p style="color: var(--text-muted); font-size: 13px;">
          Generate high-converting Facebook post captions (Bengali & English) and WhatsApp broadcasts with built-in UTM links.
        </p>
      </div>

      <!-- Selector Card -->
      <div class="card" style="padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 260px;">
            <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Choose Product to Promote</label>
            <select id="selSocialProduct" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;">
              ${this.products.map(p => `
                <option value="${p.id}" data-slug="${p.slug}">
                  ${p.isHero ? '⭐ ' : ''}${p.name} — ৳${p.salePrice}
                </option>
              `).join('')}
            </select>
          </div>

          <button id="btnGenerateSocialCopy" class="btn btn-primary" style="padding: 11px 24px;">
            ✨ Generate Post Copy
          </button>
        </div>
      </div>

      <!-- Output Container -->
      <div id="socialOutputContainer">
        <div class="card" style="padding: 40px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">📢</div>
          <div>Select a product and click "Generate Post Copy" to view formatted social templates.</div>
        </div>
      </div>
    `;

    const btnGen = container.querySelector('#btnGenerateSocialCopy');
    btnGen.addEventListener('click', async () => {
      const sel = container.querySelector('#selSocialProduct');
      const opt = sel.options[sel.selectedIndex];
      const prodId = sel.value;
      const slug = opt.getAttribute('data-slug');

      const out = container.querySelector('#socialOutputContainer');
      out.innerHTML = `<div class="card" style="padding: 40px; text-align: center; color: var(--text-muted);">Generating copy... ⏳</div>`;

      try {
        const res = await APP_API.post('/digistore/generate-post', {
          productId: prodId,
          productSlug: slug,
          channel: 'facebook'
        });

        const data = res.data || res;
        this.renderSocialOutput(out, data);
      } catch (err) {
        out.innerHTML = `<div class="card" style="padding: 30px; color: #ef4444;">Error: ${err.message}</div>`;
      }
    });
  },

  renderSocialOutput(container, data) {
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
        <!-- Bengali Facebook Post -->
        <div class="card" style="padding: 20px; border-top: 4px solid #38bdf8;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="font-size: 15px; font-weight: 700; color: #fff;">🇧🇩 Facebook Post (বাংলা)</h4>
            <button class="btn btn-sm btn-primary btn-copy-text" data-text-id="textPostBn">📋 Copy Caption</button>
          </div>
          <textarea id="textPostBn" readonly rows="12" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; color: #fff; font-size: 13px; font-family: inherit; line-height: 1.5; resize: none;">${data.postBn}</textarea>
        </div>

        <!-- English Facebook Post -->
        <div class="card" style="padding: 20px; border-top: 4px solid var(--primary);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="font-size: 15px; font-weight: 700; color: #fff;">🇬🇧 Facebook Post (English)</h4>
            <button class="btn btn-sm btn-primary btn-copy-text" data-text-id="textPostEn">📋 Copy Caption</button>
          </div>
          <textarea id="textPostEn" readonly rows="12" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; color: #fff; font-size: 13px; font-family: inherit; line-height: 1.5; resize: none;">${data.postEn}</textarea>
        </div>

        <!-- WhatsApp Broadcast Message -->
        <div class="card" style="padding: 20px; border-top: 4px solid #25d366;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="font-size: 15px; font-weight: 700; color: #fff;">💬 WhatsApp Broadcast DM</h4>
            <button class="btn btn-sm btn-primary btn-copy-text" data-text-id="textPostWa">📋 Copy WA Text</button>
          </div>
          <textarea id="textPostWa" readonly rows="12" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; color: #fff; font-size: 13px; font-family: inherit; line-height: 1.5; resize: none;">${data.postWa}</textarea>
        </div>
      </div>
    `;

    container.querySelectorAll('.btn-copy-text').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const textId = e.currentTarget.getAttribute('data-text-id');
        const textEl = document.getElementById(textId);
        if (textEl) {
          navigator.clipboard.writeText(textEl.value).then(() => {
            alert('Post caption copied to clipboard!');
          });
        }
      });
    });
  }
};

window.APP_MODULES.digistore = async function(container) {
  return DigistoreModule.render(container);
};

window.APP_MODULES['digistore.js'] = DigistoreModule;

