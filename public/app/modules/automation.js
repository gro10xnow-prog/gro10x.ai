/**
 * public/app/modules/automation.js
 * Telegram Bot Engine, Workflows & Webhook Log Viewer Module
 */
window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.automation = async function(container) {
  let healthData = {};
  let botStatus = {};
  let logsData = [];
  let groupsData = [];
  let cronStatus = {};

  async function initView() {
    renderView();
    await loadData();
  }

  function renderView() {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h1 style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); margin: 0 0 0.3rem;">
            ⚡ Bot Engine & Automation Workflows
          </h1>
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            Telegram bot health monitoring, webhook execution logs, group routers, and broadcast engine.
          </div>
        </div>
        <div style="display: flex; gap: 0.6rem;">
          <button class="btn-secondary" onclick="window.AUTOMATION_MODULE.triggerCron()">⏱️ Trigger Cron Run</button>
          <button class="btn-primary" onclick="window.AUTOMATION_MODULE.openBroadcastModal()">📣 Send Telegram Broadcast</button>
        </div>
      </div>

      <!-- KPI System Health Tiles -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
        <div class="kpi-tile">
          <div class="kpi-label">Team Bot Status</div>
          <div class="kpi-val" id="autoTeamBotVal" style="color: var(--emerald-brand);">--</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Client Bot Status</div>
          <div class="kpi-val" id="autoClientBotVal" style="color: var(--emerald-brand);">--</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Database Connection</div>
          <div class="kpi-val" id="autoDbVal">--</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Active SSE Clients</div>
          <div class="kpi-val" id="autoSseVal" style="color: var(--purple-light);">--</div>
        </div>
        <div class="kpi-tile">
          <div class="kpi-label">Server Memory (RSS)</div>
          <div class="kpi-val" id="autoMemVal">--</div>
        </div>
      </div>

      <!-- Subtab Selector -->
      <div style="display:flex; gap:0.5rem; background:var(--surface-1); padding:0.35rem; border-radius:12px; border:1px solid var(--border-subtle); width:fit-content; margin-bottom:1.5rem;">
        <button class="btn-ghost btn-secondary" id="tabBtnLogs" onclick="window.AUTOMATION_MODULE.switchSubtab('logs')">📜 Execution Logs</button>
        <button class="btn-ghost" id="tabBtnGroups" onclick="window.AUTOMATION_MODULE.switchSubtab('groups')">👥 Telegram Groups (${groupsData.length})</button>
      </div>

      <!-- Logs Tab Content -->
      <div id="subtabContentLogs" class="card-glass" style="padding: 1.25rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <div style="font-weight: 800; color: var(--text-main);">Real-time Webhook & Workflow Execution Logs</div>
          <button class="btn-ghost btn-sm" onclick="window.AUTOMATION_MODULE.loadLogs()">🔄 Refresh Logs</button>
        </div>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Source / Handler</th>
                <th>Event / Action</th>
                <th>Payload / Target</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="autoLogsBody">
              <tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">Loading logs...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Groups Tab Content (Hidden by default) -->
      <div id="subtabContentGroups" class="card-glass" style="padding: 1.25rem; display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <div style="font-weight: 800; color: var(--text-main);">Configured Telegram Group Chats & Notification Channels</div>
        </div>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Group Name</th>
                <th>Chat ID</th>
                <th>Type</th>
                <th>Associated Client / Project</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="autoGroupsBody">
              <tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">Loading group mappings...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Broadcast Modal -->
      <div id="autoBroadcastModal" class="modal-overlay">
        <div class="modal-content" style="max-width: 480px;">
          <div class="modal-header">
            <h3>📣 Send Telegram Broadcast</h3>
            <button class="modal-close" onclick="window.AUTOMATION_MODULE.closeBroadcastModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Recipient Target</label>
              <select id="bcTarget" class="input-text">
                <option value="team">All Active Team Crew (Telegram Bot)</option>
                <option value="clients">All Active Clients (Client Portal Bot)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Broadcast Title / Subject</label>
              <input type="text" id="bcTitle" class="input-text" placeholder="e.g. Studio Maintenance Notice" />
            </div>
            <div class="form-group">
              <label>Message Content (Markdown supported)</label>
              <textarea id="bcMessage" class="input-text" style="height: 110px;" placeholder="Type your broadcast message here..."></textarea>
            </div>
            <div style="margin-top: 1.5rem; text-align: right;">
              <button class="btn-primary" onclick="window.AUTOMATION_MODULE.submitBroadcast()">🚀 Send Broadcast Now</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function loadData() {
    try {
      const [sysHealth, botH, logs, groups] = await Promise.all([
        APP_API.get('/system-health').catch(() => ({})),
        APP_API.get('/bot-status').catch(() => ({})),
        APP_API.get('/logs').catch(() => []),
        APP_API.get('/groups').catch(() => [])
      ]);

      healthData = sysHealth || {};
      botStatus = botH || {};
      logsData = Array.isArray(logs) ? logs : (logs.logs || []);
      groupsData = Array.isArray(groups) ? groups : [];

      renderKpis();
      renderLogs();
      renderGroups();
    } catch (e) {
      console.error('[Automation Module] Load error:', e);
    }
  }

  function renderKpis() {
    const teamEl = document.getElementById('autoTeamBotVal');
    const clientEl = document.getElementById('autoClientBotVal');
    const dbEl = document.getElementById('autoDbVal');
    const sseEl = document.getElementById('autoSseVal');
    const memEl = document.getElementById('autoMemVal');

    if (teamEl) teamEl.textContent = botStatus.teamBot === 'active' ? '🟢 Online' : '🔴 Inactive';
    if (clientEl) clientEl.textContent = botStatus.clientBot === 'active' ? '🟢 Online' : '🔴 Inactive';
    if (dbEl) dbEl.textContent = healthData.dbConnection || 'Connected';
    if (sseEl) sseEl.textContent = healthData.sseClients || 0;
    if (memEl) memEl.textContent = (healthData.memoryUsage || 0).toFixed(1) + ' MB';
  }

  function renderLogs() {
    const tbody = document.getElementById('autoLogsBody');
    if (!tbody) return;

    if (logsData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No logs recorded.</td></tr>';
      return;
    }

    tbody.innerHTML = logsData.slice(0, 30).map(l => `
      <tr>
        <td style="font-size:0.75rem; color:var(--text-muted);">${l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : 'Just now'}</td>
        <td style="font-weight:700;">${escapeHTML(l.source || l.handler || 'Telegram Webhook')}</td>
        <td><span class="badge badge-purple">${escapeHTML(l.event || l.action || 'Message Router')}</span></td>
        <td style="font-size:0.8rem; color:var(--text-secondary); max-width: 250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(l.payload || l.message || JSON.stringify(l))}</td>
        <td><span class="badge ${l.status === 'error' ? 'badge-pink' : 'badge-emerald'}">${escapeHTML(l.status || 'Success')}</span></td>
      </tr>
    `).join('');
  }

  function renderGroups() {
    const tbody = document.getElementById('autoGroupsBody');
    if (!tbody) return;

    if (groupsData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No group chat mappings configured.</td></tr>';
      return;
    }

    tbody.innerHTML = groupsData.map(g => `
      <tr>
        <td style="font-weight:700;">💬 ${escapeHTML(g.name || 'Group Chat')}</td>
        <td style="font-family:monospace; font-size:0.8rem;">${escapeHTML(String(g.chat_id || g.id))}</td>
        <td><span class="badge badge-purple">${escapeHTML(g.type || 'Production Channel')}</span></td>
        <td style="color:var(--text-muted);">${escapeHTML(g.client_name || g.projectName || 'General Workspace')}</td>
        <td><button class="btn-ghost btn-sm" onclick="alert('Chat ID: ${g.chat_id || g.id}')">Details</button></td>
      </tr>
    `).join('');
  }

  window.AUTOMATION_MODULE = {
    switchSubtab(tab) {
      document.getElementById('subtabContentLogs').style.display = tab === 'logs' ? 'block' : 'none';
      document.getElementById('subtabContentGroups').style.display = tab === 'groups' ? 'block' : 'none';
      document.getElementById('tabBtnLogs').className = tab === 'logs' ? 'btn-ghost btn-secondary' : 'btn-ghost';
      document.getElementById('tabBtnGroups').className = tab === 'groups' ? 'btn-ghost btn-secondary' : 'btn-ghost';
    },
    async loadLogs() {
      const logs = await APP_API.get('/logs').catch(() => []);
      logsData = Array.isArray(logs) ? logs : (logs.logs || []);
      renderLogs();
      showToast('Logs refreshed!');
    },
    async triggerCron() {
      try {
        const res = await APP_API.post('/cron/trigger', {});
        if (res.success || res.ok) {
          showToast('Cron jobs triggered successfully! ⏱️');
        } else {
          showToast('Cron execution response: ' + (res.message || 'Done'));
        }
      } catch (err) {
        showToast('Failed to trigger cron runner', 'error');
      }
    },
    openBroadcastModal() {
      document.getElementById('autoBroadcastModal').classList.add('active');
    },
    closeBroadcastModal() {
      document.getElementById('autoBroadcastModal').classList.remove('active');
    },
    async submitBroadcast() {
      const target = document.getElementById('bcTarget').value;
      const title = document.getElementById('bcTitle').value.trim();
      const message = document.getElementById('bcMessage').value.trim();

      if (!message) return alert('Please enter message content.');

      try {
        const res = await APP_API.post('/automation/broadcast', { target, title, message });
        if (res.success || res.ok) {
          this.closeBroadcastModal();
          showToast('Broadcast dispatched successfully! 📣');
        } else {
          showToast(res.error || 'Failed to dispatch broadcast', 'error');
        }
      } catch (e) {
        showToast('Error: ' + e.message, 'error');
      }
    }
  };

  await initView();
};
