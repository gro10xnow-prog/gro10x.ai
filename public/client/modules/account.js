/**
 * public/client/modules/account.js
 * Client Account, Retainer & Account Manager Profile
 */
window.CLIENT_MODULES = window.CLIENT_MODULES || {};
const escapeHTML = window.escapeHTML || function(s) { return s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : ''; };

window.CLIENT_MODULES.account = async function(container) {
  const me = await CLIENT_API.get('/auth/me').catch(() => ({}));
  const user = me.user || {};
  const clientInfo = await CLIENT_API.get(`/clients/${user.linkedId || user.id}`).catch(() => ({}));

  const pocs = clientInfo.pocs && clientInfo.pocs.length > 0 
    ? clientInfo.pocs 
    : [{ name: user.name || 'Primary Contact', role: 'Account Lead', phone: user.phone || '' }];

  // Resolve assigned Account Manager
  let amName = clientInfo.accountManager || clientInfo.account_manager || 'Tasin Kabir';
  let amRole = 'Senior Manager, Client Services';
  let amPhone = '+880 1709-952672';
  let amRawPhone = '8801709952672';
  let amEmail = 'gro10xnow@gmail.com';

  if (amName.toLowerCase().includes('sayed')) {
    amName = 'Sayed Ashraf';
    amRole = 'Assistant Manager, Client Services';
    amPhone = '+880 1617-410967';
    amRawPhone = '8801617410967';
    amEmail = 'gro10xnow@gmail.com';
  } else if (amName.toLowerCase().includes('rimjhim')) {
    amName = 'Rimjhim Rashid';
    amRole = 'Assistant Manager, Client Services';
    amPhone = '+880 1759-768962';
    amRawPhone = '8801759768962';
    amEmail = 'gro10xnow@gmail.com';
  } else if (amName.toLowerCase().includes('mehedi')) {
    amName = 'MD Mehedi Bin Jayed';
    amRole = 'Head of Client & Growth';
    amPhone = '+880 1874-079687';
    amRawPhone = '8801874079687';
    amEmail = 'gro10xnow@gmail.com';
  }

  container.innerHTML = `
    <div style="margin-bottom:1.5rem;">
      <h1 style="font-size:1.5rem; font-weight:800; font-family:var(--font-heading); margin:0 0 0.3rem;">
        👤 My Account & Contact Information
      </h1>
      <div style="font-size:0.88rem; color:var(--text-muted);">
        Company profile, service retainer level, and dedicated agency contacts.
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

        <div style="margin-top:1.25rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.08); font-size:0.78rem; color:var(--text-muted);">
          Contract: <strong style="color:var(--text-primary);">GRO10X Master Service Agreement</strong>
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

      <!-- Card 3: Authorized Contacts -->
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
  `;

  window.CLIENT_ACCOUNT = {
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
        else alert('Name and phone are required');
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
          else alert('Access request submitted!');
          this.closeAddPocModal();
        }
      } catch (err) {
        if (window.showClientToast) window.showClientToast('Request error: ' + err.message, 'error');
        else alert('Error submitting request');
      }
    }
  };
};
