window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.settings = async function(container) {
  let rulesData = [];
  let logsData = [];

  async function loadData() {
    try {
      const [rules, logs] = await Promise.all([
        window.APP_API.get('/automation/rules').catch(() => []),
        window.APP_API.get('/automation/logs').catch(() => [])
      ]);
      rulesData = rules || [];
      logsData = logs || [];
      render();
    } catch (err) {
      console.error(err);
      container.innerHTML = `<div style="color:var(--text-error); padding: 2rem;">Error loading settings data.</div>`;
    }
  }

  function render() {
    let rulesHtml = '<div style="color: var(--text-muted); font-size: 0.9rem;">No active rules.</div>';
    if (rulesData.length > 0) {
      rulesHtml = rulesData.map(r => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <div>
            <div style="font-weight: 600; font-size: 0.9rem;">${r.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">${r.id}</div>
          </div>
          <span class="badge ${r.active ? 'badge-emerald' : 'badge-amber'}">${r.active ? 'Active' : 'Inactive'}</span>
        </div>
      `).join('');
    }

    let logsHtml = '> Waiting for automation events...';
    if (logsData.length > 0) {
      logsHtml = logsData.map(l => `
        <div style="margin-bottom: 0.5rem; border-bottom: 1px solid #222; padding-bottom: 0.5rem;">
          <span style="color: #888;">[${new Date(l.created_at).toLocaleString()}]</span> 
          <span style="color: #60a5fa;">[${l.event_type}]</span><br>
          <span style="color: #ccc;">${l.details || 'Executed successfully'}</span>
        </div>
      `).join('');
    }

    container.innerHTML = `
      <div class="module-header">
        <div>
          <h2 style="font-family: var(--font-heading); font-size: 1.5rem;">⚙️ System & Workspace Settings</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Manage workspace configuration, integrations, and automation triggers.</p>
        </div>
      </div>

      <div class="module-content">
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1.5rem; margin-bottom: 2rem;">
          <div class="card-glass" style="padding: 1.5rem;">
            <h3 style="font-size:1.1rem; font-family:var(--font-heading); margin-top:0; color:var(--text-primary);">
              🗄️ Database & Supabase Integration
            </h3>
            <div style="font-size:0.85rem; color:var(--text-muted); line-height:1.6; margin-bottom:1rem;">
              Real-time persistence is enabled directly through Supabase PostgreSQL.
            </div>
            <span class="badge badge-emerald">🟢 Supabase Connected</span>
          </div>

          <div class="card-glass" style="padding: 1.5rem;">
            <h3 style="font-size:1.1rem; font-family:var(--font-heading); margin-top:0; color:var(--text-primary);">
              🤖 Telegram Bot Webhooks
            </h3>
            <div style="font-size:0.85rem; color:var(--text-muted); line-height:1.6; margin-bottom:1rem;">
              Crew Bot & Client Bot are configured for real-time notifications.
            </div>
            <span class="badge badge-purple">🤖 Telegram Bots Online</span>
          </div>
        </div>
        
        <h3 style="font-family: var(--font-heading); margin-bottom: 1rem;">🤖 Automation & Webhooks</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start;">
          <div class="card-glass" style="padding: 1.5rem;">
            <h4 style="margin: 0 0 1rem;">Active Trigger Rules</h4>
            <div>${rulesHtml}</div>
          </div>
          
          <div class="card-glass" style="padding: 1.5rem; background: #111; border: 1px solid #333;">
            <h4 style="margin: 0 0 1rem; color: #eee;">Automation Execution Logs</h4>
            <div style="font-family: monospace; font-size: 0.8rem; color: #4ade80; background: #000; padding: 1rem; border-radius: 8px; max-height: 300px; overflow-y: auto;">
              ${logsHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `<div style="padding: 3rem; text-align: center; color: var(--text-muted);">⏳ Loading Settings...</div>`;
  await loadData();
};
