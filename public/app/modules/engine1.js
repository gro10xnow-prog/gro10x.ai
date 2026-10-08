/**
 * public/app/modules/engine1.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X OS v2.0 — Engine 1 Desk: AI Agent Ecosystems & Platforms
 * 
 * STRICTLY AN INTERNAL TEAM OPERATIONS COCKPIT
 * For Founders, Pod Leads, and Account Managers to build, monitor, and operate
 * AI agents for internal ventures and client implementations.
 * 
 * Visual Inspiration: Chatbase / UseInvent (useinvent.com)
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.APP_MODULES = window.APP_MODULES || {};

(function initEngine1Module() {
  let activeTab = 'telemetry'; // 'telemetry' | 'inbox' | 'studio' | 'settings'
  let currentConversations = [];
  let selectedConvId = null;
  let telemetryData = null;
  let refreshTimer = null;
  let isSending = false;

  // Render entrypoint
  async function render(container) {
    container.innerHTML = `
      <style>
        .e1-container {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          color: var(--text-primary, #ffffff);
          font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
        }
        .e1-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
        }
        .e1-title-box h1 {
          font-size: 1.6rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          margin: 0 0 0.25rem 0;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .e1-badge {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .e1-badge-purple {
          background: rgba(139, 92, 246, 0.18);
          color: #a78bfa;
          border: 1px solid rgba(139, 92, 246, 0.35);
        }
        .e1-badge-emerald {
          background: rgba(16, 185, 129, 0.18);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.35);
        }
        .e1-badge-amber {
          background: rgba(245, 158, 11, 0.18);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.35);
        }
        .e1-tabs {
          display: flex;
          gap: 0.5rem;
          background: rgba(0, 0, 0, 0.25);
          padding: 0.25rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          width: fit-content;
        }
        .e1-tab-btn {
          background: none;
          border: none;
          color: var(--text-muted, #94a3b8);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          transition: all 0.15s ease;
        }
        .e1-tab-btn.active {
          background: rgba(139, 92, 246, 0.22);
          color: #ffffff;
          border: 1px solid rgba(139, 92, 246, 0.4);
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
        }
        .e1-tab-btn:hover:not(.active) {
          color: #f1f5f9;
          background: rgba(255, 255, 255, 0.04);
        }
        /* Telemetry Cards */
        .e1-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 1rem;
        }
        .e1-kpi-card {
          background: rgba(18, 22, 38, 0.75);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 1.15rem;
          backdrop-filter: blur(8px);
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }
        .e1-kpi-card:hover {
          transform: translateY(-2px);
          border-color: rgba(139, 92, 246, 0.4);
        }
        .e1-kpi-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted, #94a3b8);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .e1-kpi-value {
          font-size: 2rem;
          font-weight: 900;
          margin: 0.4rem 0 0.15rem 0;
          font-family: var(--font-mono, monospace);
        }
        .e1-kpi-sub {
          font-size: 0.76rem;
          color: var(--text-secondary, #cbd5e1);
        }
        /* Inbox Split View */
        .e1-inbox-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 1rem;
          min-height: 560px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          background: rgba(15, 18, 30, 0.6);
          overflow: hidden;
        }
        @media (max-width: 860px) {
          .e1-inbox-grid {
            grid-template-columns: 1fr;
          }
        }
        .e1-thread-list {
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          background: rgba(10, 14, 25, 0.7);
        }
        .e1-thread-header {
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          font-weight: 800;
          font-size: 0.9rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .e1-thread-items {
          flex: 1;
          overflow-y: auto;
          max-height: 520px;
        }
        .e1-thread-item {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .e1-thread-item:hover {
          background: rgba(255, 255, 255, 0.03);
        }
        .e1-thread-item.selected {
          background: rgba(139, 92, 246, 0.15);
          border-left: 3px solid #8b5cf6;
        }
        .e1-thread-title {
          font-size: 0.88rem;
          font-weight: 700;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }
        .e1-thread-preview {
          font-size: 0.78rem;
          color: var(--text-muted, #94a3b8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        /* Message Stream */
        .e1-thread-view {
          display: flex;
          flex-direction: column;
          background: rgba(15, 18, 30, 0.4);
        }
        .e1-thread-topbar {
          padding: 0.9rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(20, 25, 42, 0.8);
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .e1-messages-stream {
          flex: 1;
          padding: 1.25rem;
          overflow-y: auto;
          max-height: 420px;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .e1-msg {
          max-width: 78%;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-size: 0.86rem;
          line-height: 1.45;
          word-break: break-word;
        }
        .e1-msg-user {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-bottom-left-radius: 2px;
        }
        .e1-msg-ai {
          align-self: flex-end;
          background: rgba(139, 92, 246, 0.2);
          border: 1px solid rgba(139, 92, 246, 0.35);
          color: #f3e8ff;
          border-bottom-right-radius: 2px;
        }
        .e1-msg-operator {
          align-self: flex-end;
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.35);
          color: #d1fae5;
          border-bottom-right-radius: 2px;
        }
        .e1-msg-meta {
          font-size: 0.68rem;
          color: var(--text-muted, #94a3b8);
          margin-top: 0.3rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .e1-reply-bar {
          padding: 1rem 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(12, 16, 28, 0.9);
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }
        .e1-reply-input {
          flex: 1;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 0.7rem 0.9rem;
          color: #fff;
          font-size: 0.88rem;
          outline: none;
        }
        .e1-reply-input:focus {
          border-color: #8b5cf6;
        }
      </style>

      <div class="e1-container">
        <!-- Top Cockpit Header -->
        <div class="e1-header">
          <div class="e1-title-box">
            <h1>
              <span>🤖</span> Engine 1: AI Agent Ecosystems
            </h1>
            <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
              <span class="e1-badge e1-badge-purple">Internal Team Cockpit</span>
              <span class="e1-badge e1-badge-emerald">v2.0 Orchestrator</span>
              <span style="font-size:0.8rem; color:var(--text-muted);">Chatbase / UseInvent Architecture</span>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
            <div class="e1-tabs">
              <button class="e1-tab-btn ${activeTab === 'telemetry' ? 'active' : ''}" onclick="window.Engine1Desk.switchTab('telemetry')">
                <span>🏠</span> Telemetry
              </button>
              <button class="e1-tab-btn ${activeTab === 'inbox' ? 'active' : ''}" onclick="window.Engine1Desk.switchTab('inbox')">
                <span>📥</span> Team Inbox
              </button>
              <button class="e1-tab-btn ${activeTab === 'studio' ? 'active' : ''}" onclick="window.Engine1Desk.switchTab('studio')">
                <span>🛠️</span> 5 Verticals Studio
              </button>
              <button class="e1-tab-btn ${activeTab === 'settings' ? 'active' : ''}" onclick="window.Engine1Desk.switchTab('settings')">
                <span>⚙️</span> Developer Control
              </button>
            </div>
            <button class="btn-secondary btn-sm" onclick="window.Engine1Desk.refreshData()" title="Reload Live Metrics">
              🔄 Sync
            </button>
          </div>
        </div>

        <!-- Dynamic Body View based on activeTab -->
        <div id="e1-tab-content">
          <div style="text-align:center; padding:3rem; color:var(--text-muted);">Loading Engine 1 Cockpit Data...</div>
        </div>
      </div>
    `;

    await loadInitialData();
    renderActiveTab();
    startAutoRefresh();
  }

  // Load telemetry & conversations from backend
  async function loadInitialData() {
    try {
      const [telemetryRes, convsRes] = await Promise.all([
        fetch('/api/chat/telemetry').then(r => r.json()).catch(() => null),
        fetch('/api/chat/conversations').then(r => r.json()).catch(() => null)
      ]);

      if (telemetryRes && (telemetryRes.ok || telemetryRes.kpis)) {
        telemetryData = telemetryRes.data || telemetryRes;
      }
      if (convsRes && (convsRes.ok || convsRes.data)) {
        currentConversations = convsRes.data || [];
        if (!selectedConvId && currentConversations.length > 0) {
          selectedConvId = currentConversations[0].id;
        }
      }
    } catch (e) {
      console.warn('[Engine 1] Load error:', e.message);
    }
  }

  function renderActiveTab() {
    const content = document.getElementById('e1-tab-content');
    if (!content) return;

    if (activeTab === 'telemetry') {
      renderTelemetryView(content);
    } else if (activeTab === 'inbox') {
      renderInboxView(content);
    } else if (activeTab === 'studio') {
      renderStudioView(content);
    } else if (activeTab === 'settings') {
      renderSettingsView(content);
    }
  }

  // 1. Telemetry View
  function renderTelemetryView(container) {
    const kpis = telemetryData?.kpis || {
      activeConversations: currentConversations.length || 5,
      waitingHumanTriage: currentConversations.filter(c => c.status === 'triage').length || 1,
      resolvedByAiPercent: 82,
      handoffsToday: 2,
      avgCsat: 4.8
    };

    const channels = telemetryData?.channels || { web: 2, telegram: 2, whatsapp: 1 };
    const spend = telemetryData?.spendingLimits || { monthlyBudgetUSD: 150, currentSpendUSD: 24.85, tokensUsed: 1242500 };

    container.innerHTML = `
      <!-- 5 Key KPI Cards -->
      <div class="e1-kpi-grid">
        <div class="e1-kpi-card" style="border-top: 3px solid #8b5cf6;">
          <div class="e1-kpi-label">
            <span>Active Conversations</span>
            <span>💬</span>
          </div>
          <div class="e1-kpi-value" style="color: #c084fc;">${kpis.activeConversations}</div>
          <div class="e1-kpi-sub">Across Web, Telegram & WhatsApp</div>
        </div>

        <div class="e1-kpi-card" style="border-top: 3px solid #ef4444;">
          <div class="e1-kpi-label">
            <span>Waiting Human Triage</span>
            <span class="e1-badge e1-badge-amber">${kpis.waitingHumanTriage} Pending</span>
          </div>
          <div class="e1-kpi-value" style="color: #f87171;">${kpis.waitingHumanTriage}</div>
          <div class="e1-kpi-sub">Needs Pod Lead / Account intervention</div>
        </div>

        <div class="e1-kpi-card" style="border-top: 3px solid #00df89;">
          <div class="e1-kpi-label">
            <span>Resolved by AI (%)</span>
            <span>🤖</span>
          </div>
          <div class="e1-kpi-value" style="color: #00df89;">${kpis.resolvedByAiPercent}%</div>
          <div class="e1-kpi-sub">Autonomous resolution efficiency</div>
        </div>

        <div class="e1-kpi-card" style="border-top: 3px solid #06b6d4;">
          <div class="e1-kpi-label">
            <span>Handoffs Today</span>
            <span>🤝</span>
          </div>
          <div class="e1-kpi-value" style="color: #38bdf8;">${kpis.handoffsToday}</div>
          <div class="e1-kpi-sub">Escalated to human operator</div>
        </div>

        <div class="e1-kpi-card" style="border-top: 3px solid #fbbf24;">
          <div class="e1-kpi-label">
            <span>Avg. CSAT Rating</span>
            <span>⭐</span>
          </div>
          <div class="e1-kpi-value" style="color: #fbbf24;">${kpis.avgCsat} <span style="font-size:1.1rem; color:var(--text-muted);">/ 5.0</span></div>
          <div class="e1-kpi-sub">Client feedback satisfaction</div>
        </div>
      </div>

      <!-- Traffic & Channel Activity Strip -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1rem; margin-top:1.25rem;">
        <!-- Channel Distribution Card -->
        <div class="card-glass" style="border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="margin:0; font-size:1rem; font-weight:800;">📡 Channel Distribution</h3>
            <span class="e1-badge e1-badge-purple">Realtime Stream</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.25rem;">
                <span>🌐 Web Embed Widgets</span>
                <strong>${channels.web} threads</strong>
              </div>
              <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden;">
                <div style="width:${(channels.web / (kpis.activeConversations || 1)) * 100}%; height:100%; background:#8b5cf6;"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.25rem;">
                <span>✈️ Telegram Bots (@Aigeneral01bot)</span>
                <strong>${channels.telegram} threads</strong>
              </div>
              <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden;">
                <div style="width:${(channels.telegram / (kpis.activeConversations || 1)) * 100}%; height:100%; background:#06b6d4;"></div>
              </div>
            </div>

            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.25rem;">
                <span>💬 WhatsApp Cloud Webhook</span>
                <strong>${channels.whatsapp} threads</strong>
              </div>
              <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:4px; overflow:hidden;">
                <div style="width:${(channels.whatsapp / (kpis.activeConversations || 1)) * 100}%; height:100%; background:#10b981;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Token Burn & COGS Card -->
        <div class="card-glass" style="border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1.25rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="margin:0; font-size:1rem; font-weight:800;">⚡ LLM Compute & Token Burn</h3>
            <span class="e1-badge e1-badge-emerald">Safe Range</span>
          </div>

          <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:0.75rem; margin-bottom:1rem;">
            <div style="background:rgba(0,0,0,0.25); padding:0.75rem; border-radius:10px;">
              <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Current Spend</span>
              <div style="font-size:1.2rem; font-weight:900; color:#38bdf8;">$${spend.currentSpendUSD.toFixed(2)}</div>
              <span style="font-size:0.7rem; color:var(--text-muted);">৳${Math.round(spend.currentSpendUSD * 120).toLocaleString()} BDT</span>
            </div>
            <div style="background:rgba(0,0,0,0.25); padding:0.75rem; border-radius:10px;">
              <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Monthly Cap</span>
              <div style="font-size:1.2rem; font-weight:900; color:#fbbf24;">$${spend.monthlyBudgetUSD.toFixed(2)}</div>
              <span style="font-size:0.7rem; color:var(--text-muted);">Auto-Kill Protection</span>
            </div>
          </div>

          <div style="font-size:0.78rem; color:var(--text-muted);">
            Tokens Processed Today: <strong style="color:#ffffff;">${spend.tokensUsed.toLocaleString()} tokens</strong> (Gemini 2.0 Flash dominant tier)
          </div>
        </div>
      </div>
    `;
  }

  // 2. Team Inbox & Human Takeover View
  function renderInboxView(container) {
    const selectedConv = currentConversations.find(c => c.id === selectedConvId) || currentConversations[0];

    container.innerHTML = `
      <div class="e1-inbox-grid">
        <!-- Left: Thread List -->
        <div class="e1-thread-list">
          <div class="e1-thread-header" style="flex-direction:column; align-items:stretch; gap:0.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <span>Omnichannel Feed (${currentConversations.length})</span>
              <button class="btn-ghost btn-sm" onclick="window.Engine1Desk.refreshData()" style="padding:0.2rem 0.5rem; font-size:0.75rem;">↻ Sync</button>
            </div>
            <input type="text" id="e1-thread-search" placeholder="Search client or project..." style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); border-radius:6px; padding:0.35rem 0.6rem; color:#fff; font-size:0.78rem;" oninput="window.Engine1Desk.filterThreads(this.value)">
            <div style="display:flex; gap:0.3rem;">
              <button class="btn-ghost btn-sm e1-pill active" onclick="window.Engine1Desk.setFilter('all')" style="font-size:0.7rem; padding:0.15rem 0.4rem;">All</button>
              <button class="btn-ghost btn-sm e1-pill" onclick="window.Engine1Desk.setFilter('triage')" style="font-size:0.7rem; padding:0.15rem 0.4rem; color:#f87171;">🚨 Triage</button>
              <button class="btn-ghost btn-sm e1-pill" onclick="window.Engine1Desk.setFilter('human')" style="font-size:0.7rem; padding:0.15rem 0.4rem; color:#34d399;">👤 Human</button>
            </div>
          </div>
          <div class="e1-thread-items" id="e1-thread-items-container">
            ${renderThreadItemsHtml(currentConversations)}
          </div>
        </div>

        <!-- Right: Message Stream & Action Bar -->
        <div class="e1-thread-view">
          ${selectedConv ? `
            <div class="e1-thread-topbar">
              <div>
                <div style="font-weight:900; font-size:1rem; display:flex; align-items:center; gap:0.5rem;">
                  <span>${selectedConv.clientName}</span>
                  <span class="e1-badge ${selectedConv.isHumanTakeover ? 'e1-badge-emerald' : 'e1-badge-purple'}">
                    ${selectedConv.isHumanTakeover ? '👤 HUMAN TAKEOVER ACTIVE' : '🤖 AI CO-PILOT ENGAGED'}
                  </span>
                </div>
                <div style="font-size:0.74rem; color:var(--text-muted); margin-top:0.2rem;">
                  Project Ref: <strong style="color:#ffffff;">${selectedConv.projectId}</strong> · Vertical: ${selectedConv.vertical || 'SME'}
                  ${selectedConv.takenOverBy ? `· Taken over by: <span style="color:#34d399;">${selectedConv.takenOverBy}</span>` : ''}
                </div>
              </div>

              <!-- 1-Click Human Takeover Toggle -->
              <div>
                ${selectedConv.isHumanTakeover ? `
                  <button class="btn-secondary btn-sm" onclick="window.Engine1Desk.toggleTakeover('${selectedConv.id}', false)" style="border-color:#34d399; color:#34d399;">
                    🤖 Return Control to AI
                  </button>
                ` : `
                  <button class="btn-primary btn-sm" onclick="window.Engine1Desk.toggleTakeover('${selectedConv.id}', true)" style="background:#8b5cf6;">
                    ⚡ Takeover as Human
                  </button>
                `}
              </div>
            </div>

            <!-- Messages Container -->
            <div class="e1-messages-stream" id="e1-msg-stream">
              ${selectedConv.messages.map(m => `
                <div class="e1-msg ${m.sender === 'user' ? 'e1-msg-user' : (m.sender === 'operator' ? 'e1-msg-operator' : 'e1-msg-ai')}">
                  <div style="font-weight:800; font-size:0.72rem; margin-bottom:0.25rem; opacity:0.85;">
                    ${m.sender === 'user' ? '👤 ' + selectedConv.clientName : (m.sender === 'operator' ? '🛡️ ' + (m.operatorName || 'Internal Operator') : '🤖 AI Co-Pilot')}
                  </div>
                  <div>${formatMessageText(m.text)}</div>
                  <div class="e1-msg-meta">
                    <span>${formatTimestamp(m.timestamp)}</span>
                    ${m.sender === 'operator' ? '<span>• Direct Bypass</span>' : ''}
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Reply Bar -->
            <div class="e1-reply-bar">
              <input type="text" id="e1-reply-text" class="e1-reply-input" placeholder="Type operator message directly to client (AI will remain bypassed)..." onkeydown="if(event.key === 'Enter') window.Engine1Desk.sendOperatorReply('${selectedConv.id}')">
              <button class="btn-primary btn-sm" onclick="window.Engine1Desk.sendOperatorReply('${selectedConv.id}')" style="padding:0.7rem 1.25rem;">
                Send Reply 📤
              </button>
            </div>
          ` : `
            <div style="text-align:center; padding:5rem; color:var(--text-muted);">
              Select a conversation thread from the left stream to inspect or takeover.
            </div>
          `}
        </div>
      </div>
    `;

    // Scroll stream to bottom
    setTimeout(() => {
      const stream = document.getElementById('e1-msg-stream');
      if (stream) stream.scrollTop = stream.scrollHeight;
    }, 50);
  }

  // 3. The 5 Verticals Studio View
  // 3. The 5 Verticals Studio & Knowledge Base View
  async function renderStudioView(container) {
    let documents = [];
    try {
      const res = await fetch('/api/ai/knowledge').then(r => r.json()).catch(() => null);
      if (res && res.documents) documents = res.documents;
    } catch (_) {}

    const verticals = [
      { id: 'group-academy', name: 'GroUp Academy', tag: '#Career', icon: '🎓', model: 'Gemini 2.0 Flash', desc: 'EdTech career mentoring, CV validation & AI portfolio guidance for students.', embedCode: '<script src="https://gro10x-ai.vercel.app/js/chat-widget.js" data-agent="group-academy"></script>' },
      { id: 'grocash-finledger', name: 'GroCash FinLedger', tag: '#Finance', icon: '🏆', model: 'GPT-4o Reasoning', desc: 'Automated invoice settlement, BRAC Bank PLC reconciliation & VAT compliance.', embedCode: '<script src="https://gro10x-ai.vercel.app/js/chat-widget.js" data-agent="grocash-finledger"></script>' },
      { id: 'soloops-hub', name: 'SoloOps Hub', tag: '#SME', icon: '🔧', model: 'Gemini 2.0 Flash', desc: 'Micro-agency operations co-pilot, SOW scope analyzer & retainer tracker.', embedCode: '<script src="https://gro10x-ai.vercel.app/js/chat-widget.js" data-agent="soloops-hub"></script>' },
      { id: 'edagent-labs', name: 'EdAgent Labs', tag: '#Education', icon: '🧪', model: 'Claude 3.5 Sonnet', desc: 'Curriculum-aligned tutor agent with dynamic interactive quizzes and evaluation.', embedCode: '<script src="https://gro10x-ai.vercel.app/js/chat-widget.js" data-agent="edagent-labs"></script>' },
      { id: 'tasksync-founder', name: 'TaskSync', tag: '#Personal', icon: '⚡', model: 'Gemini 2.0 Flash', desc: 'Founder scheduling, multi-calendar automation & daily asynchronous pod briefings.', embedCode: '<script src="https://gro10x-ai.vercel.app/js/chat-widget.js" data-agent="tasksync-founder"></script>' }
    ];

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:1rem;">
        <div>
          <h2 style="font-size:1.25rem; font-weight:800; margin:0;">🛠️ The 5 In-House Agent Verticals</h2>
          <p style="font-size:0.82rem; color:var(--text-muted); margin:0.25rem 0 0;">Configured system prompts, multi-model routing, and 1-click embed widgets.</p>
        </div>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button class="btn-primary btn-sm" onclick="window.Engine1Desk.openAddKnowledgeModal()" style="background:#8b5cf6;">
            + Ingest Knowledge Source
          </button>
        </div>
      </div>

      <!-- 5 Verticals Cards -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1rem; margin-bottom:2rem;">
        ${verticals.map(v => `
          <div class="card-glass" style="border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                  <span style="font-size:1.5rem;">${v.icon}</span>
                  <div>
                    <h3 style="margin:0; font-size:1rem; font-weight:800; color:#fff;">${v.name}</h3>
                    <span style="font-size:0.72rem; color:#8b5cf6; font-weight:800;">${v.tag}</span>
                  </div>
                </div>
                <span class="e1-badge e1-badge-purple" style="font-size:0.68rem;">${v.model}</span>
              </div>
              <p style="font-size:0.8rem; color:var(--text-secondary); line-height:1.45; margin-bottom:1rem;">
                ${v.desc}
              </p>
            </div>

            <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:0.75rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <button class="btn-ghost btn-sm" onclick="window.Engine1Desk.copyEmbed('${v.embedCode}')">
                📋 Embed Code
              </button>
              <button class="btn-secondary btn-sm" onclick="window.Engine1Desk.openAgentPlayground('${v.id}', '${v.name}')">
                Test Agent ↗
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Vector Knowledge Base Section -->
      <div class="card-glass" style="border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
          <div>
            <h3 style="margin:0; font-size:1.1rem; font-weight:800;">📚 Vector Knowledge Base & Document Registry</h3>
            <span style="font-size:0.76rem; color:var(--text-muted);">${documents.length} Indexed Sources across PDFs, URLs & FAQ pairs</span>
          </div>
          <button class="btn-secondary btn-sm" onclick="window.Engine1Desk.refreshStudioDocs()">
            🔄 Refresh Registry
          </button>
        </div>

        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; font-size:0.82rem; text-align:left;">
            <thead>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.08); color:var(--text-muted); font-size:0.72rem; text-transform:uppercase;">
                <th style="padding:0.6rem;">Source Document / Title</th>
                <th style="padding:0.6rem;">Target Agent</th>
                <th style="padding:0.6rem;">Project Ref</th>
                <th style="padding:0.6rem;">Type</th>
                <th style="padding:0.6rem;">Chunks</th>
                <th style="padding:0.6rem;">Tokens</th>
                <th style="padding:0.6rem; text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${documents.map(d => `
                <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                  <td style="padding:0.75rem 0.6rem; font-weight:700; color:#fff;">
                    ${d.sourceType === 'url' ? '🔗 ' : (d.sourceType === 'pdf' ? '📄 ' : '💬 ')}
                    ${escapeHTML(d.title)}
                  </td>
                  <td style="padding:0.75rem 0.6rem; color:#8b5cf6; font-weight:700;">${d.agentId}</td>
                  <td style="padding:0.75rem 0.6rem; color:var(--text-muted);">${d.projectId}</td>
                  <td style="padding:0.75rem 0.6rem;"><span class="e1-badge e1-badge-purple" style="font-size:0.65rem;">${d.sourceType.toUpperCase()}</span></td>
                  <td style="padding:0.75rem 0.6rem;">${d.chunkCount}</td>
                  <td style="padding:0.75rem 0.6rem; font-family:var(--font-mono); color:#00df89;">${d.tokenCount.toLocaleString()}</td>
                  <td style="padding:0.75rem 0.6rem; text-align:right;">
                    <button class="btn-ghost btn-sm" onclick="window.Engine1Desk.deleteKnowledgeDoc('${d.id}')" style="color:#f87171; padding:0.2rem 0.5rem;">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }


  // 4. Developer Settings View
  function renderSettingsView(container) {
    const spend = telemetryData?.spendingLimits || { monthlyBudgetUSD: 150, currentSpendUSD: 24.85, safetyKillSwitchActive: false };

    container.innerHTML = `
      <div style="max-width:840px; display:flex; flex-direction:column; gap:1.25rem;">
        <div class="card-glass" style="border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1.25rem;">
          <h3 style="margin:0 0 0.5rem; font-size:1.1rem; font-weight:800;">⚙️ Multi-Model AI Routing Policy</h3>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:1rem;">
            Automated routing ladder: Routine client queries use fast Gemini 2.0 Flash; deep code and complex contract queries route to GPT-4o / Claude.
          </p>

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:1rem;">
            <div style="background:rgba(0,0,0,0.25); padding:1rem; border-radius:10px; border:1px solid rgba(255,255,255,0.06);">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-size:0.88rem; color:#fff;">Primary Fast Tier</strong>
                <span class="e1-badge e1-badge-emerald">Active</span>
              </div>
              <div style="color:#00df89; font-weight:800; font-size:0.82rem; margin:0.35rem 0;">Gemini 2.0 Flash / Flash-Lite</div>
              <p style="font-size:0.74rem; color:var(--text-muted); margin:0;">Target Latency: &lt; 400ms. Handles routine sprint progress, warranty FAQs, and WhatsApp replies.</p>
            </div>

            <div style="background:rgba(0,0,0,0.25); padding:1rem; border-radius:10px; border:1px solid rgba(255,255,255,0.06);">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong style="font-size:0.88rem; color:#fff;">Heavy Reasoning Tier</strong>
                <span class="e1-badge e1-badge-purple">Fallback</span>
              </div>
              <div style="color:#c084fc; font-weight:800; font-size:0.82rem; margin:0.35rem 0;">GPT-4o / Claude 3.5 Sonnet</div>
              <p style="font-size:0.74rem; color:var(--text-muted); margin:0;">Target Accuracy: High. Triggered for 50-page legal SOW analysis, code debugging, and financial reconciliations.</p>
            </div>
          </div>
        </div>

        <div class="card-glass" style="border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:1.25rem;">
          <h3 style="margin:0 0 0.5rem; font-size:1.1rem; font-weight:800;">🛑 Token Spending Limits & Kill Switch</h3>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-bottom:1rem;">
            Hard dollar safety ceilings to protect the agency from infinite recursion loops or billing runaway.
          </p>

          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; background:rgba(0,0,0,0.3); padding:1rem; border-radius:10px; border:1px solid ${spend.safetyKillSwitchActive ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.06)'};">
            <div>
              <div style="font-size:0.88rem; font-weight:800; color:#fff;">
                Hard Monthly Kill Switch: $${spend.monthlyBudgetUSD.toFixed(2)} USD
              </div>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.2rem;">
                Current spend: <strong>$${spend.currentSpendUSD.toFixed(2)} USD</strong> · Status: <span style="color:${spend.safetyKillSwitchActive ? '#ef4444' : '#00df89'}; font-weight:800;">${spend.safetyKillSwitchActive ? '🛑 RUNTIME KILLED' : '🟢 OPERATIONAL'}</span>
              </div>
            </div>
            <div style="display:flex; gap:0.5rem;">
              <button class="btn-secondary btn-sm" onclick="window.Engine1Desk.updateSpendingCap()">
                Adjust Ceiling
              </button>
              <button class="btn-primary btn-sm" onclick="window.Engine1Desk.toggleSafetyKillSwitch()" style="background:${spend.safetyKillSwitchActive ? '#00df89' : '#ef4444'};">
                ${spend.safetyKillSwitchActive ? '🟢 Reactivate' : '🛑 Kill Switch'}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Action Handlers
  async function selectThread(id) {
    selectedConvId = id;
    renderInboxView(document.getElementById('e1-tab-content'));
  }

  async function toggleTakeover(id, enabled) {
    try {
      const res = await fetch('/api/chat/takeover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id, enabled })
      }).then(r => r.json());

      if (res && (res.ok || res.success)) {
        await loadInitialData();
        renderInboxView(document.getElementById('e1-tab-content'));
      }
    } catch (e) {
      alert('Takeover error: ' + e.message);
    }
  }

  let threadFilterQuery = '';
  let threadFilterStatus = 'all';

  function renderThreadItemsHtml(list) {
    let filtered = list || [];
    if (threadFilterStatus === 'triage') {
      filtered = filtered.filter(c => c.status === 'triage');
    } else if (threadFilterStatus === 'human') {
      filtered = filtered.filter(c => c.isHumanTakeover);
    }

    if (threadFilterQuery) {
      const q = threadFilterQuery.toLowerCase();
      filtered = filtered.filter(c => 
        (c.clientName && c.clientName.toLowerCase().includes(q)) ||
        (c.projectId && c.projectId.toLowerCase().includes(q)) ||
        (c.messages && c.messages.some(m => m.text && m.text.toLowerCase().includes(q)))
      );
    }

    if (filtered.length === 0) {
      return '<div style="padding:1.5rem; text-align:center; color:var(--text-muted); font-size:0.78rem;">No matching conversation threads found.</div>';
    }

    return filtered.map(c => `
      <div class="e1-thread-item ${c.id === selectedConvId ? 'selected' : ''}" onclick="window.Engine1Desk.selectThread('${c.id}')">
        <div class="e1-thread-title">
          <span style="color:#ffffff; font-weight:700;">${escapeHTML(c.clientName)}</span>
          <span style="font-size:0.7rem; padding:0.1rem 0.4rem; border-radius:6px; background:${c.isHumanTakeover ? 'rgba(16,185,129,0.2)' : (c.status === 'triage' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)')}; color:${c.isHumanTakeover ? '#34d399' : (c.status === 'triage' ? '#f87171' : 'var(--text-muted)')}; font-weight:800;">
            ${c.isHumanTakeover ? 'HUMAN' : (c.status === 'triage' ? 'TRIAGE' : 'AI')}
          </span>
        </div>
        <div style="display:flex; align-items:center; gap:0.4rem; font-size:0.72rem; color:var(--text-muted); margin-bottom:0.25rem;">
          <span>${c.channel === 'telegram' ? '✈️ Telegram' : (c.channel === 'whatsapp' ? '💬 WhatsApp' : '🌐 Web')}</span>
          <span>•</span>
          <span>${c.projectId || 'General'}</span>
        </div>
        <div class="e1-thread-preview">
          ${escapeHTML(c.messages[c.messages.length - 1]?.text || 'No messages')}
        </div>
      </div>
    `).join('');
  }

  function filterThreads(query) {
    threadFilterQuery = query || '';
    const container = document.getElementById('e1-thread-items-container');
    if (container) container.innerHTML = renderThreadItemsHtml(currentConversations);
  }

  function setFilter(status) {
    threadFilterStatus = status;
    document.querySelectorAll('.e1-pill').forEach(p => {
      p.classList.toggle('active', p.textContent.toLowerCase().includes(status));
    });
    const container = document.getElementById('e1-thread-items-container');
    if (container) container.innerHTML = renderThreadItemsHtml(currentConversations);
  }

  async function sendOperatorReply(id) {
    const input = document.getElementById('e1-reply-text');
    if (!input || !input.value.trim() || isSending) return;

    const text = input.value.trim();
    isSending = true;

    try {
      const res = await fetch('/api/chat/operator-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: id, text, operatorName: 'Pod Lead Operator' })
      }).then(r => r.json());

      if (res && (res.ok || res.success)) {
        input.value = '';
        await loadInitialData();
        renderInboxView(document.getElementById('e1-tab-content'));
      }
    } catch (e) {
      alert('Reply delivery error: ' + e.message);
    } finally {
      isSending = false;
    }
  }

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.e1-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tab));
    });
    renderActiveTab();
  }

  async function refreshData() {
    await loadInitialData();
    renderActiveTab();
  }

  function startAutoRefresh() {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(async () => {
      if (window.location.hash === '#engine1' || window.location.hash === '#engines') {
        await loadInitialData();
        if (activeTab === 'inbox' || activeTab === 'telemetry') {
          renderActiveTab();
        }
      }
    }, 15000);
  }

  function formatTimestamp(iso) {
    if (!iso) return 'Just now';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) {
      return 'Just now';
    }
  }

  function formatMessageText(text) {
    if (!text) return '';
    return escapeHTML(text).replace(/\n/g, '<br>');
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function copyEmbed(code) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      alert('📋 1-Click Embed Snippet copied to clipboard! Paste before </body> tag on client website.');
    } else {
      prompt('Copy this embed snippet for client website:', code);
    }
  }

  function openAgentPlayground(id, name) {
    alert(`🤖 Opening sandbox session for ${name} (${id}). System prompts and RAG context active.`);
  }

  async function refreshStudioDocs() {
    renderStudioView(document.getElementById('e1-tab-content'));
  }

  async function deleteKnowledgeDoc(id) {
    if (!confirm('Are you sure you want to remove this document from the RAG knowledge base?')) return;
    try {
      const res = await fetch(`/api/ai/knowledge/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res && res.success) {
        refreshStudioDocs();
      }
    } catch (e) {
      alert('Delete error: ' + e.message);
    }
  }

  async function openAddKnowledgeModal() {
    const title = prompt('Enter document title or URL (e.g. "https://client.com/docs" or "Client SOW v1"):');
    if (!title) return;
    const isUrl = title.startsWith('http://') || title.startsWith('https://');

    try {
      if (isUrl) {
        const res = await fetch('/api/ai/knowledge/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: title, agentId: 'soloops-hub', projectId: 'proj-purplebot-01' })
        }).then(r => r.json());
        if (res && res.success) {
          alert('✅ Website indexed and vectorized into RAG knowledge base!');
          refreshStudioDocs();
        }
      } else {
        const text = prompt('Paste plain text content or SOW terms to vectorize:');
        if (!text) return;
        const res = await fetch('/api/ai/knowledge/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, rawText: text, agentId: 'soloops-hub', projectId: 'proj-purplebot-01' })
        }).then(r => r.json());
        if (res && res.success) {
          alert('✅ Document ingested and chunks created!');
          refreshStudioDocs();
        }
      }
    } catch (e) {
      alert('Ingestion error: ' + e.message);
    }
  }

  async function updateSpendingCap() {
    const val = prompt('Enter new Monthly Spend Cap (USD):', '200');
    if (!val || isNaN(val)) return;
    try {
      const res = await fetch('/api/chat/spending-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyBudgetUSD: parseFloat(val) })
      }).then(r => r.json());
      if (res && res.success) {
        alert(`✅ Spend cap updated to $${parseFloat(val).toFixed(2)} USD!`);
        await loadInitialData();
        renderSettingsView(document.getElementById('e1-tab-content'));
      }
    } catch (e) {
      alert('Error updating cap: ' + e.message);
    }
  }

  async function toggleSafetyKillSwitch() {
    const current = telemetryData?.spendingLimits?.safetyKillSwitchActive || false;
    const next = !current;
    if (next && !confirm('WARNING: Engaging the Safety Kill Switch will immediately stop autonomous AI model loops. Proceed?')) return;
    try {
      const res = await fetch('/api/chat/spending-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ safetyKillSwitchActive: next })
      }).then(r => r.json());
      if (res && res.success) {
        alert(next ? '🛑 Kill Switch ENGAGED.' : '🟢 Kill Switch DISENGAGED.');
        await loadInitialData();
        renderSettingsView(document.getElementById('e1-tab-content'));
      }
    } catch (e) {
      alert('Error toggling switch: ' + e.message);
    }
  }

  // Expose module methods globally
  window.Engine1Desk = {
    render,
    switchTab,
    selectThread,
    toggleTakeover,
    sendOperatorReply,
    refreshData,
    copyEmbed,
    openAgentPlayground,
    refreshStudioDocs,
    deleteKnowledgeDoc,
    openAddKnowledgeModal,
    updateSpendingCap,
    toggleSafetyKillSwitch,
    filterThreads,
    setFilter
  };

  // Register in APP_MODULES
  window.APP_MODULES.engine1 = {
    render: render
  };
})();
