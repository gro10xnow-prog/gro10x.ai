// 🤝 PURPLEBOT CLIENT & PARTNER PORTAL JS

let currentPartnerClient = 'Chillox Fast Food Chain';
let currentPartnerReviewId = 'REV-001';
let partnerReviews = [];
let partnerInvoices = [];

document.addEventListener('DOMContentLoaded', () => {
  initPartnerPortal();
});

async function initPartnerPortal() {
  try {
    const res = await fetch('/api/db');
    const db = await res.json();

    partnerReviews = db.reviews || [];
    partnerInvoices = db.invoices || [];

    // Populate Client Selector
    const clientSelect = document.getElementById('partnerClientSelect');
    if (clientSelect) {
      const clients = db.clients && db.clients.length > 0 ? db.clients : [
        { name: 'Chillox Fast Food Chain' },
        { name: 'Clear Men (Unilever)' },
        { name: 'United Commercial Bank (UCB)' }
      ];
      clientSelect.innerHTML = clients.map(c => `
        <option value="${c.name}">${c.name}</option>
      `).join('');

      if (clients[0]) currentPartnerClient = clients[0].name;
    }

    renderPartnerView();
  } catch (err) {
    console.error('Error initializing partner portal:', err);
  }
}

function switchPartnerAccount(clientName) {
  currentPartnerClient = clientName;
  renderPartnerView();
}

function renderPartnerView() {
  document.getElementById('partnerClientTitle').innerText = currentPartnerClient;

  // Filter Reviews for this Client
  const clientReviews = partnerReviews.filter(r => (r.client || '').toLowerCase().includes(currentPartnerClient.toLowerCase()) || currentPartnerClient.toLowerCase().includes((r.client || '').toLowerCase()));
  const activeRev = clientReviews.find(r => r.id === currentPartnerReviewId) || clientReviews[0] || partnerReviews[0];

  const projectSelect = document.getElementById('partnerProjectSelect');
  if (projectSelect) {
    projectSelect.innerHTML = (clientReviews.length > 0 ? clientReviews : partnerReviews).map(r => `
      <option value="${r.id}" ${activeRev && r.id === activeRev.id ? 'selected' : ''}>🎥 ${r.projectName || r.id}</option>
    `).join('');
  }

  if (activeRev) {
    currentPartnerReviewId = activeRev.id;
    document.getElementById('partnerProjName').innerText = activeRev.projectName;
    document.getElementById('partnerVerBadge').innerText = activeRev.activeVersion || 'V1 Cut';

    const video = document.getElementById('partnerVideo');
    if (video && activeRev.mediaUrl) {
      const source = document.getElementById('partnerVideoSource');
      if (source && source.src !== activeRev.mediaUrl) {
        source.src = activeRev.mediaUrl;
        video.load();
      }
    }

    // Comments list
    const comments = activeRev.comments || [];
    document.getElementById('partnerCommentCount').innerText = `${comments.length} Notes`;
    const list = document.getElementById('partnerCommentsList');
    if (list) {
      list.innerHTML = comments.map(c => `
        <div style="background:rgba(255,255,255,0.04); padding:0.6rem 0.8rem; border-radius:8px; border:1px solid rgba(255,255,255,0.06);">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--purple-light); margin-bottom:0.2rem;">
            <strong>${c.user} (${c.role || 'Client'})</strong>
            <span>${c.timestamp || '0:00'}</span>
          </div>
          <div style="font-size:0.85rem; color:#cbd5e1;">${c.text}</div>
        </div>
      `).join('');
    }
  }

  // Filter Invoices for this Client
  const clientInvoices = partnerInvoices.filter(i => (i.clientName || '').toLowerCase().includes(currentPartnerClient.toLowerCase()) || currentPartnerClient.toLowerCase().includes((i.clientName || '').toLowerCase()));
  const invoicesTbody = document.getElementById('partnerInvoicesTbody');
  if (invoicesTbody) {
    const listToRender = clientInvoices.length > 0 ? clientInvoices : partnerInvoices;
    invoicesTbody.innerHTML = listToRender.map(inv => `
      <tr>
        <td><code>${inv.id}</code></td>
        <td>${inv.projectName || inv.projectRef || 'Campaign Handover'}</td>
        <td>${inv.date || '2026-07-28'}</td>
        <td>${inv.dueDate || '2026-08-04'}</td>
        <td style="font-weight:700; color:#34d399;">$${(Number(inv.amount) || 0).toLocaleString()}</td>
        <td><span class="badge ${inv.status === 'Paid' ? 'badge-emerald' : 'badge-amber'}">${inv.status}</span></td>
        <td style="text-align:right;">
          <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.78rem;" onclick="alert('Downloading Statement/Invoice PDF for ${inv.id}...')">📄 Download PDF</button>
        </td>
      </tr>
    `).join('');
  }
}

function switchPartnerProject(revId) {
  currentPartnerReviewId = revId;
  renderPartnerView();
}

async function approvePartnerCut() {
  const rev = partnerReviews.find(r => r.id === currentPartnerReviewId) || partnerReviews[0];
  if (!rev) return;

  if (!confirm(`🎉 Confirm official client approval for "${rev.projectName}"?`)) return;

  try {
    const res = await fetch(`/api/reviews/${rev.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      alert(`🎉 Deliverable cut for "${rev.projectName}" officially APPROVED!\nDraft invoice "${data.invoice?.id || 'INV'}" has been generated.`);
      location.reload();
    }
  } catch (err) {
    console.error('Error approving cut in partner portal:', err);
  }
}

async function submitPartnerComment() {
  const input = document.getElementById('partnerNewComment');
  const text = input.value.trim();
  if (!text) return;

  const rev = partnerReviews.find(r => r.id === currentPartnerReviewId) || partnerReviews[0];
  if (!rev) return;

  const video = document.getElementById('partnerVideo');
  const curTime = video ? Math.floor(video.currentTime) : 0;
  const mins = Math.floor(curTime / 60);
  const secs = String(curTime % 60).padStart(2, '0');
  const timeStr = `${mins}:${secs}`;

  try {
    const res = await fetch(`/api/reviews/${rev.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: currentPartnerClient + ' (Brand Lead)',
        role: 'Client Reviewer',
        text: text,
        timestamp: timeStr,
        timeSeconds: curTime
      })
    });
    const data = await res.json();
    if (data.success) {
      input.value = '';
      initPartnerPortal();
    }
  } catch (err) {
    console.error('Error submitting comment in partner portal:', err);
  }
}

function openPartnerBriefModal() {
  const title = prompt('Enter new campaign project title (e.g. Autumn Product Launch Reels):');
  if (!title) return;
  const budget = prompt('Enter target budget in USD ($):', '2500');
  alert(`📋 New campaign brief for "${title}" submitted to Purplebot Digital account team! Target budget: $${budget}`);
}
