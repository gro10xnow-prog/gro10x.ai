/**
 * public/app/modules/proposals.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Admin Client Proposals & Quotations Studio Module v1.0
 * Features:
 * - 🎙️ Live Voice-to-Text Transcription via Web Speech API
 * - ✨ Gemini-Powered AI Proposal Generator from raw meeting context
 * - 📋 Multi-Currency Proposal Builder (BDT ৳ / USD $) with Scope & Cost Tables
 * - 🔗 1-Tap Shareable Public Link with View Tracking & Real-Time Alerts
 * - 📄 Instant Executive PDF Export via jsPDF
 * - 🚀 1-Tap Conversion from Accepted Proposal to Active Production Project
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES['proposals.js'] = {
  proposals: [],
  currentFilter: 'all',
  recognition: null,
  isRecording: false,

  async render(container) {
    container.innerHTML = `
      <div class="proposals-container" style="padding: 24px 0;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
          <div>
            <h2 style="font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 800; color: #fff; margin-bottom: 4px; display: flex; align-items: center; gap: 10px;">
              <span>💼</span> Client Proposals & Quotations Studio
            </h2>
            <p style="color: var(--text-muted, #94a3b8); font-size: 14px;">
              AI-assisted voice/context proposal drafting, shareable client links, and 1-tap project conversion.
            </p>
          </div>
          <div style="display: flex; gap: 12px;">
            <button class="btn btn-primary" id="btnOpenNewProposal" style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px;">✨</span> New Proposal (AI / Voice)
            </button>
          </div>
        </div>

        <!-- KPI Scorecards -->
        <div class="kpi-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div class="card" style="padding: 20px; border-left: 4px solid var(--primary, #00df89);">
            <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-dim, #64748b);">Active Pipeline</div>
            <div id="kpiTotalProposals" style="font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 800; color: #fff; margin-top: 4px;">0</div>
            <div style="font-size: 12px; color: var(--text-muted, #94a3b8); margin-top: 4px;">Total proposals created</div>
          </div>
          <div class="card" style="padding: 20px; border-left: 4px solid #06b6d4;">
            <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-dim, #64748b);">One-Time Pipeline Value</div>
            <div id="kpiOneTimePipeline" style="font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 800; color: #06b6d4; margin-top: 4px;">৳0</div>
            <div style="font-size: 12px; color: var(--text-muted, #94a3b8); margin-top: 4px;">Build fees in pipeline</div>
          </div>
          <div class="card" style="padding: 20px; border-left: 4px solid #a855f7;">
            <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-dim, #64748b);">Monthly Retainer Potential</div>
            <div id="kpiRecurringPipeline" style="font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 800; color: #a855f7; margin-top: 4px;">৳0/mo</div>
            <div style="font-size: 12px; color: var(--text-muted, #94a3b8); margin-top: 4px;">Projected recurring MRR</div>
          </div>
          <div class="card" style="padding: 20px; border-left: 4px solid #eab308;">
            <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-dim, #64748b);">Win / Acceptance Rate</div>
            <div id="kpiAcceptedRate" style="font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 800; color: #eab308; margin-top: 4px;">0%</div>
            <div style="font-size: 12px; color: var(--text-muted, #94a3b8); margin-top: 4px;">Client acceptance track</div>
          </div>
        </div>

        <!-- Filter Chips & Search -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="proposalFilterChips">
            <button class="filter-chip active" data-filter="all">All Proposals</button>
            <button class="filter-chip" data-filter="Draft">Drafts</button>
            <button class="filter-chip" data-filter="Sent">Sent</button>
            <button class="filter-chip" data-filter="Viewed">Viewed</button>
            <button class="filter-chip" data-filter="Accepted">Accepted</button>
            <button class="filter-chip" data-filter="Converted">Converted to Project</button>
          </div>
        </div>

        <!-- Proposals List Table -->
        <div class="card" style="padding: 0; overflow: hidden;">
          <div style="overflow-x: auto;">
            <table class="table" style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="background: rgba(0,0,0,0.3); border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.08));">
                  <th style="padding: 14px 18px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">ID / Ref</th>
                  <th style="padding: 14px 18px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">Client / Company</th>
                  <th style="padding: 14px 18px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">Project Proposal</th>
                  <th style="padding: 14px 18px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">Build Investment</th>
                  <th style="padding: 14px 18px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">Monthly Retainer</th>
                  <th style="padding: 14px 18px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase;">Status</th>
                  <th style="padding: 14px 18px; font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase; text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody id="proposalsTableBody">
                <tr>
                  <td colspan="7" style="padding: 30px; text-align: center; color: var(--text-muted, #94a3b8);">
                    Loading client proposals...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Proposal Builder Modal / Drawer -->
        <div class="modal-overlay" id="proposalModal" style="display:none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 1000; overflow-y: auto; padding: 24px 16px;">
          <div class="modal-card" style="max-width: 860px; margin: 20px auto; background: var(--bg-surface-elevated, #151f32); border: 1px solid var(--border-subtle, rgba(255,255,255,0.1)); border-radius: 16px; padding: 32px; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
            
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding-bottom: 16px;">
              <div>
                <h3 style="font-family: 'Outfit', sans-serif; font-size: 22px; color: #fff; margin-bottom: 4px;" id="proposalModalTitle">✨ Create Project Proposal</h3>
                <p style="color: var(--text-muted, #94a3b8); font-size: 13px;">Talk into your mic or type raw meeting context — Gemini AI will structure the entire proposal.</p>
              </div>
              <button class="btn btn-outline" id="btnCloseProposalModal" style="padding: 6px 12px; font-size: 16px;">✕</button>
            </div>

            <!-- AI Context & Voice Input Section -->
            <div style="background: rgba(0, 223, 137, 0.04); border: 1px dashed rgba(0, 223, 137, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <label style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--primary, #00df89); display: flex; align-items: center; gap: 6px;">
                  <span>🎙️</span> Meeting Context & Voice Dump
                </label>
                <div style="display: flex; gap: 8px;">
                  <button type="button" class="btn btn-outline" id="btnVoiceToggle" style="padding: 6px 14px; font-size: 13px; border-color: rgba(0, 223, 137, 0.4); color: var(--primary, #00df89);">
                    <span id="voiceMicIcon">🎤</span> <span id="voiceMicLabel">Record Voice</span>
                  </button>
                  <button type="button" class="btn btn-primary" id="btnRunAIDraft" style="padding: 6px 16px; font-size: 13px;">
                    <span>✨</span> Auto-Draft with AI
                  </button>
                </div>
              </div>
              <textarea id="aiMeetingNotes" rows="4" class="form-textarea" placeholder="Speak or paste meeting notes here... (e.g. 'Client is UCB Bank. They want an automated chatbot for Facebook and Instagram to replace 2 human agents. Needs dedicated dashboard, Telegram human escalation, $400 one-time and 7.5k to 10k BDT monthly maintenance')..." style="width: 100%; background: rgba(7, 11, 18, 0.7); border: 1px solid var(--border-subtle, rgba(255,255,255,0.1)); border-radius: 8px; color: #fff; padding: 12px; font-size: 13px;"></textarea>
            </div>

            <!-- Proposal Details Form -->
            <form id="proposalForm">
              <input type="hidden" id="propEditId" value="">
              <input type="hidden" id="propShareToken" value="">

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                  <label class="form-label" style="font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase; font-weight: 600;">Client Name *</label>
                  <input type="text" id="propClientName" class="form-input" required placeholder="e.g. United Commercial Bank" style="width: 100%;">
                </div>
                <div>
                  <label class="form-label" style="font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase; font-weight: 600;">Company / Organization</label>
                  <input type="text" id="propClientCompany" class="form-input" placeholder="e.g. UCB PLC" style="width: 100%;">
                </div>
                <div>
                  <label class="form-label" style="font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase; font-weight: 600;">Currency</label>
                  <select id="propCurrency" class="form-input" style="width: 100%;">
                    <option value="BDT" selected>BDT (৳ - Bangladeshi Taka)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                  </select>
                </div>
              </div>

              <div style="margin-bottom: 16px;">
                <label class="form-label" style="font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase; font-weight: 600;">Project Title *</label>
                <input type="text" id="propProjectTitle" class="form-input" required placeholder="e.g. 24/7 AI-Powered Social Media Customer Automation" style="width: 100%;">
              </div>

              <div style="margin-bottom: 20px;">
                <label class="form-label" style="font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase; font-weight: 600;">Executive Summary & Problem Statement</label>
                <textarea id="propProjectSummary" rows="3" class="form-textarea" placeholder="Brief summary of the business solution..." style="width: 100%;"></textarea>
              </div>

              <!-- Scope Items -->
              <div style="margin-bottom: 24px; background: rgba(0,0,0,0.2); padding: 18px; border-radius: 10px; border: 1px solid var(--border-subtle, rgba(255,255,255,0.06));">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <h4 style="font-size: 14px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px;">⚡ Deliverable Scope Breakdown</h4>
                  <button type="button" class="btn btn-outline" id="btnAddScopeItem" style="padding: 4px 10px; font-size: 12px;">+ Add Deliverable</button>
                </div>
                <div id="scopeItemsWrapper"></div>
              </div>

              <!-- Phase 1: One-Time Items Table -->
              <div style="margin-bottom: 24px; background: rgba(0,0,0,0.2); padding: 18px; border-radius: 10px; border: 1px solid var(--border-subtle, rgba(255,255,255,0.06));">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <h4 style="font-size: 14px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px;">🛠️ Phase 1: One-Time Build Costs</h4>
                  <button type="button" class="btn btn-outline" id="btnAddOneTimeItem" style="padding: 4px 10px; font-size: 12px;">+ Add Build Item</button>
                </div>
                <div id="oneTimeItemsWrapper"></div>
                <div style="text-align: right; margin-top: 10px; font-weight: 700; color: var(--primary, #00df89);">
                  One-Time Total: <span id="formOneTimeTotal">0</span>
                </div>
              </div>

              <!-- Phase 2: Recurring Items Table -->
              <div style="margin-bottom: 24px; background: rgba(0,0,0,0.2); padding: 18px; border-radius: 10px; border: 1px solid var(--border-subtle, rgba(255,255,255,0.06));">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                  <h4 style="font-size: 14px; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.5px;">🔄 Phase 2: Monthly Infrastructure & Maintenance Retainer</h4>
                  <button type="button" class="btn btn-outline" id="btnAddRecurringItem" style="padding: 4px 10px; font-size: 12px;">+ Add Retainer Item</button>
                </div>
                <div id="recurringItemsWrapper"></div>
                <div style="text-align: right; margin-top: 10px; font-weight: 700; color: #06b6d4;">
                  Monthly Retainer Total: <span id="formRecurringTotal">0</span>/mo
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                  <label class="form-label" style="font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase; font-weight: 600;">Estimated Timeline</label>
                  <input type="text" id="propTimeline" class="form-input" placeholder="e.g. 10–14 Working Days" style="width: 100%;">
                </div>
                <div>
                  <label class="form-label" style="font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase; font-weight: 600;">Valid Until</label>
                  <input type="date" id="propValidUntil" class="form-input" style="width: 100%;">
                </div>
              </div>

              <div style="margin-bottom: 16px;">
                <label class="form-label" style="font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase; font-weight: 600;">Commercial Terms & Conditions</label>
                <textarea id="propTerms" rows="3" class="form-textarea" placeholder="Commercial payment milestones, SLA, and data ownership terms..." style="width: 100%;"></textarea>
              </div>

              <div style="margin-bottom: 24px;">
                <label class="form-label" style="font-size: 12px; color: var(--text-dim, #64748b); text-transform: uppercase; font-weight: 600;">Internal Notes (Only visible to Admin)</label>
                <input type="text" id="propNotes" class="form-input" placeholder="e.g. Partner agency margin is 25%" style="width: 100%;">
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-subtle, rgba(255,255,255,0.08)); padding-top: 16px;">
                <button type="button" class="btn btn-outline" id="btnCancelProposalModal">Cancel</button>
                <button type="submit" class="btn btn-primary" id="btnSaveProposal">Save & Publish Proposal</button>
              </div>
            </form>
          </div>
        </div>

      </div>
    `;

    this.bindEvents(container);
    await this.loadProposals();
  },

  async loadProposals() {
    try {
      const list = await APP_API.get('/proposals');
      this.proposals = Array.isArray(list) ? list : [];
      this.renderTable();
      this.updateKPIS();
    } catch (err) {
      console.error('Failed to load proposals:', err);
      if (window.showToast) window.showToast('Could not load proposals', 'error');
    }
  },

  updateKPIS() {
    const total = this.proposals.length;
    const oneTimeSum = this.proposals.reduce((sum, p) => sum + (Number(p.oneTimeTotal) || 0), 0);
    const recurringSum = this.proposals.reduce((sum, p) => sum + (Number(p.recurringTotal) || 0), 0);
    const acceptedCount = this.proposals.filter(p => p.status === 'Accepted' || p.status === 'Converted').length;
    const winRate = total > 0 ? Math.round((acceptedCount / total) * 100) : 0;

    const elTotal = document.getElementById('kpiTotalProposals');
    const elOneTime = document.getElementById('kpiOneTimePipeline');
    const elRecurring = document.getElementById('kpiRecurringPipeline');
    const elRate = document.getElementById('kpiAcceptedRate');

    if (elTotal) elTotal.textContent = total;
    if (elOneTime) elOneTime.textContent = `৳${oneTimeSum.toLocaleString()}`;
    if (elRecurring) elRecurring.textContent = `৳${recurringSum.toLocaleString()}/mo`;
    if (elRate) elRate.textContent = `${winRate}%`;
  },

  renderTable() {
    const tbody = document.getElementById('proposalsTableBody');
    if (!tbody) return;

    let filtered = this.proposals;
    if (this.currentFilter !== 'all') {
      filtered = this.proposals.filter(p => p.status === this.currentFilter);
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="padding: 40px; text-align: center; color: var(--text-muted, #94a3b8);">
            No proposals found in this view. Click <strong>New Proposal</strong> to create one.
          </td>
        </tr>
      `;
      return;
    }

    const baseUrl = window.location.origin;

    tbody.innerHTML = filtered.map(p => {
      const currSymbol = p.currency === 'USD' ? '$' : '৳';
      const token = p.shareToken || p.share_token || '';
      const publicLink = `${baseUrl}/proposal.html?t=${token}`;
      
      let statusColor = '#94a3b8';
      let statusBg = 'rgba(148, 163, 184, 0.1)';
      if (p.status === 'Sent') { statusColor = '#06b6d4'; statusBg = 'rgba(6, 182, 212, 0.15)'; }
      if (p.status === 'Viewed') { statusColor = '#eab308'; statusBg = 'rgba(234, 179, 8, 0.15)'; }
      if (p.status === 'Accepted') { statusColor = '#00df89'; statusBg = 'rgba(0, 223, 137, 0.2)'; }
      if (p.status === 'Converted') { statusColor = '#a855f7'; statusBg = 'rgba(168, 85, 247, 0.2)'; }

      return `
        <tr style="border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.04));">
          <td style="padding: 14px 18px; font-family: monospace; font-size: 13px; color: var(--primary, #00df89);">
            ${p.id || 'PROP-001'}
          </td>
          <td style="padding: 14px 18px;">
            <div style="font-weight: 700; color: #fff;">${p.clientName || 'Client'}</div>
            <div style="font-size: 12px; color: var(--text-muted, #94a3b8);">${p.clientCompany || ''}</div>
          </td>
          <td style="padding: 14px 18px; max-width: 260px;">
            <div style="font-weight: 600; color: var(--text-main, #f8fafc); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${p.projectTitle || 'AI Solution'}
            </div>
            <div style="font-size: 11px; color: var(--text-dim, #64748b);">
              ${p.viewCount || 0} views ${p.viewedAt ? `· Last: ${new Date(p.viewedAt).toLocaleDateString()}` : ''}
            </div>
          </td>
          <td style="padding: 14px 18px; font-family: 'Outfit', sans-serif; font-weight: 700; color: #fff;">
            ${currSymbol} ${Number(p.oneTimeTotal || 0).toLocaleString()}
          </td>
          <td style="padding: 14px 18px; font-family: 'Outfit', sans-serif; font-weight: 700; color: #06b6d4;">
            ${currSymbol} ${Number(p.recurringTotal || 0).toLocaleString()}/mo
          </td>
          <td style="padding: 14px 18px;">
            <span style="display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; color: ${statusColor}; background: ${statusBg};">
              ${p.status || 'Draft'}
            </span>
          </td>
          <td style="padding: 14px 18px; text-align: right;">
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
              <button class="btn btn-outline" onclick="window.APP_MODULES['proposals.js'].copyShareLink('${publicLink}')" title="Copy Public Shareable Link" style="padding: 6px 10px; font-size: 13px;">
                🔗 Link
              </button>
              <a href="${publicLink}" target="_blank" class="btn btn-outline" title="Open Public View" style="padding: 6px 10px; font-size: 13px; text-decoration: none;">
                👁️ View
              </a>
              ${p.status !== 'Converted' ? `
                <button class="btn btn-outline" onclick="window.APP_MODULES['proposals.js'].convertToProject('${p.id}')" title="Convert to Active Project" style="padding: 6px 10px; font-size: 13px; color: var(--primary, #00df89);">
                  🚀 Project
                </button>
              ` : ''}
              <button class="btn btn-outline" onclick="window.APP_MODULES['proposals.js'].editProposal('${p.id}')" title="Edit Proposal" style="padding: 6px 10px; font-size: 13px;">
                ✏️
              </button>
              <button class="btn btn-outline" onclick="window.APP_MODULES['proposals.js'].deleteProposal('${p.id}')" title="Delete Proposal" style="padding: 6px 10px; font-size: 13px; color: #ef4444;">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  bindEvents(container) {
    // Open Modal
    document.getElementById('btnOpenNewProposal')?.addEventListener('click', () => {
      this.openProposalModal();
    });

    // Close Modal
    document.getElementById('btnCloseProposalModal')?.addEventListener('click', () => {
      this.closeProposalModal();
    });
    document.getElementById('btnCancelProposalModal')?.addEventListener('click', () => {
      this.closeProposalModal();
    });

    // Filter Chips
    document.getElementById('proposalFilterChips')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('filter-chip')) {
        document.querySelectorAll('#proposalFilterChips .filter-chip').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.renderTable();
      }
    });

    // Add Dynamic Rows
    document.getElementById('btnAddScopeItem')?.addEventListener('click', () => {
      this.addScopeItemRow();
    });
    document.getElementById('btnAddOneTimeItem')?.addEventListener('click', () => {
      this.addOneTimeItemRow();
    });
    document.getElementById('btnAddRecurringItem')?.addEventListener('click', () => {
      this.addRecurringItemRow();
    });

    // Voice Input Toggle (Web Speech API)
    document.getElementById('btnVoiceToggle')?.addEventListener('click', () => {
      this.toggleVoiceInput();
    });

    // Run AI Draft Generator
    document.getElementById('btnRunAIDraft')?.addEventListener('click', () => {
      this.runAIDraft();
    });

    // Form Submit
    document.getElementById('proposalForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProposal();
    });
  },

  toggleVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (window.showToast) window.showToast('Speech recognition is not supported in this browser. Please use Chrome.', 'error');
      return;
    }

    const btn = document.getElementById('btnVoiceToggle');
    const icon = document.getElementById('voiceMicIcon');
    const label = document.getElementById('voiceMicLabel');
    const notesArea = document.getElementById('aiMeetingNotes');

    if (!this.recognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        notesArea.value = transcript.trim();
      };

      this.recognition.onerror = (err) => {
        console.warn('Speech error:', err);
        this.isRecording = false;
        if (icon) icon.textContent = '🎤';
        if (label) label.textContent = 'Record Voice';
        if (btn) btn.style.background = '';
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        if (icon) icon.textContent = '🎤';
        if (label) label.textContent = 'Record Voice';
        if (btn) btn.style.background = '';
      };
    }

    if (!this.isRecording) {
      try {
        this.recognition.start();
        this.isRecording = true;
        if (icon) icon.textContent = '🔴';
        if (label) label.textContent = 'Listening... Tap to Stop';
        if (btn) btn.style.background = 'rgba(239, 68, 68, 0.2)';
        if (window.showToast) window.showToast('🎙️ Listening... Speak your meeting notes');
      } catch (e) {}
    } else {
      this.recognition.stop();
      this.isRecording = false;
      if (icon) icon.textContent = '🎤';
      if (label) label.textContent = 'Record Voice';
      if (btn) btn.style.background = '';
      if (window.showToast) window.showToast('Voice recording stopped');
    }
  },

  async runAIDraft() {
    const notes = document.getElementById('aiMeetingNotes')?.value.trim();
    if (!notes || notes.length < 5) {
      if (window.showToast) window.showToast('Please record or type meeting notes first', 'error');
      return;
    }

    const btn = document.getElementById('btnRunAIDraft');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>⏳</span> Drafting with AI...`;
    }

    try {
      const currency = document.getElementById('propCurrency')?.value || 'BDT';
      const clientHint = document.getElementById('propClientName')?.value || '';

      const res = await APP_API.post('/proposals/ai-draft', {
        notes,
        clientName: clientHint,
        currency
      });

      if (res && res.draft) {
        const d = res.draft;
        if (d.clientName) document.getElementById('propClientName').value = d.clientName;
        if (d.clientCompany) document.getElementById('propClientCompany').value = d.clientCompany;
        if (d.projectTitle) document.getElementById('propProjectTitle').value = d.projectTitle;
        if (d.projectSummary) document.getElementById('propProjectSummary').value = d.projectSummary;
        if (d.timeline) document.getElementById('propTimeline').value = d.timeline;
        if (d.terms) document.getElementById('propTerms').value = d.terms;

        // Render Scope
        const scopeWrap = document.getElementById('scopeItemsWrapper');
        scopeWrap.innerHTML = '';
        (d.scopeItems || []).forEach(s => this.addScopeItemRow(s.title, s.description));

        // Render One-Time Items
        const otWrap = document.getElementById('oneTimeItemsWrapper');
        otWrap.innerHTML = '';
        (d.oneTimeItems || []).forEach(i => this.addOneTimeItemRow(i.name, i.description, i.amount));

        // Render Recurring Items
        const recWrap = document.getElementById('recurringItemsWrapper');
        recWrap.innerHTML = '';
        (d.recurringItems || []).forEach(i => this.addRecurringItemRow(i.name, i.description, i.amount, i.frequency));

        this.recalculateTotals();

        if (window.showToast) window.showToast('✨ Proposal generated by Gemini AI! Review and fine-tune below.');
      }
    } catch (err) {
      console.error('AI Draft failed:', err);
      if (window.showToast) window.showToast('AI draft failed. Please check notes or fill manually.', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span>✨</span> Auto-Draft with AI`;
      }
    }
  },

  openProposalModal(proposal = null) {
    const modal = document.getElementById('proposalModal');
    if (!modal) return;

    document.getElementById('proposalForm').reset();
    document.getElementById('scopeItemsWrapper').innerHTML = '';
    document.getElementById('oneTimeItemsWrapper').innerHTML = '';
    document.getElementById('recurringItemsWrapper').innerHTML = '';
    document.getElementById('aiMeetingNotes').value = '';

    if (proposal) {
      document.getElementById('proposalModalTitle').textContent = `✏️ Edit Proposal (${proposal.id})`;
      document.getElementById('propEditId').value = proposal.id;
      document.getElementById('propShareToken').value = proposal.shareToken || proposal.share_token || '';
      document.getElementById('propClientName').value = proposal.clientName || '';
      document.getElementById('propClientCompany').value = proposal.clientCompany || '';
      document.getElementById('propCurrency').value = proposal.currency || 'BDT';
      document.getElementById('propProjectTitle').value = proposal.projectTitle || '';
      document.getElementById('propProjectSummary').value = proposal.projectSummary || '';
      document.getElementById('propTimeline').value = proposal.timeline || '';
      document.getElementById('propValidUntil').value = proposal.validUntil ? proposal.validUntil.split('T')[0] : '';
      document.getElementById('propTerms').value = proposal.terms || '';
      document.getElementById('propNotes').value = proposal.notes || '';

      (proposal.scopeItems || []).forEach(s => this.addScopeItemRow(s.title, s.description));
      (proposal.oneTimeItems || []).forEach(i => this.addOneTimeItemRow(i.name, i.description, i.amount));
      (proposal.recurringItems || []).forEach(i => this.addRecurringItemRow(i.name, i.description, i.amount, i.frequency));
    } else {
      document.getElementById('proposalModalTitle').textContent = '✨ Create Project Proposal';
      document.getElementById('propEditId').value = '';
      document.getElementById('propShareToken').value = '';
      document.getElementById('propTerms').value = '1. 50% advance upon formal kickoff and credentials handover; 50% upon successful UAT sign-off.\n2. Monthly maintenance and AI infrastructure retainer is billed at the beginning of each service cycle.\n3. Usage & API Policy: Standard monthly AI inference volume is included. Any high-volume surges or additional third-party API compute will be billed directly at actual provider costs with full transparent usage telemetry.\n4. Client maintains 100% data sovereignty and confidential control over all user sessions and data.\n5. Standard SLA response time for critical infrastructure triage is under 60 minutes.';

      // Add starter empty rows
      this.addScopeItemRow('System Architecture & API Integration', '');
      this.addOneTimeItemRow('Core Build & Setup', '', 45000);
      this.addRecurringItemRow('AI Inference & Dedicated Hosting', '', 8500, 'Monthly');
    }

    this.recalculateTotals();
    modal.style.display = 'block';
  },

  closeProposalModal() {
    const modal = document.getElementById('proposalModal');
    if (modal) modal.style.display = 'none';
    if (this.isRecording && this.recognition) {
      this.recognition.stop();
      this.isRecording = false;
    }
  },

  addScopeItemRow(title = '', desc = '') {
    const wrap = document.getElementById('scopeItemsWrapper');
    const row = document.createElement('div');
    row.className = 'scope-item-row';
    row.style.cssText = 'display: grid; grid-template-columns: 1fr 2fr auto; gap: 8px; margin-bottom: 8px; align-items: center;';
    row.innerHTML = `
      <input type="text" class="form-input scope-title" placeholder="Deliverable Title" value="${title.replace(/"/g, '&quot;')}" style="font-size: 13px;">
      <input type="text" class="form-input scope-desc" placeholder="Scope Description" value="${desc.replace(/"/g, '&quot;')}" style="font-size: 13px;">
      <button type="button" class="btn btn-outline" onclick="this.parentElement.remove()" style="padding: 6px 10px; color: #ef4444;">✕</button>
    `;
    wrap.appendChild(row);
  },

  addOneTimeItemRow(name = '', desc = '', amount = '') {
    const wrap = document.getElementById('oneTimeItemsWrapper');
    const row = document.createElement('div');
    row.className = 'onetime-item-row';
    row.style.cssText = 'display: grid; grid-template-columns: 1.5fr 2fr 1fr auto; gap: 8px; margin-bottom: 8px; align-items: center;';
    row.innerHTML = `
      <input type="text" class="form-input ot-name" placeholder="Component Name" value="${name.replace(/"/g, '&quot;')}" style="font-size: 13px;">
      <input type="text" class="form-input ot-desc" placeholder="Description" value="${desc.replace(/"/g, '&quot;')}" style="font-size: 13px;">
      <input type="number" class="form-input ot-amount" placeholder="Amount" value="${amount}" oninput="window.APP_MODULES['proposals.js'].recalculateTotals()" style="font-size: 13px; font-weight: 700;">
      <button type="button" class="btn btn-outline" onclick="this.parentElement.remove(); window.APP_MODULES['proposals.js'].recalculateTotals();" style="padding: 6px 10px; color: #ef4444;">✕</button>
    `;
    wrap.appendChild(row);
    this.recalculateTotals();
  },

  addRecurringItemRow(name = '', desc = '', amount = '', freq = 'Monthly') {
    const wrap = document.getElementById('recurringItemsWrapper');
    const row = document.createElement('div');
    row.className = 'recurring-item-row';
    row.style.cssText = 'display: grid; grid-template-columns: 1.5fr 2fr 1fr auto; gap: 8px; margin-bottom: 8px; align-items: center;';
    row.innerHTML = `
      <input type="text" class="form-input rec-name" placeholder="Service / Retainer Item" value="${name.replace(/"/g, '&quot;')}" style="font-size: 13px;">
      <input type="text" class="form-input rec-desc" placeholder="Description (Hosting, SLA, etc)" value="${desc.replace(/"/g, '&quot;')}" style="font-size: 13px;">
      <input type="number" class="form-input rec-amount" placeholder="Monthly Fee" value="${amount}" oninput="window.APP_MODULES['proposals.js'].recalculateTotals()" style="font-size: 13px; font-weight: 700;">
      <button type="button" class="btn btn-outline" onclick="this.parentElement.remove(); window.APP_MODULES['proposals.js'].recalculateTotals();" style="padding: 6px 10px; color: #ef4444;">✕</button>
    `;
    wrap.appendChild(row);
    this.recalculateTotals();
  },

  recalculateTotals() {
    let oneTimeTotal = 0;
    document.querySelectorAll('.ot-amount').forEach(input => {
      oneTimeTotal += Number(input.value) || 0;
    });

    let recurringTotal = 0;
    document.querySelectorAll('.rec-amount').forEach(input => {
      recurringTotal += Number(input.value) || 0;
    });

    const curr = document.getElementById('propCurrency')?.value || 'BDT';
    const symbol = curr === 'USD' ? '$' : '৳';

    const otEl = document.getElementById('formOneTimeTotal');
    const recEl = document.getElementById('formRecurringTotal');

    if (otEl) otEl.textContent = `${symbol} ${oneTimeTotal.toLocaleString()}`;
    if (recEl) recEl.textContent = `${symbol} ${recurringTotal.toLocaleString()}`;
  },

  async saveProposal() {
    const editId = document.getElementById('propEditId').value;
    const shareToken = document.getElementById('propShareToken').value;

    const scopeItems = [];
    document.querySelectorAll('.scope-item-row').forEach(row => {
      const title = row.querySelector('.scope-title')?.value.trim();
      const desc = row.querySelector('.scope-desc')?.value.trim();
      if (title) scopeItems.push({ title, description: desc });
    });

    const oneTimeItems = [];
    document.querySelectorAll('.onetime-item-row').forEach(row => {
      const name = row.querySelector('.ot-name')?.value.trim();
      const desc = row.querySelector('.ot-desc')?.value.trim();
      const amount = Number(row.querySelector('.ot-amount')?.value) || 0;
      if (name) oneTimeItems.push({ name, description: desc, amount });
    });

    const recurringItems = [];
    document.querySelectorAll('.recurring-item-row').forEach(row => {
      const name = row.querySelector('.rec-name')?.value.trim();
      const desc = row.querySelector('.rec-desc')?.value.trim();
      const amount = Number(row.querySelector('.rec-amount')?.value) || 0;
      if (name) recurringItems.push({ name, description: desc, amount, frequency: 'Monthly' });
    });

    const payload = {
      clientName: document.getElementById('propClientName').value.trim(),
      clientCompany: document.getElementById('propClientCompany').value.trim(),
      currency: document.getElementById('propCurrency').value,
      projectTitle: document.getElementById('propProjectTitle').value.trim(),
      projectSummary: document.getElementById('propProjectSummary').value.trim(),
      timeline: document.getElementById('propTimeline').value.trim(),
      validUntil: document.getElementById('propValidUntil').value || null,
      terms: document.getElementById('propTerms').value.trim(),
      notes: document.getElementById('propNotes').value.trim(),
      status: 'Sent',
      scopeItems,
      oneTimeItems,
      recurringItems
    };

    if (shareToken) payload.shareToken = shareToken;

    try {
      if (editId) {
        await APP_API.patch(`/proposals/${editId}`, payload);
        if (window.showToast) window.showToast('✅ Proposal updated successfully');
      } else {
        await APP_API.post('/proposals', payload);
        if (window.showToast) window.showToast('🚀 Proposal created & link activated!');
      }

      this.closeProposalModal();
      await this.loadProposals();
    } catch (err) {
      console.error('Save proposal failed:', err);
      if (window.showToast) window.showToast('Failed to save proposal', 'error');
    }
  },

  editProposal(id) {
    const prop = this.proposals.find(p => p.id === id);
    if (prop) this.openProposalModal(prop);
  },

  async deleteProposal(id) {
    if (!confirm(`Are you sure you want to delete proposal ${id}?`)) return;
    try {
      await APP_API.delete(`/proposals/${id}`);
      if (window.showToast) window.showToast('Proposal deleted');
      await this.loadProposals();
    } catch (err) {
      if (window.showToast) window.showToast('Failed to delete proposal', 'error');
    }
  },

  copyShareLink(url) {
    navigator.clipboard.writeText(url).then(() => {
      if (window.showToast) window.showToast('🔗 Public proposal link copied to clipboard!');
    }).catch(() => {
      prompt('Copy this proposal link:', url);
    });
  },

  async convertToProject(id) {
    if (!confirm(`Convert this proposal into an active production project?`)) return;
    try {
      const res = await APP_API.post(`/proposals/${id}/convert-to-project`, {});
      if (res && res.success) {
        if (window.showToast) window.showToast(`🚀 Converted to Project ${res.projectId}!`);
        await this.loadProposals();
      }
    } catch (err) {
      console.error('Conversion failed:', err);
      if (window.showToast) window.showToast('Failed to convert proposal to project', 'error');
    }
  }
};
