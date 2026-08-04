window._allClients = [];

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('clientsContent')) {
    loadClientsData();
  }
});

async function loadClientsData() {
  try {
    const clients = await fetch('/api/clients').then(r => r.json()).catch(() => []);
    window._allClients = clients;

    const activeCount = clients.filter(c => (c.status || '').toLowerCase() !== 'churned').length;
    const totSpent = clients.reduce((acc, c) => acc + (Number(c.totalSpent || c.total_spent) || 0), 0);
    const totCampaigns = clients.reduce((acc, c) => acc + (Number(c.activeCampaigns || c.active_campaigns) || 1), 0);

    const kpiActive = document.getElementById('kpiActiveClients');
    if (kpiActive) kpiActive.textContent = activeCount;
    
    const kpiSpend = document.getElementById('kpiRetainerSpend');
    if (kpiSpend) kpiSpend.textContent = `৳${totSpent.toLocaleString()}`;
    
    const kpiCamp = document.getElementById('kpiCampaigns');
    if (kpiCamp) kpiCamp.textContent = totCampaigns;

    renderClientGrid();
  } catch(e) {
    console.error('Clients load err:', e);
  }
}

function renderClientGrid() {
  const box = document.getElementById('clientsContent');
  if (!box) return;
  const clients = window._allClients || [];

  if (clients.length === 0) {
    box.innerHTML = `<div style="color: var(--text-muted); padding: 2rem; text-align: center;">No client accounts found.</div>`;
    return;
  }

  box.innerHTML = `
    <div class="client-cards-grid">
      ${clients.map(c => {
        const name = c.name || 'Client';
        const initials = (name.substring(0, 2)).toUpperCase();
        
        // Handle multiple POCs display
        const pocs = c.pocs && c.pocs.length > 0 ? c.pocs : [{ name: c.contactPerson || c.contact_person || 'Lead Contact', role: 'Primary' }];
        const pocHtml = pocs.map(p => `<div style="font-size: 0.82rem; color: #fff; margin-bottom: 0.2rem;">👤 ${p.name} <span style="color:var(--text-muted); font-size: 0.75rem;">(${p.role})</span></div>`).join('');

        return `
          <div class="client-card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div class="client-avatar">${initials}</div>
              <span class="badge badge-purple">${c.status || 'Active Retainer'}</span>
            </div>
            <div>
              <div style="font-weight: 800; color: #fff; font-size: 1.1rem;">${name}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${c.industry || c.category || 'General Industry'}</div>
            </div>
            <div>
              ${pocHtml}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.6rem; margin-top: auto;">
              <span style="color: var(--text-muted);">Total Spend: <strong style="color: #34d399;">৳${(Number(c.totalSpent || c.total_spent) || 0).toLocaleString()}</strong></span>
              <span style="color: var(--purple-light); font-weight: 700;">${c.activeCampaigns || c.active_campaigns || 1} Active</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function openClientModal() {
  const modal = document.getElementById('clientModal');
  if (modal) modal.style.display = 'flex';
  
  // Reset POC list to a single empty item
  const pocList = document.getElementById('pocList');
  if (pocList) {
    pocList.innerHTML = `
      <div class="poc-item" style="display:flex; gap:0.5rem;">
        <input type="text" class="form-input poc-name" placeholder="Name" style="flex:1;">
        <input type="text" class="form-input poc-role" placeholder="Role (e.g. Lead)" style="flex:1;">
        <input type="text" class="form-input poc-phone" placeholder="Phone" style="flex:1;">
      </div>
    `;
  }
}

function closeClientModal() {
  const modal = document.getElementById('clientModal');
  if (modal) modal.style.display = 'none';
}

function addPOCRow() {
  const pocList = document.getElementById('pocList');
  if (!pocList) return;
  const row = document.createElement('div');
  row.className = 'poc-item';
  row.style.cssText = 'display:flex; gap:0.5rem;';
  row.innerHTML = `
    <input type="text" class="form-input poc-name" placeholder="Name" style="flex:1;">
    <input type="text" class="form-input poc-role" placeholder="Role" style="flex:1;">
    <input type="text" class="form-input poc-phone" placeholder="Phone" style="flex:1;">
    <button onclick="this.parentElement.remove()" style="background:transparent; border:none; color:#f87171; cursor:pointer;" title="Remove">✕</button>
  `;
  pocList.appendChild(row);
}

async function submitNewClient() {
  const name = document.getElementById('cliName').value.trim();
  const industry = document.getElementById('cliIndustry').value.trim() || 'General';

  // Gather POCs
  const pocItems = document.querySelectorAll('.poc-item');
  const pocs = [];
  pocItems.forEach((item, index) => {
    const pocName = item.querySelector('.poc-name').value.trim();
    const pocRole = item.querySelector('.poc-role').value.trim();
    const pocPhone = item.querySelector('.poc-phone').value.trim();
    if (pocName) {
      pocs.push({
        name: pocName,
        role: pocRole || 'Contact',
        phone: pocPhone,
        isPrimary: index === 0
      });
    }
  });

  if (!name) return alert('Please enter client name.');
  
  const primaryContact = pocs.length > 0 ? pocs[0].name : 'Primary Lead';
  const primaryPhone = pocs.length > 0 ? pocs[0].phone : '';

  try {
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name, 
        industry, 
        contactPerson: primaryContact, 
        phone: primaryPhone, 
        status: 'Active',
        pocs 
      })
    });
    const data = await res.json();
    if (data.success || data.id || data.name) {
      closeClientModal();
      loadClientsData();
    } else {
      alert(data.error || 'Failed to create client');
    }
  } catch(e) {
    console.error('Client submit err:', e);
  }
}
