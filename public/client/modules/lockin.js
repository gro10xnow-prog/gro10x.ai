/**
 * public/client/modules/lockin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * GRO10X Client Portal: Project Lock-In & Handover Cockpit v1.0
 * Provides:
 * 1. Ironclad Scope Lock & Definition of Done visualization (Inclusions vs. Exclusions)
 * 2. 5-Item Handover Shield & Prerequisite Credentials Tracker (PENDING -> RECEIVED -> VERIFIED)
 * 3. Multi-POC Governance Roster & Authority Delegation (Signer, Tech Lead, Finance)
 * 4. Technical Discovery Questionnaire Breakdown & Sprint Milestone Countdown
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.CLIENT_MODULES = window.CLIENT_MODULES || {};
var escapeHTML = window.escapeHTML || function(s) {
  return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';
};

window.CLIENT_MODULES.lockin = async function(container) {
  let activeTab = 'prerequisites';
  let clientRecord = null;
  let activeSpec = null;
  let allSpecs = [];
  let currentClientId = null;

  // 1. Resolve Current Client ID
  try {
    const me = await CLIENT_API.get('/auth/me').catch(() => ({}));
    const user = me.user || {};
    currentClientId = user.linkedId || user.id;

    // Fetch client record
    clientRecord = await CLIENT_API.get('/clients/me').catch(() => null);
  } catch (err) {
    console.warn('[Lockin Module] User resolution notice:', err.message);
  }

  // If no logged in client found via /auth/me, fallback to checking local storage
  if (!currentClientId) {
    try {
      const rawUser = localStorage.getItem('purple_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        currentClientId = u.linkedId || u.id || u.clientId;
      }
    } catch (_) {}
  }

  // 2. Fetch Lock-In Specs for Client
  async function loadSpecs() {
    if (!currentClientId) {
      // Demo / fallback client ID if viewing in dev
      currentClientId = 'CLI-ONBOARD-TEST-99';
    }

    try {
      const res = await CLIENT_API.get(`/clients/${currentClientId}/lockin-specs`).catch(() => ({ data: [] }));
      allSpecs = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      
      // Check if URL hash specifies a spec ID (e.g. #lockin?specId=SPEC-123)
      const hash = window.location.hash || '';
      const match = hash.match(/specId=([^&]+)/);
      const requestedSpecId = match ? match[1] : null;

      if (requestedSpecId) {
        activeSpec = allSpecs.find(s => s.id === requestedSpecId);
      }
      
      if (!activeSpec && allSpecs.length > 0) {
        activeSpec = allSpecs[0];
      }

      // If still no spec found, fetch default demo/canonical spec for display
      if (!activeSpec) {
        activeSpec = {
          id: 'SPEC-DEMO-SVC001',
          canonical_service_code: 'SVC-001',
          service_title: 'Full-Stack SaaS MVP Sprint (14-Day Delivery)',
          status: 'LOCKED',
          scope_boundaries: {
            core_inclusions: [
              'Complete UX/UI Wireframes in Figma with interactive clickable prototype',
              'Production Full-Stack Application Codebase (Node.js + Supabase + Edge API)',
              'PostgreSQL Database Architecture with Row-Level Security (RLS) policies',
              'Automated CI/CD Edge Deployment with custom domain SSL handshake',
              '100% Full Source Code Transfer to Client GitHub Organization'
            ],
            explicit_exclusions: [
              'Legacy data migration or historical database backfilling (Phase 2 SOW)',
              'Third-party external review delays (Apple App Store / DLT SMS registration)',
              'Unspecified custom third-party proprietary API reverse-engineering'
            ],
            definition_of_done: 'Live staging deployment passing end-to-end integration tests, 100% full source code transfer to Client GitHub repository, and recorded 15-min founder walkthrough video.',
            questionnaire_answers: {
              Q1_INFRASTRUCTURE: 'Dedicated Supabase + Vercel stack provisioned for organization',
              Q3_AUTH_SECURITY: 'Email & Password + Google OAuth with secure JWT session handling',
              Q5_SUCCESS_BENCHMARK: 'Launch beta within 14 days to onboard initial cohort.'
            }
          },
          delivery_and_governance: {
            turnaround_days: 14,
            review_window_hours: 48,
            warranty_days: 30,
            target_handover_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
            communication_protocol: {
              primary_chat: 'Dedicated WhatsApp Group (Gro10x + Client Leadership)',
              sprint_updates: 'Async Loom video every Tuesday and Friday'
            }
          },
          prerequisites_checklist: [
            { id: 'PRE-01', category: 'CLOUD_CREDENTIALS', name: 'GitHub Organization Access', instructions: 'Invite GRO10X engineering bot to your target GitHub repository with write permissions.', status: 'RECEIVED' },
            { id: 'PRE-02', category: 'CLOUD_CREDENTIALS', name: 'Supabase / Cloud Hosting Credentials', instructions: 'Authorize GRO10X to provision or connect your Supabase production database.', status: 'PENDING' },
            { id: 'PRE-03', category: 'API_KEYS', name: 'Third-Party Gateway API Credentials', instructions: 'Securely submit test or live API keys for payment gateways or AI model providers.', status: 'PENDING' },
            { id: 'PRE-04', category: 'BRAND_ASSETS', name: 'Vector Brand Identity Assets', instructions: 'Upload SVG vector logos, corporate hex colors, and typography guidelines.', status: 'RECEIVED' },
            { id: 'PRE-05', category: 'SAMPLE_DATA', name: 'Sample Seed Data & User Flow Notes', instructions: 'Provide sample test CSV records and reference competitor workflow links.', status: 'PENDING' }
          ]
        };
      }
    } catch (e) {
      console.error('[Lockin Module] Load specs error:', e);
    }

    renderCockpit();
  }

  // 3. Render Master Cockpit
  function renderCockpit() {
    if (!activeSpec) {
      container.innerHTML = `
        <div class="card-glass" style="text-align:center; padding:3rem 1.5rem;">
          <div style="font-size:3rem; margin-bottom:1rem;">🔒</div>
          <h2 style="font-size:1.4rem; font-family:var(--font-heading); color:#fff; margin-bottom:0.5rem;">No Active Project Lock-In Found</h2>
          <p style="color:var(--text-muted); max-width:480px; margin:0 auto 1.5rem;">
            When you accept a project proposal or SOW, your dedicated zero-miscommunication handover cockpit will automatically appear here.
          </p>
          <a href="#brief" class="btn-primary" style="display:inline-flex; align-items:center; gap:0.5rem; text-decoration:none;">
            <span>📝</span> Submit Service Brief
          </a>
        </div>
      `;
      return;
    }

    const checklist = Array.isArray(activeSpec.prerequisites_checklist) ? activeSpec.prerequisites_checklist : [];
    const receivedCount = checklist.filter(i => i.status === 'RECEIVED' || i.status === 'VERIFIED').length;
    const totalCount = checklist.length || 5;
    const progressPercent = Math.round((receivedCount / totalCount) * 100);

    const statusBadgeClass = 
      activeSpec.status === 'IN_PROGRESS' ? 'badge-purple' :
      activeSpec.status === 'PREREQUISITES_RECEIVED' ? 'badge-emerald' :
      activeSpec.status === 'DELIVERED' ? 'badge-emerald' : 'badge-amber';

    const statusLabel = 
      activeSpec.status === 'IN_PROGRESS' ? '🚀 Active Sprint (In Progress)' :
      activeSpec.status === 'PREREQUISITES_RECEIVED' ? '✅ Handover Complete (Ready for Kickoff)' :
      activeSpec.status === 'DELIVERED' ? '🏆 Delivered & Verified' : '🔒 Scope Locked (Awaiting Prerequisites)';

    container.innerHTML = `
      <!-- Header Hero Banner -->
      <div class="card-glass" style="margin-bottom:1.5rem; border-left:4px solid var(--purple-primary); position:relative; overflow:hidden;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; position:relative; z-index:2;">
          <div>
            <div style="display:flex; align-items:center; gap:0.6rem; margin-bottom:0.4rem;">
              <span class="badge badge-purple" style="font-weight:800; letter-spacing:0.05em;">${escapeHTML(activeSpec.canonical_service_code || 'ENGINE 2')}</span>
              <span class="badge ${statusBadgeClass}">${statusLabel}</span>
            </div>
            <h1 style="font-size:1.6rem; font-weight:800; font-family:var(--font-heading); color:#fff; margin:0 0 0.4rem;">
              ${escapeHTML(activeSpec.service_title || 'AI Agency Service Sprint')}
            </h1>
            <div style="font-size:0.88rem; color:var(--text-muted); display:flex; gap:1.2rem; flex-wrap:wrap;">
              <span>⏱️ Turnaround: <strong>${activeSpec.delivery_and_governance?.turnaround_days || 14} Working Days</strong></span>
              <span>📅 Target Handover: <strong>${escapeHTML(activeSpec.delivery_and_governance?.target_handover_date || 'Calculated at Kickoff')}</strong></span>
              <span>🛡️ Warranty: <strong>${activeSpec.delivery_and_governance?.warranty_days || 30} Days Post-Launch</strong></span>
            </div>
          </div>

          <!-- Prerequisite Handover Progress Bar -->
          <div style="min-width:240px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:0.85rem 1rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.78rem; font-weight:700; margin-bottom:0.4rem;">
              <span style="color:var(--text-secondary);">Handover Shield</span>
              <span style="color:var(--emerald-accent);">${receivedCount}/${totalCount} (${progressPercent}%)</span>
            </div>
            <div style="width:100%; height:8px; background:rgba(255,255,255,0.1); border-radius:99px; overflow:hidden;">
              <div style="width:${progressPercent}%; height:100%; background:linear-gradient(90deg, #8b5cf6, #10b981); transition:width 0.4s ease;"></div>
            </div>
            <div style="font-size:0.7rem; color:var(--text-dim); margin-top:0.35rem;">
              ${receivedCount === totalCount ? '🎉 All prerequisites verified!' : 'Submit remaining items to start sprint'}
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div style="display:flex; gap:0.5rem; margin-bottom:1.25rem; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:0.5rem; overflow-x:auto;">
        <button class="btn-sm ${activeTab === 'prerequisites' ? 'btn-primary' : 'btn-secondary'}" onclick="window.LOCKIN_MODULE.switchTab('prerequisites')">
          🔑 Prerequisites Tracker (${receivedCount}/${totalCount})
        </button>
        <button class="btn-sm ${activeTab === 'scope' ? 'btn-primary' : 'btn-secondary'}" onclick="window.LOCKIN_MODULE.switchTab('scope')">
          🛡️ Scope & DoD Lock
        </button>
        <button class="btn-sm ${activeTab === 'pocs' ? 'btn-primary' : 'btn-secondary'}" onclick="window.LOCKIN_MODULE.switchTab('pocs')">
          👥 Key Contacts & Roles
        </button>
        <button class="btn-sm ${activeTab === 'discovery' ? 'btn-primary' : 'btn-secondary'}" onclick="window.LOCKIN_MODULE.switchTab('discovery')">
          📋 Scoping Discovery
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="lockinTabContent">
        ${renderActiveTabContent()}
      </div>
    `;
  }

  function renderActiveTabContent() {
    if (activeTab === 'prerequisites') {
      return renderPrerequisitesTab();
    } else if (activeTab === 'scope') {
      return renderScopeTab();
    } else if (activeTab === 'pocs') {
      return renderPocsTab();
    } else if (activeTab === 'discovery') {
      return renderDiscoveryTab();
    }
    return '';
  }

  // ── Tab 1: Prerequisites Tracker (Handover Shield) ─────────────────────────
  function renderPrerequisitesTab() {
    const checklist = Array.isArray(activeSpec.prerequisites_checklist) ? activeSpec.prerequisites_checklist : [];

    return `
      <div style="display:flex; flex-direction:column; gap:1rem;">
        <div style="background:rgba(139,92,246,0.1); border:1px solid rgba(139,92,246,0.25); border-radius:12px; padding:0.85rem 1.25rem; font-size:0.85rem; color:#e2e8f0; line-height:1.5;">
          💡 <strong>The GRO10X Zero-Delay Handover Shield:</strong>
          To ensure your 14-day delivery clock runs with maximum speed and zero friction, submit the necessary cloud accesses, API credentials, and brand assets below. As each item is submitted, our engineering team verifies it immediately.
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:1rem;">
          ${checklist.map(item => {
            const isReceived = item.status === 'RECEIVED';
            const isVerified = item.status === 'VERIFIED';
            const isPending = item.status === 'PENDING';

            const badgeColor = isVerified ? 'badge-emerald' : isReceived ? 'badge-purple' : 'badge-amber';
            const statusText = isVerified ? '✅ Verified by Engineering' : isReceived ? '📨 Submitted (Under Review)' : '⏳ Awaiting Submission';

            return `
              <div class="card-glass" style="display:flex; flex-direction:column; justify-content:space-between; gap:0.85rem;">
                <div>
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.4rem;">
                    <span style="font-size:0.7rem; font-weight:800; color:var(--text-dim); text-transform:uppercase;">${escapeHTML(item.category)}</span>
                    <span class="badge ${badgeColor}">${statusText}</span>
                  </div>
                  <h3 style="font-size:1.05rem; font-weight:700; color:#fff; margin:0 0 0.35rem;">
                    ${escapeHTML(item.name)}
                  </h3>
                  <p style="font-size:0.82rem; color:var(--text-secondary); line-height:1.45; margin:0;">
                    ${escapeHTML(item.instructions)}
                  </p>
                </div>

                <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:0.75rem;">
                  ${isVerified ? `
                    <div style="font-size:0.78rem; color:var(--emerald-accent); display:flex; align-items:center; gap:0.4rem;">
                      <span>🔒</span> <strong>Verified & Access Connected</strong>
                    </div>
                  ` : isReceived ? `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-size:0.78rem; color:var(--text-muted);">Submitted at ${item.received_at ? new Date(item.received_at).toLocaleDateString() : 'Today'}</span>
                      <button class="btn-secondary btn-sm" onclick="window.LOCKIN_MODULE.promptPrerequisite('${item.id}', '${escapeHTML(item.name)}')">Update Details</button>
                    </div>
                  ` : `
                    <button class="btn-primary btn-sm" style="width:100%; justify-content:center;" onclick="window.LOCKIN_MODULE.promptPrerequisite('${item.id}', '${escapeHTML(item.name)}')">
                      📤 Submit / Mark as Provided
                    </button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ── Tab 2: Scope & DoD Lock ────────────────────────────────────────────────
  function renderScopeTab() {
    const scope = activeSpec.scope_boundaries || {};
    const inclusions = Array.isArray(scope.core_inclusions) ? scope.core_inclusions : [];
    const exclusions = Array.isArray(scope.explicit_exclusions) ? scope.explicit_exclusions : [];

    return `
      <div style="display:flex; flex-direction:column; gap:1.25rem;">
        <!-- Inclusions & Exclusions 2-Col Grid -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:1.25rem;">
          
          <!-- Core Inclusions -->
          <div class="card-glass" style="border-top:3px solid var(--emerald-accent);">
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
              <span style="font-size:1.2rem;">✅</span>
              <h3 style="font-size:1.15rem; font-weight:800; font-family:var(--font-heading); color:#fff; margin:0;">
                Guaranteed Core Inclusions
              </h3>
            </div>
            <div style="display:flex; flex-direction:column; gap:0.65rem;">
              ${inclusions.map((item, idx) => `
                <div style="display:flex; align-items:flex-start; gap:0.6rem; font-size:0.85rem; color:#e2e8f0; line-height:1.45;">
                  <span style="color:var(--emerald-accent); font-weight:bold;">${idx + 1}.</span>
                  <span>${escapeHTML(item)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Explicit Exclusions -->
          <div class="card-glass" style="border-top:3px solid #ef4444;">
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:1rem;">
              <span style="font-size:1.2rem;">🚫</span>
              <h3 style="font-size:1.15rem; font-weight:800; font-family:var(--font-heading); color:#fff; margin:0;">
                Explicit Exclusions (Phase 2)
              </h3>
            </div>
            <div style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.75rem;">
              Non-negotiable scope shield: To protect your 14-day launch deadline, the following items are formally scoped out of this sprint:
            </div>
            <div style="display:flex; flex-direction:column; gap:0.65rem;">
              ${exclusions.map((item, idx) => `
                <div style="display:flex; align-items:flex-start; gap:0.6rem; font-size:0.85rem; color:#fca5a5; line-height:1.45;">
                  <span style="color:#ef4444; font-weight:bold;">✕</span>
                  <span>${escapeHTML(item)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Definition of Done (DoD) -->
        <div class="card-glass" style="background:rgba(16,185,129,0.05); border:1px solid rgba(16,185,129,0.25);">
          <h3 style="font-size:1.1rem; font-weight:800; font-family:var(--font-heading); color:var(--emerald-accent); margin:0 0 0.5rem;">
            🏁 Formal Definition of Done (DoD)
          </h3>
          <p style="font-size:0.9rem; color:#e2e8f0; line-height:1.6; margin:0 0 1rem;">
            ${escapeHTML(scope.definition_of_done || 'Full handover of clean production codebase and staging deployment.')}
          </p>

          <!-- Governance Terms -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:0.85rem; border-top:1px solid rgba(255,255,255,0.08); padding-top:0.85rem;">
            <div>
              <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Delivery Timeline</div>
              <div style="font-size:0.95rem; font-weight:800; color:#fff;">${activeSpec.delivery_and_governance?.turnaround_days || 14} Working Days</div>
            </div>
            <div>
              <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Client Review SLA</div>
              <div style="font-size:0.95rem; font-weight:800; color:var(--cyan);">${activeSpec.delivery_and_governance?.review_window_hours || 48} Hours Feedback Window</div>
            </div>
            <div>
              <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Bug-Fix Warranty</div>
              <div style="font-size:0.95rem; font-weight:800; color:var(--emerald-accent);">${activeSpec.delivery_and_governance?.warranty_days || 30} Days Complimentary</div>
            </div>
            <div>
              <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Milestone Terms</div>
              <div style="font-size:0.95rem; font-weight:800; color:var(--purple-light);">50% Kickoff / 50% Handover</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ── Tab 3: Key Contacts & Decision Roles (Multi-POC) ───────────────────────
  function renderPocsTab() {
    const pocs = clientRecord?.pocs && clientRecord.pocs.length > 0 
      ? clientRecord.pocs 
      : [{
          name: clientRecord?.contact_person || 'Primary Contact',
          decision_role: 'PRIMARY_DECISION_MAKER',
          designation: 'Managing Director / Founder',
          email: clientRecord?.email || '',
          phone: clientRecord?.phone || '',
          authority: { can_sign_sow: true, can_authorize_payment: true, can_approve_deliverables: true }
        }];

    return `
      <div style="display:flex; flex-direction:column; gap:1.25rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
          <div>
            <h3 style="font-size:1.15rem; font-weight:800; font-family:var(--font-heading); color:#fff; margin:0 0 0.2rem;">
              👥 Authorized Decision Roster
            </h3>
            <div style="font-size:0.82rem; color:var(--text-muted);">
              Designate key representatives for engineering sign-offs, billing, and project direction.
            </div>
          </div>

          <button class="btn-primary btn-sm" onclick="window.LOCKIN_MODULE.openAddPocModal()">
            + Add Contact Person
          </button>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:1rem;">
          ${pocs.map(poc => {
            const isPrimary = poc.decision_role === 'PRIMARY_DECISION_MAKER';
            const isTech = poc.decision_role === 'TECHNICAL_LEAD';
            const isFinance = poc.decision_role === 'BILLING_FINANCE';

            const roleBadge = isPrimary ? 'badge-purple' : isTech ? 'badge-cyan' : isFinance ? 'badge-emerald' : 'badge-amber';
            const roleTitle = isPrimary ? 'Primary Decision Maker' : isTech ? 'Technical Lead' : isFinance ? 'Finance / Billing' : 'Operator';

            return `
              <div class="card-glass" style="display:flex; flex-direction:column; justify-content:space-between; gap:0.85rem;">
                <div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <span class="badge ${roleBadge}">${roleTitle}</span>
                    ${isPrimary ? '<span style="font-size:0.75rem; color:var(--purple-light); font-weight:700;">★ Lead Account</span>' : ''}
                  </div>
                  <h4 style="font-size:1.1rem; color:#fff; margin:0 0 0.2rem;">${escapeHTML(poc.name)}</h4>
                  <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.6rem;">${escapeHTML(poc.designation || '')}</div>

                  <div style="font-size:0.82rem; color:var(--text-secondary); display:flex; flex-direction:column; gap:0.25rem;">
                    ${poc.email ? `<div>📧 ${escapeHTML(poc.email)}</div>` : ''}
                    ${poc.phone ? `<div>📞 ${escapeHTML(poc.phone)}</div>` : ''}
                  </div>
                </div>

                <!-- Authority Badges -->
                <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:0.6rem; display:flex; flex-direction:column; gap:0.3rem;">
                  <div style="font-size:0.7rem; color:var(--text-dim); text-transform:uppercase; font-weight:700;">Delegated Authorities:</div>
                  <div style="display:flex; flex-wrap:wrap; gap:0.3rem;">
                    <span class="badge ${poc.authority?.can_sign_sow ? 'badge-emerald' : 'badge-secondary'}" style="font-size:0.65rem;">
                      ${poc.authority?.can_sign_sow ? '✓ Sign SOW' : '✗ No SOW Signing'}
                    </span>
                    <span class="badge ${poc.authority?.can_approve_deliverables ? 'badge-emerald' : 'badge-secondary'}" style="font-size:0.65rem;">
                      ${poc.authority?.can_approve_deliverables ? '✓ Approve Code/DoD' : '✗ No Code Approval'}
                    </span>
                    <span class="badge ${poc.authority?.can_authorize_payment ? 'badge-emerald' : 'badge-secondary'}" style="font-size:0.65rem;">
                      ${poc.authority?.can_authorize_payment ? '✓ Authorize Wire' : '✗ No Billing'}
                    </span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // ── Tab 4: Scoping Discovery Brief ─────────────────────────────────────────
  function renderDiscoveryTab() {
    const answers = activeSpec.scope_boundaries?.questionnaire_answers || {};

    const questionsMap = [
      { key: 'Q1_INFRASTRUCTURE', title: '1. Cloud Infrastructure & Hosting', answer: answers.Q1_INFRASTRUCTURE || 'Dedicated Supabase PostgreSQL + Edge Architecture' },
      { key: 'Q2_DESIGN_ASSETS', title: '2. UX/UI Wireframes & Brand Assets', answer: answers.Q2_DESIGN_ASSETS || 'Wireframes provided in Figma or created by GRO10X' },
      { key: 'Q3_AUTH_SECURITY', title: '3. Authentication & Access Control', answer: answers.Q3_AUTH_SECURITY || 'Email/Password + OAuth 2.0 with JWT Sessions' },
      { key: 'Q4_INTEGRATIONS', title: '4. Third-Party Gateways & AI APIs', answer: answers.Q4_INTEGRATIONS || 'Google Gemini API + Communication Webhooks' },
      { key: 'Q5_SUCCESS_BENCHMARK', title: '5. Non-Negotiable Launch Deadline & KPI', answer: answers.Q5_SUCCESS_BENCHMARK || 'Beta deployment passing UAT within 14 days' }
    ];

    return `
      <div style="display:flex; flex-direction:column; gap:1rem;">
        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.5rem;">
          Recorded technical discovery specifications for <strong>${escapeHTML(activeSpec.canonical_service_code)}</strong>:
        </div>

        <div style="display:flex; flex-direction:column; gap:0.85rem;">
          ${questionsMap.map(q => `
            <div class="card-glass" style="padding:1rem 1.25rem;">
              <div style="font-size:0.75rem; color:var(--purple-light); font-weight:800; text-transform:uppercase; margin-bottom:0.25rem;">
                ${escapeHTML(q.title)}
              </div>
              <div style="font-size:0.92rem; color:#fff; line-height:1.5;">
                ${escapeHTML(q.answer)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // ── Interactive Actions (Exposed to Window) ────────────────────────────────
  window.LOCKIN_MODULE = {
    switchTab(tabName) {
      activeTab = tabName;
      const el = document.getElementById('lockinTabContent');
      if (el) {
        el.innerHTML = renderActiveTabContent();
      }
      renderCockpit();
    },

    async promptPrerequisite(itemId, itemName) {
      // Non-blocking submission without native prompt or alert
      const existingModal = document.getElementById('prereqModalOverlay');
      if (existingModal) existingModal.remove();

      const modal = document.createElement('div');
      modal.className = 'modal-backdrop active';
      modal.id = 'prereqModalOverlay';
      modal.style.cssText = 'position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; padding:1rem;';
      modal.innerHTML = `
        <div class="modal-box card-glass" style="max-width:480px; width:100%; padding:1.5rem; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:#0f172a; box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
          <h3 style="margin:0 0 0.5rem; font-size:1.15rem; color:#fff;">🔐 Submit Prerequisite Credentials</h3>
          <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:1rem;">
            Provide repository invite link, API key, credentials, or confirmation note for: <br/><strong style="color:var(--purple-light);">${escapeHTML(itemName)}</strong>
          </div>
          <textarea id="prereqSubmissionInput" rows="3" class="form-input" style="width:100%; box-sizing:border-box; padding:0.6rem 0.8rem; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:#fff; font-size:0.85rem;" placeholder="e.g. GitHub invite sent to tech@gro10x.ai or API token..."></textarea>
          <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1rem;">
            <button type="button" class="btn-secondary" id="btnCancelPrereq" style="font-size:0.82rem; padding:0.4rem 0.8rem;">Cancel</button>
            <button type="button" class="btn-primary" id="btnSubmitPrereq" style="font-size:0.82rem; padding:0.4rem 1rem;">Mark Received & Submit</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#btnCancelPrereq').onclick = () => { modal.remove(); };
      modal.querySelector('#btnSubmitPrereq').onclick = async () => {
        const note = modal.querySelector('#prereqSubmissionInput').value.trim();
        modal.remove();
        try {
          const res = await CLIENT_API.put(`/clients/${currentClientId}/lockin-specs/${activeSpec.id}/prerequisites/${itemId}`, {
            status: 'RECEIVED',
            note: note || 'Prerequisite provided by client'
          });

          if (res.ok) {
            if (window.showClientToast) window.showClientToast('✅ Item marked as RECEIVED! Engineering team notified.', 'success');
            await loadSpecs();
          } else {
            if (window.showClientToast) window.showClientToast(`Error: ${res.error || 'Failed to update prerequisite'}`, 'error');
          }
        } catch (err) {
          if (window.showClientToast) window.showClientToast(`Failed to submit: ${err.message}`, 'error');
        }
      };
    },

    async openAddPocModal() {
      const existingModal = document.getElementById('addPocModalOverlay');
      if (existingModal) existingModal.remove();

      const modal = document.createElement('div');
      modal.className = 'modal-backdrop active';
      modal.id = 'addPocModalOverlay';
      modal.style.cssText = 'position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.7); display:flex; align-items:center; justify-content:center; padding:1rem;';
      modal.innerHTML = `
        <div class="modal-box card-glass" style="max-width:480px; width:100%; padding:1.5rem; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:#0f172a; box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
          <h3 style="margin:0 0 0.5rem; font-size:1.15rem; color:#fff;">👤 Add Authorized Contact Person</h3>
          <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:1rem;">
            Register a designated point of contact with role-based decision authority.
          </div>
          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            <div>
              <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:0.25rem;">Full Name *</label>
              <input type="text" id="pocFullName" class="form-input" style="width:100%; box-sizing:border-box; padding:0.5rem 0.75rem; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:#fff;" placeholder="e.g. Asif Mahmud" />
            </div>
            <div>
              <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:0.25rem;">Email Address</label>
              <input type="email" id="pocEmail" class="form-input" style="width:100%; box-sizing:border-box; padding:0.5rem 0.75rem; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:#fff;" placeholder="asif@company.com" />
            </div>
            <div>
              <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:0.25rem;">WhatsApp / Phone</label>
              <input type="text" id="pocPhone" class="form-input" style="width:100%; box-sizing:border-box; padding:0.5rem 0.75rem; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:#fff;" placeholder="+880 1711-019550" />
            </div>
            <div>
              <label style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:0.25rem;">Authority Role</label>
              <select id="pocRoleSelect" class="form-input" style="width:100%; box-sizing:border-box; padding:0.5rem 0.75rem; background:#1e293b; border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:#fff;">
                <option value="TECHNICAL_LEAD">Technical Lead / Head of Engineering</option>
                <option value="BILLING_FINANCE">Billing & Finance / Commercial Approver</option>
                <option value="DAY_TO_DAY_OPERATOR">Day-to-Day Operations Specialist</option>
              </select>
            </div>
          </div>
          <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.25rem;">
            <button type="button" class="btn-secondary" id="btnCancelPoc" style="font-size:0.82rem; padding:0.4rem 0.8rem;">Cancel</button>
            <button type="button" class="btn-primary" id="btnSavePoc" style="font-size:0.82rem; padding:0.4rem 1rem;">Register Contact</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('#btnCancelPoc').onclick = () => { modal.remove(); };
      modal.querySelector('#btnSavePoc').onclick = async () => {
        const name = modal.querySelector('#pocFullName').value.trim();
        const email = modal.querySelector('#pocEmail').value.trim();
        const phone = modal.querySelector('#pocPhone').value.trim();
        const roleChoice = modal.querySelector('#pocRoleSelect').value;

        if (!name) {
          if (window.showClientToast) window.showClientToast('Contact name is required', 'error');
          return;
        }

        modal.remove();

        let designation = 'Head of Engineering';
        if (roleChoice === 'BILLING_FINANCE') designation = 'Finance / Accounts Lead';
        else if (roleChoice === 'DAY_TO_DAY_OPERATOR') designation = 'Operations Specialist';

        try {
          const res = await CLIENT_API.post(`/clients/${currentClientId}/pocs`, {
            name,
            email,
            phone,
            decision_role: roleChoice,
            designation
          });

          if (res.ok) {
            if (window.showClientToast) window.showClientToast('✅ Contact person successfully registered to your account.', 'success');
            if (clientRecord) {
              clientRecord.pocs = res.client?.pocs || clientRecord.pocs;
            }
            renderCockpit();
          } else {
            if (window.showClientToast) window.showClientToast(`Failed to add contact: ${res.error || 'Server error'}`, 'error');
          }
        } catch (err) {
          if (window.showClientToast) window.showClientToast(`Failed to add contact: ${err.message}`, 'error');
        }
      };
    }
  };

  // Initial Load
  await loadSpecs();
};
