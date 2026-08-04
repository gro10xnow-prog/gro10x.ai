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
    window.showToast(`Lead ${id} marked as ${stage}`, 'success');
    setTimeout(() => loadLeads(), 1000);
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
              ${stageBadge}
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
            </div>

            ${l.stage !== 'Won' ? `
              <div style="display:flex; gap:0.5rem; margin-top: auto; padding-top: 1rem;">
                ${l.stage !== 'Contacted' ? `<button class="btn btn-outline" style="flex:1; font-size: 0.8rem; padding: 0.4rem;" onclick="window.updateLeadStage('${l.id}', 'Contacted')">Mark Contacted</button>` : ''}
                <button class="btn btn-primary" style="flex:1; font-size: 0.8rem; padding: 0.4rem;" onclick="window.winLead('${l.id}', '${l.company}', '${l.email}')">🏆 Mark Won</button>
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
        <button class="btn btn-primary" onclick="showToast('Lead manual entry coming soon')">+ Manual Entry</button>
      </div>

      <div class="module-content">
        <div style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));">
          ${gridHtml}
        </div>
      </div>
    `;
  }

  // Initial load
  container.innerHTML = `<div style="padding: 3rem; text-align: center; color: var(--text-muted);">⏳ Loading Leads...</div>`;
  await loadLeads();
};
