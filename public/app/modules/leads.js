window.APP_MODULES = window.APP_MODULES || {};

window.APP_MODULES.leads = async function(container) {
  let leadsData = [];

  async function loadLeads() {
    try {
      leadsData = await window.APP_API.get('/leads') || [];
      render();
    } catch (err) {
      console.error(err);
      container.innerHTML = `<div style="color:var(--text-error); padding: 2rem;">Error loading leads.</div>`;
    }
  }

  window.updateLeadStage = async function(id, stage) {
    try {
      await window.APP_API.put(`/leads/${id}`, { stage });
      window.showToast(`Lead ${id} marked as ${stage}`, 'success');
      setTimeout(() => loadLeads(), 500);
    } catch(err) {
      window.showToast('Failed to update lead stage', 'error');
    }
  };

  window.setFollowUp = async function(id) {
    const dateStr = prompt('Enter follow-up date (YYYY-MM-DD):');
    if (!dateStr) return;
    try {
      await window.APP_API.put(`/leads/${id}`, { follow_up_date: dateStr });
      window.showToast(`Follow-up set for ${dateStr}`, 'success');
      setTimeout(() => loadLeads(), 500);
    } catch(err) {
      window.showToast('Failed to set follow-up', 'error');
    }
  };

  window.winLead = async function(id, company, email) {
    if (!confirm('Mark lead as won? This will trigger an automation to create a CRM account.')) return;
    
    window.showToast(`Lead ${id} Won! Triggering CRM Account generation...`, 'success');
    
    try {
      await window.APP_API.post('/automation/trigger', {
        eventType: 'lead_won',
        eventData: { leadId: id, company, email }
      });
      window.showToast('✅ Auto-generated Client Account!', 'success');
    } catch(err) {
      console.warn('Automation trigger failed (expected if Supabase not configured):', err);
    }
    
    setTimeout(() => loadLeads(), 1000);
  };

  window.openAddLeadModal = function() {
    document.getElementById('manualLeadModal').style.display = 'flex';
  };

  window.closeAddLeadModal = function() {
    document.getElementById('manualLeadModal').style.display = 'none';
  };

  window.submitManualLead = async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const origText = btn.innerText;
    btn.innerText = 'Saving...';
    btn.disabled = true;

    const leadData = {
      company: document.getElementById('leadCompany').value,
      contactPerson: document.getElementById('leadName').value,
      email: document.getElementById('leadEmail').value,
      phone: document.getElementById('leadPhone').value,
      service: document.getElementById('leadService').value,
      value: document.getElementById('leadBudget').value,
      source: document.getElementById('leadSource').value,
      notes: document.getElementById('leadNotes').value
    };

    try {
      const res = await window.APP_API.post('/leads', leadData);
      if (res.success || res.lead) {
        window.showToast('✅ Manual Lead created successfully!', 'success');
        window.closeAddLeadModal();
        e.target.reset();
        loadLeads();
      } else {
        window.showToast('Failed to create lead', 'error');
      }
    } catch (err) {
      window.showToast('Error: ' + err.message, 'error');
    } finally {
      btn.innerText = origText;
      btn.disabled = false;
    }
  };

  window.handleBulkImport = async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(event) {
      const csvData = event.target.result;
      const lines = csvData.split('\n');
      if (lines.length < 2) {
        return window.showToast('CSV is empty or invalid', 'error');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const leads = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const cols = lines[i].split(',').map(c => c.trim());
        const lead = {};
        
        headers.forEach((h, index) => {
          if (cols[index]) lead[h] = cols[index];
        });

        // Basic mapping for typical CSV headers
        leads.push({
          company: lead.company || lead['company name'] || lead.client || '',
          contactPerson: lead.name || lead['contact person'] || lead.contact || '',
          email: lead.email || '',
          phone: lead.phone || lead.whatsapp || '',
          service: lead.service || 'General',
          value: lead.budget || lead.value || '',
          notes: lead.notes || ''
        });
      }

      if (leads.length === 0) return window.showToast('No valid leads found in CSV', 'error');

      if (!confirm(`Import ${leads.length} leads from CSV?`)) return;

      try {
        const res = await window.APP_API.post('/leads/bulk', { leads });
        if (res.success) {
          window.showToast(`✅ Successfully imported ${res.count} leads!`, 'success');
          loadLeads();
        } else {
          window.showToast('Failed to import bulk leads', 'error');
        }
      } catch (err) {
        window.showToast('Error during bulk import: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  function render() {
    let gridHtml = '';
    
    if (leadsData.length === 0) {
      gridHtml = `<div style="grid-column: 1/-1; padding: 3rem; text-align: center; background: var(--bg-surface); border-radius: 12px;">No incoming leads right now.</div>`;
    } else {
      gridHtml = leadsData.map(l => {
        let stageBadge = '<span class="badge badge-amber">New</span>';
        if (l.stage === 'Contacted') stageBadge = '<span class="badge badge-blue">Contacted</span>';
        if (l.stage === 'Won') stageBadge = '<span class="badge badge-emerald">Won & Transferred</span>';
        
        return `
          <div class="card-glass" style="padding: 1.2rem; display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <span style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">${l.id || 'N/A'}</span>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <span style="font-size: 0.75rem; font-weight: 700; color: ${l.score >= 75 ? 'var(--emerald-accent)' : l.score >= 40 ? 'var(--amber-accent)' : 'var(--text-error)'}; background: rgba(0,0,0,0.2); padding: 0.2rem 0.5rem; border-radius: 4px;">🔥 Score: ${l.score || 50}</span>
                ${stageBadge}
              </div>
            </div>
            
            <h3 style="font-size: 1.1rem; margin: 0;">${l.company || 'Unknown Client'}</h3>
            
            <div style="font-size: 0.85rem; color: var(--text-secondary); display: grid; gap: 0.4rem;">
              <div>👤 ${l.contact_person || 'N/A'}</div>
              <div>📞 ${l.phone || 'N/A'}</div>
              <div>📧 ${l.email || 'N/A'}</div>
            </div>
            
            <div style="background: rgba(0,0,0,0.1); padding: 0.75rem; border-radius: 8px; font-size: 0.8rem;">
              <strong>Service:</strong> ${l.service || 'N/A'} <br>
              <div style="margin-top: 0.4rem; color: var(--text-muted);">${l.notes || ''}</div>
              ${l.follow_up_date ? `<div style="margin-top: 0.4rem; color: var(--amber-accent); font-weight: bold;">⏰ Follow-up: ${l.follow_up_date}</div>` : ''}
            </div>

            ${l.stage !== 'Won' ? `
              <div style="display:flex; gap:0.5rem; margin-top: auto; padding-top: 1rem;">
                ${l.stage !== 'Contacted' ? `<button class="btn btn-outline" style="flex:1; font-size: 0.75rem; padding: 0.4rem;" onclick="window.updateLeadStage('${l.id}', 'Contacted')">Mark Contacted</button>` : ''}
                <button class="btn btn-outline" style="flex:1; font-size: 0.75rem; padding: 0.4rem;" onclick="window.setFollowUp('${l.id}')">📅 Set Reminder</button>
                <button class="btn btn-primary" style="flex:1; font-size: 0.75rem; padding: 0.4rem;" onclick="window.winLead('${l.id}', '${l.company}', '${l.email}')">🏆 Won</button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div class="module-header">
        <div>
          <h2 style="font-family: var(--font-heading); font-size: 1.5rem;">Lead CRM Pipeline</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Manage incoming client inquiries from the public website.</p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <label class="btn btn-outline" style="cursor: pointer;">
            Bulk Import CSV
            <input type="file" accept=".csv" style="display: none;" onchange="window.handleBulkImport(event)">
          </label>
          <button class="btn btn-primary" onclick="window.openAddLeadModal()">+ Manual Entry</button>
        </div>
      </div>

      <div class="module-content">
        <!-- Pipeline Funnel -->
        <div style="background: var(--surface); padding: 1.5rem; border-radius: 16px; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.05);">
          <h3 style="margin-top: 0; font-size: 1rem; color: var(--text-secondary); margin-bottom: 1rem;">Pipeline Funnel</h3>
          <div style="display: flex; gap: 4px; height: 32px; border-radius: 8px; overflow: hidden; background: rgba(0,0,0,0.2);">
            ${[
              { stage: 'New Inquiry', color: 'var(--amber-accent)' },
              { stage: 'Contacted', color: 'var(--blue-brand, #3b82f6)' },
              { stage: 'Proposal Sent', color: 'var(--purple-primary)' },
              { stage: 'Won / Closed', color: 'var(--emerald-accent)' },
              { stage: 'Lost', color: 'var(--text-error)' }
            ].map(s => {
              const count = leadsData.filter(l => l.stage === s.stage || (s.stage === 'New Inquiry' && l.stage === 'New')).length;
              const pct = leadsData.length ? Math.max((count / leadsData.length) * 100, count > 0 ? 5 : 0) : 0;
              if (pct === 0) return '';
              return `<div style="width: ${pct}%; background: ${s.color}; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: bold; color: #fff; transition: width 0.3s;" title="${s.stage}: ${count}">
                ${count > 0 ? count : ''}
              </div>`;
            }).join('') || `<div style="width: 100%; text-align:center; line-height:32px; font-size:0.8rem; color:var(--text-muted);">No pipeline data</div>`}
          </div>
          <div style="display: flex; gap: 1rem; margin-top: 0.8rem; justify-content: center; flex-wrap: wrap;">
            ${[
              { stage: 'New Inquiry', color: 'var(--amber-accent)' },
              { stage: 'Contacted', color: 'var(--blue-brand, #3b82f6)' },
              { stage: 'Proposal Sent', color: 'var(--purple-primary)' },
              { stage: 'Won / Closed', color: 'var(--emerald-accent)' },
              { stage: 'Lost', color: 'var(--text-error)' }
            ].map(s => `
              <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: var(--text-muted);">
                <div style="width: 10px; height: 10px; border-radius: 50%; background: ${s.color};"></div>
                ${s.stage} (${leadsData.filter(l => l.stage === s.stage || (s.stage === 'New Inquiry' && l.stage === 'New')).length})
              </div>
            `).join('')}
          </div>
        </div>

        <div style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));">
          ${gridHtml}
        </div>
      </div>

      <!-- Manual Lead Modal -->
      <div id="manualLeadModal" class="modal-overlay" style="display: none; align-items: center; justify-content: center; z-index: 1000;">
        <div class="modal-content card-glass" style="width: 100%; max-width: 500px; padding: 2rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3 style="margin: 0; font-family: var(--font-heading);">Add Manual Lead</h3>
            <button class="btn btn-outline" style="padding: 0.2rem 0.6rem; border: none;" onclick="window.closeAddLeadModal()">✕</button>
          </div>
          <form onsubmit="window.submitManualLead(event)" style="display: flex; flex-direction: column; gap: 1rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <input type="text" id="leadCompany" class="input-field" placeholder="Company/Brand Name *" required>
              <input type="text" id="leadName" class="input-field" placeholder="Contact Person *" required>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <input type="email" id="leadEmail" class="input-field" placeholder="Email Address">
              <input type="text" id="leadPhone" class="input-field" placeholder="Phone/WhatsApp">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <select id="leadService" class="input-field" required>
                <option value="">Select Service...</option>
                <option value="Social Media Retainer">Social Media Retainer</option>
                <option value="Video Production">Video Production</option>
                <option value="Branding">Branding</option>
                <option value="Web Development">Web Development</option>
              </select>
              <select id="leadBudget" class="input-field" required>
                <option value="">Select Budget...</option>
                <option value="Low ($500-$1k)">Low ($500-$1k)</option>
                <option value="Medium ($1k-$5k)">Medium ($1k-$5k)</option>
                <option value="High ($5k+)">High ($5k+)</option>
              </select>
            </div>
            <select id="leadSource" class="input-field" required>
              <option value="">Lead Source...</option>
              <option value="Outbound / Cold Email">Outbound / Cold Email</option>
              <option value="Referral">Referral / Partner</option>
              <option value="Event / Network">Event / Network</option>
              <option value="Manual Entry">Manual Entry</option>
            </select>
            <textarea id="leadNotes" class="input-field" placeholder="Initial notes or context..." style="min-height: 80px; resize: vertical;"></textarea>
            <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem; padding: 0.8rem;">Save Lead</button>
          </form>
        </div>
      </div>
    `;
  }

  // Initial load
  container.innerHTML = `<div style="padding: 3rem; text-align: center; color: var(--text-muted);">⏳ Loading Leads...</div>`;
  await loadLeads();
};
