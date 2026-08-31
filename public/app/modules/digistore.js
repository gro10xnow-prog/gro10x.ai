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

window.APP_MODULES['digistore.js'] = {
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
    await this.loadAllData();
    this.switchTab('orders');
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
    const activeSubs = this.orders.filter(o => o.deliveryStatus === 'delivered').length;

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
      if (this.orderFilter === 'pending_payment') filtered = filtered.filter(o => o.paymentStatus === 'pending');
      else if (this.orderFilter === 'verified') filtered = filtered.filter(o => o.paymentStatus === 'verified');
      else if (this.orderFilter === 'delivered') filtered = filtered.filter(o => o.deliveryStatus === 'delivered');
      else if (this.orderFilter === 'rejected') filtered = filtered.filter(o => o.paymentStatus === 'rejected');
    }

    container.innerHTML = `
      <!-- Order Filters & Actions -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="orderFilterChips">
          <button class="filter-chip ${this.orderFilter === 'all' ? 'active' : ''}" data-filter="all">All Orders (${this.orders.length})</button>
          <button class="filter-chip ${this.orderFilter === 'pending_payment' ? 'active' : ''}" data-filter="pending_payment">⏳ Payment Pending</button>
          <button class="filter-chip ${this.orderFilter === 'verified' ? 'active' : ''}" data-filter="verified">✅ Payment Verified</button>
          <button class="filter-chip ${this.orderFilter === 'delivered' ? 'active' : ''}" data-filter="delivered">🔑 Delivered</button>
        </div>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="inputSearchOrders" placeholder="Search by customer, product, order #..." style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 8px 14px; color: #fff; font-size: 13px; min-width: 260px;" />
        </div>
      </div>

      <!-- Orders Table -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <div style="overflow-x: auto;">
          <table class="table" style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: rgba(0,0,0,0.3); border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.08));">
                <th style="padding: 14px 16px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">Order #</th>
                <th style="padding: 14px 16px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">Customer</th>
                <th style="padding: 14px 16px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">Product & Duration</th>
                <th style="padding: 14px 16px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">Sale / Cost / Profit</th>
                <th style="padding: 14px 16px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">Payment Status</th>
                <th style="padding: 14px 16px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">🛡️ Blind Procurement</th>
                <th style="padding: 14px 16px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">Delivery</th>
                <th style="padding: 14px 16px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase; text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="ordersTableBody">
              ${filtered.length === 0 ? `
                <tr>
                  <td colspan="8" style="padding: 48px; text-align: center; color: var(--text-muted);">
                    <div style="font-size: 32px; margin-bottom: 8px;">📭</div>
                    <div>No orders found. Click <strong>"Log New Order"</strong> to record your first sale!</div>
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

    let paymentBadge = `<span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">⏳ Pending</span>`;
    if (isPaid) paymentBadge = `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">✅ Verified</span>`;
    if (o.paymentStatus === 'rejected') paymentBadge = `<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3);">❌ Rejected</span>`;

    let deliveryBadge = `<span class="badge" style="background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3);">⏳ Unfulfilled</span>`;
    if (isDelivered) deliveryBadge = `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">🔑 Delivered</span>`;

    return `
      <tr style="border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.05));" data-order-id="${o.id}">
        <td style="padding: 14px 16px; font-family: monospace; font-weight: 700; color: #38bdf8;">
          ${o.orderNumber}
        </td>
        <td style="padding: 14px 16px;">
          <div style="font-weight: 700; color: #fff;">${o.customerName}</div>
          <div style="font-size: 12px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; margin-top: 2px;">
            <span>${o.contactChannel === 'facebook' ? '📘' : o.contactChannel === 'whatsapp' ? '💬' : '📱'}</span>
            <span>${o.customerContact}</span>
          </div>
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
          ${paymentBadge}
          ${o.paymentProofUrl ? `<div style="margin-top: 4px;"><a href="${o.paymentProofUrl}" target="_blank" style="font-size: 11px; color: #38bdf8; text-decoration: underline;">🖼️ View Proof</a></div>` : ''}
        </td>
        <td style="padding: 14px 16px;">
          ${o.procurementLink ? `
            <a href="${o.procurementLink}" target="_blank" class="btn" style="padding: 4px 10px; font-size: 11px; background: rgba(37, 211, 102, 0.15); color: #25d366; border: 1px solid rgba(37, 211, 102, 0.3); border-radius: 6px; display: inline-flex; align-items: center; gap: 5px; text-decoration: none; font-weight: 600;">
              <span>💬</span> Procure (WA)
            </a>
            <div style="font-size: 10px; color: #64748b; margin-top: 3px;">To: ${o.vendorName.split(' ')[0]}</div>
          ` : `<span style="font-size: 11px; color: #64748b;">No Vendor Phone</span>`}
        </td>
        <td style="padding: 14px 16px;">
          ${deliveryBadge}
          ${o.expiryDate ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 3px;">Expires: ${o.expiryDate}</div>` : ''}
        </td>
        <td style="padding: 14px 16px; text-align: right;">
          <div style="display: flex; gap: 6px; justify-content: flex-end;">
            ${!isPaid ? `
              <button class="btn btn-sm btn-success btn-verify-pay" data-id="${o.id}" title="Verify Payment">✅ Verify</button>
            ` : ''}
            ${!isDelivered ? `
              <button class="btn btn-sm btn-primary btn-open-deliver" data-id="${o.id}" title="Enter Credentials & Deliver">🔑 Deliver</button>
            ` : `
              <button class="btn btn-sm btn-secondary btn-renew-order" data-id="${o.id}" title="Renew Subscription">🔄 Renew</button>
            `}
          </div>
        </td>
      </tr>
    `;
  },

  bindOrderRowActions(container) {
    // Verify Payment button
    container.querySelectorAll('.btn-verify-pay').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        try {
          const res = await APP_API.patch(`/digistore/orders/${id}/verify-payment`);
          if (res && res.message) {
            alert(res.message);
            await this.loadAllData();
            this.renderOrdersTab(container);
          }
        } catch (err) {
          alert('Error verifying payment: ' + err.message);
        }
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

    // Renew button
    container.querySelectorAll('.btn-renew-order').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Create a renewal order for this subscription?')) {
          try {
            await APP_API.post(`/digistore/orders/${id}/renew`);
            alert('Renewal order created!');
            await this.loadAllData();
            this.renderOrdersTab(container);
          } catch (err) {
            alert('Error creating renewal: ' + err.message);
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

    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 18px; font-weight: 700; color: #fff;">🔑 Action Center — Unfulfilled Orders (${queue.length})</h3>
        <p style="color: var(--text-muted); font-size: 13px;">
          These orders have verified customer payments. Procure credentials from the supplier and enter them into the vault to dispatch to the customer.
        </p>
      </div>

      ${queue.length === 0 ? `
        <div class="card" style="padding: 48px; text-align: center; color: var(--text-muted);">
          <div style="font-size: 36px; margin-bottom: 12px;">🎉</div>
          <div style="font-size: 16px; font-weight: 700; color: #fff;">Delivery Queue is Clear!</div>
          <div style="font-size: 13px; margin-top: 4px;">All paid orders have been successfully fulfilled.</div>
        </div>
      ` : `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 16px;">
          ${queue.map(o => `
            <div class="card" style="padding: 20px; border-top: 4px solid #f59e0b; display: flex; flex-direction: column; justify-content: space-between;">
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
                  <div style="color: #94a3b8; margin-top: 4px;">Supplier: <strong style="color: #38bdf8;">${o.vendorName}</strong></div>
                  <div style="color: #10b981; margin-top: 4px; font-weight: 700;">Net Profit: +৳${o.profit.toLocaleString()}</div>
                </div>
              </div>

              <div style="display: flex; gap: 8px; margin-top: 12px;">
                ${o.procurementLink ? `
                  <a href="${o.procurementLink}" target="_blank" class="btn btn-secondary" style="flex: 1; text-align: center; text-decoration: none; font-size: 12px; display: flex; align-items: center; justify-content: center; gap: 6px;">
                    <span>💬</span> WhatsApp Supplier
                  </a>
                ` : ''}
                <button class="btn btn-primary btn-queue-deliver" data-id="${o.id}" style="flex: 1; font-size: 12px;">
                  🔑 Enter Credentials
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    `;

    container.querySelectorAll('.btn-queue-deliver').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const order = this.orders.find(o => o.id === id);
        if (order) this.openDeliveryModal(order);
      });
    });
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

              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
                <span style="font-size: 11px; color: #64748b;">Supplier: ${p.vendorName ? p.vendorName.split(' ')[0] : 'Farhan'}</span>
                <button class="btn btn-sm btn-secondary btn-quick-order" data-prod-id="${p.id}" data-prod-name="${p.name}" data-prod-sale="${p.salePrice}" data-prod-cost="${p.vendorPrice}" data-prod-dur="${p.duration}">
                  🛒 Order
                </button>
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
    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 18px; font-weight: 700; color: #fff;">🏪 Verified Suppliers Directory</h3>
        <p style="color: var(--text-muted); font-size: 13px;">
          Suppliers fulfillment contacts and procurement channels. Strict blind protocol applies.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px;">
        <!-- Vendor A: Munir -->
        <div class="card" style="padding: 24px; border-left: 4px solid #00df89;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <span class="badge" style="background: rgba(0, 223, 137, 0.15); color: #00df89; font-size: 11px;">⭐ AI & VIDEO SPECIALIST</span>
              <h4 style="font-size: 18px; font-weight: 800; color: #fff; margin-top: 4px;">Premium Box Munir</h4>
            </div>
            <span style="font-size: 20px;">💎</span>
          </div>
          
          <div style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">
            Primary Supplier for <strong>Gemini Pro 18M Admin Accounts (91% Margin)</strong>, VEO 3 Ultra Video generation, and Official CapCut Premium.
          </div>

          <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px; font-size: 13px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #94a3b8;">WhatsApp:</span>
              <strong style="color: #38bdf8;">+880 1602-733832</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #94a3b8;">Payment Method:</span>
              <span style="color: #fff;">bKash Personal</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Avg Fulfillment:</span>
              <span style="color: #10b981; font-weight: 700;">10 - 20 Mins</span>
            </div>
          </div>

          <a href="https://wa.me/8801602733832" target="_blank" class="btn btn-primary" style="width: 100%; text-align: center; text-decoration: none; display: block;">
            💬 Open Munir on WhatsApp
          </a>
        </div>

        <!-- Vendor B: Farhan -->
        <div class="card" style="padding: 24px; border-left: 4px solid #38bdf8;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 11px;">🛍️ GENERAL CATALOG SUPPLIER</span>
              <h4 style="font-size: 18px; font-weight: 800; color: #fff; margin-top: 4px;">Farhan Ahmed Rifat (FarhanFlix)</h4>
            </div>
            <span style="font-size: 20px;">📦</span>
          </div>

          <div style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">
            Full-catalog supplier covering <strong>40+ streaming, audio, creative tools, Office365, Google Drive, and LinkedIn packs</strong>.
          </div>

          <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px; font-size: 13px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #94a3b8;">WhatsApp:</span>
              <strong style="color: #38bdf8;">+880 1609-127266</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #94a3b8;">Telegram:</span>
              <span style="color: #fff;">@farhan_ahmed_rifat</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #94a3b8;">Payment Method:</span>
              <span style="color: #fff;">bKash Personal</span>
            </div>
          </div>

          <a href="https://wa.me/8801609127266" target="_blank" class="btn btn-primary" style="width: 100%; text-align: center; text-decoration: none; display: block;">
            💬 Open Farhan on WhatsApp
          </a>
        </div>
      </div>
    `;
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 5: RENEWALS & RETENTION ENGINE
  // ───────────────────────────────────────────────────────────────────────────
  renderRenewalsTab(container) {
    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 18px; font-weight: 700; color: #fff;">🔔 Subscriptions Due for Renewal (${this.renewals.length})</h3>
        <p style="color: var(--text-muted); font-size: 13px;">
          Automated cron detects subscriptions expiring in ≤ 7 days so you can follow up with customers before they lapse.
        </p>
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
                    <button class="btn btn-sm btn-primary btn-renew-order" data-id="${r.id}">
                      🔄 Renew Order
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;

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
  },

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 6: PROFIT ANALYTICS
  // ───────────────────────────────────────────────────────────────────────────
  renderAnalyticsTab(container) {
    const a = this.analytics || {};
    const topProds = a.topProducts || [];
    const channelMap = a.channelBreakdown || {};

    container.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 18px; font-weight: 700; color: #fff;">📊 DigiVault Commerce Intelligence</h3>
        <p style="color: var(--text-muted); font-size: 13px;">
          Financial telemetry across all digital subscription sales, margin breakdowns, and acquisition channels.
        </p>
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

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Customer Name</label>
                <input type="text" id="modalOrderCustName" required placeholder="e.g. Zahid Hasan" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
              </div>
              <div>
                <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Contact Handle / Phone</label>
                <input type="text" id="modalOrderCustContact" required placeholder="e.g. 017xxxxxxxx or FB Link" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
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

  openDeliveryModal(order) {
    const modalContainer = document.getElementById('digiModalsContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="modal-backdrop" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px;">
        <div class="modal-card" style="background: #131722; border: 1px solid var(--border-subtle); border-radius: 12px; width: 100%; max-width: 500px; padding: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <span style="font-family: monospace; font-size: 12px; color: #38bdf8; font-weight: 700;">${order.orderNumber}</span>
              <h3 style="font-size: 18px; font-weight: 800; color: #fff;">🔑 Credential Vault Fulfillment</h3>
            </div>
            <button class="btn btn-sm btn-secondary btn-close-modal">✕</button>
          </div>

          <div style="background: rgba(0,0,0,0.25); border-radius: 8px; padding: 12px; font-size: 13px; margin-bottom: 16px;">
            <div style="color: #fff; font-weight: 700;">${order.productName}</div>
            <div style="color: var(--text-muted); margin-top: 2px;">Customer: <strong>${order.customerName}</strong> (${order.customerContact})</div>
          </div>

          <form id="formFulfillDelivery" style="display: flex; flex-direction: column; gap: 14px;">
            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Email / Login ID</label>
              <input type="text" id="modalCredEmail" placeholder="e.g. netflix_user@domain.com" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
            </div>

            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Password / Key / PIN</label>
              <input type="text" id="modalCredPass" placeholder="e.g. Pass@12345" style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
            </div>

            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Redemption Link / Invite URL (If applicable)</label>
              <input type="url" id="modalCredLink" placeholder="e.g. https://www.linkedin.com/premium/redeem/..." style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;" />
            </div>

            <div>
              <label style="font-size: 12px; color: #94a3b8; font-weight: 600;">Instructions / Customer Notes</label>
              <textarea id="modalCredNotes" rows="2" placeholder="e.g. Please use Profile #3 only." style="width: 100%; background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px; color: #fff; font-size: 13px; margin-top: 4px;"></textarea>
            </div>

            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px;">
              <button type="button" class="btn btn-secondary btn-close-modal">Cancel</button>
              <button type="submit" class="btn btn-primary">Save & Mark Delivered</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modalContainer.querySelectorAll('.btn-close-modal').forEach(b => {
      b.addEventListener('click', () => { modalContainer.innerHTML = ''; });
    });

    const form = modalContainer.querySelector('#formFulfillDelivery');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        deliveryType: 'id_pass',
        credentialData: {
          email: document.getElementById('modalCredEmail').value.trim(),
          password: document.getElementById('modalCredPass').value.trim(),
          link: document.getElementById('modalCredLink').value.trim(),
          notes: document.getElementById('modalCredNotes').value.trim()
        }
      };

      try {
        const res = await APP_API.post(`/digistore/orders/${order.id}/deliver`, payload);
        alert(res.message || 'Credentials stored & marked as delivered!');
        modalContainer.innerHTML = '';
        await this.loadAllData();
        this.switchTab('orders');
      } catch (err) {
        alert('Error fulfilling order: ' + err.message);
      }
    });
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

