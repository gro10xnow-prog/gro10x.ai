/**
 * public/app/modules/webhooks.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Admin Command Center — Outbound Webhook Subscriptions & Delivery Desk
 * Allows ops to manage real-time event subscriptions, test webhooks, and audit logs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.WEBHOOKS_MODULE = (function() {
  let subscriptions = [];
  let deliveries = [];
  let isLoading = false;

  async function init(container) {
    container.innerHTML = `
      <div class="view-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <div>
          <h2 style="font-size:1.4rem; font-weight:800; font-family:var(--font-heading); margin:0;">
            🔗 Webhook Subscriptions & Delivery Logs
          </h2>
          <p style="color:var(--text-muted); font-size:0.85rem; margin:0.25rem 0 0 0;">
            Manage authenticated HMAC-SHA256 outbound webhooks to external partners, CRM, and Zapier/Make.
          </p>
        </div>
        <button class="btn-primary" onclick="window.WEBHOOKS_MODULE.openAddModal()" style="display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; padding:0.45rem 1rem;">
          <span>➕</span> New Subscription
        </button>
      </div>

      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1.5rem;" id="webhooksLayout">
        <!-- Subscriptions Table -->
        <div class="card" style="background:var(--surface-card, #181824); border:1px solid var(--border-subtle, #2e2e3e); border-radius:14px; padding:1.25rem;">
          <h3 style="font-size:1.05rem; font-weight:700; margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;">
            <span>📡</span> Active Subscriptions (<span id="subCount">0</span>)
          </h3>
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
              <thead>
                <tr style="border-bottom:1px solid var(--border-subtle, #2e2e3e); text-align:left; color:var(--text-muted);">
                  <th style="padding:0.6rem 0.5rem;">Target URL</th>
                  <th style="padding:0.6rem 0.5rem;">Events</th>
                  <th style="padding:0.6rem 0.5rem;">Type</th>
                  <th style="padding:0.6rem 0.5rem;">Status</th>
                  <th style="padding:0.6rem 0.5rem; text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody id="subscriptionsTableBody">
                <tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">Loading subscriptions...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Telemetry & Verification Panel -->
        <div class="card" style="background:var(--surface-card, #181824); border:1px solid var(--border-subtle, #2e2e3e); border-radius:14px; padding:1.25rem;">
          <h3 style="font-size:1.05rem; font-weight:700; margin-bottom:1rem; display:flex; align-items:center; gap:0.5rem;">
            <span>🛡️</span> Security & Signature Specs
          </h3>
          <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.6; display:flex; flex-direction:column; gap:0.75rem;">
            <p>Outbound webhooks include the following security headers:</p>
            <div style="background:rgba(0,0,0,0.3); padding:0.75rem; border-radius:8px; font-family:monospace; font-size:0.75rem;">
              X-GRO10X-Signature: hex(hmac_sha256)<br>
              X-GRO10X-Event: &lt;event_type&gt;<br>
              X-GRO10X-Delivery: DELIV-&lt;uuid&gt;
            </div>
            <p style="color:var(--text-muted); font-size:0.75rem;">
              Supported Events: <code>proposal.accepted</code>, <code>change_order.approved</code>, <code>invoice.paid</code>, <code>ticket.sla_breach_holdback</code>, <code>affiliate.payout_requested</code>.
            </p>
          </div>
        </div>
      </div>
    `;

    await loadSubscriptions();
  }

  async function loadSubscriptions() {
    try {
      const res = await APP_API.get('/webhooks/subscriptions');
      subscriptions = (res && res.subscriptions) || [];
      renderSubscriptions();
    } catch (err) {
      console.warn('[Webhooks Module] Load failed:', err);
      const tbody = document.getElementById('subscriptionsTableBody');
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No subscriptions configured yet.</td></tr>`;
      }
    }
  }

  function renderSubscriptions() {
    const tbody = document.getElementById('subscriptionsTableBody');
    const countEl = document.getElementById('subCount');
    if (countEl) countEl.innerText = subscriptions.length;
    if (!tbody) return;

    if (subscriptions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No active webhook subscriptions. Click "New Subscription" above to create one.</td></tr>`;
      return;
    }

    tbody.innerHTML = subscriptions.map(sub => `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
        <td style="padding:0.75rem 0.5rem; font-family:monospace; word-break:break-all; max-width:260px;">
          ${escapeHtml(sub.target_url || sub.targetUrl || '')}
        </td>
        <td style="padding:0.75rem 0.5rem;">
          <span style="font-size:0.75rem; background:rgba(0,223,137,0.1); color:#00df89; padding:0.15rem 0.4rem; border-radius:4px;">
            ${Array.isArray(sub.events) ? sub.events.join(', ') : (sub.events || '*')}
          </span>
        </td>
        <td style="padding:0.75rem 0.5rem; text-transform:capitalize; color:var(--text-muted);">
          ${escapeHtml(sub.stakeholder_type || sub.stakeholderType || 'system')}
        </td>
        <td style="padding:0.75rem 0.5rem;">
          <span style="font-size:0.75rem; background:rgba(16,185,129,0.15); color:#10b981; padding:0.15rem 0.5rem; border-radius:10px;">Active</span>
        </td>
        <td style="padding:0.75rem 0.5rem; text-align:right;">
          <button onclick="window.WEBHOOKS_MODULE.deleteSub('${sub.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:0.85rem;" title="Delete Subscription">🗑️</button>
        </td>
      </tr>
    `).join('');
  }

  async function deleteSub(id) {
    if (!confirm('Are you sure you want to remove this webhook subscription?')) return;
    try {
      await APP_API.delete(`/webhooks/subscriptions/${id}`);
      await loadSubscriptions();
    } catch (err) {
      alert('Failed to delete subscription: ' + err.message);
    }
  }

  function openAddModal() {
    const url = prompt('Enter Destination Webhook URL (HTTPS required):');
    if (!url) return;
    APP_API.post('/webhooks/subscriptions', {
      targetUrl: url,
      events: ['*'],
      stakeholderType: 'internal'
    }).then(() => {
      loadSubscriptions();
    }).catch(err => {
      alert('Error creating subscription: ' + err.message);
    });
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, function(m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  return {
    init,
    openAddModal,
    deleteSub
  };
})();
