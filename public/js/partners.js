// 🤝 GRO10X CLIENT & PARTNER PORTAL JS

let currentPartnerClient = 'Chillox Fast Food Chain';
let currentPartnerReviewId = 'REV-001';
let partnerReviews = [];
let partnerInvoices = [];
let partnerPosts = [];

/* -------------------------------------------------------------
 * 🔔 Partner Portal Toast Notification System
 * ------------------------------------------------------------- */
function showPartnerToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('partnerToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'partnerToastContainer';
    container.className = 'admin-toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `admin-toast ${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `
    <div style="display:flex; align-items:center; gap:0.6rem;">
      <span>${icon}</span>
      <span>${message}</span>
    </div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

document.addEventListener('DOMContentLoaded', () => {
  initPartnerPortal();
});

function handlePartnerLogout() {
  localStorage.removeItem('purple_user');
  localStorage.removeItem('purple_user_phone');
  localStorage.removeItem('purple_user_email');
  localStorage.removeItem('purple_user_name');
  localStorage.removeItem('purple_user_role');
  localStorage.removeItem('purple_user_access');
  localStorage.removeItem('gro10x_token');
  localStorage.removeItem('gro10x_token');
  localStorage.removeItem('gro10x_token');
  sessionStorage.removeItem('jwt_token');
  document.cookie = "sb-access-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  window.location.href = '/auth';
}


let partnerAuthUser = null;

async function initPartnerPortal() {
  try {
    const token = localStorage.getItem('sb-access-token') || localStorage.getItem('gro10x_token');
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

    // Fetch authenticated user profile
    const authRes = await fetch('/api/auth/me', { headers: authHeaders });
    let userClientName = 'Brand Partner Workspace';
    let userClientId = null;
    let isAdminUser = false;

    if (authRes.ok) {
      const authData = await authRes.json();
      if (authData.user) {
        partnerAuthUser = authData.user;
        userClientName = partnerAuthUser.company || partnerAuthUser.profile?.name || partnerAuthUser.name || 'Brand Partner Workspace';
        userClientId = partnerAuthUser.linkedId || null;

        isAdminUser = (
          partnerAuthUser.accessLevel === 'Owner / Admin' ||
          partnerAuthUser.accessLevel === 'Manager / Director' ||
          partnerAuthUser.role === 'Agency Owner' ||
          partnerAuthUser.role === 'Admin' ||
          partnerAuthUser.role === 'Manager'
        );
      }
    } else {
      console.warn('[partners] Invalid or expired session, redirecting to login');
      window.location.href = '/auth?portal=client';
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const magicClient = urlParams.get('client');

    // Security Hardening: Only allow ?client= URL override for Admin/Manager accounts
    if (magicClient) {
      if (isAdminUser) {
        userClientName = decodeURIComponent(magicClient);
      } else if (partnerAuthUser) {
        showPartnerToast('🔒 Client workspace is locked to your authenticated account', 'info');
      }
    }

    currentPartnerClient = userClientName;

    const headerNameEl = document.getElementById('partnerHeaderName');
    if (headerNameEl) {
      headerNameEl.innerText = `🏢 Workspace: ${currentPartnerClient}`;
    }

    // Securely Fetch Isolated Client Workspace Data via RBAC Endpoint
    try {
      const dashRes = await fetch(`/api/clients/${userClientId}/dashboard`, { headers: authHeaders });
      if (dashRes.ok) {
        const dashData = await dashRes.json();
        partnerReviews = dashData.reviews || [];
        partnerInvoices = dashData.invoices || [];
        partnerPosts = dashData.posts || [];
        if (dashData.client && dashData.client.name) {
          currentPartnerClient = dashData.client.name;
          if (headerNameEl) headerNameEl.innerText = `🏢 Workspace: ${currentPartnerClient}`;
        }
      } else {
        // Fallback to isolated query parameters if direct endpoint degrades
        const [revRes, invRes, postRes] = await Promise.all([
          fetch(`/api/reviews?clientId=${userClientId}`, { headers: authHeaders }),
          fetch(`/api/invoices?clientId=${userClientId}`, { headers: authHeaders }),
          fetch(`/api/posts?clientId=${userClientId}`, { headers: authHeaders })
        ]);
        if (revRes.ok) partnerReviews = await revRes.json();
        if (invRes.ok) partnerInvoices = await invRes.json();
        if (postRes.ok) partnerPosts = await postRes.json();
      }
    } catch (e) {
      console.warn('Isolated dashboard fetch error, using client scope:', e);
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
    projectSelect.innerHTML = clientReviews.map(r => `
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
    if (clientPosts.length === 0) {
      socialGrid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:2.5rem; color:var(--text-muted); font-size:0.9rem; background:rgba(15,23,42,0.4); border-radius:12px; border:1px dashed rgba(255,255,255,0.1);">
          📭 No scheduled social posts pending review for ${currentPartnerClient}.
        </div>
      `;
    } else {
      socialGrid.innerHTML = clientPosts.map(post => {
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
                <img src="${mediaUrl}" loading="lazy" decoding="async" style="width:100%; height:100%; object-fit:cover;" alt="Asset Preview">
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
  }

  // Filter Invoices for this Client
  const clientInvoices = partnerInvoices.filter(i => (i.clientName || '').toLowerCase().includes(currentPartnerClient.toLowerCase()) || currentPartnerClient.toLowerCase().includes((i.clientName || '').toLowerCase()));
  const invoicesTbody = document.getElementById('partnerInvoicesTbody');
  if (invoicesTbody) {
    if (clientInvoices.length === 0) {
      invoicesTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No invoices generated for ${currentPartnerClient} yet.</td></tr>`;
    } else {
      invoicesTbody.innerHTML = clientInvoices.map(inv => `
      <tr>
        <td><code>${inv.id}</code></td>
        <td>${inv.projectName || inv.projectRef || 'Campaign Handover'}</td>
        <td>${inv.date || '2026-07-28'}</td>
        <td>${inv.dueDate || '2026-08-04'}</td>
        <td style="font-weight:700; color:#00df89;">
          $${(Number(inv.amount) || 0).toLocaleString()}
          <div style="font-size:0.75rem; color:#94a3b8; font-weight:500;">৳${Math.round((Number(inv.amount) || 0) * 118).toLocaleString()}</div>
        </td>
        <td><span class="badge ${inv.status === 'Paid' ? 'badge-emerald' : 'badge-amber'}">${inv.status}</span></td>
        <td style="text-align:right;">
          <div style="display:flex; justify-content:flex-end; gap:0.4rem;">
            ${inv.status !== 'Paid' ? `
              <button class="btn-purple" style="padding:0.2rem 0.6rem; font-size:0.78rem;" onclick="openPartnerPaymentModal('${inv.id}', ${inv.amount})">💳 Pay / Verify</button>
            ` : ''}
            <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.78rem;" onclick="showPartnerToast('📄 Downloading Statement/Invoice PDF for ${inv.id}...', 'info')">📄 PDF</button>
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
      showPartnerToast(`✅ Social post ${postId} is APPROVED! Social team alerted for dispatch.`, 'success');
      initPartnerPortal();
    }
  } catch (err) {
    showPartnerToast('Error approving post: ' + err.message, 'error');
  }
}

async function rejectPartnerPost(postId, customNote) {
  const note = customNote || 'Please update the image overlay and adjust caption text.';

  try {
    const res = await fetch(`/api/posts/${postId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: note })
    });
    const data = await res.json();
    if (data.success) {
      showPartnerToast(`💬 Feedback submitted for post ${postId}. The team will update and re-submit for approval.`, 'info');
      initPartnerPortal();
    }
  } catch (err) {
    showPartnerToast('Error requesting post revision: ' + err.message, 'error');
  }
}

// Module C5: Client Payment Gateway Verification Logic
function openPartnerPaymentModal(invId, amount) {
  const modal = document.getElementById('partnerPaymentModal');
  const invInput = document.getElementById('payModalInvoiceId');
  const invLabel = document.getElementById('payModalInvLabel');
  const amtLabel = document.getElementById('payModalAmountLabel');
  const trxInput = document.getElementById('payModalTrxInput');

  if (invInput) invInput.value = invId;
  if (invLabel) invLabel.innerText = invId;
  if (amtLabel) amtLabel.innerText = `$${(Number(amount) || 0).toLocaleString()}`;
  if (trxInput) trxInput.value = '';

  if (modal) modal.style.display = 'flex';
}

function closePartnerPaymentModal() {
  const modal = document.getElementById('partnerPaymentModal');
  if (modal) modal.style.display = 'none';
}

async function submitPartnerPayment(event) {
  event.preventDefault();
  const invId = document.getElementById('payModalInvoiceId').value;
  const method = document.getElementById('payModalMethodSelect').value;
  const trxId = document.getElementById('payModalTrxInput').value.trim();

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
      showPartnerToast(`💳 Payment Proof Submitted! Invoice ${invId} set to Verification Pending. Finance team notified for verification.`, 'success');
      closePartnerPaymentModal();
      initPartnerPortal();
    } else {
      showPartnerToast('Payment error: ' + (data.error || 'Verification failed'), 'error');
    }
  } catch (err) {
    showPartnerToast('Payment error: ' + err.message, 'error');
  }
}

function switchPartnerProject(revId) {
  currentPartnerReviewId = revId;
  renderPartnerView();
}

async function approvePartnerCut(btnElement) {
  const rev = partnerReviews.find(r => r.id === currentPartnerReviewId) || partnerReviews[0];
  if (!rev) return;

  if (btnElement && !btnElement.dataset.confirming) {
    btnElement.dataset.confirming = 'true';
    const origText = btnElement.innerHTML;
    btnElement.innerHTML = '⚠️ Confirm Approval?';
    setTimeout(() => {
      delete btnElement.dataset.confirming;
      btnElement.innerHTML = origText;
    }, 3000);
    return;
  }

  try {
    const res = await fetch(`/api/reviews/${rev.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      showPartnerToast(`🎉 Deliverable cut for "${rev.projectName}" officially APPROVED! Invoice generated.`, 'success');
      setTimeout(() => location.reload(), 1500);
    }
  } catch (err) {
    showPartnerToast('Error approving cut: ' + err.message, 'error');
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
      showPartnerToast('💬 Timestamped feedback submitted!', 'success');
      initPartnerPortal();
    }
  } catch (err) {
    showPartnerToast('Error submitting comment: ' + err.message, 'error');
  }
}

function openPartnerBriefModal() {
  const modal = document.getElementById('partnerBriefModal');
  if (modal) modal.style.display = 'flex';
}

function closePartnerBriefModal() {
  const modal = document.getElementById('partnerBriefModal');
  if (modal) modal.style.display = 'none';
}

async function submitPartnerCampaignBrief(event) {
  event.preventDefault();
  const title = document.getElementById('briefTitleInput').value.trim();
  const category = document.getElementById('briefCategorySelect').value;
  const targetDate = document.getElementById('briefDateInput').value;
  const budget = document.getElementById('briefBudgetInput').value.trim();
  const desc = document.getElementById('briefDescInput').value.trim();

  const payload = {
    title: `[Brief] ${title}`,
    client: currentPartnerClient,
    stage: 'Briefing',
    priority: 'High',
    department: 'Client Services',
    dueDate: targetDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    description: `Category: ${category}\nBudget: ${budget}\nNotes: ${desc}`
  };

  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showPartnerToast(`🚀 New Campaign Brief "${title}" submitted! Account Manager notified.`, 'success');
      closePartnerBriefModal();
      initPartnerPortal();
    } else {
      showPartnerToast('Error submitting brief: ' + (data.error || 'Check fields'), 'error');
    }
  } catch (err) {
    showPartnerToast('Error submitting campaign brief: ' + err.message, 'error');
  }
}

function setupPartnerSSE() {
  try {
    const token = localStorage.getItem('gro10x_token') || localStorage.getItem('sb-access-token') || sessionStorage.getItem('gro10x_token') || '';
    const sseUrl = token ? `/api/events?role=client&token=${encodeURIComponent(token)}` : '/api/events?role=client';
    const es = new EventSource(sseUrl);
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (['review_update', 'comment_update', 'review_comment_update', 'invoice_update', 'payment_update', 'post_update', 'task_update'].includes(msg.type)) {
          if (typeof initPartnerPortal === 'function') initPartnerPortal();
        }
      } catch (err) {}
    };
    ['review_update', 'comment_update', 'review_comment_update', 'invoice_update', 'payment_update', 'post_update', 'task_update'].forEach(evt => {
      es.addEventListener(evt, () => {
        if (typeof initPartnerPortal === 'function') initPartnerPortal();
      });
    });
    es.onerror = () => {
      es.close();
      setTimeout(setupPartnerSSE, 5000);
    };
  } catch (err) {}
}

document.addEventListener('DOMContentLoaded', () => {
  setupPartnerSSE();
});
