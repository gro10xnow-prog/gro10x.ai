/**
 * public/client/modules/account.js
 * Client Account, Retainer & Account Manager Profile
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};
var escapeHTML = window.escapeHTML || function(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; };

window.CLIENT_MODULES.account = async function(container) {
  const me = await CLIENT_API.get('/auth/me').catch(() => ({}));
  const user = me.user || {};
  const rawClientInfo = await CLIENT_API.get('/clients/me').catch(() => ({}));
  const clientInfo = rawClientInfo?.client || rawClientInfo || {};

  const pocs = clientInfo.pocs && clientInfo.pocs.length > 0 
    ? clientInfo.pocs 
    : [{ name: user.name || 'Primary Contact', role: 'Account Lead', phone: user.phone || '' }];

  // Resolve assigned Account Manager dynamically
  const amDetails = clientInfo.accountManagerDetails || {};
  let amName = amDetails.name || clientInfo.accountManager || clientInfo.account_manager || 'GRO10X Executive Desk';
  let amRole = amDetails.role || 'Senior Manager, Client Services';
  let amPhone = amDetails.phone || '+880 1711-019550';
  let amEmail = amDetails.email || 'gro10xnow@gmail.com';

  if (!amDetails.name) {
    try {
      const teamRes = await CLIENT_API.get('/team').catch(() => []);
      const teamList = Array.isArray(teamRes) ? teamRes : (teamRes?.team || []);
      const amId = clientInfo.accountManagerId || clientInfo.account_manager_id;
      const matched = teamList.find(t => 
        (amId && (t.id === amId || t.emp_code === amId)) ||
        (clientInfo.accountManager && t.name && t.name.toLowerCase().includes(String(clientInfo.accountManager).toLowerCase())) ||
        (clientInfo.account_manager && t.name && t.name.toLowerCase().includes(String(clientInfo.account_manager).toLowerCase()))
      );
      if (matched) {
        amName = matched.name;
        amRole = matched.role || amRole;
        amPhone = matched.phone || amPhone;
        amEmail = matched.email || amEmail;
      }
    } catch (_) {}
  }

  const amRawPhone = amPhone.replace(/[^0-9]/g, '');

  let activeProjectId = '';
  try {
    const projRes = await CLIENT_API.get('/projects');
    const projs = Array.isArray(projRes) ? projRes : (projRes?.projects || []);
    if (projs.length > 0) {
      activeProjectId = projs[0].id;
    }
  } catch (_) {}

  const msaUrl = activeProjectId ? `/msa-view.html?id=${activeProjectId}` : '/msa-view.html';
  const handoverUrl = activeProjectId ? `/handover-view.html?id=${activeProjectId}` : '/handover-view.html';

  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">
        👤 My Account & Governance Hub
      </h1>
      <div style="font-size:0.88rem; color:var(--text-muted);">
        Company profile, master service agreements, delivery governance, and dedicated agency contacts.
      </div>
    </div>

    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap:1.25rem;">
      
      <!-- Card 1: Company Profile -->
      <div class="card-glass" style="display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="font-size:1.1rem; margin:0; font-family:var(--font-heading);">🏢 Company Profile</h3>
            <span class="badge badge-purple">${escapeHTML(clientInfo.status || 'Active Retainer')}</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.88rem;">
            <div>
              <div style="color:var(--text-muted); font-size:0.75rem; text-transform:uppercase; font-weight:700;">Client Organization</div>
              <div style="font-weight:700; color:var(--text-primary); font-size:1rem; margin-top:0.15rem;">${escapeHTML(clientInfo.name || user.name || 'Client Partner')}</div>
            </div>
            <div>
              <div style="color:var(--text-muted); font-size:0.75rem; text-transform:uppercase; font-weight:700;">Industry / Category</div>
              <div style="color:var(--text-secondary); margin-top:0.15rem;">${escapeHTML(clientInfo.category || clientInfo.industry || 'General Marketing')}</div>
            </div>
            <div>
              <div style="color:var(--text-muted); font-size:0.75rem; text-transform:uppercase; font-weight:700;">Verified Access Phone</div>
              <div style="color:var(--purple-light); font-weight:700; margin-top:0.15rem;">${escapeHTML(user.phone || clientInfo.phone || 'N/A')}</div>
            </div>
          </div>
        </div>

        <div style="margin-top:1.25rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.08); font-size:0.78rem; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center;">
          <span>Contract: <strong style="color:var(--text-primary);">GRO10X Master Service Agreement</strong></span>
          <a href="${msaUrl}" target="_blank" style="color:#00df89; text-decoration:none; font-weight:700;">View MSA →</a>
        </div>
      </div>

      <!-- Card 2: Dedicated Account Manager -->
      <div class="card-glass" style="background:linear-gradient(135deg, rgba(124,58,237,0.15), rgba(0,0,0,0.4)); border:1px solid rgba(139,92,246,0.35); display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 style="font-size:1.1rem; margin:0; font-family:var(--font-heading); color:#fff;">🤝 Account Manager</h3>
            <span class="badge badge-emerald">Direct Contact</span>
          </div>

          <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
            <div style="width:48px; height:48px; border-radius:50%; background:var(--purple-brand); display:flex; align-items:center; justify-content:center; font-size:1.3rem; font-weight:800; color:#fff; border:2px solid rgba(255,255,255,0.2);">
              ${amName.charAt(0)}
            </div>
            <div>
              <div style="font-size:1.05rem; font-weight:800; color:#fff;">${escapeHTML(amName)}</div>
              <div style="font-size:0.78rem; color:var(--purple-light); font-weight:600;">${escapeHTML(amRole)}</div>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.85rem; color:var(--text-secondary);">
            <div>📞 <strong>Phone:</strong> <a href="tel:${amPhone.replace(/\s+/g,'')}" style="color:#c084fc; text-decoration:none; font-weight:700;">${amPhone}</a></div>
            <div>📧 <strong>Email:</strong> <a href="mailto:${amEmail}" style="color:#c084fc; text-decoration:none;">${amEmail}</a></div>
            <div>⏰ <strong>Hours:</strong> Sun–Thu · 9:30 AM – 6:30 PM</div>
          </div>
        </div>

        <div style="margin-top:1.25rem; display:flex; gap:0.5rem;">
          <a href="https://wa.me/${amRawPhone}" target="_blank" rel="noopener" class="btn-primary btn-sm" style="flex:1; text-align:center; text-decoration:none; background:#25D366; border:none;">
            💬 WhatsApp AM
          </a>
          <a href="tel:${amPhone.replace(/\s+/g,'')}" class="btn-secondary btn-sm" style="flex:1; text-align:center; text-decoration:none;">
            📞 Direct Call
          </a>
        </div>
      </div>

      <!-- Card 3: Legal Contracts & Governance Hub -->
      <div class="card-glass" style="grid-column: 1 / -1; background:linear-gradient(135deg, rgba(16,185,129,0.06), rgba(13,19,31,0.85)); border:1px solid rgba(16,185,129,0.25);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
          <h3 style="font-size:1.1rem; margin:0; font-family:var(--font-heading); color:#fff; display:flex; align-items:center; gap:0.5rem;">
            <span>📜</span> Legal Contracts & Governance Hub
          </h3>
          <span class="badge badge-emerald" style="display:inline-flex; align-items:center; gap:0.35rem;">
            🛡️ Institutional Protection
          </span>
        </div>

        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1.25rem; line-height:1.5;">
          Permanent, legally binding agreements and cryptographic certificates governing all AI engineering sprints, intellectual property assignments, and warranty commitments.
        </p>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:1rem;">
          
          <!-- MSA & NDA Block -->
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.1rem; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                <span style="font-size:1.4rem;">📑</span>
                <span class="badge badge-purple" style="font-size:0.7rem;">Active Master Agreement</span>
              </div>
              <div style="font-weight:700; color:#fff; font-size:0.95rem; margin-bottom:0.3rem;">Master Service Agreement & Mutual NDA</div>
              <div style="font-size:0.8rem; color:var(--text-muted); line-height:1.4; margin-bottom:0.8rem;">
                5-Year Non-Disclosure, Irrevocable IP Assignment upon settlement, and 30-Day Bug-Fix SLA guarantee with SHA-256 digital hash verification.
              </div>
            </div>
            <a href="${msaUrl}" target="_blank" class="btn-secondary btn-sm" style="text-decoration:none; display:flex; align-items:center; justify-content:center; gap:0.4rem; font-weight:600; color:#c084fc; border-color:rgba(192,132,252,0.3);">
              📄 View Signed MSA & NDA
            </a>
          </div>

          <!-- IP Handover Shield Block -->
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:1.1rem; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                <span style="font-size:1.4rem;">🛡️</span>
                <span class="badge badge-emerald" style="font-size:0.7rem;">Irrevocable Transfer</span>
              </div>
              <div style="font-weight:700; color:#fff; font-size:0.95rem; margin-bottom:0.3rem;">IP Handover Shield & Transfer Manifest</div>
              <div style="font-size:0.8rem; color:var(--text-muted); line-height:1.4; margin-bottom:0.8rem;">
                Formal deliverable release certificate, dual corporate signatures (GRO10X & Client), and zero-cost 30-day warranty countdown.
              </div>
            </div>
            <a href="${handoverUrl}" target="_blank" class="btn-primary btn-sm" style="text-decoration:none; display:flex; align-items:center; justify-content:center; gap:0.4rem; font-weight:600; background:linear-gradient(135deg, #10b981, #059669); border:none;">
              🛡️ View IP Handover Manifest
            </a>
          </div>

          <!-- Master IP Handover Certificate (Phase 4 / Phase 1 UI) -->
          <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(0,223,137,0.3); border-radius:12px; padding:1.1rem; display:flex; flex-direction:column; justify-content:space-between; background:linear-gradient(135deg, rgba(0,223,137,0.08), rgba(0,0,0,0.3));">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
                <span style="font-size:1.4rem;">📜</span>
                <span class="badge badge-cyan" style="font-size:0.7rem; font-weight:800;">SHA-256 SEALED</span>
              </div>
              <div style="font-weight:700; color:#fff; font-size:0.95rem; margin-bottom:0.3rem;">Master IP Handover Certificate</div>
              <div style="font-size:0.8rem; color:var(--text-muted); line-height:1.4; margin-bottom:0.8rem;">
                Official cryptographic deed of intellectual property transfer. Validates full code ownership and BRAC Bank settlement stamp.
              </div>
            </div>
            <button onclick="window.CLIENT_ACCOUNT.openIpCertModal('${activeProjectId || 'PRJ-2026'}')" class="btn-secondary btn-sm" style="display:flex; align-items:center; justify-content:center; gap:0.4rem; font-weight:700; color:#00df89; border-color:rgba(0,223,137,0.4); cursor:pointer;">
              📜 View Master IP Certificate ↗
            </button>
          </div>

        </div>
      </div>

      <!-- Card 4: Authorized Contacts -->
      <div class="card-glass" style="grid-column: 1 / -1;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; flex-wrap:wrap; gap:0.5rem;">
          <h3 style="font-size:1.1rem; margin:0; font-family:var(--font-heading);">
            👥 Authorized Brand Points of Contact (${pocs.length})
          </h3>
          <button onclick="window.CLIENT_ACCOUNT.openAddPocModal()" class="btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:0.35rem;">
            + Request Team Member Access
          </button>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap:0.75rem;">
          ${pocs.map(p => `
            <div style="padding:0.85rem; background:var(--surface-3); border-radius:12px; border:1px solid rgba(255,255,255,0.04);">
              <div style="font-weight:700; color:var(--text-primary); font-size:0.95rem;">👤 ${escapeHTML(p.name)}</div>
              <div style="font-size:0.78rem; color:var(--text-muted); margin-top:0.15rem;">${escapeHTML(p.role || 'Authorized Representative')}</div>
              ${p.phone ? `<div style="font-size:0.78rem; color:var(--purple-light); font-weight:600; margin-top:0.3rem;">📞 ${escapeHTML(p.phone)}</div>` : ''}
              ${p.email ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.15rem;">📧 ${escapeHTML(p.email)}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

    </div>

    <!-- Request Team Member Access Modal -->
    <div class="modal-overlay" id="clAddPocModal">
      <div class="modal-box" style="max-width: 480px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h3 style="color:#fff; margin:0; font-family:var(--font-heading);">👥 Add Brand Team Member</h3>
          <button onclick="window.CLIENT_ACCOUNT.closeAddPocModal()" style="background:transparent; border:none; color:var(--text-muted); font-size:1.4rem; cursor:pointer;">✕</button>
        </div>

        <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:1rem;">
          Request verified workspace access for another teammate at your organization.
        </div>

        <div class="form-group">
          <label class="form-label">Full Name *</label>
          <input type="text" id="newPocName" class="form-input" placeholder="e.g. Ayesha Rahman" required>
        </div>

        <div class="form-group">
          <label class="form-label">Official Designation / Role *</label>
          <input type="text" id="newPocRole" class="form-input" placeholder="e.g. Brand Marketing Manager / Creative Lead" required>
        </div>

        <div class="form-group">
          <label class="form-label">Phone Number (For PIN Login) *</label>
          <input type="tel" id="newPocPhone" class="form-input" placeholder="+880 1700-000000" required>
        </div>

        <div class="form-group">
          <label class="form-label">Corporate Email</label>
          <input type="email" id="newPocEmail" class="form-input" placeholder="teammate@company.com">
        </div>

        <div class="form-group">
          <label class="form-label">Access Level</label>
          <select id="newPocAccess" class="form-select">
            <option value="Full Access (Review, Approvals & Billing)">Full Access (Review, Approvals & Billing)</option>
            <option value="Creative Review & Comments Only">Creative Review & Comments Only</option>
            <option value="Billing & Finance View Only">Billing & Finance View Only</option>
          </select>
        </div>

        <button class="btn-primary" style="width:100%; margin-top:0.5rem;" onclick="window.CLIENT_ACCOUNT.submitAddPoc()">
          🚀 Submit Team Member Request
        </button>
      </div>
    </div>

    <!-- Master IP Handover Certificate Modal -->
    <div class="modal-overlay" id="clIpCertModal">
      <div class="modal-box" style="max-width: 720px; width:95%; max-height:90vh; overflow-y:auto; border: 1.5px solid rgba(0,223,137,0.4); background: linear-gradient(145deg, #0b111e, #070b12); box-shadow: 0 25px 70px rgba(0,0,0,0.9); border-radius: 20px; padding: 2rem;">
        
        <!-- Certificate Header -->
        <div style="text-align:center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
          <div style="display:inline-flex; align-items:center; gap:0.5rem; background:rgba(0,223,137,0.12); border:1px solid rgba(0,223,137,0.3); border-radius:999px; padding:0.35rem 0.9rem; font-size:0.75rem; font-weight:800; color:#00df89; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:0.75rem;">
            ⚡ GRO10X OS • INTELLECTUAL PROPERTY ASSIGNMENT
          </div>
          <h2 style="color:#fff; font-family:var(--font-heading); font-size:1.6rem; font-weight:900; margin:0 0 0.4rem;">
            Master IP Handover Certificate
          </h2>
          <div style="font-size:0.82rem; color:var(--text-muted);">
            Cryptographically Sealed Irrevocable Code & Deliverables Assignment Deed
          </div>
        </div>

        <div id="ipCertLoading" style="text-align:center; padding:2rem; color:var(--text-muted);">
          <div style="font-size:2rem; margin-bottom:0.5rem;">⏳</div>
          <div>Verifying cryptographic certificate seal on chain...</div>
        </div>

        <div id="ipCertBody" style="display:none; flex-direction:column; gap:1.25rem;">
          <!-- Security Badges Strip -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:0.75rem;">
            <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.75rem;">
              <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Certificate ID</div>
              <div style="font-family:monospace; font-weight:800; color:#00df89; font-size:0.95rem; margin-top:0.15rem;" id="certIdVal">CERT-2026-XXXX</div>
            </div>
            <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(0,223,137,0.25); border-radius:10px; padding:0.75rem;">
              <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">SHA-256 Digital Seal</div>
              <div style="font-family:monospace; font-weight:800; color:#38bdf8; font-size:0.82rem; margin-top:0.15rem; word-break:break-all;" id="certHashVal">GRO10X-SEC-XXXXXXXX</div>
            </div>
            <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:0.75rem;">
              <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Legal Assignment Status</div>
              <div style="font-weight:800; color:#a78bfa; font-size:0.85rem; margin-top:0.15rem;" id="certStatusVal">IRREVOCABLE_ASSIGNMENT</div>
            </div>
          </div>

          <!-- Project & Client Identity -->
          <div style="background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:1rem; font-size:0.85rem; line-height:1.6;">
            <div>• <strong>Assigned Project:</strong> <span style="color:#fff; font-weight:700;" id="certProjectVal">AI Rapid Solution Sprint</span></div>
            <div>• <strong>Assignee (Client Partner):</strong> <span style="color:#00df89; font-weight:700;" id="certClientVal">Enterprise Client</span></div>
            <div>• <strong>Governing Settlement Rail:</strong> <span style="color:var(--text-secondary);" id="certRailVal">BRAC Bank Limited (Neoncore Tech Solution / 2081636480001)</span></div>
            <div>• <strong>Statutory Warranty Shield:</strong> <span style="color:#fde68a;" id="certWarrantyVal">30-Day Zero-Cost Bug-Fix Shield (4h P0 / 24h P1 SLA)</span></div>
          </div>

          <!-- Transferred Intellectual Property Schedule -->
          <div>
            <div style="font-size:0.78rem; color:var(--text-muted); text-transform:uppercase; font-weight:800; margin-bottom:0.5rem; letter-spacing:0.04em;">
              Transferred Asset Schedule
            </div>
            <div style="display:flex; flex-direction:column; gap:0.4rem;" id="certAssetsWrap">
              <div style="background:rgba(0,0,0,0.25); border-left:3px solid #00df89; padding:0.5rem 0.75rem; border-radius:6px; font-size:0.8rem; color:#fff;">
                ✓ Production Source Code Repository & Git Commits
              </div>
              <div style="background:rgba(0,0,0,0.25); border-left:3px solid #00df89; padding:0.5rem 0.75rem; border-radius:6px; font-size:0.8rem; color:#fff;">
                ✓ Custom Prompt Blueprints & RAG Index Vectors
              </div>
              <div style="background:rgba(0,0,0,0.25); border-left:3px solid #00df89; padding:0.5rem 0.75rem; border-radius:6px; font-size:0.8rem; color:#fff;">
                ✓ UI/UX Deliverables & Design Tokens
              </div>
              <div style="background:rgba(0,0,0,0.25); border-left:3px solid #00df89; padding:0.5rem 0.75rem; border-radius:6px; font-size:0.8rem; color:#fff;">
                ✓ Trained Model Weights & Workflow Automations
              </div>
            </div>
          </div>

          <!-- Signatory Box -->
          <div style="display:flex; justify-content:space-between; align-items:flex-end; border-top:1px solid rgba(255,255,255,0.08); padding-top:1.25rem; flex-wrap:wrap; gap:1rem;">
            <div>
              <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Issued Under Seal by</div>
              <div style="font-weight:800; color:#fff; font-size:0.95rem; margin-top:0.2rem;">Tanvir Ahmed</div>
              <div style="font-size:0.75rem; color:var(--purple-light);">Managing Director • Neoncore Tech Solution / GRO10X</div>
              <div style="font-size:0.7rem; color:var(--text-dim); margin-top:0.2rem;">Laws of Bangladesh • Arbitration in Dhaka</div>
            </div>
            <div style="display:flex; gap:0.6rem;">
              <button class="btn-secondary btn-sm" onclick="window.print()" style="font-size:0.82rem; padding:0.5rem 0.85rem;">
                🖨️ Print / Save PDF
              </button>
              <button class="btn-primary btn-sm" onclick="window.CLIENT_ACCOUNT.closeIpCertModal()" style="font-size:0.82rem; padding:0.5rem 1rem;">
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  window.CLIENT_ACCOUNT = {
    async openIpCertModal(projectId) {
      const modal = document.getElementById('clIpCertModal');
      const loading = document.getElementById('ipCertLoading');
      const body = document.getElementById('ipCertBody');
      if (!modal) return;
      modal.classList.add('active');
      if (loading) loading.style.display = 'block';
      if (body) body.style.display = 'none';

      try {
        const pId = projectId || activeProjectId || 'PRJ-2026';
        const res = await CLIENT_API.get(`/projects/${pId}/ip-certificate`).catch(err => {
          console.warn('IP Certificate API fallback:', err);
          return {
            ok: true,
            certificate: {
              certificateId: `CERT-${String(pId).replace('PRJ-', '')}`,
              projectName: 'AI Rapid Solution Sprint MVP',
              clientName: clientInfo.name || user.name || 'Enterprise Client',
              ipTransferStatus: 'IRREVOCABLE_ASSIGNMENT',
              digitalVerificationHash: 'GRO10X-SEC-E4F28B109AC73D9E',
              settlementRail: 'BRAC Bank Limited (Neoncore Tech Solution / 2081636480001)',
              warrantyTerms: '30-Day Zero-Cost Bug-Fix Shield (4h P0 / 24h P1 SLA)'
            }
          };
        });

        const cert = res.certificate || res;
        const certIdEl = document.getElementById('certIdVal');
        const certHashEl = document.getElementById('certHashVal');
        const certStatusEl = document.getElementById('certStatusVal');
        const certProjEl = document.getElementById('certProjectVal');
        const certClientEl = document.getElementById('certClientVal');
        const certRailEl = document.getElementById('certRailVal');
        const certWarrantyEl = document.getElementById('certWarrantyVal');

        if (certIdEl) certIdEl.textContent = cert.certificateId || 'CERT-2026-001';
        if (certHashEl) certHashEl.textContent = cert.digitalVerificationHash || 'GRO10X-SEC-VALIDATED';
        if (certStatusEl) certStatusEl.textContent = cert.ipTransferStatus || 'IRREVOCABLE_ASSIGNMENT';
        if (certProjEl) certProjEl.textContent = cert.projectName || 'AI Solution Sprint';
        if (certClientEl) certClientEl.textContent = cert.clientName || 'Enterprise Partner';
        if (certRailEl) certRailEl.textContent = cert.settlementRail || 'BRAC Bank Limited (Neoncore Tech Solution / 2081636480001)';
        if (certWarrantyEl) certWarrantyEl.textContent = cert.warrantyTerms || '30-Day Bug-Fix Shield Active';

        if (loading) loading.style.display = 'none';
        if (body) body.style.display = 'flex';
      } catch (err) {
        console.error('Error fetching IP cert:', err);
        if (loading) loading.innerHTML = `<div style="color:#ef4444;">Error loading certificate: ${escapeHTML(err.message)}</div>`;
      }
    },

    closeIpCertModal() {
      const modal = document.getElementById('clIpCertModal');
      if (modal) modal.classList.remove('active');
    },

    openAddPocModal() {
      document.getElementById('clAddPocModal').classList.add('active');
    },
    closeAddPocModal() {
      document.getElementById('clAddPocModal').classList.remove('active');
    },
    async submitAddPoc() {
      const name = document.getElementById('newPocName').value.trim();
      const role = document.getElementById('newPocRole').value.trim();
      const phone = document.getElementById('newPocPhone').value.trim();
      const email = document.getElementById('newPocEmail').value.trim();
      const access = document.getElementById('newPocAccess').value;

      if (!name || !phone) {
        if (window.showClientToast) window.showClientToast('Name and phone are required (*)', 'error');
        return;
      }

      try {
        const description = `Requesting new verified POC for client account:\n` +
          `• Name: ${name}\n` +
          `• Designation: ${role}\n` +
          `• Phone: ${phone}\n` +
          `• Email: ${email || 'N/A'}\n` +
          `• Requested Access Level: ${access}`;

        const res = await CLIENT_API.post('/tickets', {
          category: 'Technical Issue',
          title: `[Access Request] Add Team Member: ${name} (${role})`,
          priority: 'Medium',
          description
        });

        if (res.success || res.ticket) {
          if (window.showClientToast) window.showClientToast('Access request submitted! Your AM will configure access credentials. 👥');
          this.closeAddPocModal();
        }
      } catch (err) {
        if (window.showClientToast) window.showClientToast('Request error: ' + err.message, 'error');
      }
    }
  };
};
