/**
 * public/app/modules/automation.js
 * Telegram Bot Engine, Workflows, Automation Rules & Webhook Log Viewer Module
 * v2.0 — Full Rebuild with corrected API paths, Automation Rules tab, system health KPIs,
 * loading/error states, and toast notifications.
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.automation = async function(container) {
  let healthData = {};
  let logsData = [];
  let groupsData = [];
  let rulesData = [];
  let activeSubtab = 'logs';
  let isLoading = true;
  let hasError = false;

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  async function loadData() {
    isLoading = true;
    hasError = false;
    renderSkeleton();

    try {
      const [health, logs, groups, rules] = await Promise.all([
        APP_API.get('/automation/health').catch(() => ({})),
        APP_API.get('/automation/logs').catch(() => []),
        APP_API.get('/automation/groups').catch(() => []),
        APP_API.get('/automation/rules').catch(() => [])
      ]);

      healthData = health || {};
      logsData = Array.isArray(logs) ? logs : [];
      groupsData = Array.isArray(groups) ? groups : [];
      rulesData = Array.isArray(rules) ? rules : [];

      isLoading = false;
      renderView();
    } catch (err) {
      console.error('[Automation Module] Load error:', err);
      isLoading = false;
      hasError = true;
      renderErrorState(err.message || 'Failed to load automation data.');
    }
  }

  function renderSkeleton() {
    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <div>
          <h1 style="font-size:1.6rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">
            ⚡ Bot Engine & Automation Workflows
          </h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">
            Telegram bot health monitoring, webhook execution logs, automation rules, and broadcast engine.
          </div>
        </div>
      </div>
      <div style="padding:3rem; text-align:center; color:var(--text-muted);">Loading automation engine...</div>
    `;
  }

  function renderErrorState(message) {
    container.innerHTML = `
      <div style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:16px; padding:3rem; text-align:center; color:#fca5a5; margin-top:2rem;">
        <div style="font-size:2.5rem; margin-bottom:0.5rem;">⚠️</div>
        <div style="font-size:1.1rem; font-weight:700; color:#fff; margin-bottom:0.4rem;">Error Loading Automation Engine</div>
        <div style="font-size:0.85rem; margin-bottom:1.5rem;">${escapeHTML(message)}</div>
        <button class="btn-primary" onclick="window.AUTOMATION_MODULE.reload()">🔄 Retry Loading</button>
      </div>
    `;
  }

  function renderView() {
    const teamBotOnline = healthData.teamBot === 'active';
    const clientBotOnline = healthData.clientBot === 'active';
    const activeRules = rulesData.filter(r => r.active).length;

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h1 style="font-size:1.6rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">
            ⚡ Bot Engine & Automation Workflows
          </h1>
          <div style="font-size:0.88rem; color:var(--text-muted);">
            Telegram bot health monitoring, webhook execution logs, automation rules, and broadcast engine.
          </div>
        </div>
        <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
          <button class="btn-secondary" onclick="window.AUTOMATION_MODULE.triggerCron()">⏱️ Trigger Cron Run</button>
          <button class="btn-primary" onclick="window.AUTOMATION_MODULE.openBroadcastModal()">📣 Send Telegram Broadcast</button>
        </div>
      </div>

      <!-- KPI System Health Tiles -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(190px, 1fr)); gap:1.25rem; margin-bottom:1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Team Bot Status</div>
          <div class="kpi-val" style="color:${teamBotOnline ? 'var(--emerald-brand)' : '#ef4444'};">${teamBotOnline ? '🟢 Online' : '🔴 Offline'}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Client Bot Status</div>
          <div class="kpi-val" style="color:${clientBotOnline ? 'var(--emerald-brand)' : '#ef4444'};">${clientBotOnline ? '🟢 Online' : '🔴 Offline'}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Database</div>
          <div class="kpi-val" style="color:${healthData.dbConnection === 'Connected' ? 'var(--emerald-brand)' : '#ef4444'};">${escapeHTML(healthData.dbConnection || 'Unknown')}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Active SSE Clients</div>
          <div class="kpi-val" style="color:var(--purple-light);">${healthData.sseClients || 0}</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Server Memory (RSS)</div>
          <div class="kpi-val">${(healthData.memoryUsage || 0).toFixed(1)} MB</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Active Automation Rules</div>
          <div class="kpi-val" style="color:var(--amber-brand);">${activeRules} / ${rulesData.length}</div>
        </div>
      </div>

      <!-- Subtab Selector -->
      <div style="display:flex; gap:0.5rem; background:var(--surface-1); padding:0.35rem; border-radius:12px; border:1px solid var(--border-subtle); width:fit-content; margin-bottom:1.5rem; flex-wrap:wrap;">
        <button class="btn-ghost ${activeSubtab === 'logs' ? 'btn-secondary' : ''}" onclick="window.AUTOMATION_MODULE.switchSubtab('logs')">📜 Execution Logs (${logsData.length})</button>
        <button class="btn-ghost ${activeSubtab === 'rules' ? 'btn-secondary' : ''}" onclick="window.AUTOMATION_MODULE.switchSubtab('rules')">⚙️ Automation Rules (${rulesData.length})</button>
        <button class="btn-ghost ${activeSubtab === 'groups' ? 'btn-secondary' : ''}" onclick="window.AUTOMATION_MODULE.switchSubtab('groups')">👥 Telegram Groups (${groupsData.length})</button>
      </div>

      <!-- Subtab Content -->
      <div class="data-table-container">
        ${renderSubtabContent()}
      </div>

      <!-- Broadcast Modal -->
      <div id="autoBroadcastModal" class="modal-overlay">
        <div class="modal-box" style="max-width:480px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">📣 Send Telegram Broadcast</h3>
            <button onclick="window.AUTOMATION_MODULE.closeBroadcastModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>
          <form onsubmit="window.AUTOMATION_MODULE.submitBroadcast(event)" style="display:flex; flex-direction:column; gap:0.9rem;">
            <div class="form-group">
              <label class="form-label">Recipient Target</label>
              <select id="bcTarget" class="input-text">
                <option value="all">All Active Groups</option>
                ${groupsData.map(g => `<option value="${escapeHTML(g.chat_id || g.id)}">${escapeHTML(g.name || 'Group')} (${escapeHTML(g.type || 'channel')})</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Broadcast Title / Subject</label>
              <input type="text" id="bcTitle" class="input-text" placeholder="e.g. Studio Maintenance Notice" />
            </div>
            <div class="form-group">
              <label class="form-label">Message Content (Markdown supported) *</label>
              <textarea id="bcMessage" class="input-text" rows="4" placeholder="Type your broadcast message here..." required></textarea>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
              <button type="button" class="btn-secondary" onclick="window.AUTOMATION_MODULE.closeBroadcastModal()">Cancel</button>
              <button type="submit" class="btn-primary">🚀 Send Broadcast Now</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Create Rule Modal -->
      <div id="autoCreateRuleModal" class="modal-overlay">
        <div class="modal-box" style="max-width:520px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">⚙️ Create Automation Rule</h3>
            <button onclick="window.AUTOMATION_MODULE.closeCreateRuleModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
          </div>
          <form onsubmit="window.AUTOMATION_MODULE.submitRule(event)" style="display:flex; flex-direction:column; gap:0.9rem;">
            <div class="form-group">
              <label class="form-label">Rule Name *</label>
              <input type="text" id="ruleNameInput" class="input-text" placeholder="e.g. Notify editor on task assignment" required />
            </div>
            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Trigger Event *</label>
                <select id="ruleTriggerInput" class="input-text" required>
                  <option value="task_stage_change">Task Stage Change</option>
                  <option value="invoice_paid">Invoice Paid</option>
                  <option value="lead_won">Lead Won</option>
                  <option value="leave_submitted">Leave Submitted</option>
                  <option value="leave_decision">Leave Decision</option>
                  <option value="review_approved">Review Approved</option>
                  <option value="review_revision_requested">Review Revision Requested</option>
                  <option value="ticket_resolved">Ticket Resolved</option>
                  <option value="social_post_approved">Social Post Approved</option>
                  <option value="expense_submitted">Expense Submitted</option>
                  <option value="client_onboarded">Client Onboarded</option>
                  <option value="eod_submitted">EOD Submitted</option>
                </select>
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Action Type *</label>
                <select id="ruleActionInput" class="input-text" required>
                  <option value="telegram_notify">Telegram Notification</option>
                  <option value="email_notify">Email Notification</option>
                  <option value="webhook_call">Webhook Call</option>
                  <option value="update_record">Update Record</option>
                </select>
              </div>
            </div>
            <div style="display:flex; gap:1rem;">
              <div class="form-group" style="flex:1;">
                <label class="form-label">Condition Field (Optional)</label>
                <input type="text" id="ruleCondFieldInput" class="input-text" placeholder="e.g. stage" />
              </div>
              <div class="form-group" style="flex:1;">
                <label class="form-label">Condition Value (Optional)</label>
                <input type="text" id="ruleCondValInput" class="input-text" placeholder="e.g. Client Review" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Action Target (Telegram ID, Email, Webhook URL)</label>
              <input type="text" id="ruleTargetInput" class="input-text" placeholder="e.g. owner or a Telegram ID" />
            </div>
            <div style="display:flex; justify-content:flex-end; gap:0.75rem; margin-top:0.5rem;">
              <button type="button" class="btn-secondary" onclick="window.AUTOMATION_MODULE.closeCreateRuleModal()">Cancel</button>
              <button type="submit" class="btn-primary">⚡ Create Rule</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function renderSubtabContent() {
    if (activeSubtab === 'logs') {
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <div style="font-weight:800; color:var(--text-main);">Real-time Webhook & Workflow Execution Logs</div>
          <button class="btn-ghost btn-sm" onclick="window.AUTOMATION_MODULE.refreshLogs()">🔄 Refresh Logs</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event Type</th>
              <th>Description</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${logsData.slice(0, 40).map(l => `
              <tr>
                <td style="font-size:0.75rem; color:var(--text-muted);">${l.created_at || l.triggered_at ? new Date(l.created_at || l.triggered_at).toLocaleString() : 'Just now'}</td>
                <td><span class="badge badge-purple">${escapeHTML(l.event_type || l.source || 'System')}</span></td>
                <td style="font-size:0.8rem; color:var(--text-secondary); max-width:350px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(l.description || l.payload || l.message || 'No details')}</td>
                <td><span class="badge ${l.status === 'error' || l.status === 'failed' ? 'badge-pink' : l.status === 'partial' ? 'badge-amber' : 'badge-emerald'}">${escapeHTML(l.status || 'success')}</span></td>
              </tr>
            `).join('') || `<tr><td colspan="4" style="text-align:center; padding:2rem; color:var(--text-muted);">No execution logs recorded.</td></tr>`}
          </tbody>
        </table>
      `;
    } else if (activeSubtab === 'rules') {
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <div style="font-weight:800; color:var(--text-main);">Automation Rules & Workflow Triggers</div>
          <button class="btn-primary btn-sm" onclick="window.AUTOMATION_MODULE.openCreateRuleModal()">+ Create Rule</button>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Rule ID</th>
              <th>Rule Name</th>
              <th>Trigger Event</th>
              <th>Condition</th>
              <th>Action Type</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rulesData.map(r => `
              <tr>
                <td style="font-weight:700; font-family:monospace; color:var(--purple-light);">${escapeHTML(r.id)}</td>
                <td style="font-weight:700;">${escapeHTML(r.rule_name)}</td>
                <td><span class="badge badge-purple">${escapeHTML(r.trigger_event)}</span></td>
                <td style="font-size:0.8rem; color:var(--text-muted);">${r.condition_field ? `${escapeHTML(r.condition_field)} = ${escapeHTML(r.condition_value)}` : '<em>No condition</em>'}</td>
                <td><span class="badge badge-amber">${escapeHTML(r.action_type)}</span></td>
                <td>
                  <button class="btn-ghost btn-sm" style="color:${r.active ? 'var(--emerald-brand)' : '#ef4444'}; font-weight:800;" 
                          onclick="window.AUTOMATION_MODULE.toggleRule('${r.id}', ${!r.active})">
                    ${r.active ? '🟢 ON' : '🔴 OFF'}
                  </button>
                </td>
                <td>
                  <button class="btn-secondary btn-sm" style="font-size:0.75rem; color:#ef4444;" onclick="window.AUTOMATION_MODULE.deleteRule('${r.id}')">🗑️ Delete</button>
                </td>
              </tr>
            `).join('') || `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">No automation rules configured. Click + Create Rule to add one.</td></tr>`}
          </tbody>
        </table>
      `;
    } else {
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <div style="font-weight:800; color:var(--text-main);">Configured Telegram Group Chats & Notification Channels</div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Group Name</th>
              <th>Chat ID</th>
              <th>Type</th>
              <th>Bot</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${groupsData.map(g => `
              <tr>
                <td style="font-weight:700;">💬 ${escapeHTML(g.name || 'Group Chat')}</td>
                <td style="font-family:monospace; font-size:0.8rem;">${escapeHTML(String(g.chat_id || g.chatId || g.id))}</td>
                <td><span class="badge badge-purple">${escapeHTML(g.type || 'group')}</span></td>
                <td style="color:var(--text-muted);">${escapeHTML(g.bot || 'teamBot')}</td>
                <td><span class="badge ${g.active !== false ? 'badge-emerald' : 'badge-pink'}">${g.active !== false ? '● Active' : '● Inactive'}</span></td>
              </tr>
            `).join('') || `<tr><td colspan="5" style="text-align:center; padding:2rem; color:var(--text-muted);">No group chat mappings configured.</td></tr>`}
          </tbody>
        </table>
      `;
    }
  }

  window.AUTOMATION_MODULE = {
    reload() {
      loadData();
    },
    switchSubtab(tab) {
      activeSubtab = tab;
      renderView();
    },
    async refreshLogs() {
      const logs = await APP_API.get('/automation/logs').catch(() => []);
      logsData = Array.isArray(logs) ? logs : [];
      renderView();
      if (window.showToast) window.showToast('Logs refreshed!', 'success');
    },
    async triggerCron() {
      try {
        const res = await APP_API.post('/automation/cron-trigger', {});
        if (window.showToast) window.showToast(res.message || 'Cron jobs triggered! ⏱️', 'success');
      } catch (err) {
        if (window.showToast) window.showToast('Failed to trigger cron: ' + err.message, 'error');
      }
    },
    openBroadcastModal() {
      document.getElementById('autoBroadcastModal').classList.add('active');
    },
    closeBroadcastModal() {
      document.getElementById('autoBroadcastModal').classList.remove('active');
    },
    async submitBroadcast(e) {
      if (e && e.preventDefault) e.preventDefault();
      const target = document.getElementById('bcTarget').value;
      const title = document.getElementById('bcTitle').value.trim();
      const message = document.getElementById('bcMessage').value.trim();

      if (!message) {
        if (window.showToast) window.showToast('Please enter message content.', 'error');
        return;
      }

      try {
        const res = await APP_API.post('/automation/broadcast', { target, title, message });
        if (res.success || res.ok) {
          this.closeBroadcastModal();
          if (window.showToast) window.showToast(`Broadcast sent to ${res.sent || 0} group(s)! 📣`, 'success');
        } else {
          if (window.showToast) window.showToast(res.error || 'Failed to dispatch broadcast', 'error');
        }
      } catch (e) {
        if (window.showToast) window.showToast('Error: ' + e.message, 'error');
      }
    },
    openCreateRuleModal() {
      document.getElementById('autoCreateRuleModal').classList.add('active');
    },
    closeCreateRuleModal() {
      document.getElementById('autoCreateRuleModal').classList.remove('active');
    },
    async submitRule(e) {
      if (e && e.preventDefault) e.preventDefault();
      const rule_name = document.getElementById('ruleNameInput').value.trim();
      const trigger_event = document.getElementById('ruleTriggerInput').value;
      const action_type = document.getElementById('ruleActionInput').value;
      const condition_field = document.getElementById('ruleCondFieldInput').value.trim();
      const condition_value = document.getElementById('ruleCondValInput').value.trim();
      const action_target = document.getElementById('ruleTargetInput').value.trim();

      if (!rule_name || !trigger_event || !action_type) {
        if (window.showToast) window.showToast('Rule name, trigger event, and action type are required.', 'error');
        return;
      }

      try {
        const res = await APP_API.post('/automation/rules', {
          rule_name, trigger_event, action_type, condition_field, condition_value, action_target
        });
        if (res.success) {
          this.closeCreateRuleModal();
          if (window.showToast) window.showToast(`Rule "${rule_name}" created! ⚡`, 'success');
          loadData();
        }
      } catch (err) {
        if (window.showToast) window.showToast('Failed to create rule: ' + err.message, 'error');
      }
    },
    async toggleRule(id, newActive) {
      try {
        await APP_API.put(`/automation/rules/${id}`, { active: newActive });
        if (window.showToast) window.showToast(`Rule ${newActive ? 'enabled' : 'disabled'}`, 'info');
        loadData();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to toggle rule: ' + err.message, 'error');
      }
    },
    async deleteRule(id) {
      if (!confirm('Delete this automation rule?')) return;
      try {
        await APP_API.delete(`/automation/rules/${id}`);
        if (window.showToast) window.showToast('Rule deleted', 'info');
        loadData();
      } catch (err) {
        if (window.showToast) window.showToast('Failed to delete rule: ' + err.message, 'error');
      }
    }
  };

  await loadData();
};
