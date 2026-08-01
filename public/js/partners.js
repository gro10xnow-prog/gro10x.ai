// 🤝 PURPLEBOT CLIENT & PARTNER PORTAL JS

let currentPartnerClient = 'Chillox Fast Food Chain';
let currentPartnerReviewId = 'REV-001';
let partnerReviews = [];
let partnerInvoices = [];
let partnerPosts = [];

document.addEventListener('DOMContentLoaded', () => {
  initPartnerPortal();
});

function handlePartnerLogout() {
  localStorage.removeItem('purple_user_phone');
  localStorage.removeItem('purple_user_email');
  localStorage.removeItem('purple_user_name');
  localStorage.removeItem('purple_user_role');
  localStorage.removeItem('purple_user_access');
  localStorage.removeItem('sb-access-token');
  document.cookie = "sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  window.location.href = '/auth';
}


async function initPartnerPortal() {
  try {
    // Fetch authenticated user profile
    const authRes = await fetch('/api/auth/me');
    let userClientName = 'Chillox Fast Food Chain';
    let userClientId = 'CLI-0001';

    if (authRes.ok) {
      const authData = await authRes.json();
      if (authData.user) {
        userClientName = authData.user.name || authData.user.profile?.name || userClientName;
        userClientId = authData.user.linkedId || userClientId;
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const magicClient = urlParams.get('client');
    if (magicClient) {
      userClientName = decodeURIComponent(magicClient);
    }

    currentPartnerClient = userClientName;

    const headerNameEl = document.getElementById('partnerHeaderName');
    if (headerNameEl) {
      headerNameEl.innerText = `🏢 Workspace: ${currentPartnerClient}`;
    }

    // Fetch Isolated Client Data
    const [revRes, invRes, postRes] = await Promise.all([
      fetch('/api/reviews'),
      fetch('/api/invoices'),
      fetch('/api/posts')
    ]);

    if (revRes.ok) partnerReviews = await revRes.json();
    if (invRes.ok) partnerInvoices = await invRes.json();
    if (postRes.ok) partnerPosts = await postRes.json();

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

  // Filter Social Posts for this Client (Phase A)
  const clientPosts = partnerPosts.filter(p => {
    const cName = (p.clientName || p.client || '').toLowerCase();
    const curName = currentPartnerClient.toLowerCase();
    return cName.includes(curName) || curName.includes(cName);
  });

  const socialBadge = document.getElementById('partnerSocialBadge');
  const socialGrid = document.getElementById('partnerSocialGrid');

  if (socialBadge) {
    const pendingCount = clientPosts.filter(p => p.status === 'Pending Client Approval' || p.status === 'Draft').length;
    socialBadge.innerText = `${pendingCount} Pending Approval`;
    socialBadge.className = pendingCount > 0 ? 'badge badge-amber' : 'badge badge-emerald';
  }

  if (socialGrid) {
    const listToRender = clientPosts.length > 0 ? clientPosts : partnerPosts;
    socialGrid.innerHTML = listToRender.map(post => {
      let badgeClass = 'badge-purple';
      if (post.platform === 'Instagram') badgeClass = 'badge-pink';
      else if (post.platform === 'LinkedIn') badgeClass = 'badge-cyan';
      else if (post.platform === 'Facebook') badgeClass = 'badge-purple';

      let statusBadge = 'badge-purple';
      if (post.status === 'Approved') statusBadge = 'badge-emerald';
      else if (post.status === 'Published') statusBadge = 'badge-emerald';
      else if (post.status === 'Due Today') statusBadge = 'badge-pink';
      else if (post.status === 'Pending Client Approval') statusBadge = 'badge-amber';
      else if (post.status === 'Changes Requested') statusBadge = 'badge-pink';

      const mediaUrl = (post.mediaUrls && post.mediaUrls[0]) || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80';

      return `
        <div class="glass-panel" style="padding:1.2rem; display:flex; flex-direction:column; justify-content:space-between; gap:1rem; border:1px solid rgba(255,255,255,0.08); background:rgba(15,23,42,0.6);">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
              <span class="badge ${badgeClass}">${post.platform}</span>
              <span class="badge ${statusBadge}">${post.status}</span>
            </div>

            <h3 style="color:#fff; font-size:1rem; margin:0.2rem 0 0.4rem;">${post.title}</h3>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.8rem;">
              📅 Scheduled: <strong>${post.scheduledDate} ${post.scheduledTime || ''}</strong>
            </div>

            <div style="position:relative; background:#000; border-radius:8px; overflow:hidden; margin-bottom:0.8rem; height:140px;">
              <img src="${mediaUrl}" style="width:100%; height:100%; object-fit:cover;" alt="Asset Preview">
            </div>

            <div style="background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.06); padding:0.8rem; border-radius:8px; max-height:100px; overflow-y:auto; font-size:0.82rem; color:#cbd5e1; white-space:pre-wrap;">${post.caption}</div>

            ${post.clientFeedback ? `
              <div style="margin-top:0.6rem; padding:0.5rem; background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.3); border-radius:6px; font-size:0.78rem; color:#f43f5e;">
                💬 Revision Note: ${post.clientFeedback}
              </div>
            ` : ''}
          </div>

          <div style="display:flex; gap:0.6rem; margin-top:0.5rem;">
            ${post.status !== 'Approved' && post.status !== 'Published' ? `
              <button class="btn-purple" style="flex:1; justify-content:center; padding:0.4rem 0.8rem; font-size:0.82rem; background:#10b981;" onclick="approvePartnerPost('${post.id}')">✅ Approve Post</button>
              <button class="btn-secondary" style="flex:1; justify-content:center; padding:0.4rem 0.8rem; font-size:0.82rem; color:#f43f5e;" onclick="rejectPartnerPost('${post.id}')">💬 Request Changes</button>
            ` : `
              <div style="width:100%; text-align:center; padding:0.4rem; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); border-radius:8px; font-size:0.82rem; color:#10b981; font-weight:700;">
                ✅ Approved for Dispatch (${post.approvedBy || 'Client Lead'})
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');
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
          <div style="display:flex; justify-content:flex-end; gap:0.4rem;">
            ${inv.status !== 'Paid' ? `
              <button class="btn-purple" style="padding:0.2rem 0.6rem; font-size:0.78rem;" onclick="openPartnerPaymentModal('${inv.id}', ${inv.amount})">💳 Pay / Verify</button>
            ` : ''}
            <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.78rem;" onclick="alert('Downloading Statement/Invoice PDF for ${inv.id}...')">📄 PDF</button>
          </div>
        </td>
      </tr>
    `).join('');
  }
}

async function approvePartnerPost(postId) {
  try {
    const res = await fetch(`/api/posts/${postId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approvedBy: currentPartnerClient })
    });
    const data = await res.json();
    if (data.success) {
      alert(`✅ Social post ${postId} is APPROVED!\nThe social team has been alerted for 1-Click Dispatch on the scheduled date.`);
      initPartnerPortal();
    }
  } catch (err) {
    console.error('Error approving post:', err);
  }
}

async function rejectPartnerPost(postId) {
  const note = prompt('Enter feedback / requested changes for the social media team:', 'Please update the image overlay and adjust caption text.');
  if (!note) return;

  try {
    const res = await fetch(`/api/posts/${postId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: note })
    });
    const data = await res.json();
    if (data.success) {
      alert(`💬 Feedback submitted for post ${postId}. The team will update and re-submit for approval.`);
      initPartnerPortal();
    }
  } catch (err) {
    console.error('Error requesting post revision:', err);
  }
}

// Module C5: Client Payment Gateway Verification Modal Logic
async function openPartnerPaymentModal(invId, amount) {
  const method = prompt(`💳 ONLINE INVOICE PAYMENT (${invId} — $${amount} USD)\n\nSelect Payment Gateway Method:\n1. Bkash Direct Merchant (TrxID)\n2. Nagad Merchant (TrxID)\n3. Bank Wire Transfer (Ref No)\n4. Credit/Debit Card (Instant Sim)`, 'Bkash Direct Merchant (TrxID)');
  if (!method) return;

  const trxId = prompt(`Enter Payment Transaction ID (TrxID / Bank Ref No):`, `TRX${Math.floor(100000 + Math.random() * 900000)}`);
  if (!trxId) return;

  try {
    const res = await fetch(`/api/invoices/${invId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: method,
        trxId: trxId,
        payerName: currentPartnerClient
      })
    });
    const data = await res.json();
    if (data.success) {
      alert(`✅ Payment Verified!\nInvoice ${invId} is now marked PAID.\nTransaction Ref: ${trxId}`);
      initPartnerPortal();
    }
  } catch (err) {
    console.error('Payment error:', err);
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
